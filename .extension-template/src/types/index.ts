export interface ExtensionConfig {
  apiKey: string;
  options: ExtensionOptions;
}

export interface ExtensionOptions {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoUpdate: boolean;
}

export interface ContentScriptConfig {
  enabled: boolean;
  selector: string;
}

export interface PopupData {
  status?: string;
  statusType?: 'configured' | 'unconfigured' | 'error';
  config?: Record<string, unknown>;
}

export type StorageKeys = 'config' | 'userPreferences' | 'cache' | 'history';

export interface MessagePayload {
  type: string;
  payload?: unknown;
  requestId?: string;
}

export type MessageType = MessagePayload & {
  type: MessageAction;
};

export type MessageAction =
  | 'GET_CONFIG'
  | 'CONFIG_CHANGED'
  | 'CONTENT_READY'
  | 'TOGGLE_POPUP'
  | 'OPEN_POPUP'
  | 'EXECUTE_ACTION'
  | 'ACTION_RESULT'
  | 'STORAGE_CHANGED';

export interface ChromeMessage {
  type: string;
  payload?: unknown;
  tabId?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}