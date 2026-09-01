import { Logger, getLogger } from '@utils/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Logger('TestContext');
    consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('log levels', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message', { data: 123 });
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[TestContext]'),
        'Debug message',
        { data: 123 }
      );
    });

    it('should log info messages', () => {
      logger.info('Info message');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[TestContext]'),
        'Info message',
        ''
      );
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[TestContext]'),
        'Warning message',
        ''
      );
    });

    it('should log error messages', () => {
      logger.error('Error message', new Error('test'));
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[TestContext]'),
        'Error message',
        new Error('test')
      );
    });
  });

  describe('minLevel filtering', () => {
    it('should filter out debug when minLevel is info', () => {
      logger.setMinLevel('info');
      logger.debug('Debug message');
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should allow info when minLevel is info', () => {
      logger.setMinLevel('info');
      logger.info('Info message');
      expect(console.info).toHaveBeenCalled();
    });

    it('should allow warn when minLevel is warn', () => {
      logger.setMinLevel('warn');
      logger.warn('Warn message');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should allow error when minLevel is error', () => {
      logger.setMinLevel('error');
      logger.error('Error message');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('log management', () => {
    it('should store logs internally', () => {
      logger.info('Test message');
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test message');
      expect(logs[0].level).toBe('info');
      expect(logs[0].context).toBe('TestContext');
    });

    it('should filter logs by level', () => {
      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(logger.getLogs('debug')).toHaveLength(1);
      expect(logger.getLogs('info')).toHaveLength(1);
      expect(logger.getLogs('warn')).toHaveLength(1);
      expect(logger.getLogs('error')).toHaveLength(1);
    });

    it('should clear logs', () => {
      logger.info('Test');
      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });

    it('should export logs as JSON', () => {
      logger.info('Test', { key: 'value' });
      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].data).toEqual({ key: 'value' });
    });

    it('should limit max logs', () => {
      const limitedLogger = new Logger('Limited');
      (limitedLogger as any).maxLogs = 3;

      limitedLogger.info('1');
      limitedLogger.info('2');
      limitedLogger.info('3');
      limitedLogger.info('4');

      expect(limitedLogger.getLogs()).toHaveLength(3);
      expect(limitedLogger.getLogs()[0].message).toBe('2');
    });
  });
});

describe('getLogger', () => {
  it('should return singleton instance per context', () => {
    const logger1 = getLogger('SharedContext');
    const logger2 = getLogger('SharedContext');
    expect(logger1).toBe(logger2);
  });

  it('should return different instances for different contexts', () => {
    const logger1 = getLogger('Context1');
    const logger2 = getLogger('Context2');
    expect(logger1).not.toBe(logger2);
  });
});