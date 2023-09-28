import { PinoLoggerFactory } from './pino/pino-logger-factory';
import { LoggerFactory, Logger, LoggerPoolConfig as LoggerPoolConfig } from './types';

/**
 * ロガーを取得するためのインターフェースを提供します。
 */
export abstract class LoggerPool {
  /** LoggerFactoryのインスタンス */
  private static _instance: LoggerFactory;

  private static get instance() {
    if (this._instance == null) {
      throw new Error('LoggerFactory.create() is not called');
    }
    return this._instance;
  }

  /**
   * プールを初期化します。
   * @param config 初期化設定
   */
  public static initialize(config?: LoggerPoolConfig) {
    // 実装としてはpinoしかない。内容によって使い分けられるようにしたい。
    this._instance = new PinoLoggerFactory(config);
  }

  /**
   * categoryに対応するロガーを取得します。
   *
   * @param category ロガーを取得するカテゴリ
   * @returns ロガー
   */
  public static getLogger(category: string): Logger {
    return this.instance.getLogger(category);
  }

  /**
   * MDCにデータを登録します。
   *
   * @param key キー
   * @param value 値
   */
  public static setMdc(key: string, value: unknown) {
    this.instance.setMdc(key, value);
  }

  /**
   * MDCからデータを削除します。
   * @param key キー
   */
  public static removeMdc(key: string) {
    this.instance.removeMdc(key);
  }
}
