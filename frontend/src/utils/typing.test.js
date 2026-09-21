import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
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

test('sentence case capitalises the first letter of the final text', () => {
  const text = createTypingText('english', { uppercase: true, wordCount: 30 });
  assert.match(text, /^\p{Lu}/u);
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
