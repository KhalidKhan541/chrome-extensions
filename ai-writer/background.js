chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ai-writer-improve',
    title: 'Improve with AI Writer',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'ai-writer-check',
    title: 'Check Grammar',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'ai-writer-tone',
    title: 'Analyze Tone',
    contexts: ['selection']
  });

  chrome.alarms.create('cleanup', { periodInMinutes: 60 });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'ai-writer-improve') {
    handleImproveSelection(info.selectionText, tab);
  } else if (info.menuItemId === 'ai-writer-check') {
    handleCheckGrammar(info.selectionText, tab);
  } else if (info.menuItemId === 'ai-writer-tone') {
    handleAnalyzeTone(info.selectionText, tab);
  }
});

async function handleImproveSelection(text, tab) {
  if (!text || text.trim().length === 0) return;

  try {
    const response = await sendMessageToContentScript(tab.id, {
      type: 'SHOW_OVERLAY',
      data: {
        title: 'Improving text...',
        content: 'Processing your text...'
      }
    });

    const result = processText(text, 'auto');

    await sendMessageToContentScript(tab.id, {
      type: 'SHOW_IMPROVED',
      data: {
        original: text,
        improved: result.improved,
        suggestions: result.suggestions,
        stats: result.stats
      }
    });

    await saveToHistory(text, result);

  } catch (error) {
    console.error('Error improving text:', error);
  }
}

async function handleCheckGrammar(text, tab) {
  if (!text || text.trim().length === 0) return;

  const issues = findGrammarIssues(text);

  await sendMessageToContentScript(tab.id, {
    type: 'SHOW_GRAMMAR',
    data: {
      original: text,
      issues: issues
    }
  });
}

async function handleAnalyzeTone(text, tab) {
  if (!text || text.trim().length === 0) return;

  const tone = detectToneSimple(text);

  await sendMessageToContentScript(tab.id, {
    type: 'SHOW_TONE',
    data: {
      original: text,
      tone: tone
    }
  });
}

function sendMessageToContentScript(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

function processText(text, targetTone) {
  let improved = text;
  const suggestions = [];

  const wordinessMap = {
    'due to the fact that': 'because',
    'in order to': 'to',
    'for the purpose of': 'to',
    'in the event that': 'if',
    'at this point in time': 'now',
    'in the near future': 'soon',
    'prior to': 'before',
    'subsequent to': 'after',
    'in spite of the fact that': 'although',
    'despite the fact that': 'although',
    'in regards to': 'regarding',
    'with regard to': 'regarding',
    'in the process of': 'while',
    'has the ability to': 'can',
    'is able to': 'can',
    'make a decision': 'decide',
    'give consideration to': 'consider',
    'come to the conclusion': 'conclude',
    'carry out': 'perform',
    'come up with': 'create',
    'get rid of': 'eliminate',
    'take into consideration': 'consider',
    'place emphasis on': 'emphasize',
    'make use of': 'use',
    'conduct an investigation': 'investigate',
    'perform an analysis': 'analyze',
    'express an opinion': 'opine',
    'provide an explanation': 'explain',
    'reach a conclusion': 'conclude',
    'utilize': 'use'
  };

  for (const [phrase, replacement] of Object.entries(wordinessMap)) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (regex.test(improved)) {
      improved = improved.replace(regex, replacement);
      suggestions.push(`Simplified "${phrase}" to "${replacement}"`);
    }
  }

  const weakWords = {
    'very': 'extremely', 'really': 'truly', 'just': 'simply',
    'quite': 'fairly', 'thing': 'aspect', 'things': 'aspects',
    'good': 'excellent', 'bad': 'poor', 'nice': 'pleasant',
    'big': 'large', 'small': 'tiny', 'important': 'crucial',
    'interesting': 'fascinating', 'happy': 'delighted', 'sad': 'sorrowful',
    'fast': 'rapid', 'slow': 'sluggish', 'old': 'ancient', 'new': 'modern',
    'easy': 'simple', 'hard': 'difficult', 'help': 'assist',
    'make': 'create', 'get': 'obtain', 'give': 'provide',
    'show': 'demonstrate', 'think': 'consider', 'say': 'state',
    'start': 'commence', 'end': 'conclude', 'use': 'utilize'
  };

  for (const [weak, strong] of Object.entries(weakWords)) {
    const regex = new RegExp(`\\b${weak}\\b`, 'gi');
    if (regex.test(improved)) {
      improved = improved.replace(regex, strong);
      suggestions.push(`Replaced "${weak}" with "${strong}"`);
    }
  }

  improved = improved.replace(/\bi\b/g, 'I');

  return {
    improved,
    suggestions: suggestions.slice(0, 10),
    stats: {
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
      tone: detectToneSimple(text).name,
      writingScore: calculateSimpleScore(text)
    }
  };
}

function findGrammarIssues(text) {
  const issues = [];

  const patterns = [
    {
      regex: /\b(could|should|would|might|must)\s+of\b/gi,
      suggestion: (match) => `Use "${match.match(/(\w+)/)[1]} have" instead`
    },
    {
      regex: /\b(don't|doesn't|didn't|won't|wouldn't|couldn't|shouldn't|can't|isn't|aren't|wasn't|weren't)\s+(no|nothing|nobody|nowhere|neither|none|never)\b/gi,
      suggestion: () => 'Consider removing the double negative'
    },
    {
      regex: /\b(every|each|everyone|everyone|someone|somebody|nobody|no one|anyone|anybody)\s+(are|were|have|has)\b/gi,
      suggestion: () => 'Subject-verb agreement issue'
    },
    {
      regex: /\bmore\s+then\b|\bless\s+then\b|\bbetter\s+then\b|\bworse\s+then\b/gi,
      suggestion: () => 'Use "than" for comparisons'
    },
    {
      regex: /\bi\b/g,
      suggestion: () => 'Capitalize the pronoun "I"'
    }
  ];

  for (const { regex, suggestion } of patterns) {
    let match;
    const r = new RegExp(regex.source, regex.flags);
    while ((match = r.exec(text)) !== null) {
      issues.push({
        found: match[0],
        suggestion: suggestion(match[0]),
        position: match.index
      });
    }
  }

  return issues;
}

function detectToneSimple(text) {
  const lowerText = text.toLowerCase();

  const formalWords = ['furthermore', 'moreover', 'consequently', 'therefore', 'thus', 'hence', 'accordingly', 'nevertheless', 'aforementioned', 'regarding', 'pertaining'];
  const casualWords = ['hey', 'yeah', 'gonna', 'wanna', 'gotta', 'kinda', 'lol', 'omg', 'cool', 'awesome', 'totally', 'super', 'stuff', 'things'];
  const professionalWords = ['strategy', 'implementation', 'optimization', 'efficiency', 'stakeholders', 'deliverables', 'milestones', 'objectives', 'leverage', 'scalable'];

  let formalScore = 0, casualScore = 0, professionalScore = 0;

  for (const word of formalWords) {
    if (lowerText.includes(word)) formalScore += 2;
  }
  for (const word of casualWords) {
    if (lowerText.includes(word)) casualScore += 2;
  }
  for (const word of professionalWords) {
    if (lowerText.includes(word)) professionalScore += 2;
  }

  if (text.includes("'")) casualScore += 2;
  if (/!/.test(text)) casualScore += 1;

  const scores = { formal: formalScore, casual: casualScore, professional: professionalScore };
  const maxScore = Math.max(formalScore, casualScore, professionalScore);

  let detectedTone = 'neutral';
  if (maxScore > 0) {
    detectedTone = Object.keys(scores).find(key => scores[key] === maxScore);
  }

  return {
    name: detectedTone,
    scores
  };
}

function calculateSimpleScore(text) {
  let score = 100;

  if (/\b(could|should|would|might|must)\s+of\b/i.test(text)) score -= 10;
  if (/\bmore\s+then\b|\bless\s+then\b/i.test(text)) score -= 10;
  if (/\bi\b/.test(text) && !/\bI\b/.test(text)) score -= 5;

  const weakWords = ['very', 'really', 'just', 'quite', 'thing', 'things', 'good', 'bad'];
  for (const word of weakWords) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) score -= 3;
  }

  return Math.max(0, Math.min(100, score));
}

async function saveToHistory(original, result) {
  try {
    const historyResult = await chrome.storage.local.get('history');
    const history = historyResult.history || [];

    const entry = {
      id: Date.now(),
      original: original.substring(0, 200),
      improved: result.improved.substring(0, 200),
      fullOriginal: original,
      fullImproved: result.improved,
      stats: result.stats,
      timestamp: new Date().toISOString()
    };

    history.unshift(entry);
    if (history.length > 20) history.pop();

    await chrome.storage.local.set({ history });
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    cleanupOldHistory();
  }
});

async function cleanupOldHistory() {
  try {
    const result = await chrome.storage.local.get('history');
    const history = result.history || [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filtered = history.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate > thirtyDaysAgo;
    });

    await chrome.storage.local.set({ history: filtered });
  } catch (error) {
    console.error('Error cleaning up history:', error);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SELECTED_TEXT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_SELECTION' }, (response) => {
          sendResponse(response);
        });
      }
    });
    return true;
  }

  if (request.type === 'IMPROVE_TEXT') {
    const result = processText(request.text, request.tone || 'auto');
    sendResponse(result);
    return true;
  }

  if (request.type === 'CHECK_GRAMMAR') {
    const issues = findGrammarIssues(request.text);
    sendResponse({ issues });
    return true;
  }

  if (request.type === 'ANALYZE_TONE') {
    const tone = detectToneSimple(request.text);
    sendResponse({ tone });
    return true;
  }
});