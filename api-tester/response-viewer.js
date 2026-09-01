/* response-viewer.js — JSON highlighting, status colours, clipboard, size */

(function () {
  'use strict';

  /* ── status code helpers ── */
  function statusClass(code) {
    if (code >= 200 && code < 300) return 'status-2xx';
    if (code >= 300 && code < 400) return 'status-3xx';
    if (code >= 400 && code < 500) return 'status-4xx';
    if (code >= 500) return 'status-5xx';
    return '';
  }

  function statusLabel(code) {
    if (code >= 200 && code < 300) return 'Success';
    if (code >= 300 && code < 400) return 'Redirect';
    if (code >= 400 && code < 500) return 'Client Error';
    if (code >= 500) return 'Server Error';
    return 'Unknown';
  }

  /* ── JSON syntax highlighting ── */
  function highlightJSON(json) {
    if (!json) return '';
    try {
      const obj = typeof json === 'string' ? JSON.parse(json) : json;
      json = JSON.stringify(obj, null, 2);
    } catch {
      /* not valid JSON — return escaped as-is */
    }
    const escaped = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }

  /* ── format size ── */
  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /* ── format time ── */
  function formatTime(ms) {
    if (ms < 1000) return ms + ' ms';
    return (ms / 1000).toFixed(2) + ' s';
  }

  /* ── copy to clipboard ── */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    }
  }

  /* ── render response headers table ── */
  function renderHeaders(headers) {
    if (!headers || !Object.keys(headers).length) return '<p class="muted">No headers</p>';
    let html = '<table class="headers-table"><thead><tr><th>Header</th><th>Value</th></tr></thead><tbody>';
    for (const [k, v] of Object.entries(headers)) {
      html += `<tr><td class="header-key">${escapeHtml(k)}</td><td class="header-val">${escapeHtml(v)}</td></tr>`;
    }
    html += '</tbody></table>';
    return html;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  window.APIResponseViewer = {
    statusClass,
    statusLabel,
    highlightJSON,
    formatSize,
    formatTime,
    copyToClipboard,
    renderHeaders,
    escapeHtml,
  };
})();
