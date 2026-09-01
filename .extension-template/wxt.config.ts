import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: '{{EXTENSION_NAME}}',
    version: '0.0.0',
    description: '{{EXTENSION_DESCRIPTION}}',
    manifest_version: 3,
    default_locale: 'en',
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png'
    },
    action: {
      default_popup: 'popup.html',
      default_icon: {
        16: 'icons/icon-16.png',
        32: 'icons/icon-32.png',
        48: 'icons/icon-48.png',
        128: 'icons/icon-128.png'
      }
    },
    background: {
      service_worker: 'background.js',
      type: 'module'
    },
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content.js'],
        css: ['content.css'],
        run_at: 'document_idle'
      }
    ],
    permissions: ['storage', 'activeTab', 'scripting', 'tabs'],
    host_permissions: ['https://api.example.com/*'],
    optional_permissions: ['contextMenus', 'notifications', 'alarms'],
    options_page: 'options.html',
    options_ui: {
      page: 'options.html',
      open_in_tab: true
    },
    web_accessible_resources: [
      {
        resources: ['icons/*', 'styles/*'],
        matches: ['<all_urls>']
      }
    ],
    commands: {
      'open-popup': {
        suggested_key: { default: 'Ctrl+Shift+X', mac: 'Command+Shift+X' },
        description: 'Open extension popup'
      },
      'toggle-feature': {
        suggested_key: { default: 'Ctrl+Shift+Y', mac: 'Command+Shift+Y' },
        description: 'Toggle main feature'
      }
    }
  },
  modules: ['@wxt-dev/module-react'],
  runner: {
    startUrls: ['https://example.com']
  },
  zip: {
    artifactName: 'extension-{{VERSION}}.zip'
  }
});