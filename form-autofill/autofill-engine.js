const AutoFillEngine = {
  FIELD_KEYWORDS: {
    name: ['name', 'fullname', 'full_name', 'your-name', 'yourname', 'display-name'],
    firstName: ['first-name', 'firstname', 'first_name', 'fname', 'given-name', 'givenname'],
    lastName: ['last-name', 'lastname', 'last_name', 'lname', 'surname', 'family-name'],
    email: ['email', 'e-mail', 'mail', 'email-address', 'emailaddress', 'user-email'],
    phone: ['phone', 'tel', 'telephone', 'mobile', 'cell', 'phone-number', 'phonenumber', 'contact-phone'],
    address: ['address', 'street', 'street-address', 'streetaddress', 'addr', 'address1', 'address-line1'],
    address2: ['address2', 'address-line2', 'addressline2', 'apt', 'suite', 'unit', 'apartment'],
    city: ['city', 'town', 'locality', 'address-city'],
    state: ['state', 'province', 'region', 'address-state', 'address-region'],
    zip: ['zip', 'zipcode', 'zip-code', 'postal', 'postalcode', 'postal-code', 'postcode'],
    country: ['country', 'address-country', 'country-code'],
    company: ['company', 'organization', 'org', 'company-name', 'companyname', 'business'],
    jobTitle: ['job-title', 'jobtitle', 'job_title', 'title', 'position', 'role', 'designation'],
    card: ['card', 'card-number', 'cardnumber', 'cc-number', 'ccnumber', 'credit-card', 'creditcard', 'payment-card'],
    cardExpiry: ['expiry', 'exp', 'expiration', 'card-expiry', 'cardexpiry', 'cc-exp', 'mm-yy', 'mm/yyyy'],
    cardCvc: ['cvc', 'cvv', 'ccv', 'security-code', 'card-code', 'card-cvc', 'card-cvv'],
    username: ['user', 'username', 'user-name', 'login', 'userid', 'user-id'],
    password: ['pass', 'password', 'passwd', 'pwd', 'user-password'],
    website: ['url', 'website', 'web', 'site', 'homepage', 'website-url'],
    notes: ['notes', 'comments', 'message', 'description', 'remark', 'extra']
  },

  CLASS_KEYWORDS: {
    name: ['name', 'fullname', 'full-name'],
    firstName: ['first', 'fname', 'given'],
    lastName: ['last', 'lname', 'surname', 'family'],
    email: ['email', 'e-mail', 'mail'],
    phone: ['phone', 'tel', 'telephone', 'mobile'],
    address: ['address', 'street', 'addr'],
    city: ['city', 'town'],
    state: ['state', 'province', 'region'],
    zip: ['zip', 'postal', 'postcode'],
    country: ['country'],
    company: ['company', 'organization', 'org'],
    jobTitle: ['job', 'title', 'position', 'role'],
    card: ['card', 'credit', 'payment'],
    cardExpiry: ['expir', 'exp-date'],
    cardCvc: ['cvc', 'cvv', 'security'],
    username: ['user', 'login'],
    password: ['pass', 'pwd'],
    website: ['url', 'website', 'site']
  },

  detectFieldType(input) {
    const candidates = [];

    const nameAttr = (input.name || '').toLowerCase();
    const idAttr = (input.id || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
    const autocomplete = (input.autocomplete || '').toLowerCase();
    const type = (input.type || '').toLowerCase();

    if (autocomplete) {
      const autoResult = this.matchAutocomplete(autocomplete);
      if (autoResult) return autoResult;
    }

    if (type === 'email') return 'email';
    if (type === 'tel') return 'phone';

    const label = this.findAssociatedLabel(input);
    const labelText = label ? label.toLowerCase() : '';

    const sources = [nameAttr, idAttr, placeholder, ariaLabel, labelText];

    for (const [fieldType, keywords] of Object.entries(this.FIELD_KEYWORDS)) {
      for (const source of sources) {
        if (!source) continue;
        for (const keyword of keywords) {
          if (source === keyword || source.includes(keyword)) {
            candidates.push({ type: fieldType, score: 10 });
          }
        }
      }
    }

    for (const [fieldType, keywords] of Object.entries(this.CLASS_KEYWORDS)) {
      const className = (input.className || '').toLowerCase();
      for (const keyword of keywords) {
        if (className.includes(keyword)) {
          candidates.push({ type: fieldType, score: 5 });
        }
      }
    }

    if (type === 'number' || type === 'text') {
      if (sources.some(s => s && (s.includes('card') || s.includes('credit')))) {
        candidates.push({ type: 'card', score: 8 });
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0].type;
    }

    return this.guessByPosition(input);
  },

  matchAutocomplete(autocomplete) {
    const map = {
      'name': 'name',
      'given-name': 'firstName',
      'family-name': 'lastName',
      'email': 'email',
      'tel': 'phone',
      'street-address': 'address',
      'address-line1': 'address',
      'address-line2': 'address2',
      'address-level2': 'city',
      'address-level1': 'state',
      'postal-code': 'zip',
      'country-name': 'country',
      'organization': 'company',
      'organization-title': 'jobTitle',
      'cc-number': 'card',
      'cc-exp': 'cardExpiry',
      'cc-csc': 'cardCvc',
      'username': 'username',
      'current-password': 'password',
      'new-password': 'password'
    };

    for (const [key, fieldType] of Object.entries(map)) {
      if (autocomplete.includes(key)) return fieldType;
    }
    return null;
  },

  findAssociatedLabel(input) {
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label.textContent.trim();
    }

    const parent = input.closest('label');
    if (parent) {
      const clone = parent.cloneNode(true);
      clone.querySelectorAll('input, select, textarea').forEach(el => el.remove());
      return clone.textContent.trim();
    }

    const container = input.closest('.form-group, .form-field, .field, .input-group, [class*="field"], [class*="form"]');
    if (container) {
      const label = container.querySelector('label, .label, [class*="label"]');
      if (label) return label.textContent.trim();
    }

    const prev = input.previousElementSibling;
    if (prev && (prev.tagName === 'LABEL' || prev.classList.contains('label'))) {
      return prev.textContent.trim();
    }

    const wrapper = input.parentElement;
    if (wrapper) {
      const textNodes = [];
      wrapper.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          textNodes.push(node.textContent.trim());
        }
      });
      if (textNodes.length > 0) return textNodes[0];
    }

    return null;
  },

  guessByPosition(input) {
    const rect = input.getBoundingClientRect();
    const allInputs = Array.from(document.querySelectorAll('input, select, textarea'));
    const index = allInputs.indexOf(input);

    if (index >= 0 && index <= 2) {
      const nearbyLabels = [];
      for (let i = Math.max(0, index - 2); i <= Math.min(allInputs.length - 1, index + 2); i++) {
        const label = this.findAssociatedLabel(allInputs[i]);
        if (label) nearbyLabels.push(label.toLowerCase());
      }
      const combined = nearbyLabels.join(' ');
      if (combined.includes('name') && !combined.includes('last')) return 'firstName';
      if (combined.includes('last') && combined.includes('name')) return 'lastName';
    }

    return null;
  },

  classifyInputs(inputs) {
    const classified = [];
    const used = new Set();

    for (const input of inputs) {
      if (used.has(input)) continue;
      if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') continue;
      if (input.disabled || input.readOnly) continue;

      const fieldType = this.detectFieldType(input);
      if (fieldType) {
        classified.push({ input, fieldType });
        used.add(input);
      }
    }

    return classified;
  },

  formatValue(fieldType, value) {
    if (!value) return '';

    switch (fieldType) {
      case 'phone':
        return this.formatPhone(value);
      case 'card':
        return this.formatCard(value);
      case 'email':
        return value.toLowerCase().trim();
      case 'zip':
        return value.trim();
      default:
        return value;
    }
  },

  formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  },

  formatCard(number) {
    const cleaned = number.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  },

  parseAddress(fullAddress) {
    const parts = fullAddress.split(',').map(s => s.trim());
    if (parts.length >= 3) {
      return {
        address: parts[0],
        city: parts[1],
        state: parts[2].split(' ')[0],
        zip: parts[2].split(' ').slice(1).join(' ')
      };
    }
    if (parts.length === 2) {
      return {
        address: parts[0],
        city: parts[1]
      };
    }
    return { address: fullAddress };
  },

  splitName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  }
};

if (typeof module !== 'undefined') {
  module.exports = AutoFillEngine;
}
