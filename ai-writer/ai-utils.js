const AIUtils = (() => {
  const WEAK_WORDS = {
    'very': ['extremely', 'highly', 'remarkably', 'exceptionally'],
    'really': ['truly', 'genuinely', 'absolutely', 'certainly'],
    'just': ['simply', 'merely', 'only', 'purely'],
    'quite': ['fairly', 'rather', 'somewhat', 'moderately'],
    'thing': ['aspect', 'element', 'component', 'factor', 'item', 'object', 'piece'],
    'things': ['aspects', 'elements', 'components', 'factors', 'items', 'objects'],
    'good': ['excellent', 'outstanding', 'superior', 'exceptional', 'fine', 'satisfactory'],
    'bad': ['poor', 'inferior', 'substandard', 'inadequate', 'deficient'],
    'nice': ['pleasant', 'delightful', 'enjoyable', 'agreeable', 'charming'],
    'big': ['large', 'substantial', 'considerable', 'significant', 'massive', 'enormous'],
    'small': ['tiny', 'minute', 'compact', 'diminutive', 'minimal'],
    'important': ['crucial', 'vital', 'essential', 'critical', 'significant', 'paramount'],
    'interesting': ['fascinating', 'compelling', 'intriguing', 'captivating', 'engaging'],
    'happy': ['delighted', 'pleased', 'content', 'satisfied', 'cheerful'],
    'sad': ['sorrowful', 'melancholy', 'despondent', 'mournful', 'grieved'],
    'angry': ['furious', 'irate', 'enraged', 'livid', 'incensed'],
    'fast': ['rapid', 'swift', 'quick', 'speedy', 'prompt'],
    'slow': ['sluggish', 'lethargic', 'gradual', 'unhurried', 'plodding'],
    'old': ['ancient', 'aged', 'antique', 'vintage', 'elderly'],
    'new': ['recent', 'novel', 'fresh', 'modern', 'contemporary'],
    'easy': ['simple', 'straightforward', 'effortless', 'uncomplicated', 'manageable'],
    'hard': ['difficult', 'challenging', 'demanding', 'strenuous', 'arduous'],
    'help': ['assist', 'support', 'aid', 'facilitate', 'contribute'],
    'make': ['create', 'produce', 'generate', 'construct', 'establish'],
    'get': ['obtain', 'acquire', 'procure', 'secure', 'receive'],
    'give': ['provide', 'supply', 'furnish', 'deliver', 'offer'],
    'show': ['demonstrate', 'illustrate', 'display', 'exhibit', 'present'],
    'think': ['believe', 'consider', 'contemplate', 'ponder', 'reflect'],
    'say': ['state', 'declare', 'assert', 'maintain', 'express'],
    'start': ['begin', 'commence', 'initiate', 'launch', 'embark'],
    'end': ['conclude', 'terminate', 'finish', 'complete', 'cease'],
    'use': ['utilize', 'employ', 'apply', 'leverage', 'implement'],
    'look': ['appear', 'seem', 'look like', 'resemble'],
    'find': ['discover', 'locate', 'identify', 'determine', 'ascertain'],
    'want': ['desire', 'wish', 'prefer', 'require', 'need'],
    'need': ['require', 'necessitate', 'demand', 'call for'],
    'try': ['attempt', 'endeavor', 'strive', 'seek', 'aim'],
    'tell': ['inform', 'notify', 'advise', 'instruct', 'notify'],
    'ask': ['inquire', 'question', 'query', 'request', 'seek'],
    'work': ['function', 'operate', 'perform', 'labor', 'toil'],
    'seem': ['appear', 'look', 'suggest', 'indicate', 'imply'],
    'feel': ['sense', 'perceive', 'experience', 'notice'],
    'become': ['grow', 'turn', 'develop into', 'transform into', 'evolve'],
    'leave': ['depart', 'depart from', 'exit', 'vacate', 'abandon'],
    'put': ['place', 'position', 'set', 'establish', 'deposit'],
    'mean': ['signify', 'imply', 'suggest', 'indicate', 'denote'],
    'keep': ['maintain', 'retain', 'preserve', 'sustain', 'continue'],
    'let': ['allow', 'permit', 'enable', 'authorize', 'consent'],
    'begin': ['commence', 'initiate', 'launch', 'embark', 'start'],
    'seem': ['appear', 'look', 'suggest', 'indicate', 'imply'],
    'might': ['could', 'may', 'potentially', 'possibly'],
    'also': ['additionally', 'furthermore', 'moreover', 'in addition'],
    'maybe': ['perhaps', 'possibly', 'potentially', 'conceivably'],
    'probably': ['likely', 'presumably', 'arguably', 'in all likelihood'],
    'often': ['frequently', 'regularly', 'commonly', 'habitually'],
    'sometimes': ['occasionally', 'periodically', 'intermittently', 'at times'],
    'really': ['truly', 'genuinely', 'actually', 'indeed'],
    'totally': ['completely', 'entirely', 'wholly', 'utterly'],
    'already': ['previously', 'formerly', 'prior', 'already established']
  };

  const PASSIVE_VOICE_PATTERNS = [
    /\b(am|is|are|was|were|be|been|being)\s+(being\s+)?\w+ed\b/gi,
    /\b(am|is|are|was|were|be|been|being)\s+(being\s+)?(known|seen|heard|found|made|given|told|shown|taken|done|gone|left|kept|set|put|run|cut|hit|let|got|won|lost|sent|read|brought|built|caught|felt|fed|fought|held|kept|laid|led|met|paid|said|sat|shot|spent|stood|taught|thought|understood|woken|worn|written)\b/gi
  ];

  const WORDINESS_PATTERNS = [
    { pattern: /\bdue to the fact that\b/gi, replacement: 'because' },
    { pattern: /\bin order to\b/gi, replacement: 'to' },
    { pattern: /\bfor the purpose of\b/gi, replacement: 'to' },
    { pattern: /\bin the event that\b/gi, replacement: 'if' },
    { pattern: /\bat this point in time\b/gi, replacement: 'now' },
    { pattern: /\bin the near future\b/gi, replacement: 'soon' },
    { pattern: /\bprior to\b/gi, replacement: 'before' },
    { pattern: /\bsubsequent to\b/gi, replacement: 'after' },
    { pattern: /\bin spite of the fact that\b/gi, replacement: 'although' },
    { pattern: /\bdespite the fact that\b/gi, replacement: 'although' },
    { pattern: /\bin regards to\b/gi, replacement: 'regarding' },
    { pattern: /\bwith regard to\b/gi, replacement: 'regarding' },
    { pattern: /\bin the process of\b/gi, replacement: 'while' },
    { pattern: /\bhas the ability to\b/gi, replacement: 'can' },
    { pattern: /\bis able to\b/gi, replacement: 'can' },
    { pattern: /\bmake a decision\b/gi, replacement: 'decide' },
    { pattern: /\bgive consideration to\b/gi, replacement: 'consider' },
    { pattern: /\bcome to the conclusion\b/gi, replacement: 'conclude' },
    { pattern: /\bcarry out\b/gi, replacement: 'perform' },
    { pattern: /\bcome up with\b/gi, replacement: 'create' },
    { pattern: /\bget rid of\b/gi, replacement: 'eliminate' },
    { pattern: /\btake into consideration\b/gi, replacement: 'consider' },
    { pattern: /\bplace emphasis on\b/gi, replacement: 'emphasize' },
    { pattern: /\bmake use of\b/gi, replacement: 'use' },
    { pattern: /\bconduct an investigation\b/gi, replacement: 'investigate' },
    { pattern: /\bperform an analysis\b/gi, replacement: 'analyze' },
    { pattern: /\bexpress an opinion\b/gi, replacement: 'opine' },
    { pattern: /\bprovide an explanation\b/gi, replacement: 'explain' },
    { pattern: /\breach a conclusion\b/gi, replacement: 'conclude' },
    { pattern: /\butilize\b/gi, replacement: 'use' }
  ];

  const FILLER_WORDS = [
    'basically', 'actually', 'literally', 'honestly', 'obviously',
    'clearly', 'simply', 'definitely', 'certainly', 'absolutely',
    'totally', 'completely', 'utterly', 'really', 'very',
    'quite', 'rather', 'somewhat', 'fairly', 'pretty much'
  ];

  const WEAK_PHRASES = [
    { phrase: /\bI think\b/gi, suggestion: 'Remove "I think" to sound more confident' },
    { phrase: /\bI believe\b/gi, suggestion: 'Remove "I believe" to sound more confident' },
    { phrase: /\bin my opinion\b/gi, suggestion: 'Remove "in my opinion" to sound more authoritative' },
    { phrase: /\bit seems like\b/gi, suggestion: 'Use "it appears" or state directly' },
    { phrase: /\bkind of\b/gi, suggestion: 'Use "somewhat" or be more specific' },
    { phrase: /\bsort of\b/gi, suggestion: 'Use "somewhat" or be more specific' },
    { phrase: /\ba lot of\b/gi, suggestion: 'Use "many", "much", or "numerous"' },
    { phrase: /\bthe fact that\b/gi, suggestion: 'Simplify the sentence structure' },
    { phrase: /\bwas able to\b/gi, suggestion: 'Use "managed to" or "succeeded in"' },
    { phrase: /\bhas the ability to\b/gi, suggestion: 'Use "can"' }
  ];

  const GRAMMAR_RULES = [
    {
      name: 'a_an',
      description: 'Use "a" before consonant sounds, "an" before vowel sounds',
      pattern: /\b(a)\s+([aeiou]\w*)\b/gi,
      check: (match, article, word) => {
        if (word[0].match(/[aeiou]/i)) {
          return { found: match, suggestion: `Use "an ${word}" instead of "a ${word}"`, type: 'grammar' };
        }
        return null;
      }
    },
    {
      name: 'their_there_theyre',
      description: 'Check for common confusions',
      pattern: /\b(there|their|they're|your|you're|its|it's|whose|who's|to|too|two|affect|effect)\b/gi,
      check: (match) => null
    },
    {
      name: 'double_negative',
      description: 'Avoid double negatives',
      pattern: /\b(don't|doesn't|didn't|won't|wouldn't|couldn't|shouldn't|can't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|n't)\s+(no|nothing|nobody|nowhere|neither|none|never)\b/gi,
      check: (match) => ({ found: match, suggestion: 'Consider removing the double negative', type: 'grammar' })
    },
    {
      name: 'comma_splice',
      description: 'Check for comma splices',
      pattern: /[^,]+,\s+[a-z]+[^.!?]*[.!?]/gi,
      check: () => null
    },
    {
      name: 'subject_verb_agreement',
      description: 'Check subject-verb agreement',
      pattern: /\b(every|each|everyone|everybody|someone|somebody|nobody|no one|anyone|anybody)\s+(are|were|have|has)\b/gi,
      check: (match) => ({ found: match, suggestion: 'Subject-verb agreement issue: singular subjects need singular verbs', type: 'grammar' })
    },
    {
      name: 'who_whom',
      description: 'Use "who" for subjects, "whom" for objects',
      pattern: /\b(to|for|with|from|by)\s+who\b/gi,
      check: (match) => ({ found: match, suggestion: 'Consider using "whom" after prepositions', type: 'style' })
    },
    {
      name: 'than_then',
      description: '"Than" for comparisons, "then" for time',
      pattern: /\bmore\s+then\b|\bless\s+then\b|\bbetter\s+then\b|\bworse\s+then\b/gi,
      check: (match) => ({ found: match, suggestion: 'Use "than" for comparisons, not "then"', type: 'grammar' })
    },
    {
      name: 'could_of',
      description: '"Could have" not "could of"',
      pattern: /\b(could|should|would|might|must)\s+of\b/gi,
      check: (match) => ({ found: match, suggestion: `Use "${match.match(/(\w+)/)[1]} have" instead of "${match}"`, type: 'grammar' })
    },
    {
      name: 'me_vs_i',
      description: 'Use "I" as subject, "me" as object',
      pattern: /\b(between|for|to|with|from|by)\s+(I|he|she|we|they)\b/gi,
      check: (match) => ({ found: match, suggestion: 'Use objective case after prepositions (me, him, her, us, them)', type: 'grammar' })
    },
    {
      name: 'split_infinitive',
      description: 'Avoid splitting infinitives',
      pattern: /\bto\s+(quickly|slowly|carefully|really|very|just|also|always|never|often)\s+\w+/gi,
      check: (match) => ({ found: match, suggestion: 'Consider not splitting the infinitive', type: 'style' })
    },
    {
      name: 'starting_conjunction',
      description: 'Avoid starting sentences with conjunctions in formal writing',
      pattern: /^(And|But|Or|So|Yet|For|Nor)\s/gm,
      check: (match) => ({ found: match, suggestion: 'Consider not starting a sentence with a conjunction in formal writing', type: 'style' })
    },
    {
      name: 'ending_preposition',
      description: 'Ending sentences with prepositions',
      pattern: /\b(who|which|that|what|whom)\s+.*\s+(in|on|at|to|for|with|by|of|from|about|into|through|during|before|after|above|below|between|under|over)\s*[.!?]$/gi,
      check: (match) => ({ found: match, suggestion: 'Consider restructuring to avoid ending with a preposition', type: 'style' })
    },
    {
      name: 'contraction_in_formal',
      description: 'Avoid contractions in formal writing',
      pattern: /\b(don't|doesn't|didn't|won't|wouldn't|couldn't|shouldn't|can't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|it's|that's|there's|here's|let's|what's|who's|where's|when's|how's|I'm|you're|we're|they're|I've|you've|we've|they've|I'll|you'll|we'll|they'll|he'll|she'll|I'd|you'd|we'd|they'd|he'd|she'd)\b/gi,
      check: (match) => ({ found: match, suggestion: 'Avoid contractions in formal writing', type: 'style' })
    },
    {
      name: 'redundant_words',
      description: 'Remove redundant words',
      pattern: /\b(past|previous)\s+(history|experience|background)\b|\b(advance|advance)\s+(warning|notice|planning)\b|\b(basic|fundamental)\s+(fundamentals|basics)\b|\b(end)\s+result\b|\b(final)\s+outcome\b|\b(past)\s+history\b/gi,
      check: (match) => ({ found: match, suggestion: 'Remove redundant words', type: 'wordiness' })
    },
    {
      name: 'excessive_exclamation',
      description: 'Avoid excessive exclamation marks',
      pattern: /!{2,}/g,
      check: (match) => ({ found: match, suggestion: 'Use a single exclamation mark', type: 'punctuation' })
    },
    {
      name: 'multiple_question_marks',
      description: 'Avoid multiple question marks',
      pattern: /\?{2,}/g,
      check: (match) => ({ found: match, suggestion: 'Use a single question mark', type: 'punctuation' })
    },
    {
      name: 'ellipsis_misuse',
      description: 'Proper ellipsis usage',
      pattern: /\.{4,}/g,
      check: (match) => ({ found: match, suggestion: 'Use exactly three dots for an ellipsis', type: 'punctuation' })
    },
    {
      name: 'capitalize_i',
      description: 'Capitalize the pronoun "I"',
      pattern: /\bi\b/g,
      check: (match) => ({ found: match, suggestion: 'Capitalize the pronoun "I"', type: 'grammar' })
    },
    {
      name: 'oxford_comma',
      description: 'Consider using Oxford comma',
      pattern: /\b\w+,\s+\w+\s+and\s+\w+/gi,
      check: () => null
    }
  ];

  const TONE_INDICATORS = {
    formal: {
      words: ['furthermore', 'moreover', 'consequently', 'therefore', 'thus', 'hence',
        'accordingly', 'nevertheless', 'nonetheless', 'notwithstanding', 'henceforth',
        'aforementioned', 'subsequent', 'prior', 'regarding', 'pertaining', 'affecting',
        'established', 'implemented', 'utilized', 'commenced', 'terminated', 'facilitated',
        'comprehensive', 'substantial', 'significant', 'considerable', 'approximately',
        'demonstrate', 'illustrate', 'indicate', 'suggest', 'imply', 'necessitate',
        'shall', 'herein', 'thereof', 'wherein', 'hereby', 'thereby'],
      patterns: [
        /\bshall\b/gi, /\bherein\b/gi, /\bthereof\b/gi, /\bwherein\b/gi,
        /\bhereby\b/gi, /\bthereby\b/gi, /\bwhereby\b/gi, /\bhereafter\b/gi,
        /\bwhereas\b/gi, /\bnotwithstanding\b/gi
      ],
      characteristics: ['No contractions', 'Complex sentences', 'Technical vocabulary']
    },
    casual: {
      words: ['hey', 'yeah', 'yep', 'nope', 'gonna', 'wanna', 'gotta', 'kinda',
        'sorta', 'dunno', 'lemme', 'gimme', 'btw', 'tbh', 'imo', 'smh',
        'lol', 'omg', 'wow', 'cool', 'awesome', 'totally', 'super', 'pretty',
        'stuff', 'things', 'guys', 'friends', 'hangout', 'chill', 'bored',
        'ok', 'okay', 'sure', 'nah', 'yeah', 'right', 'like'],
      patterns: [
        /\bgonna\b/gi, /\bwanna\b/gi, /\bgotta\b/gi, /\bkinda\b/gi,
        /\bsorta\b/gi, /\bdunno\b/gi, /\blemme\b/gi, /\bgimme\b/gi,
        /\bbtw\b/gi, /\btbh\b/gi, /\bimo\b/gi, /\bsmh\b/gi,
        /\blol\b/gi, /\bomg\b/gi
      ],
      characteristics: ['Contractions', 'Informal language', 'Shorter sentences']
    },
    professional: {
      words: ['strategy', 'implementation', 'optimization', 'efficiency', 'productivity',
        'stakeholders', 'deliverables', 'milestones', 'objectives', 'initiatives',
        'leverage', 'synergy', 'bandwidth', 'pipeline', 'ecosystem', 'scalable',
        'innovative', 'proactive', 'results-driven', 'cross-functional', 'end-to-end',
        'best practices', 'key performance', 'metrics', 'analytics', 'ROI'],
      patterns: [
        /\bkey performance indicator\b/gi, /\bestimated return\b/gi,
        /\bcross-functional\b/gi, /\bend-to-end\b/gi, /\bbest practices\b/gi
      ],
      characteristics: ['Business terminology', 'Action-oriented', 'Results-focused']
    },
    creative: {
      words: ['imagine', 'discover', 'explore', 'journey', 'adventure', 'mystery',
        'enchanting', 'captivating', 'mesmerizing', 'breathtaking', 'stunning',
        'vivid', 'dramatic', 'passionate', 'whimsical', 'ethereal', 'luminous',
        'cascade', 'symphony', 'tapestry', 'ethereal', 'transcend', 'illuminate',
        'evocative', 'compelling', 'nuanced', 'multifaceted', 'profound'],
      patterns: [
        /\bimagine\b/gi, /\bdiscover\b/gi, /\bexplore\b/gi, /\bjourney\b/gi,
        /\bcaptivating\b/gi, /\bmesmerizing\b/gi, /\bbreathtaking\b/gi
      ],
      characteristics: ['Descriptive language', 'Metaphors', 'Emotional appeal']
    },
    academic: {
      words: ['hypothesis', 'methodology', 'empirical', 'theoretical', 'paradigm',
        'epistemological', 'ontological', 'phenomenological', 'longitudinal',
        'meta-analysis', 'qualitative', 'quantitative', 'correlation', 'variables',
        'data-driven', 'peer-reviewed', 'citations', 'literature', 'argument',
        'assertion', 'premise', 'conclusion', 'evidence-based', 'research'],
      patterns: [
        /\bhypothesis\b/gi, /\bmethodology\b/gi, /\bempirical\b/gi,
        /\btheoretical\b/gi, /\bparadigm\b/gi, /\bpeer-reviewed\b/gi
      ],
      characteristics: ['Technical vocabulary', 'Citations expected', 'Formal structure']
    },
    concise: {
      words: ['brief', 'concise', 'direct', 'essential', 'core', 'key',
        'primary', 'main', 'crucial', 'vital', 'necessary', 'required'],
      patterns: [
        /\b(briefly|concisely|directly)\b/gi, /\bin short\b/gi, /\bto summarize\b/gi
      ],
      characteristics: ['Short sentences', 'No filler words', 'Direct communication']
    }
  };

  const SENTENCE_STARTERS = [
    'However', 'Furthermore', 'Moreover', 'Additionally', 'Consequently',
    'Therefore', 'Nevertheless', 'Nonetheless', 'Meanwhile', 'Subsequently',
    'Interestingly', 'Unfortunately', 'Importantly', 'Significantly',
    'Apparently', 'Certainly', 'Obviously', 'Clearly', 'Undoubtedly'
  ];

  function analyzeText(text) {
    if (!text || text.trim().length === 0) {
      return {
        wordCount: 0,
        sentenceCount: 0,
        charCount: 0,
        paragraphCount: 0,
        readingTime: 0,
        readingLevel: 'N/A',
        readingLevelScore: 0,
        tone: 'neutral',
        toneScore: 0,
        writingScore: 0
      };
    }

    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const syllableCount = countSyllables(text);

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const charCount = text.length;
    const paragraphCount = paragraphs.length || 1;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const fkGrade = calculateFleschKincaid(wordCount, sentenceCount, syllableCount);
    const readingLevel = getReadingLevel(fkGrade);

    const tone = detectTone(text);
    const writingScore = calculateWritingScore(text, words, sentences);

    return {
      wordCount,
      sentenceCount,
      charCount,
      paragraphCount,
      readingTime,
      readingLevel,
      readingLevelScore: fkGrade,
      tone: tone.name,
      toneScore: tone.score,
      writingScore
    };
  }

  function countSyllables(text) {
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    let count = 0;

    for (const word of words) {
      count += countWordSyllables(word);
    }

    return count;
  }

  function countWordSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    const vowels = word.match(/[aeiouy]{1,2}/g);
    return vowels ? vowels.length : 1;
  }

  function calculateFleschKincaid(words, sentences, syllables) {
    if (words === 0 || sentences === 0) return 0;
    return Math.round(
      (0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59) * 10
    ) / 10;
  }

  function getReadingLevel(score) {
    if (score < 0) return 'Very Easy';
    if (score < 5) return 'Easy';
    if (score < 8) return 'Standard';
    if (score < 12) return 'Moderate';
    if (score < 16) return 'Difficult';
    return 'Very Difficult';
  }

  function detectTone(text) {
    const lowerText = text.toLowerCase();
    const scores = {};

    for (const [tone, indicators] of Object.entries(TONE_INDICATORS)) {
      let score = 0;

      for (const word of indicators.words) {
        if (lowerText.includes(word)) {
          score += 2;
        }
      }

      for (const pattern of indicators.patterns) {
        const matches = text.match(pattern);
        if (matches) {
          score += matches.length * 3;
        }
      }

      if (text.includes('!')) score += 1;
      if (text.includes('...')) score += 1;

      const avgWordLength = text.split(/\s+/).reduce((sum, w) => sum + w.length, 0) / (text.split(/\s+/).length || 1);
      if (avgWordLength > 6) score += 2;

      const avgSentenceLength = text.split(/[.!?]+/).filter(s => s.trim()).reduce((sum, s) => sum + s.split(/\s+/).length, 0) / (text.split(/[.!?]+/).filter(s => s.trim()).length || 1);
      if (avgSentenceLength > 20) score += 2;

      scores[tone] = score;
    }

    let maxScore = 0;
    let detectedTone = 'neutral';

    for (const [tone, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedTone = tone;
      }
    }

    const totalPossible = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
    const normalizedScore = Math.round((maxScore / totalPossible) * 100);

    return {
      name: detectedTone,
      score: Math.min(normalizedScore, 100),
      scores
    };
  }

  function calculateWritingScore(text, words, sentences) {
    let score = 100;
    const issues = findIssues(text);

    for (const issue of issues) {
      switch (issue.type) {
        case 'grammar': score -= 8; break;
        case 'passive_voice': score -= 3; break;
        case 'wordiness': score -= 4; break;
        case 'weak_word': score -= 2; break;
        case 'filler': score -= 3; break;
        case 'punctuation': score -= 5; break;
        case 'style': score -= 2; break;
      }
    }

    if (words.length > 0) {
      const avgWordLength = text.length / words.length;
      if (avgWordLength > 6) score -= 5;
      if (avgWordLength < 3) score -= 3;
    }

    if (sentences.length > 0) {
      const avgSentenceLength = words.length / sentences.length;
      if (avgSentenceLength > 30) score -= 10;
      if (avgSentenceLength > 25) score -= 5;
      if (avgSentenceLength < 5) score -= 5;
    }

    const sentences_arr = text.split(/[.!?]+/).filter(s => s.trim());
    if (sentences_arr.length > 1) {
      const lengths = sentences_arr.map(s => s.split(/\s+/).length);
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
      if (variance > 100) score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  function findIssues(text) {
    const issues = [];

    for (const rule of GRAMMAR_RULES) {
      let match;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        const issue = rule.check(match[0], match[1], match[2]);
        if (issue) {
          issues.push({
            ...issue,
            rule: rule.name,
            description: rule.description,
            position: match.index
          });
        }
      }
    }

    for (const pattern of PASSIVE_VOICE_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        issues.push({
          found: match[0],
          suggestion: 'Consider using active voice',
          type: 'passive_voice',
          rule: 'passive_voice',
          description: 'Passive voice detected',
          position: match.index
        });
      }
    }

    for (const { pattern, replacement } of WORDINESS_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        issues.push({
          found: match[0],
          suggestion: `Replace with "${replacement}"`,
          type: 'wordiness',
          rule: 'wordiness',
          description: 'Wordy phrase detected',
          position: match.index
        });
      }
    }

    const words = text.split(/\s+/);
    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      if (FILLER_WORDS.includes(cleanWord)) {
        issues.push({
          found: word,
          suggestion: `Remove filler word "${cleanWord}"`,
          type: 'filler',
          rule: 'filler_words',
          description: 'Filler word detected',
          position: text.indexOf(word)
        });
      }
    }

    for (const { phrase, suggestion } of WEAK_PHRASES) {
      let match;
      const regex = new RegExp(phrase.source, phrase.flags);
      while ((match = regex.exec(text)) !== null) {
        issues.push({
          found: match[0],
          suggestion,
          type: 'weak_word',
          rule: 'weak_phrases',
          description: 'Weak phrase detected',
          position: match.index
        });
      }
    }

    issues.sort((a, b) => a.position - b.position);
    return issues;
  }

  function improveText(text, targetTone = 'auto') {
    if (!text || text.trim().length === 0) {
      return {
        improved: '',
        suggestions: [],
        issues: [],
        stats: analyzeText('')
      };
    }

    let improved = text;
    const suggestions = [];
    const issues = findIssues(text);

    for (const { pattern, replacement } of WORDINESS_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      if (regex.test(improved)) {
        improved = improved.replace(regex, replacement);
        suggestions.push(`Simplified "${pattern.source.replace(/\\b/g, '').replace(/\\/g, '')}" to "${replacement}"`);
      }
    }

    for (const phrase of WEAK_PHRASES) {
      const regex = new RegExp(phrase.phrase.source, phrase.phrase.flags);
      if (regex.test(improved)) {
        improved = improved.replace(regex, '');
        suggestions.push(phrase.suggestion);
      }
    }

    for (const [weak, strong] of Object.entries(WEAK_WORDS)) {
      const regex = new RegExp(`\\b${weak}\\b`, 'gi');
      if (regex.test(improved) && strong.length > 0) {
        const replacement = strong[Math.floor(Math.random() * Math.min(2, strong.length))];
        improved = improved.replace(regex, replacement);
        suggestions.push(`Replaced "${weak}" with "${replacement}"`);
      }
    }

    improved = improved.replace(/\bi\b/g, 'I');

    const passiveRegex = /\b(am|is|are|was|were)\s+(\w+ed)\b/gi;
    const passiveMatches = improved.match(passiveRegex);
    if (passiveMatches && passiveMatches.length < 3) {
      suggestions.push('Consider converting more passive voice to active voice');
    }

    if (targetTone !== 'auto') {
      const toneSuggestions = getToneAdjustments(improved, targetTone);
      suggestions.push(...toneSuggestions);
    }

    if (suggestions.length === 0) {
      suggestions.push('Your text looks good! No major improvements needed.');
    }

    const stats = analyzeText(improved);

    return {
      improved,
      suggestions: [...new Set(suggestions)].slice(0, 10),
      issues: issues.slice(0, 10),
      stats
    };
  }

  function getToneAdjustments(text, targetTone) {
    const suggestions = [];
    const indicators = TONE_INDICATORS[targetTone];

    if (!indicators) return suggestions;

    if (targetTone === 'formal') {
      if (text.includes("'") || text.includes("'")) {
        suggestions.push('Expand contractions for formal writing (e.g., "don\'t" → "do not")');
      }
      if (/\b(gonna|wanna|gotta|kinda|sorta)\b/i.test(text)) {
        suggestions.push('Replace informal words with formal alternatives');
      }
    }

    if (targetTone === 'casual') {
      if (/\b(shall|furthermore|moreover|henceforth)\b/i.test(text)) {
        suggestions.push('Replace formal words with casual alternatives');
      }
    }

    if (targetTone === 'professional') {
      suggestions.push('Focus on action verbs and results-oriented language');
      if (/\b(stuff|things|guys)\b/i.test(text)) {
        suggestions.push('Replace casual terms with professional alternatives');
      }
    }

    if (targetTone === 'concise') {
      const wordCount = text.split(/\s+/).length;
      const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length;
      if (sentenceCount > 0 && wordCount / sentenceCount > 25) {
        suggestions.push('Break long sentences into shorter ones');
      }
      suggestions.push('Remove unnecessary adjectives and adverbs');
    }

    return suggestions;
  }

  function getReplacementWord(word) {
    const lowerWord = word.toLowerCase();
    if (WEAK_WORDS[lowerWord]) {
      const replacements = WEAK_WORDS[lowerWord];
      return replacements[Math.floor(Math.random() * replacements.length)];
    }
    return null;
  }

  return {
    analyzeText,
    improveText,
    findIssues,
    detectTone,
    getReplacementWord,
    WEAK_WORDS,
    PASSIVE_VOICE_PATTERNS,
    WORDINESS_PATTERNS,
    FILLER_WORDS,
    WEAK_PHRASES,
    GRAMMAR_RULES,
    TONE_INDICATORS,
    SENTENCE_STARTERS
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIUtils;
}