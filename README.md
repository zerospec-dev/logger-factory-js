# logger-factory.js

このモジュールは、汎用的なロガーのインターフェースを提供します。  
現在はpinoのみ対応しています。

## install

`npm install @zerospec-dev/logger-factory pino`

## usage

```
const factory = LoggerFactory.get(config);
const logger = factory.getLogger('path.to.the.category');

logger.info({ foo: 123, bar: '456' }, 'some things occurred');
logger.error({ error }, 'error occurred');
```
