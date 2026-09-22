import { LANGUAGES } from './words.js';

export function calculateWpm(correctChars, elapsedMs) {
  if (!elapsedMs || elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return (correctChars / 5) / minutes;
}

export function calculateRawWpm(totalTypedChars, elapsedMs) {
  if (!elapsedMs || elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return (totalTypedChars / 5) / minutes;
}

export function calculateAccuracy(correctChars, totalTypedChars) {
  if (!totalTypedChars) return 100;
  return (correctChars / totalTypedChars) * 100;
}

export function calculateConsistency(wpmHistory) {
  if (!wpmHistory || wpmHistory.length === 0) return 100;
  const average = wpmHistory.reduce((sum, value) => sum + value, 0) / wpmHistory.length;
  if (average === 0) return 0;
  const variance = wpmHistory.reduce((sum, value) => sum + (value - average) ** 2, 0) / wpmHistory.length;
  const stdDev = Math.sqrt(variance);
  const score = 100 - (stdDev / average) * 100;
  return Math.max(0, Math.min(100, score));
}

export function formatSeconds(totalSeconds) {
  return Math.max(0, totalSeconds).toFixed(1);
}

export function getLanguageOptions() {
  return Object.entries(LANGUAGES).map(([value, meta]) => ({
    value,
    label: meta.label,
  }));
}

const RTL_LANGUAGES = new Set(['arabic']);

// ponytail: sets reading direction only. The test renders one <span> per
// character, and browsers do not shape Arabic across element boundaries, so
// letters still draw in isolated forms. Fixing that means rendering the shaped
// string once and overlaying the per-character highlight.
export function getLanguageDirection(language) {
  return RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
}

export const QUOTE_TEXTS = [
  'The future depends on what you do today.',
  'Great things are done by a series of small things brought together.',
  'Success is the sum of small efforts repeated day in and day out.',
  'The secret of getting ahead is getting started.',
  'It always seems impossible until it is done.',
  'Well begun is half done.',
  'Believe you can and you are halfway there.',
  'What we learn with pleasure we never forget.',
  'A journey of a thousand miles begins with a single step.',
  'The best way out is always through.'
];

// Deduplicated once per language, so a word listed twice does not come up
// twice as often.
const wordPools = new Map();

function getWordPool(language) {
  const key = LANGUAGES[language] ? language : 'english';
  if (!wordPools.has(key)) wordPools.set(key, [...new Set(LANGUAGES[key].words)]);
  return wordPools.get(key);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// About one word in eight becomes a number, same as monkeytype's numbers mode.
function applyNumbers(words) {
  return words.map((word, index) => {
    if (index === 0 || Math.random() > 0.125) return word;
    const digits = 1 + Math.floor(Math.random() * 4);
    return String(Math.floor(Math.random() * 10 ** digits));
  });
}

const WRAPPERS = [['"', '"'], ['(', ')'], ['‘', '’']];

// Sentence ends capitalise the next word; the rest are commas and the odd
// wrapped or hyphenated word. Probabilities kept close to monkeytype's.
function applyPunctuation(words) {
  let startOfSentence = true;

  return words.map((word, index) => {
    let result = word;
    const last = index === words.length - 1;

    if (startOfSentence) {
      result = capitalize(result);
      startOfSentence = false;
    }

    const roll = Math.random();

    if (last) {
      startOfSentence = true;
      return `${result}.`;
    }

    // a sentence ending on its first word reads as a typo, not as punctuation
    if (roll < 0.1 && index > 0) {
      startOfSentence = true;
      return `${result}${pick(['.', '.', '.', '?', '!'])}`;
    }
    if (roll < 0.17) return `${result},`;
    if (roll < 0.19) return `${result};`;
    if (roll < 0.21) return `${result}:`;
    if (roll < 0.23) {
      const [open, close] = pick(WRAPPERS);
      return `${open}${result}${close}`;
    }
    if (roll < 0.25 && index + 1 < words.length) return `${result}-`;

    return result;
  });
}

// Leaves any capital the punctuation pass already placed alone and sprinkles
// more on top, so "A words" stays useful together with "@ punctuation".
function applyCaseMode(words) {
  return words.map((word, index) => {
    if (index === 0 || Math.random() < 0.3) return capitalize(word);
    return word;
  });
}

function drawWords(language, count) {
  const pool = getWordPool(language);
  const words = [];
  while (words.length < count) {
    // the same word twice in a row reads as a mistake in the text, so redraw
    const word = pick(pool);
    if (word !== words[words.length - 1]) words.push(word);
  }
  return words;
}

// Quote mode is its own thing: the whole quote, as written, with no generated
// punctuation, numbers or word-count slicing on top of it.
export function createQuoteText() {
  return pick(QUOTE_TEXTS).replace(/\s+/g, ' ').trim();
}

// A time test has no natural end, so it starts with a buffer the caller tops
// up as the typist approaches it.
const TIME_MODE_WORDS = 60;

export function createTypingText(language = 'english', options = {}) {
  const { punctuation = false, numbers = false, quote = false, uppercase = false, wordCount = 0 } = options;

  if (quote) return createQuoteText();

  let words = drawWords(language, wordCount > 0 ? wordCount : TIME_MODE_WORDS);

  if (numbers) words = applyNumbers(words);
  if (punctuation) words = applyPunctuation(words);
  if (uppercase) words = applyCaseMode(words);

  return words.join(' ');
}
