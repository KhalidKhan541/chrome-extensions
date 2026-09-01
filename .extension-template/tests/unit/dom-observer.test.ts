import { DOMObserver } from '@utils/dom-observer';

describe('DOMObserver', () => {
  let observer: DOMObserver;

  beforeEach(() => {
    document.body.innerHTML = '';
    observer = new DOMObserver({ selector: '[data-test]' });
  });

  afterEach(() => {
    observer.stop();
  });

  describe('start/stop', () => {
    it('should start observing', () => {
      observer.start();
      expect(observer.isRunning()).toBe(true);
    });

    it('should stop observing', () => {
      observer.start();
      observer.stop();
      expect(observer.isRunning()).toBe(false);
    });

    it('should not create multiple observers', () => {
      observer.start();
      observer.start();
      expect(observer.isRunning()).toBe(true);
    });
  });

  describe('element detection', () => {
    it('should detect elements matching selector on start', () => {
      document.body.innerHTML = '<div data-test="1"></div><div data-test="2"></div>';
      const callback = jest.fn();
      observer.on('element-added', callback);
      observer.start();

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should detect dynamically added elements', () => {
      const callback = jest.fn();
      observer.on('element-added', callback);
      observer.start();

      const div = document.createElement('div');
      div.setAttribute('data-test', 'dynamic');
      document.body.appendChild(div);

      expect(callback).toHaveBeenCalledWith(div);
    });

    it('should detect nested matching elements', () => {
      const callback = jest.fn();
      observer.on('element-added', callback);
      observer.start();

      const container = document.createElement('div');
      container.innerHTML = '<span data-test="nested"></span>';
      document.body.appendChild(container);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not trigger for non-matching elements', () => {
      const callback = jest.fn();
      observer.on('element-added', callback);
      observer.start();

      const div = document.createElement('div');
      div.setAttribute('data-other', 'value');
      document.body.appendChild(div);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('selector updates', () => {
    it('should update selector and detect new matches', () => {
      document.body.innerHTML = '<div data-old="1"></div>';
      const callback = jest.fn();
      observer.on('element-added', callback);
      observer.start();

      observer.setSelector('[data-new]');
      const div = document.createElement('div');
      div.setAttribute('data-new', 'value');
      document.body.appendChild(div);

      expect(callback).toHaveBeenCalledWith(div);
    });
  });

  describe('event callbacks', () => {
    it('should allow multiple callbacks for same event', () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      observer.on('element-added', cb1);
      observer.on('element-added', cb2);
      observer.start();

      const div = document.createElement('div');
      div.setAttribute('data-test', 'multi');
      document.body.appendChild(div);

      expect(cb1).toHaveBeenCalled();
      expect(cb2).toHaveBeenCalled();
    });

    it('should allow removing callbacks', () => {
      const callback = jest.fn();
      const unsubscribe = observer.on('element-added', callback);
      observer.start();

      const div = document.createElement('div');
      div.setAttribute('data-test', 'remove');
      document.body.appendChild(div);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      const div2 = document.createElement('div');
      div2.setAttribute('data-test', 'remove2');
      document.body.appendChild(div2);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should emit element-updated on attribute change', () => {
      document.body.innerHTML = '<div data-test="original"></div>';
      const callback = jest.fn();
      observer.on('element-updated', callback);
      observer.start();

      const div = document.querySelector('[data-test]')!;
      div.setAttribute('data-test', 'updated');

      expect(callback).toHaveBeenCalledWith(div);
    });
  });

  describe('options', () => {
    it('should respect subtree option', () => {
      const callback = jest.fn();
      observer = new DOMObserver({ selector: '[data-test]', subtree: false });
      observer.on('element-added', callback);
      observer.start();

      const container = document.createElement('div');
      const nested = document.createElement('div');
      nested.setAttribute('data-test', 'nested');
      container.appendChild(nested);
      document.body.appendChild(container);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should respect childList option', () => {
      const callback = jest.fn();
      observer = new DOMObserver({ selector: '[data-test]', childList: false });
      observer.on('element-added', callback);
      observer.start();

      const div = document.createElement('div');
      div.setAttribute('data-test', 'no-childlist');
      document.body.appendChild(div);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});