import pino from "pino";
import { Logger } from "../types";
import { PinoLoggerFactory } from "./pino-logger-factory";

export interface PinoLoggerOptions {
  /** このロガーのカテゴリ */
  category: string;

  /** ログに呼び出し元の情報を含めるかどうか */
  useCaller: boolean;
}

export class PinoLogger implements Logger {
  public constructor(
    private readonly factory: PinoLoggerFactory,
    public readonly delegate: pino.Logger,
    public readonly options: PinoLoggerOptions,
  ) {
  }

  public trace<T extends object>(obj: T, message: string, ...args: unknown[]) {
    this.delegate.trace(this.addOptionalData(obj), message, args);
  }

  public debug<T extends object>(obj: T, message: string, ...args: unknown[]) {
    this.delegate.debug(this.addOptionalData(obj), message, args);
  }

  public info<T extends object>(obj: T, message: string, ...args: unknown[]) {
    this.delegate.info(this.addOptionalData(obj), message, args);
  }

  public warn<T extends object>(obj: T, message: string, ...args: unknown[]) {
    this.delegate.warn(this.addOptionalData(obj), message, args);
  }

  public error<T extends object>(obj: T, message: string, ...args: unknown[]) {
    this.delegate.error(this.addOptionalData(obj), message, args);
  }

  private addOptionalData<T extends object>(obj: any): T {
    // categoryを追加するための処理。
    // pinoだとnameを使うべきだが、出力直前のログオブジェクトを扱えなかったためここで対応する。
    obj.category = this.options.category;

    // callerを追加するための処理
    if (this.options.useCaller) {
      obj.caller = this.getCaller();
    }

    return obj;
  }

  private getCaller(): string {
    const data: any = {};

    const original = Error.prepareStackTrace;
    try {
      Error.prepareStackTrace = (e, st) => {
        return st;
      };
      Error.captureStackTrace(data, this.getCaller);

      const caller = (data.stack as Array<NodeJS.CallSite>)[2];
      return `${this.toRelational(caller.getFileName())}:${caller.getLineNumber() ?? 0}`;
    } catch(e) {
      return 'unknown file:0';
    } finally {
      Error.prepareStackTrace = original;
    }
  }

  private toRelational(fileName: string | null | undefined): string {
    if (fileName == null) return 'unknown file';
    if (fileName.startsWith(process.cwd())) {
      return fileName.slice(process.cwd().length + 1);
    }
    return fileName;
  }

  public isTraceEnabled(): boolean {
    return this.delegate.isLevelEnabled('trace');
  }

  public isDebugEnabled(): boolean {
    return this.delegate.isLevelEnabled('debug');
  }

  public isInfoEnabled(): boolean {
    return this.delegate.isLevelEnabled('info');
  }

  public isWarnEnabled(): boolean {
    return this.delegate.isLevelEnabled('warn');
  }

  public isErrorEnabled(): boolean {
    return this.delegate.isLevelEnabled('error');
  }

  public setMdc(key: string, value: unknown): void {
    this.factory.setMdc(key, value);
  }

  public removeMdc(key: string): void {
    this.factory.removeMdc(key);
  }
}
