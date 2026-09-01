/* request-handler.js — Fetch wrapper, body serialisation, timing */

(function () {
  'use strict';

  const DEFAULT_TIMEOUT = 30000;

  /**
   * Send an HTTP request and return a structured result.
   *
   * @param {object} opts
   * @param {string} opts.method
   * @param {string} opts.url
   * @param {Array<{key:string,value:string}>} opts.headers
   * @param {string} opts.bodyType — 'json' | 'text' | 'formdata' | ''
   * @param {string} opts.body
   * @param {Array<{key:string,value:string}>} opts.formData
   * @param {number} opts.timeout
   * @param {boolean} opts.followRedirects
   * @returns {Promise<object>}
   */
  async function sendRequest(opts) {
    const {
      method = 'GET',
      url = '',
      headers = [],
      bodyType = '',
      body = '',
      formData = [],
      timeout = DEFAULT_TIMEOUT,
      followRedirects = true,
    } = opts;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const start = performance.now();

    const fetchOpts = {
      method: method.toUpperCase(),
      headers: {},
      signal: controller.signal,
      redirect: followRedirects ? 'follow' : 'manual',
    };

    /* build headers */
    headers.forEach((h) => {
      if (h.key && h.key.trim()) {
        fetchOpts.headers[h.key.trim()] = h.value;
      }
    });

    /* build body */
    if (method !== 'GET' && method !== 'HEAD') {
      if (bodyType === 'json') {
        if (body && !fetchOpts.headers['Content-Type']) {
          fetchOpts.headers['Content-Type'] = 'application/json';
        }
        fetchOpts.body = body;
      } else if (bodyType === 'text') {
        if (body && !fetchOpts.headers['Content-Type']) {
          fetchOpts.headers['Content-Type'] = 'text/plain';
        }
        fetchOpts.body = body;
      } else if (bodyType === 'formdata') {
        const fd = new FormData();
        formData.forEach((f) => {
          if (f.key) fd.append(f.key, f.value);
        });
        fetchOpts.body = fd;
      } else if (body) {
        fetchOpts.body = body;
      }
    }

    let response;
    try {
      response = await fetch(url, fetchOpts);
    } catch (err) {
      clearTimeout(timer);
      const elapsed = Math.round(performance.now() - start);
      return {
        ok: false,
        error: err.name === 'AbortError' ? 'Request timed out' : err.message,
        elapsed,
        status: 0,
        statusText: 'Error',
      };
    }

    clearTimeout(timer);
    const elapsed = Math.round(performance.now() - start);

    /* clone so we can read body twice if needed */
    const clone = response.clone();
    let responseBody;
    const contentType = response.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        responseBody = JSON.stringify(await response.json(), null, 2);
      } else {
        responseBody = await response.text();
      }
    } catch {
      responseBody = await response.text().catch(() => '');
    }

    /* response headers */
    const respHeaders = {};
    response.headers.forEach((v, k) => {
      respHeaders[k] = v;
    });

    /* response size (approximate) */
    const sizeBytes = new TextEncoder().encode(responseBody).length;

    return {
      ok: true,
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
      body: responseBody,
      elapsed,
      size: sizeBytes,
      url: response.url,
      redirected: response.redirected,
    };
  }

  /* ── environment variable interpolation ── */
  function interpolate(text, envVars) {
    if (!text || !envVars || !envVars.length) return text;
    let result = text;
    envVars.forEach((v) => {
      if (v.key) {
        const pattern = new RegExp(`\\{\\{${v.key}\\}\\}`, 'g');
        result = result.replace(pattern, v.value);
      }
    });
    return result;
  }

  /* expose globally */
  window.APIRequestHandler = { sendRequest, interpolate };
})();
