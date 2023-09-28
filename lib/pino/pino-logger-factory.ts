import pino from "pino";
import { LoggerFactory, LoggerPoolConfig } from "../types";
import { PinoLogger } from "./pino-logger";

/**
 * ロガーを提供します。
 */
export class PinoLoggerFactory implements LoggerFactory {
  private readonly config: LoggerPoolConfig['configs'];

  private readonly loggers = new Map<string, PinoLogger>();

  private readonly mdc = new Map<string, unknown>();

  public constructor(config?: LoggerPoolConfig) {
    if (config == null) {
      config = {
        configs: {
          root: { level: 'info' },
        }
      };
    }
    this.config = config.configs;

    const root = pino({
      ...config.configs.root,
      base: undefined,
      errorKey: 'error',
      timestamp: () => `, "ts": ${new Date().getTime() / 1000 }`, // as unix time
      formatters: {
        level(label, number) {
          return { level: label };
        },
      },
      mixin: this.mixin(),
    });

    this.loggers.set('', new PinoLogger(this, root, {
      category: '',
      useCaller: config.configs.root.useCaller === true,
    }));
  }

  private mixin() {
    return () => {
      const context: {[key: string]: unknown} = {};
      for (const [key, value] of this.mdc.entries()) {
        if (value != null) context[key] = value;
      }

      return { context };
    };
  }

  public getLogger(category: string): PinoLogger {
    let logger = this.loggers.get(category);
    if (logger == null) {
      // 親に相当するロガーを取得する
      const parent = this.getLogger(this.getParentCategory(category));

      // 親の設定を引き継ぎ、自分の設定とマージする
      const config = Object.assign({}, parent.options, this.config[category] ?? {});
      const bindings = {};
      const delegate = parent.delegate.child(bindings, config as pino.ChildLoggerOptions);
      logger = new PinoLogger(this, delegate, {
        category,
        useCaller: config.useCaller === true,
      });
      this.loggers.set(category, logger);
    }

    return logger;
  }

  private getParentCategory(category: string): string {
    if (category === '') throw new Error("'' is root category");

    const index = category.lastIndexOf('.');
    if (index === -1) return '';
    return category.slice(0, index - 1);
  }

  public async finish() {
    const promises: Array<Promise<void>> = [];

    this.loggers.forEach((logger, name) => {
      const delegate = logger.delegate;
      delegate.flush();

      const sym = Object.getOwnPropertySymbols(delegate).find(
        key => String(key) === 'Symbol(pino.stream)',
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream = (delegate as any)[sym!];
      if (stream == null) return;

      stream.flushSync();

      promises.push(new Promise(
        resolve => {
          // copy from thread-stream/index.js/destroy
          if (stream.destroyed) {
            resolve();
            return;
          }
          stream.on('close', () => {
            resolve();
          });
          if (stream.worker.exited) {
            resolve();
            return;
          }
          // 終了させる
          stream.worker.emit('exit', 0);
        },
      ));
    });

    await Promise.allSettled(promises);
  }

  public setMdc(key: string, value: unknown) {
    this.mdc.set(key, value);
  }

  public removeMdc(key: string) {
    this.mdc.delete(key);
  }
}
