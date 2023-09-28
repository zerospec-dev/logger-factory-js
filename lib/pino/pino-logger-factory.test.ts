import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { pino } from 'pino';

import { PinoLoggerFactory } from './pino-logger-factory';
import { LoggerFactory, LoggerConfig } from '../types';

const removeFile = util.promisify(fs.unlink);
const readFile = util.promisify(fs.readFile);

const readLogs = async (logFile: string) => {
  const text = await readFile(logFile);
  const lines = text.toString().split(/\r\n|\r|\n/);
  return lines
    .filter(line => line.trim().length > 0)
    .map(line => JSON.parse(line));
};

describe('pino/pino-logger-factory', () => {
  const logFile = path.resolve(__dirname, '../../test.log');
  const pinoConfig: pino.LoggerOptions & LoggerConfig = {
    level: 'info',
    useCaller: true,
    // テストの都合上ファイルに出力する。
    transport: {
      target: 'pino/file',
      options: {
        destination: logFile,
        sync: true,
      },
    },
  };

  let sut: LoggerFactory | undefined;
  afterEach(() => {
    sut = undefined;
  });
  afterEach(async () => {
    try {
      await removeFile(logFile);
    } catch (e) {
      // NOP
    }
  });

  it('creates root logger with config', async () => {
    sut = new PinoLoggerFactory({
      configs: {
        root: pinoConfig,
      },
    });

    const logger = sut.getLogger('');
    logger.info({}, 'info');
    logger.debug({}, 'debug');

    await sut.finish();

    const logs = await readLogs(logFile);
    expect(logs).toMatchObject([
      {
        level: 'info',
        ts: expect.any(Number),
        context: {},
        category: '',
        caller: 'lib/pino/pino-logger-factory.test.ts:87',
        msg: 'info',
      },
    ]);
  });

  it('creates child logger', async () => {
    sut = new PinoLoggerFactory({
      configs: {
        root: pinoConfig,
        'abc.def': {
          level: 'debug',
        },
      },
    });

    const logger = sut.getLogger('abc.def');

    logger.info({ type: 'info' }, 'info');
    logger.debug({ type: 'debug' }, 'debug');

    await sut.finish();

    const logs = await readLogs(logFile);
    expect(logs).toMatchObject([
      {
        level: 'info',
        type: 'info',
        ts: expect.any(Number),
        context: {},
        category: 'abc.def',
        caller: 'lib/pino/pino-logger-factory.test.ts:112',
        msg: 'info',
      },
      {
        level: 'debug',
        type: 'debug',
        ts: expect.any(Number),
        context: {},
        category: 'abc.def',
        caller: 'lib/pino/pino-logger-factory.test.ts:115',
        msg: 'debug',
      },
    ]);
  });

  it('handles mdc', async () => {
    sut = new PinoLoggerFactory({
      configs: {
        root: pinoConfig,
        'abc.def': {
          level: 'debug',
        },
      },
    });

    const logger = sut.getLogger('abc.def');
    logger.setMdc('test', 123);
    logger.debug({ type: 'debug' }, 'debug');

    await sut.finish();

    const logs = await readLogs(logFile);
    expect(logs).toMatchObject([
      {
        level: 'debug',
        type: 'debug',
        ts: expect.any(Number),
        context: {
          test: 123,
        },
        category: 'abc.def',
        caller: 'lib/pino/pino-logger-factory.test.ts:152',
        msg: 'debug',
      },
    ]);
  });
});
