import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  QUOTE_TEXTS,
  calculateAccuracy,
  calculateConsistency,
  calculateRawWpm,
  calculateWpm,
  createTypingText,
  getLanguageDirection,
  getLanguageOptions,
} from './typing.js';

const MINUTE = 60_000;

test('wpm counts five characters as one word', () => {
  assert.equal(calculateWpm(300, MINUTE), 60);
  assert.equal(calculateWpm(150, MINUTE / 2), 60);
});

test('wpm is zero before the clock starts', () => {
  assert.equal(calculateWpm(50, 0), 0);
  assert.equal(calculateWpm(50, -1), 0);
});

test('raw wpm counts every keystroke, right or wrong', () => {
  assert.equal(calculateRawWpm(300, MINUTE), 60);
  assert.ok(calculateRawWpm(300, MINUTE) > calculateWpm(200, MINUTE));
});

test('accuracy is a percentage, and an untouched test is perfect', () => {
  assert.equal(calculateAccuracy(90, 100), 90);
  assert.equal(calculateAccuracy(0, 0), 100);
});

test('consistency rewards a steady pace and punishes a ragged one', () => {
  assert.equal(calculateConsistency([60, 60, 60]), 100);
  assert.equal(calculateConsistency([]), 100);
  assert.ok(calculateConsistency([10, 120, 15, 130]) < 50);
});

test('consistency stays inside 0-100 even for wild input', () => {
  const score = calculateConsistency([1, 400, 1, 400, 1]);
  assert.ok(score >= 0 && score <= 100, `got ${score}`);
});

test('word mode returns exactly the requested number of words', () => {
  for (const count of [10, 25, 50, 100]) {
    assert.equal(createTypingText('english', { wordCount: count }).split(' ').length, count);
  }
});

test('a long word test draws varied sentences instead of looping one', () => {
  const words = createTypingText('english', { wordCount: 100 }).split(' ');
  // A single repeated sentence would leave roughly a dozen distinct words.
  assert.ok(new Set(words).size > 30, `only ${new Set(words).size} distinct words`);
});

test('digits and punctuation appear only when asked for', () => {
  const plain = createTypingText('english', {});
  assert.ok(!/\d/.test(plain), plain);
  assert.ok(!/[.,!;]/.test(plain), plain);
  assert.ok(/\d/.test(createTypingText('english', { numbers: true })));
});

test('case mode applies more than just the first character and keeps text usable', () => {
  const text = createTypingText('english', { uppercase: true, wordCount: 30 });
  assert.match(text, /^\p{Lu}/u);
  const uppercaseLetters = [...text].filter((char) => /[A-Z]/u.test(char)).length;
  assert.ok(uppercaseLetters > 3, `expected many uppercase letters, got ${uppercaseLetters} in ${text}`);
});

test('quote mode keeps the original quote intact and ignores punctuation and number generators', () => {
  const text = createTypingText('english', { quote: true, punctuation: true, numbers: true, wordCount: 0 });
  const normalizedText = text.toLowerCase();
  const match = QUOTE_TEXTS.some((quote) => quote.toLowerCase() === normalizedText);

  assert.ok(match, `expected one of the quote texts, got: ${text}`);
  assert.ok(!/\d/.test(text), `quote text unexpectedly contained digits: ${text}`);
  assert.ok(!/[!?;:]/.test(normalizedText.replace(/[,.()'-]/g, '')), `quote text unexpectedly included extra punctuation: ${text}`);
});

test('arabic reads right to left, everything else left to right', () => {
  assert.equal(getLanguageDirection('arabic'), 'rtl');
  assert.equal(getLanguageDirection('english'), 'ltr');
  assert.equal(getLanguageDirection('unknown'), 'ltr');
});

test('every offered language can actually produce text', () => {
  for (const { value } of getLanguageOptions()) {
    assert.ok(createTypingText(value, { wordCount: 10 }).length > 0, value);
  }
});

test('punctuation mode spreads punctuation through the text, not only at the end', () => {
  const text = createTypingText('english', { punctuation: true, wordCount: 60 });
  const body = text.slice(0, -1);

  assert.match(text, /^\p{Lu}/u, text);
  assert.match(text, /\.$/, text);
  assert.ok(/[.,;:!?]/.test(body), `no punctuation inside the text: ${text}`);
  // Every sentence end has to hand a capital to the word that follows it.
  for (const [, next] of body.matchAll(/[.!?]\s+(\S)/gu)) {
    assert.match(next, /\p{Lu}|["'‘(]/u, `lowercase after a sentence end: ${text}`);
  }
  assert.equal(text.split(' ').length, 60, text);
});

test('numbers mode swaps words for numbers across the text', () => {
  const words = createTypingText('english', { numbers: true, wordCount: 100 }).split(' ');
  const digitWords = words.filter((word) => /^\d+$/.test(word));

  assert.ok(digitWords.length >= 3, `only ${digitWords.length} numbers in 100 words`);
  assert.ok(digitWords.length <= 40, `${digitWords.length} numbers is more text than practice`);
  assert.ok(words.every((word) => /^\d+$/.test(word) || !/\d/.test(word)), 'digits leaked into a word');
});

test('every language draws from a pool big enough that a test is not repetitive', () => {
  for (const { value } of getLanguageOptions()) {
    const seen = new Set();
    for (let run = 0; run < 50; run += 1) {
      createTypingText(value, { wordCount: 50 }).split(' ').forEach((word) => seen.add(word));
    }
    assert.ok(seen.size >= 180, `${value} only draws from ${seen.size} words`);
  }
});

test('restarting gives a different text almost every time', () => {
  const texts = new Set();
  for (let run = 0; run < 50; run += 1) texts.add(createTypingText('english', { wordCount: 25 }));
  assert.equal(texts.size, 50);
});

test('the same word never comes up twice in a row', () => {
  for (const { value } of getLanguageOptions()) {
    for (let run = 0; run < 20; run += 1) {
      const words = createTypingText(value, { wordCount: 100 }).split(' ');
      const repeat = words.findIndex((word, index) => index > 0 && word === words[index - 1]);
      assert.equal(repeat, -1, `${value} repeated "${words[repeat]}" at ${repeat}`);
    }
  }
});
