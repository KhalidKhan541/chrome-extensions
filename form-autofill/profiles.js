const ProfileManager = {
  STORAGE_KEY: 'form_autofill_profiles',
  SETTINGS_KEY: 'form_autofill_settings',
  ACTIVE_KEY: 'form_autofill_active_profile',

  FIELD_TYPES: [
    { value: 'name', label: 'Full Name' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'address', label: 'Address' },
    { value: 'address2', label: 'Address Line 2' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'zip', label: 'ZIP Code' },
    { value: 'country', label: 'Country' },
    { value: 'company', label: 'Company' },
    { value: 'jobTitle', label: 'Job Title' },
    { value: 'card', label: 'Card Number' },
    { value: 'cardExpiry', label: 'Card Expiry' },
    { value: 'cardCvc', label: 'Card CVC' },
    { value: 'notes', label: 'Notes' },
    { value: 'username', label: 'Username' },
    { value: 'password', label: 'Password' },
    { value: 'website', label: 'Website' },
    { value: 'custom', label: 'Custom' }
  ],

  DEFAULT_PROFILES: {
    personal: {
      id: 'personal',
      name: 'Personal',
      fields: {
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        phone: '(555) 123-4567',
        address: '123 Main Street',
        address2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'United States',
        company: '',
        jobTitle: '',
        card: '',
        cardExpiry: '',
        cardCvc: '',
        notes: '',
        username: 'johndoe',
        password: '',
        website: '',
        custom: ''
      },
      created: Date.now(),
      updated: Date.now()
    },
    work: {
      id: 'work',
      name: 'Work',
      fields: {
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        phone: '(555) 987-6543',
        address: '456 Business Ave',
        address2: 'Suite 200',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'United States',
        company: 'Acme Corp',
        jobTitle: 'Software Engineer',
        card: '',
        cardExpiry: '',
        cardCvc: '',
        notes: '',
        username: 'jsmith',
        password: '',
        website: 'https://company.com',
        custom: ''
      },
      created: Date.now(),
      updated: Date.now()
    }
  },

  DEFAULT_SETTINGS: {
    highlight: true,
    highlightColor: '#4ade80',
    contextMenu: true,
    autoDetect: false
  },

  async getProfiles() {
    const result = await chrome.storage.local.get(this.STORAGE_KEY);
    const profiles = result[this.STORAGE_KEY];
    if (!profiles || Object.keys(profiles).length === 0) {
      await this.saveProfiles(this.DEFAULT_PROFILES);
      return { ...this.DEFAULT_PROFILES };
    }
    return profiles;
  },

  async saveProfiles(profiles) {
    await chrome.storage.local.set({ [this.STORAGE_KEY]: profiles });
  },

  async getActiveProfileId() {
    const result = await chrome.storage.local.get(this.ACTIVE_KEY);
    return result[this.ACTIVE_KEY] || 'personal';
  },

  async setActiveProfile(id) {
    await chrome.storage.local.set({ [this.ACTIVE_KEY]: id });
  },

  async getActiveProfile() {
    const profiles = await this.getProfiles();
    const activeId = await this.getActiveProfileId();
    return profiles[activeId] || profiles.personal;
  },

  async createProfile(name, fields = {}) {
    const profiles = await this.getProfiles();
    const id = 'profile_' + Date.now();
    const defaultFields = {};
    this.FIELD_TYPES.forEach(f => {
      defaultFields[f.value] = fields[f.value] || '';
    });
    profiles[id] = {
      id,
      name,
      fields: defaultFields,
      created: Date.now(),
      updated: Date.now()
    };
    await this.saveProfiles(profiles);
    return profiles[id];
  },

  async updateProfile(id, updates) {
    const profiles = await this.getProfiles();
    if (!profiles[id]) return null;
    profiles[id] = {
      ...profiles[id],
      ...updates,
      updated: Date.now()
    };
    await this.saveProfiles(profiles);
    return profiles[id];
  },

  async deleteProfile(id) {
    const profiles = await this.getProfiles();
    if (!profiles[id]) return false;
    delete profiles[id];
    await this.saveProfiles(profiles);
    const activeId = await this.getActiveProfileId();
    if (activeId === id) {
      const remaining = Object.keys(profiles);
      await this.setActiveProfile(remaining[0] || '');
    }
    return true;
  },

  async getSettings() {
    const result = await chrome.storage.local.get(this.SETTINGS_KEY);
    return { ...this.DEFAULT_SETTINGS, ...result[this.SETTINGS_KEY] };
  },

  async saveSettings(settings) {
    const current = await this.getSettings();
    await chrome.storage.local.set({
      [this.SETTINGS_KEY]: { ...current, ...settings }
    });
  },

  async exportProfile(id) {
    const profiles = await this.getProfiles();
    const profile = profiles[id];
    if (!profile) return null;
    return JSON.stringify({
      name: profile.name,
      fields: profile.fields
    }, null, 2);
  },

  async importProfile(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.name || !data.fields) {
        throw new Error('Invalid profile format');
      }
      return await this.createProfile(data.name, data.fields);
    } catch (e) {
      throw new Error('Failed to import: ' + e.message);
    }
  },

  async exportAll() {
    const profiles = await this.getProfiles();
    return JSON.stringify(profiles, null, 2);
  },

  async resetAll() {
    await chrome.storage.local.clear();
    await this.saveProfiles(this.DEFAULT_PROFILES);
    await this.saveSettings(this.DEFAULT_SETTINGS);
    await this.setActiveProfile('personal');
  },

  generateId() {
    return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  maskCard(number) {
    if (!number) return '';
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length <= 4) return cleaned;
    return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
  },

  formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  getFieldLabel(type) {
    const field = this.FIELD_TYPES.find(f => f.value === type);
    return field ? field.label : type;
  }
};

if (typeof module !== 'undefined') {
  module.exports = ProfileManager;
}
