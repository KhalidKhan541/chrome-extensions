chrome.runtime.onInstalled.addListener(async () => {
  const profiles = await chrome.storage.local.get('form_autofill_profiles');
  if (!profiles.form_autofill_profiles || Object.keys(profiles.form_autofill_profiles).length === 0) {
    await chrome.storage.local.set({
      form_autofill_profiles: {
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
      form_autofill_active_profile: 'personal',
      form_autofill_settings: {
        highlight: true,
        highlightColor: '#4ade80',
        contextMenu: true,
        autoDetect: false
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleContextMenu') {
    if (message.enabled) {
      chrome.contextMenus.create({
        id: 'autofill-form',
        title: 'AutoFill Form',
        contexts: ['all']
      });
    } else {
      chrome.contextMenus.remove('autofill-form');
    }
    sendResponse({ success: true });
  }

  if (message.action === 'fillFromBackground') {
    fillActiveTab(message.profile, message.settings);
    sendResponse({ success: true });
  }

  return true;
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'autofill-form') {
    const result = await chrome.storage.local.get([
      'form_autofill_profiles',
      'form_autofill_active_profile',
      'form_autofill_settings'
    ]);

    const profiles = result.form_autofill_profiles;
    const activeId = result.form_autofill_active_profile;
    const settings = result.form_autofill_settings || { highlight: true, highlightColor: '#4ade80' };
    const profile = profiles[activeId];

    if (!profile) return;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['autofill-engine.js', 'content.js']
      });

      await chrome.tabs.sendMessage(tab.id, {
        action: 'fillForm',
        profile: profile.fields,
        settings
      });
    } catch (e) {
      console.error('AutoFill failed:', e);
    }
  }
});

async function fillActiveTab(profileFields, settings) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['autofill-engine.js', 'content.js']
    });

    await chrome.tabs.sendMessage(tab.id, {
      action: 'fillForm',
      profile: profileFields,
      settings
    });
  } catch (e) {
    console.error('AutoFill failed:', e);
  }
}
