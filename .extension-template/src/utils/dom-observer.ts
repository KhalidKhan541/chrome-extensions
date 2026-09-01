type ObserverCallback = (element: HTMLElement) => void;

interface ObserverOptions {
  selector?: string;
  subtree?: boolean;
  childList?: boolean;
  attributes?: boolean;
  attributeFilter?: string[];
}

class DOMObserver {
  private observer: MutationObserver | null = null;
  private callbacks: Map<string, ObserverCallback[]> = new Map();
  private options: Required<ObserverOptions> = {
    selector: '',
    subtree: true,
    childList: true,
    attributes: false,
    attributeFilter: []
  };

  constructor(options: ObserverOptions = {}) {
    this.options = { ...this.options, ...options } as Required<ObserverOptions>;
  }

  start(): void {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.checkElement(node as HTMLElement);
            }
          });
        } else if (mutation.type === 'attributes' && this.options.attributes) {
          const target = mutation.target as HTMLElement;
          if (this.matchesSelector(target)) {
            this.emit('element-updated', target);
          }
        }
      });
    });

    this.observer.observe(document.body, {
      childList: this.options.childList,
      subtree: this.options.subtree,
      attributes: this.options.attributes,
      attributeFilter: this.options.attributeFilter
    });

    if (this.options.selector) {
      document.querySelectorAll(this.options.selector).forEach((el) => {
        this.checkElement(el as HTMLElement);
      });
    }
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  on(event: string, callback: ObserverCallback): () => void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);

    return () => {
      const callbacks = this.callbacks.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    };
  }

  off(event: string, callback: ObserverCallback): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  private emit(event: string, element: HTMLElement): void {
    this.callbacks.get(event)?.forEach((cb) => cb(element));
  }

  private checkElement(element: HTMLElement): void {
    if (this.matchesSelector(element)) {
      this.emit('element-added', element);
    }

    if (this.options.selector) {
      element.querySelectorAll(this.options.selector).forEach((el) => {
        this.checkElement(el as HTMLElement);
      });
    }
  }

  private matchesSelector(element: HTMLElement): boolean {
    if (!this.options.selector) return true;
    return element.matches(this.options.selector);
  }

  setSelector(selector: string): void {
    this.options.selector = selector;
  }

  isRunning(): boolean {
    return this.observer !== null;
  }
}

export { DOMObserver };