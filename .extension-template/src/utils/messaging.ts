import { MessageType, MessagePayload } from '@types/index';

type MessageHandlerFn = (payload: MessagePayload, sender: chrome.runtime.MessageSender) => Promise<unknown> | unknown;

export class MessageHandler {
  private handlers: Map<string, MessageHandlerFn> = new Map();
  private pendingRequests: Map<string, { resolve: (value: unknown) => void; reject: (reason: unknown) => void }> = new Map();
  private requestId = 0;

  constructor() {
    this.setupListener();
  }

  private setupListener(): void {
    chrome.runtime.onMessage.addListener((message: MessageType, sender, sendResponse) => {
      this.handleIncoming(message, sender, sendResponse);
      return true;
    });
  }

  private async handleIncoming(
    message: MessageType,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): Promise<void> {
    if (message.requestId && this.pendingRequests.has(message.requestId)) {
      const { resolve } = this.pendingRequests.get(message.requestId)!;
      this.pendingRequests.delete(message.requestId);
      resolve(message.payload);
      return;
    }

    const handler = this.handlers.get(message.type);
    if (handler) {
      try {
        const result = await handler(message.payload, sender);
        sendResponse({ success: true, payload: result });
      } catch (error) {
        sendResponse({ success: false, error: (error as Error).message });
      }
    } else {
      sendResponse({ success: false, error: `No handler for ${message.type}` });
    }
  }

  on(messageType: string, handler: MessageHandlerFn): void {
    this.handlers.set(messageType, handler);
  }

  off(messageType: string): void {
    this.handlers.delete(messageType);
  }

  async sendToBackground(payload: MessagePayload): Promise<unknown> {
    return this.sendMessage(payload);
  }

  async sendToTab(tabId: number, payload: MessagePayload): Promise<unknown> {
    return this.sendMessage(payload, tabId);
  }

  async sendToAllTabs(payload: MessagePayload): Promise<void> {
    const tabs = await chrome.tabs.query({});
    await Promise.all(
      tabs.map((tab) => tab.id && this.sendToTab(tab.id, payload))
    );
  }

  private sendMessage(payload: MessagePayload, tabId?: number): Promise<unknown> {
    const requestId = `req_${++this.requestId}_${Date.now()}`;
    const message: MessageType = { ...payload, requestId };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      const sendFn = tabId
        ? (msg: MessageType) => chrome.tabs.sendMessage(tabId, msg)
        : (msg: MessageType) => chrome.runtime.sendMessage(msg);

      sendFn(message);

      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Message timeout'));
        }
      }, 30000);
    });
  }
}

export const messaging = new MessageHandler();