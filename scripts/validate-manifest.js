#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const MV3_REQUIRED_FIELDS = [
  'manifest_version',
  'name',
  'version',
];

const MV3_VALID_PERMISSIONS = [
  'activeTab', 'alarms', 'background', 'bookmarks', 'browsingData',
  'certificateProvider', 'clipboardRead', 'clipboardWrite', 'contentSettings',
  'contextMenus', 'cookies', 'debugger', 'declarativeNetRequest',
  'declarativeNetRequestWithHostAccess', 'desktopCapture', 'displaySource',
  'dns', 'documentScan', 'downloads', 'downloads.open', 'downloads.shelf',
  'enterprise.deviceAttributes', 'enterprise.hardwarePlatform',
  'enterprise.networkingAttributes', 'enterprise.platformKeys',
  'fileBrowserHandler', 'fileSystem', 'fileSystem.write', 'fileSystem.directory',
  'fileSystem.writeDirectory', 'fontSettings', 'gcm', 'geolocation',
  'history', 'identity', 'identity.email', 'idle', 'management',
  'nativeMessaging', 'notifications', 'pageCapture', 'platformKeys',
  'power', 'printerProvider', 'printing', 'printingMetrics', 'privacy',
  'processes', 'proxy', 'scripting', 'search', 'sessions', 'sidePanel',
  'storage', 'system.cpu', 'system.display', 'system.memory', 'system.storage',
  'tabCapture', 'tabGroups', 'tabs', 'topSites', 'tts', 'ttsEngine',
  'vpnProvider', 'wallpaper', 'webAuthenticationProxy', 'webNavigation',
  'webRequest', 'webRequestBlocking',
];

const MV3_VALID_HOST_PERMISSIONS = [
  '<all_urls>', '*://*/*', 'http://*/*', 'https://*/*', 'file://*/*',
];

const MV3_VALID_ACTION_FIELDS = ['default_popup', 'default_icon', 'default_title'];
const MV3_VALID_BACKGROUND_FIELDS = ['service_worker', 'type'];
const MV3_VALID_CONTENT_SCRIPT_FIELDS = ['matches', 'exclude_matches', 'include_globs', 'exclude_globs', 'js', 'css', 'run_at', 'match_origin_as_fallback', 'world'];
const MV3_VALID_ICON_SIZES = ['16', '24', '32', '48', '64', '96', '128', '256'];
const MV3_VALID_RUN_AT = ['document_start', 'document_end', 'document_idle'];
const MV3_VALID_WORLD = ['MAIN', 'ISOLATED'];

function validateManifest(manifestPath) {
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(manifestPath)) {
    return { valid: false, errors: [`Manifest not found: ${manifestPath}`], warnings: [] };
  }

  let manifest;
  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    manifest = JSON.parse(content);
  } catch (e) {
    return { valid: false, errors: [`Invalid JSON: ${e.message}`], warnings: [] };
  }

  if (manifest.manifest_version !== 3) {
    errors.push('manifest_version must be 3');
  }

  for (const field of MV3_REQUIRED_FIELDS) {
    if (!manifest[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (manifest.name && manifest.name.length > 75) {
    warnings.push('name should be <= 75 characters');
  }

  if (manifest.version && !/^\d+\.\d+\.\d+(-.+)?$/.test(manifest.version)) {
    warnings.push('version should follow semver (e.g., 1.0.0)');
  }

  if (manifest.description && manifest.description.length > 132) {
    warnings.push('description should be <= 132 characters');
  }

  if (manifest.permissions) {
    for (const perm of manifest.permissions) {
      if (!MV3_VALID_PERMISSIONS.includes(perm) && !perm.startsWith('http')) {
        warnings.push(`Unknown permission: ${perm}`);
      }
    }
  }

  if (manifest.host_permissions) {
    for (const hp of manifest.host_permissions) {
      if (!MV3_VALID_HOST_PERMISSIONS.includes(hp) && !hp.match(/^\*?:\/\/\*/) && !hp.match(/^https?:\/\//)) {
        warnings.push(`Unusual host_permission: ${hp}`);
      }
    }
  }

  if (manifest.action) {
    for (const key of Object.keys(manifest.action)) {
      if (!MV3_VALID_ACTION_FIELDS.includes(key)) {
        warnings.push(`Unknown action field: ${key}`);
      }
    }
    if (manifest.action.default_icon) {
      for (const size of Object.keys(manifest.action.default_icon)) {
        if (!MV3_VALID_ICON_SIZES.includes(size)) {
          warnings.push(`Unusual icon size in action.default_icon: ${size}`);
        }
      }
    }
  }

  if (manifest.background) {
    if (!manifest.background.service_worker && manifest.background.type !== 'module') {
      errors.push('background must have service_worker (or type: module)');
    }
    for (const key of Object.keys(manifest.background)) {
      if (!MV3_VALID_BACKGROUND_FIELDS.includes(key)) {
        warnings.push(`Unknown background field: ${key}`);
      }
    }
  }

  if (manifest.content_scripts) {
    for (const [i, cs] of manifest.content_scripts.entries()) {
      if (!cs.matches || !Array.isArray(cs.matches) || cs.matches.length === 0) {
        errors.push(`content_scripts[${i}] missing required 'matches' array`);
      }
      for (const key of Object.keys(cs)) {
        if (!MV3_VALID_CONTENT_SCRIPT_FIELDS.includes(key)) {
          warnings.push(`Unknown content_scripts field: ${key}`);
        }
      }
      if (cs.run_at && !MV3_VALID_RUN_AT.includes(cs.run_at)) {
        warnings.push(`Invalid run_at value: ${cs.run_at}`);
      }
      if (cs.world && !MV3_VALID_WORLD.includes(cs.world)) {
        warnings.push(`Invalid world value: ${cs.world}`);
      }
      if (cs.js) {
        for (const jsFile of cs.js) {
          if (!jsFile.endsWith('.js')) {
            warnings.push(`content_scripts[${i}] js file should end with .js: ${jsFile}`);
          }
        }
      }
    }
  }

  if (manifest.icons) {
    for (const size of Object.keys(manifest.icons)) {
      if (!MV3_VALID_ICON_SIZES.includes(size)) {
        warnings.push(`Unusual icon size: ${size}`);
      }
    }
  }

  if (manifest.web_accessible_resources) {
    for (const [i, war] of manifest.web_accessible_resources.entries()) {
      if (!war.resources || !Array.isArray(war.resources) || war.resources.length === 0) {
        errors.push(`web_accessible_resources[${i}] missing required 'resources' array`);
      }
      if (!war.matches || !Array.isArray(war.matches) || war.matches.length === 0) {
        errors.push(`web_accessible_resources[${i}] missing required 'matches' array`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function main() {
  const args = process.argv.slice(2);
  const manifestPath = args[0] || path.join(process.cwd(), 'manifest.json');

  console.log(`\nValidating manifest: ${manifestPath}\n`);

  const result = validateManifest(manifestPath);

  if (result.errors.length > 0) {
    console.error('❌ Errors:');
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Warnings:');
    for (const warn of result.warnings) {
      console.warn(`  - ${warn}`);
    }
  }

  if (result.valid) {
    console.log('\n✅ Manifest is valid (MV3)');
  } else {
    console.log('\n❌ Manifest validation failed');
  }

  process.exit(result.valid ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { validateManifest, MV3_REQUIRED_FIELDS, MV3_VALID_PERMISSIONS };