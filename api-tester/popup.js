/* popup.js — Main popup logic for API Request Tester */

(function () {
  'use strict';

  /* ── DOM references ── */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const methodSelect = $('#methodSelect');
  const urlInput = $('#urlInput');
  const btnSend = $('#btnSend');
  const headersList = $('#headersList');
  const btnAddHeader = $('#btnAddHeader');
  const historyList = $('#historyList');
  const btnClearHistory = $('#btnClearHistory');
  const envPanel = $('#envPanel');
  const btnEnvToggle = $('#btnEnvToggle');
  const btnAddEnv = $('#btnAddEnv');
  const btnSaveEnv = $('#btnSaveEnv');
  const envList = $('#envList');
  const btnImport = $('#btnImport');
  const btnExport = $('#btnExport');

  const bodyJsonArea = $('#bodyJsonArea');
  const bodyTextArea = $('#bodyTextArea');
  const bodyFormDataArea = $('#bodyFormDataArea');
  const bodyJson = $('#bodyJson');
  const bodyText = $('#bodyText');
  const formDataList = $('#formDataList');
  const btnAddFormDatum = $('#btnAddFormDatum');

  const responseSection = $('#responseSection');
  const resStatus = $('#resStatus');
  const resTime = $('#resTime');
  const resSize = $('#resSize');
  const respBody = $('#respBody');
  const respHeaders = $('#respHeaders');
  const btnCopyRes = $('#btnCopyRes');

  let envVars = [];
  let lastResponseBody = '';

  /* ══════════════════════════════════════════════════════
     Tab switching
     ══════════════════════════════════════════════════════ */
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach((t) => t.classList.remove('active'));
      $$('.tab-content').forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      $(`#tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  $$('.resp-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.resp-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      respBody.classList.toggle('hidden', tab.dataset.resptab !== 'body');
      respHeaders.classList.toggle('hidden', tab.dataset.resptab !== 'headers');
    });
  });

  /* ══════════════════════════════════════════════════════
     Body type switching
     ══════════════════════════════════════════════════════ */
  $$('input[name="bodyType"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      bodyJsonArea.classList.add('hidden');
      bodyTextArea.classList.add('hidden');
      bodyFormDataArea.classList.add('hidden');
      const v = radio.value;
      if (v === 'json') bodyJsonArea.classList.remove('hidden');
      else if (v === 'text') bodyTextArea.classList.remove('hidden');
      else if (v === 'formdata') bodyFormDataArea.classList.remove('hidden');
    });
  });

  /* ══════════════════════════════════════════════════════
     Key-value row helpers
     ══════════════════════════════════════════════════════ */
  function createKVRow(container, keyPlaceholder, valuePlaceholder) {
    const row = document.createElement('div');
    row.className = 'kv-row';
    row.innerHTML = `
      <input type="text" class="kv-key" placeholder="${keyPlaceholder}" spellcheck="false" />
      <input type="text" class="kv-value" placeholder="${valuePlaceholder}" spellcheck="false" />
      <button class="btn-remove" title="Remove">&times;</button>
    `;
    row.querySelector('.btn-remove').addEventListener('click', () => row.remove());
    container.appendChild(row);
    row.querySelector('.kv-key').focus();
    return row;
  }

  function readKVPairs(container) {
    return Array.from(container.querySelectorAll('.kv-row')).map((row) => ({
      key: row.querySelector('.kv-key').value,
      value: row.querySelector('.kv-value').value,
    }));
  }

  /* Initial rows */
  createKVRow(headersList, 'Header name', 'Value');
  createKVRow(formDataList, 'Field name', 'Value');

  btnAddHeader.addEventListener('click', () => createKVRow(headersList, 'Header name', 'Value'));
  btnAddFormDatum.addEventListener('click', () => createKVRow(formDataList, 'Field name', 'Value'));

  /* ══════════════════════════════════════════════════════
     Environment variables
     ══════════════════════════════════════════════════════ */
  btnEnvToggle.addEventListener('click', () => envPanel.classList.toggle('hidden'));
  btnAddEnv.addEventListener('click', () => createKVRow(envList, 'Variable name', 'Value'));

  btnSaveEnv.addEventListener('click', () => {
    envVars = readKVPairs(envList).filter((v) => v.key);
    chrome.runtime.sendMessage({ type: 'SAVE_ENV_VARS', envVars });
  });

  function loadEnvVars() {
    chrome.runtime.sendMessage({ type: 'GET_ENV_VARS' }, (res) => {
      envVars = res?.envVars || [];
      envList.innerHTML = '';
      envVars.forEach((v) => {
        const row = createKVRow(envList, 'Variable name', 'Value');
        row.querySelector('.kv-key').value = v.key;
        row.querySelector('.kv-value').value = v.value;
      });
      if (!envVars.length) createKVRow(envList, 'Variable name', 'Value');
    });
  }
  loadEnvVars();

  /* ══════════════════════════════════════════════════════
     Interpolate environment variables
     ══════════════════════════════════════════════════════ */
  function interpolate(text) {
    return window.APIRequestHandler.interpolate(text, envVars);
  }

  /* ══════════════════════════════════════════════════════
     Send request
     ══════════════════════════════════════════════════════ */
  async function sendRequest() {
    const method = methodSelect.value;
    let url = interpolate(urlInput.value.trim());
    if (!url) { urlInput.focus(); return; }

    /* auto-add protocol */
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    const headers = readKVPairs(headersList).filter((h) => h.key);
    headers.forEach((h) => { h.value = interpolate(h.value); });

    const bodyTypeRadio = document.querySelector('input[name="bodyType"]:checked');
    const bodyType = bodyTypeRadio ? bodyTypeRadio.value : 'none';
    let body = '';
    let formData = [];

    if (bodyType === 'json') body = interpolate(bodyJson.value);
    else if (bodyType === 'text') body = interpolate(bodyText.value);
    else if (bodyType === 'formdata') {
      formData = readKVPairs(formDataList).filter((f) => f.key);
      formData.forEach((f) => { f.value = interpolate(f.value); });
    }

    btnSend.textContent = 'Sending…';
    btnSend.disabled = true;

    const result = await window.APIRequestHandler.sendRequest({
      method,
      url,
      headers,
      bodyType: bodyType === 'none' ? '' : bodyType,
      body,
      formData,
    });

    btnSend.textContent = 'Send';
    btnSend.disabled = false;

    displayResponse(result);

    /* save to history */
    const historyItem = {
      method,
      url: urlInput.value.trim(),
      status: result.status,
      statusText: result.statusText,
      elapsed: result.elapsed,
      size: result.size,
      timestamp: Date.now(),
      headers,
      bodyType,
      body,
    };
    chrome.runtime.sendMessage({ type: 'SAVE_HISTORY_ITEM', item: historyItem });
    loadHistory();
  }

  btnSend.addEventListener('click', sendRequest);

  /* ── Keyboard shortcut ── */
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      sendRequest();
    }
  });

  /* ══════════════════════════════════════════════════════
     Display response
     ══════════════════════════════════════════════════════ */
  function displayResponse(result) {
    responseSection.classList.remove('hidden');

    if (!result.ok) {
      resStatus.textContent = 'Error';
      resStatus.className = 'res-badge status-5xx';
      resTime.textContent = window.APIResponseViewer.formatTime(result.elapsed);
      resSize.textContent = '';
      respBody.innerHTML = `<span class="json-null">Error: ${window.APIResponseViewer.escapeHtml(result.error)}</span>`;
      respHeaders.innerHTML = '';
      lastResponseBody = '';
      return;
    }

    /* status badge */
    resStatus.textContent = `${result.status} ${result.statusText}`;
    resStatus.className = `res-badge ${window.APIResponseViewer.statusClass(result.status)}`;
    resTime.textContent = `⏱ ${window.APIResponseViewer.formatTime(result.elapsed)}`;
    resSize.textContent = `📦 ${window.APIResponseViewer.formatSize(result.size)}`;

    /* body */
    const contentType = (result.headers['content-type'] || '').toLowerCase();
    if (contentType.includes('application/json')) {
      respBody.innerHTML = window.APIResponseViewer.highlightJSON(result.body);
    } else {
      respBody.textContent = result.body;
    }
    lastResponseBody = result.body;

    /* headers */
    respHeaders.innerHTML = window.APIResponseViewer.renderHeaders(result.headers);

    /* auto-switch to body tab */
    $$('.resp-tab').forEach((t) => t.classList.remove('active'));
    $$('.resp-tab')[0].classList.add('active');
    respBody.classList.remove('hidden');
    respHeaders.classList.add('hidden');
  }

  /* ══════════════════════════════════════════════════════
     Copy response
     ══════════════════════════════════════════════════════ */
  btnCopyRes.addEventListener('click', async () => {
    if (!lastResponseBody) return;
    const ok = await window.APIResponseViewer.copyToClipboard(lastResponseBody);
    btnCopyRes.textContent = ok ? 'Copied!' : 'Failed';
    setTimeout(() => { btnCopyRes.textContent = 'Copy'; }, 1500);
  });

  /* ══════════════════════════════════════════════════════
     History
     ══════════════════════════════════════════════════════ */
  function loadHistory() {
    chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (res) => {
      const items = res?.history || [];
      historyList.innerHTML = '';
      if (!items.length) {
        historyList.innerHTML = '<p class="muted" style="padding:8px">No request history yet.</p>';
        return;
      }
      items.forEach((item, idx) => {
        const el = document.createElement('div');
        el.className = 'history-item';
        const methodCls = `method-${item.method}`;
        const statusCls = item.status ? window.APIResponseViewer.statusClass(item.status) : '';
        el.innerHTML = `
          <span class="history-method ${methodCls}">${item.method}</span>
          <span class="history-url" title="${window.APIResponseViewer.escapeHtml(item.url)}">${window.APIResponseViewer.escapeHtml(item.url)}</span>
          <span class="history-status ${statusCls}">${item.status || '—'}</span>
          <span class="history-time">${item.elapsed ? window.APIResponseViewer.formatTime(item.elapsed) : ''}</span>
          <button class="history-delete" title="Delete">&times;</button>
        `;
        /* click to replay */
        el.addEventListener('click', (e) => {
          if (e.target.closest('.history-delete')) return;
          methodSelect.value = item.method || 'GET';
          urlInput.value = item.url || '';
          if (item.headers) {
            headersList.innerHTML = '';
            item.headers.forEach((h) => {
              const row = createKVRow(headersList, 'Header name', 'Value');
              row.querySelector('.kv-key').value = h.key;
              row.querySelector('.kv-value').value = h.value;
            });
          }
          if (item.bodyType) {
            const radio = document.querySelector(`input[name="bodyType"][value="${item.bodyType}"]`);
            if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change')); }
          }
          if (item.body) {
            if (item.bodyType === 'json') bodyJson.value = item.body;
            else if (item.bodyType === 'text') bodyText.value = item.body;
          }
          /* switch to headers tab */
          $$('.tab').forEach((t) => t.classList.remove('active'));
          $$('.tab-content').forEach((c) => c.classList.remove('active'));
          $$('.tab')[0].classList.add('active');
          $('#tab-headers').classList.add('active');
        });
        /* delete */
        el.querySelector('.history-delete').addEventListener('click', (e) => {
          e.stopPropagation();
          chrome.runtime.sendMessage({ type: 'DELETE_HISTORY_ITEM', index: idx }, () => loadHistory());
        });
        historyList.appendChild(el);
      });
    });
  }
  loadHistory();

  btnClearHistory.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' }, () => loadHistory());
  });

  /* ══════════════════════════════════════════════════════
     Import / Export
     ══════════════════════════════════════════════════════ */
  btnExport.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (res) => {
      const data = JSON.stringify({ history: res?.history || [], envVars }, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'api-tester-export.json'; a.click();
      URL.revokeObjectURL(url);
    });
  });

  btnImport.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (data.history) {
            data.history.forEach((item) => {
              chrome.runtime.sendMessage({ type: 'SAVE_HISTORY_ITEM', item });
            });
          }
          if (data.envVars) {
            chrome.runtime.sendMessage({ type: 'SAVE_ENV_VARS', envVars: data.envVars }, () => loadEnvVars());
          }
          setTimeout(loadHistory, 200);
        } catch (e) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });
})();
