(() => {
  if (window.__formAutofillLoaded) return;
  window.__formAutofillLoaded = true;

  const HIGHLIGHT_CLASS = 'form-autofill-highlight';
  let highlightStyle = null;

  function injectHighlightStyle(color) {
    if (highlightStyle) highlightStyle.remove();
    highlightStyle = document.createElement('style');
    highlightStyle.textContent = `
      .${HIGHLIGHT_CLASS} {
        outline: 2px solid ${color || '#4ade80'} !important;
        outline-offset: -1px !important;
        background-color: ${color || '#4ade80'}15 !important;
        transition: outline-color 0.3s, background-color 0.3s !important;
      }
      .${HIGHLIGHT_CLASS}:focus {
        outline-color: ${color || '#4ade80'} !important;
      }
    `;
    document.head.appendChild(highlightStyle);
  }

  function removeHighlights() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(el => {
      el.classList.remove(HIGHLIGHT_CLASS);
    });
  }

  function setInputValue(input, value) {
    if (!value && value !== 0) return false;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set;

    if (input.tagName === 'TEXTAREA' && nativeTextareaValueSetter) {
      nativeTextareaValueSetter.call(input, value);
    } else if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, value);
    } else {
      input.value = value;
    }

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));

    return true;
  }

  function findFormFields() {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
    return inputs.filter(input => {
      if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return false;
      if (input.type === 'checkbox' || input.type === 'radio') return false;
      if (input.type === 'file' || input.type === 'image') return false;
      if (input.disabled || input.readOnly) return false;
      if (!input.offsetParent && !input.getClientRects().length) return false;
      return true;
    });
  }

  function detectForm() {
    const inputs = findFormFields();
    const fields = [];

    inputs.forEach(input => {
      const fieldType = AutoFillEngine.detectFieldType(input);
      if (fieldType) {
        fields.push({
          type: fieldType,
          tagName: input.tagName.toLowerCase(),
          inputType: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder
        });
      }
    });

    return fields;
  }

  function fillForm(profile, settings) {
    const inputs = findFormFields();
    const classified = AutoFillEngine.classifyInputs(inputs);
    let filled = 0;

    if (settings && settings.highlight) {
      injectHighlightStyle(settings.highlightColor);
    }

    classified.forEach(({ input, fieldType }) => {
      let value = profile[fieldType];
      if (!value) return;

      if (fieldType === 'name') {
        const nameParts = AutoFillEngine.splitName(value);
        if (!profile.firstName) profile.firstName = nameParts.firstName;
        if (!profile.lastName) profile.lastName = nameParts.lastName;
      }

      if (fieldType === 'address' && !profile.city) {
        const parsed = AutoFillEngine.parseAddress(value);
        Object.assign(profile, parsed);
      }

      value = AutoFillEngine.formatValue(fieldType, value);

      if (setInputValue(input, value)) {
        filled++;
        if (settings && settings.highlight) {
          input.classList.add(HIGHLIGHT_CLASS);
          setTimeout(() => input.classList.remove(HIGHLIGHT_CLASS), 2000);
        }
      }
    });

    return filled;
  }

  function quickFill(fieldType, value) {
    const inputs = findFormFields();
    let filled = 0;

    inputs.forEach(input => {
      const detected = AutoFillEngine.detectFieldType(input);
      if (detected === fieldType) {
        const formatted = AutoFillEngine.formatValue(fieldType, value);
        if (setInputValue(input, formatted)) {
          filled++;
        }
      }
    });

    return filled;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      switch (message.action) {
        case 'detectForm': {
          const fields = detectForm();
          sendResponse({ fields });
          break;
        }

        case 'fillForm': {
          const filled = fillForm(message.profile, message.settings);
          sendResponse({ filled });
          break;
        }

        case 'quickFill': {
          const filled = quickFill(message.fieldType, message.value);
          sendResponse({ filled });
          break;
        }

        case 'removeHighlights': {
          removeHighlights();
          sendResponse({ success: true });
          break;
        }

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (e) {
      sendResponse({ error: e.message });
    }

    return true;
  });
})();
