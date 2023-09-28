/**
 * ログを記録するためのインターフェース。
 * 
 * @param obj ログに記録するkey-value形式のオブジェクト
 * @param message ログに記録するメッセージ
 * @param args メッセージに埋め込む引数
 */
export interface LogFunction {
  <T extends {[key: string]: unknown}>(obj: T, message: string, ...args: any[]): void;
}

export interface Logger {
  /** traceレベルのログを記録します。 */
  trace: LogFunction;

  /** debugレベルのログを記録します。 */
  debug: LogFunction;

  /** infoレベルのログを記録します。 */
  info: LogFunction;

  /** warnレベルのログを記録します。 */
  warn: LogFunction;

  /** errorレベルのログを記録します。 */
  error: LogFunction;

  /** traceレベルのログが有効かどうかを判断します。 */
  isTraceEnabled(): boolean;

  /** debugレベルのログが有効かどうかを判断します。 */
  isDebugEnabled(): boolean;

  /** infoレベルのログが有効かどうかを判断します。 */
  isInfoEnabled(): boolean;

  /** warnレベルのログが有効かどうかを判断します。 */
  isWarnEnabled(): boolean;

  /** errorレベルのログが有効かどうかを判断します。 */
  isErrorEnabled(): boolean;

  /**
   * MDCにデータを登録します。
   *
   * @param key キー
   * @param value 値
   */
  setMdc(key: string, value: unknown): void;

  /**
   * MDCからデータを削除します。
   *
   * @param key キー
   */
  removeMdc(key: string): void;
}

/**
 * categoryごとの設定を定義します。
 */
export interface LoggerConfig {
  [key: string]: unknown;
}

/**
 * LoggerPoolの設定
 */
export interface LoggerPoolConfig {
  /** ロガーの実装名 */
  base?: string;

  /** categoryごとの設定 */
  configs: {
    /** ルートの設定 */
    root: LoggerConfig;

    /** 各カテゴリごとの設定 */
    [category: string]: LoggerConfig;
  }
}

/**
 * ロガーの実装を提供します。
 */
export interface LoggerFactory {

  /**
   * カテゴリに対応したロガーの実装を返します。
   * @param category カテゴリ
   */
  getLogger(category: string): Logger;

  /**
   * MDCに情報を設定します。
   *
   * @param key キー
   * @param value 値
   */
  setMdc(key: string, value: unknown): void;

  /**
   * MDCから情報を削除します。
   *
   * @param key キー
   */
  removeMdc(key: string): void;

  /**
   * ロガーを終了させます。
   */
  finish(): Promise<void>;
}
