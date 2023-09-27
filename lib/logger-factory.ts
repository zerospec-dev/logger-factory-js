import { PinoLoggerFactory } from './pino/pino-logger-factory';
import { ILoggerFactory, Logger, LoggerFactoryConfig } from './types';

/**
 * ロガーを提供します。
 */
export abstract class LoggerFactory implements ILoggerFactory {
  public static get(config?: LoggerFactoryConfig): ILoggerFactory {
    // 実装としてはpinoしかない。内容によって使い分けられるようにしたい。
    return new PinoLoggerFactory(config);
  }

  public abstract getLogger(category: string): Logger;

  public abstract finish(): Promise<void>;
}
