// dictionary.js — Dictionary module with definitions, synonyms, examples, idioms
const DICTIONARY = (() => {
  const entries = {
    'hello': { definition: 'Used as a greeting or to begin a phone conversation.', synonyms: ['hi', 'hey', 'greetings', 'howdy'], antonyms: ['goodbye', 'farewell'], pronunciation: '/həˈloʊ/', examples: ['Hello, how are you?', 'She said hello to everyone.'], idioms: ['hello there', 'say hello'] },
    'goodbye': { definition: 'Used when leaving or being left by someone.', synonyms: ['farewell', 'bye', 'see you', 'adieu'], antonyms: ['hello', 'greeting'], pronunciation: '/ɡʊdˈbaɪ/', examples: ['Goodbye, see you tomorrow!', 'She waved goodbye.'], idioms: ['say goodbye', 'kiss goodbye'] },
    'thank': { definition: 'Express gratitude.', synonyms: ['appreciate', 'be grateful'], antonyms: ['blame', 'criticize'], pronunciation: '/θæŋk/', examples: ['Thank you very much.', 'I want to thank you for your help.'], idioms: ['thank goodness', 'thank heavens'] },
    'please': { definition: 'Used to add a polite request.', synonyms: ['kindly', 'if you please'], antonyms: ['demand', 'insist'], pronunciation: '/pliːz/', examples: ['Please sit down.', 'Could you help me, please?'], idioms: ['please yourself', 'as you please'] },
    'love': { definition: 'An intense feeling of deep affection.', synonyms: ['affection', 'adoration', 'devotion', 'fondness'], antonyms: ['hate', 'dislike', 'hatred'], pronunciation: '/lʌv/', examples: ['I love my family.', 'Love conquers all.'], idioms: ['love at first sight', 'make love', 'true love'] },
    'work': { definition: 'Activity involving mental or physical effort.', synonyms: ['labor', 'employment', 'job', 'occupation'], antonyms: ['rest', 'leisure', 'play'], pronunciation: '/wɜːrk/', examples: ['I love my work.', 'Hard work pays off.'], idioms: ['work out', 'work together', 'out of work'] },
    'home': { definition: 'The place where one lives.', synonyms: ['house', 'residence', 'dwelling', 'abode'], antonyms: ['away', 'abroad'], pronunciation: '/hoʊm/', examples: ['I\'m going home.', 'Home is where the heart is.'], idioms: ['at home', 'home sweet home', 'feel at home'] },
    'time': { definition: 'The ongoing sequence of events.', synonyms: ['moment', 'period', 'era', 'occasion'], antonyms: ['never'], pronunciation: '/taɪm/', examples: ['What time is it?', 'Time flies.'], idioms: ['on time', 'in time', 'time flies'] },
    'good': { definition: 'Of a high quality or standard.', synonyms: ['fine', 'excellent', 'great', 'wonderful'], antonyms: ['bad', 'poor', 'terrible'], pronunciation: '/ɡʊd/', examples: ['This is a good book.', 'Good morning!'], idioms: ['good morning', 'good job', 'for good'] },
    'bad': { definition: 'Of poor quality or low standard.', synonyms: ['poor', 'terrible', 'awful', 'horrible'], antonyms: ['good', 'excellent', 'great'], pronunciation: '/bæd/', examples: ['That\'s a bad idea.', 'The weather is bad.'], idioms: ['bad luck', 'bad apple', 'not bad'] },
    'big': { definition: 'Of considerable importance or size.', synonyms: ['large', 'huge', 'enormous', 'massive'], antonyms: ['small', 'tiny', 'little'], pronunciation: '/bɪɡ/', examples: ['This is a big city.', 'She has a big smile.'], idioms: ['big deal', 'big picture', 'think big'] },
    'small': { definition: 'Of a size that is less than normal.', synonyms: ['little', 'tiny', 'miniature', 'compact'], antonyms: ['big', 'large', 'huge'], pronunciation: '/smɔːl/', examples: ['She lives in a small house.', 'Small steps lead to big changes.'], idioms: ['small talk', 'small change', 'small fry'] },
    'friend': { definition: 'A person with whom one has a bond of mutual affection.', synonyms: ['buddy', 'pal', 'companion', 'mate'], antonyms: ['enemy', 'foe', 'rival'], pronunciation: '/frend/', examples: ['He is my best friend.', 'A friend in need is a friend indeed.'], idioms: ['make friends', 'best friend', 'old friend'] },
    'happy': { definition: 'Feeling or showing pleasure or contentment.', synonyms: ['joyful', 'cheerful', 'delighted', 'pleased'], antonyms: ['sad', 'unhappy', 'miserable'], pronunciation: '/ˈhæpi/', examples: ['I\'m so happy to see you.', 'Happy birthday!'], idioms: ['happy ending', 'happy go lucky'] },
    'sad': { definition: 'Feeling sorrow or unhappiness.', synonyms: ['unhappy', 'sorrowful', 'melancholy', 'gloomy'], antonyms: ['happy', 'joyful', 'cheerful'], pronunciation: '/sæd/', examples: ['She felt sad about the news.', 'A sad story.'], idioms: ['sad to say'] },
    'beautiful': { definition: 'Pleasing the senses or mind aesthetically.', synonyms: ['gorgeous', 'stunning', 'lovely', 'pretty'], antonyms: ['ugly', 'hideous'], pronunciation: '/ˈbjuːtɪfəl/', examples: ['What a beautiful day!', 'She is beautiful.'], idioms: ['beautiful soul', 'too beautiful'] },
    'easy': { definition: 'Achieved without great effort.', synonyms: ['simple', 'straightforward', 'effortless'], antonyms: ['difficult', 'hard', 'challenging'], pronunciation: '/ˈiːzi/', examples: ['This test is easy.', 'Easy come, easy go.'], idioms: ['easy as pie', 'easy going', 'take it easy'] },
    'difficult': { definition: 'Needing much effort to accomplish.', synonyms: ['hard', 'challenging', 'tough', 'tricky'], antonyms: ['easy', 'simple', 'effortless'], pronunciation: '/ˈdɪfɪkəlt/', examples: ['This is a difficult question.', 'Life can be difficult.'], idioms: ['in a difficult position'] },
    'important': { definition: 'Of great significance or value.', synonyms: ['significant', 'crucial', 'vital', 'essential'], antonyms: ['unimportant', 'trivial', 'minor'], pronunciation: '/ɪmˈpɔːrtənt/', examples: ['This is important.', 'It\'s important to exercise.'], idioms: ['important thing', 'self-important'] },
    'love': { definition: 'An intense feeling of deep affection.', synonyms: ['affection', 'adoration', 'devotion', 'passion'], antonyms: ['hatred', 'hate', 'dislike'], pronunciation: '/lʌv/', examples: ['I love you.', 'She fell in love.'], idioms: ['love at first sight', 'make love', 'no love lost'] },
    'life': { definition: 'The condition that distinguishes animals and plants.', synonyms: ['existence', 'being', 'living', 'vitality'], antonyms: ['death'], pronunciation: '/laɪf/', examples: ['Life is beautiful.', 'He lost his life.'], idioms: ['life of the party', 'real life', 'life lesson'] },
    'water': { definition: 'A transparent liquid essential for life.', synonyms: ['aqua', 'H2O'], pronunciation: '/ˈwɔːtər/', examples: ['Can I have some water?', 'Water is life.'], idioms: ['in deep water', 'water under the bridge'] },
    'food': { definition: 'Any nutritious substance consumed for energy.', synonyms: ['nourishment', 'sustenance', 'meal', 'fare'], pronunciation: '/fuːd/', examples: ['The food was delicious.', 'Food and water are essentials.'], idioms: ['food for thought'] },
    'run': { definition: 'Move at a speed faster than a walk.', synonyms: ['jog', 'sprint', 'dash', 'race'], antonyms: ['walk', 'stop'], pronunciation: '/rʌn/', examples: ['I run every morning.', 'She can run fast.'], idioms: ['run out of', 'run away', 'in the long run'] },
    'walk': { definition: 'Move at a regular pace by lifting and setting down each foot.', synonyms: ['stroll', 'saunter', 'amble', 'march'], antonyms: ['run', 'sprint'], pronunciation: '/wɔːk/', examples: ['Let\'s walk to school.', 'Walk this way.'], idioms: ['walk of life', 'walk the line'] },
    'see': { definition: 'Perceive with the eyes.', synonyms: ['view', 'observe', 'watch', 'notice'], antonyms: ['miss', 'overlook'], pronunciation: '/siː/', examples: ['I can see the mountains.', 'See you later!'], idioms: ['see through', 'see eye to eye', 'as far as I can see'] },
    'hear': { definition: 'Perceive sound with the ears.', synonyms: ['listen', 'perceive', 'detect'], antonyms: ['deaf', 'ignore'], pronunciation: '/hɪr/', examples: ['I hear music.', 'Did you hear that?'], idioms: ['hear me out', 'hearing aid'] },
    'eat': { definition: 'Put food into the mouth and swallow.', synonyms: ['dine', 'consume', 'devour'], antonyms: ['starve', 'fast'], pronunciation: '/iːt/', examples: ['Let\'s eat dinner.', 'Eat your vegetables.'], idioms: ['eat out', 'eat your words'] },
    'drink': { definition: 'Take liquid into the mouth and swallow.', synonyms: ['sip', 'gulp', 'swallow'], antonyms: ['spit'], pronunciation: '/drɪŋk/', examples: ['Would you like a drink?', 'Drink water.'], idioms: ['drink up', 'on the drink'] },
    'sleep': { definition: 'Rest with eyes closed and unconsciousness.', synonyms: ['rest', 'nap', 'slumber', 'doze'], antonyms: ['wake', 'awake'], pronunciation: '/sliːp/', examples: ['I need to sleep.', 'Sleep well.'], idioms: ['sleep tight', 'go to sleep', 'sleep on it'] },
    'read': { definition: 'Look at and understand written words.', synonyms: ['peruse', 'scan', 'study', 'review'], antonyms: ['write'], pronunciation: '/riːd/', examples: ['I love to read books.', 'Read this carefully.'], idioms: ['read between the lines'] },
    'write': { definition: 'Mark letters or symbols on a surface.', synonyms: ['compose', 'pen', 'draft', 'author'], antonyms: ['read'], pronunciation: '/raɪt/', examples: ['Write your name here.', 'Write to me soon.'], idioms: ['write down', 'write off'] },
    'speak': { definition: 'Say words aloud.', synonyms: ['talk', 'converse', 'chat', 'utter'], antonyms: ['listen', 'be silent'], pronunciation: '/spiːk/', examples: ['Please speak clearly.', 'She speaks three languages.'], idioms: ['speak up', 'speak for'] },
    'understand': { definition: 'Perceive the meaning of something.', synonyms: ['comprehend', 'grasp', 'fathom'], antonyms: ['misunderstand', 'confuse'], pronunciation: '/ˌʌndərˈstænd/', examples: ['I understand now.', 'Do you understand?'], idioms: ['understand each other'] },
    'give': { definition: 'Freely transfer possession to someone.', synonyms: ['donate', 'provide', 'offer', 'present'], antonyms: ['take', 'receive', 'withhold'], pronunciation: '/ɡɪv/', examples: ['Give me the book.', 'Give it a try.'], idioms: ['give up', 'give in', 'give away'] },
    'take': { definition: 'Lay hold of something with hands.', synonyms: ['grab', 'seize', 'capture', 'capture'], antonyms: ['give', 'release'], pronunciation: '/teɪk/', examples: ['Take this with you.', 'Take a break.'], idioms: ['take off', 'take on', 'take care'] },
    'make': { definition: 'Form something by putting parts together.', synonyms: ['create', 'build', 'construct', 'produce'], antonyms: ['destroy', 'demolish'], pronunciation: '/meɪk/', examples: ['Make a wish.', 'Make yourself at home.'], idioms: ['make up', 'make sure', 'make sense'] },
    'come': { definition: 'Move toward the speaker.', synonyms: ['arrive', 'approach', 'reach'], antonyms: ['go', 'leave'], pronunciation: '/kʌm/', examples: ['Come here.', 'Come and see.'], idioms: ['come along', 'come back', 'come true'] },
    'go': { definition: 'Move from one place to another.', synonyms: ['move', 'travel', 'depart', 'leave'], antonyms: ['come', 'stay'], pronunciation: '/ɡoʊ/', examples: ['Let\'s go.', 'Go ahead.'], idioms: ['go ahead', 'go out', 'go on'] },
    'old': { definition: 'Having lived for many years.', synonyms: ['elderly', 'aged', 'senior', 'mature'], antonyms: ['young', 'new'], pronunciation: '/oʊld/', examples: ['My grandmother is old.', 'This is an old book.'], idioms: ['old enough', 'of old'] },
    'new': { definition: 'Not existing before; recently made.', synonyms: ['fresh', 'novel', 'modern', 'recent'], antonyms: ['old', 'ancient'], pronunciation: '/njuː/', examples: ['I bought a new car.', 'Happy New Year!'], idioms: ['brand new', 'new age'] },
    'hot': { definition: 'Having a high temperature.', synonyms: ['warm', 'boiling', 'scorching', 'sizzling'], antonyms: ['cold', 'cool', 'freezing'], pronunciation: '/hɒt/', examples: ['It\'s hot today.', 'This coffee is hot.'], idioms: ['hot potato', 'hot and bothered'] },
    'cold': { definition: 'Having a low temperature.', synonyms: ['chilly', 'freezing', 'frigid', 'icy'], antonyms: ['hot', 'warm'], pronunciation: '/koʊld/', examples: ['It\'s cold outside.', 'I have a cold.'], idioms: ['cold shoulder', 'cold feet'] },
    'fast': { definition: 'Moving or capable of moving at high speed.', synonyms: ['quick', 'rapid', 'swift', 'speedy'], antonyms: ['slow', 'sluggish'], pronunciation: '/fæst/', examples: ['He runs fast.', 'Fast food.'], idioms: ['fast asleep', 'hold fast'] },
    'slow': { definition: 'Moving without much speed.', synonyms: ['sluggish', 'gradual', 'leisurely'], antonyms: ['fast', 'quick', 'rapid'], pronunciation: '/sloʊ/', examples: ['The car is slow.', 'Slow down.'], idioms: ['slow motion', 'slow and steady'] },
    'day': { definition: 'A period of light between sunrise and sunset.', synonyms: ['daytime', 'light'], antonyms: ['night'], pronunciation: '/deɪ/', examples: ['Good day!', 'It was a long day.'], idioms: ['day by day', 'day off', 'one day'] },
    'night': { definition: 'The period of darkness each 24 hours.', synonyms: ['evening', 'darkness', 'nighttime'], antonyms: ['day', 'morning'], pronunciation: '/naɪt/', examples: ['Good night!', 'A beautiful night.'], idioms: ['night and day', 'last night', 'at night'] },
    'sun': { definition: 'The star at the center of our solar system.', synonyms: ['sunshine', 'daylight'], antonyms: ['moon'], pronunciation: '/sʌn/', examples: ['The sun is shining.', 'Sun rises in the east.'], idioms: ['under the sun', 'sun shine'] },
    'moon': { definition: 'The natural satellite of the earth.', synonyms: ['lunar'], antonyms: ['sun'], pronunciation: '/muːn/', examples: ['The moon is full.', 'Moonlight is beautiful.'], idioms: ['moon light', 'over the moon'] },
    'world': { definition: 'The earth, together with all countries and people.', synonyms: ['earth', 'globe', 'planet', 'universe'], pronunciation: '/wɜːrld/', examples: ['The world is beautiful.', 'Travel the world.'], idioms: ['around the world', 'in the world'] },
    'dog': { definition: 'A domesticated carnivorous mammal.', synonyms: ['puppy', 'canine', 'hound', 'mutt'], antonyms: ['cat'], pronunciation: '/dɒɡ/', examples: ['I have a dog.', 'Dog is man\'s best friend.'], idioms: ['dog tired', 'let sleeping dogs lie'] },
    'cat': { definition: 'A small domesticated carnivorous mammal.', synonyms: ['kitten', 'feline', 'tabby'], antonyms: ['dog'], pronunciation: '/kæt/', examples: ['The cat sat.', 'Curiosity killed the cat.'], idioms: ['cat nap', 'cat got your tongue'] },
    'book': { definition: 'A written or printed work of pages.', synonyms: ['volume', 'tome', 'text', 'manuscript'], pronunciation: '/bʊk/', examples: ['Read a book.', 'Book a flight.'], idioms: ['by the book', 'close the book'] },
    'house': { definition: 'A building for human habitation.', synonyms: ['home', 'residence', 'dwelling', 'abode'], antonyms: ['tent'], pronunciation: '/haʊs/', examples: ['My house is big.', 'House for sale.'], idioms: ['house party', 'on the house'] },
    'money': { definition: 'A medium of exchange for goods and services.', synonyms: ['cash', 'currency', 'funds', 'wealth'], antonyms: ['debt', 'poverty'], pronunciation: '/ˈmʌni/', examples: ['Money doesn\'t grow on trees.', 'Save money.'], idioms: ['money talks', 'pocket money'] },
    'red': { definition: 'A color at the end of the visible spectrum.', synonyms: ['crimson', 'scarlet', 'ruby'], antonyms: ['blue', 'green'], pronunciation: '/red/', examples: ['Red roses.', 'The red car.'], idioms: ['in the red', 'see red'] },
    'blue': { definition: 'A color between green and violet.', synonyms: ['azure', 'cobalt', 'navy'], antonyms: ['red', 'orange'], pronunciation: '/bluː/', examples: ['Blue sky.', 'Feeling blue.'], idioms: ['out of the blue', 'feeling blue'] },
    'green': { definition: 'The color of grass or emeralds.', synonyms: ['emerald', 'jade', 'lime'], antonyms: ['red'], pronunciation: '/ɡriːn/', examples: ['Green grass.', 'Green light.'], idioms: ['green light', 'green thumb'] },
    'white': { definition: 'The lightest color.', synonyms: ['ivory', 'snow', 'alabaster'], antonyms: ['black'], pronunciation: '/waɪt/', examples: ['White snow.', 'White House.'], idioms: ['white lie', 'white as snow'] },
    'black': { definition: 'The darkest color.', synonyms: ['dark', 'ebony', 'jet', 'obsidian'], antonyms: ['white'], pronunciation: '/blæk/', examples: ['Black cat.', 'Black coffee.'], idioms: ['black and white', 'black sheep'] },
    'think': { definition: 'Use the mind to consider.', synonyms: ['consider', 'ponder', 'reflect', 'contemplate'], antonyms: ['ignore', 'neglect'], pronunciation: '/θɪŋk/', examples: ['I think so.', 'Think before you speak.'], idioms: ['think about', 'think of'] },
    'know': { definition: 'Be aware of through observation or information.', synonyms: ['understand', 'realize', 'recognize', 'perceive'], antonyms: ['ignore', 'ignore'], pronunciation: '/noʊ/', examples: ['I know the answer.', 'Do you know?'], idioms: ['know by heart', 'know-how'] },
    'want': { definition: 'Have a desire to possess or do something.', synonyms: ['desire', 'wish', 'crave', 'long for'], antonyms: ['dislike', 'reject'], pronunciation: '/wɒnt/', examples: ['I want a coffee.', 'What do you want?'], idioms: ['for want of'] },
    'need': { definition: 'Require something because it is essential.', synonyms: ['require', 'demand', 'must have'], antonyms: ['have enough'], pronunciation: '/niːd/', examples: ['I need help.', 'Need I say more?'], idioms: ['needless to say'] },
    'like': { definition: 'Find agreeable or enjoyable.', synonyms: ['enjoy', 'love', 'adore', 'fancy'], antonyms: ['dislike', 'hate'], pronunciation: '/laɪk/', examples: ['I like ice cream.', 'Like father, like son.'], idioms: ['like crazy', 'feel like'] },
    'go': { definition: 'Move from one place to another.', synonyms: ['travel', 'move', 'depart', 'proceed'], antonyms: ['come', 'stay'], pronunciation: '/ɡoʊ/', examples: ['Let\'s go!', 'Go home.'], idioms: ['go ahead', 'go without'] },
    'come': { definition: 'Move toward a place or person.', synonyms: ['arrive', 'approach', 'reach'], antonyms: ['leave', 'depart'], pronunciation: '/kʌm/', examples: ['Come in!', 'Come with me.'], idioms: ['come across', 'come about'] },
    'see': { definition: 'Perceive with the eyes.', synonyms: ['view', 'observe', 'notice', 'watch'], antonyms: ['miss', 'overlook'], pronunciation: '/siː/', examples: ['I see.', 'See you tomorrow!'], idioms: ['see through', 'see to'] },
    'say': { definition: 'Utter words.', synonyms: ['speak', 'state', 'declare', 'mention'], antonyms: ['listen'], pronunciation: '/seɪ/', examples: ['Say hello!', 'What did you say?'], idioms: ['say hello', 'say goodbye'] },
    'get': { definition: 'Come to have or receive.', synonyms: ['obtain', 'acquire', 'receive', 'gain'], antonyms: ['give', 'lose'], pronunciation: '/ɡet/', examples: ['Get me water.', 'I get it.'], idioms: ['get up', 'get over', 'get along'] },
    'make': { definition: 'Form something.', synonyms: ['create', 'build', 'produce', 'construct'], antonyms: ['destroy'], pronunciation: '/meɪk/', examples: ['Make me laugh.', 'Make it happen.'], idioms: ['make up', 'make sure'] },
    'try': { definition: 'Attempt to do something.', synonyms: ['attempt', 'endeavor', 'strive', 'attempt'], antonyms: ['give up'], pronunciation: '/traɪ/', examples: ['Try again.', 'I tried my best.'], idioms: ['try on', 'try out'] },
    'help': { definition: 'Make it easier for someone to do something.', synonyms: ['assist', 'aid', 'support', 'benefit'], antonyms: ['hinder', 'obstruct'], pronunciation: '/help/', examples: ['Can you help me?', 'Help yourself.'], idioms: ['help out', 'help yourself'] },
    'start': { definition: 'Begin doing something.', synonyms: ['begin', 'commence', 'initiate', 'launch'], antonyms: ['finish', 'end'], pronunciation: '/stɑːrt/', examples: ['Start the engine.', 'Let\'s start.'], idioms: ['start over', 'get started'] },
    'stop': { definition: 'Cease an action or event.', synonyms: ['halt', 'cease', 'discontinue', 'quit'], antonyms: ['start', 'continue'], pronunciation: '/stɒp/', examples: ['Stop the car.', 'Stop talking.'], idioms: ['stop by', 'stop off'] },
    'find': { definition: 'Discover something by searching.', synonyms: ['discover', 'locate', 'uncover', 'detect'], antonyms: ['lose', 'miss'], pronunciation: '/faɪnd/', examples: ['Find the answer.', 'Find me a pen.'], idioms: ['find out', 'find your way'] },
    'tell': { definition: 'Communicate information to someone.', synonyms: ['inform', 'notify', 'advise', 'instruct'], antonyms: ['ask', 'conceal'], pronunciation: '/tel/', examples: ['Tell me a story.', 'Tell the truth.'], idioms: ['tell apart', 'tell off'] },
    'ask': { definition: 'Request information from someone.', synonyms: ['inquire', 'question', 'query', 'demand'], antonyms: ['answer', 'reply'], pronunciation: '/æsk/', examples: ['Ask a question.', 'Ask for help.'], idioms: ['ask after', 'ask around'] },
    'play': { definition: 'Engage in activity for enjoyment.', synonyms: ['sport', 'game', 'fun', 'recreation'], antonyms: ['work'], pronunciation: '/pleɪ/', examples: ['Children play outside.', 'Play music.'], idioms: ['play along', 'play fair'] },
    'move': { definition: 'Change position or place.', synonyms: ['shift', 'relocate', 'transfer', 'go'], antonyms: ['stay', 'remain'], pronunciation: '/muːv/', examples: ['Move the box.', 'I\'m moving soon.'], idioms: ['move on', 'move out'] },
    'live': { definition: 'Be alive; have life.', synonyms: ['exist', 'survive', 'breathe'], antonyms: ['die'], pronunciation: '/lɪv/', examples: ['Live and let live.', 'Where do you live?'], idioms: ['live up to', 'live through'] },
    'die': { definition: 'Cease to live.', synonyms: ['perish', 'pass away', 'decease'], antonyms: ['live', 'be born'], pronunciation: '/daɪ/', examples: ['Plants die without water.', 'He died peacefully.'], idioms: ['die down', 'die out'] },
    'change': { definition: 'Make or become different.', synonyms: ['alter', 'modify', 'transform', 'shift'], antonyms: ['stay the same'], pronunciation: '/tʃeɪndʒ/', examples: ['Change is good.', 'Change your mind.'], idioms: ['change of pace', 'change your mind'] },
    'want': { definition: 'Desire something.', synonyms: ['desire', 'wish', 'crave', 'covet'], antonyms: ['reject', 'refuse'], pronunciation: '/wɒnt/', examples: ['I want to go.', 'Do you want this?'], idioms: ['for want of'] }
  };

  const SYNONYM_MAP = {};
  const ANTONYM_MAP = {};

  function getEntry(word) {
    const lower = word.toLowerCase().trim();
    return entries[lower] || null;
  }

  function getDefinition(word) {
    const entry = getEntry(word);
    return entry ? entry.definition : null;
  }

  function getSynonyms(word) {
    const entry = getEntry(word);
    return entry ? entry.synonyms : [];
  }

  function getAntonyms(word) {
    const entry = getEntry(word);
    return entry ? entry.antonyms : [];
  }

  function getPronunciation(word) {
    const entry = getEntry(word);
    return entry ? entry.pronunciation : null;
  }

  function getExamples(word) {
    const entry = getEntry(word);
    return entry ? entry.examples : [];
  }

  function getIdioms(word) {
    const entry = getEntry(word);
    return entry ? entry.idioms : [];
  }

  function lookup(text) {
    const lower = text.toLowerCase().trim().replace(/[.!?;:,]+$/g, '');
    const entry = getEntry(lower);
    if (entry) {
      return { word: lower, found: true, ...entry };
    }
    const words = lower.split(/\s+/);
    const results = words.map(w => {
      const e = getEntry(w.replace(/[.!?;:,]+$/g, ''));
      return e ? { word: w, found: true, ...e } : { word: w, found: false };
    });
    const found = results.filter(r => r.found);
    if (found.length > 0) {
      return { multiple: true, results: found, allResults: results };
    }
    return { word: text, found: false, definition: null };
  }

  function search(query) {
    const lower = query.toLowerCase().trim();
    return Object.entries(entries)
      .filter(([word]) => word.includes(lower))
      .slice(0, 20)
      .map(([word, entry]) => ({ word, ...entry }));
  }

  return { entries, getEntry, getDefinition, getSynonyms, getAntonyms, getPronunciation, getExamples, getIdioms, lookup, search };
})();

if (typeof module !== 'undefined') module.exports = DICTIONARY;