const assert = require('node:assert');
const { normalizeResult, validateResult } = require('./utils');

const honest = {
  wpm: 82.4, raw_wpm: 88.1, accuracy: 94.2, consistency: 71.5,
  errors: 12, correct_chars: 206, incorrect_chars: 12, test_duration: 30,
};

assert.strictEqual(validateResult(normalizeResult(honest)), null);

// forged scores must be rejected
assert.ok(validateResult(normalizeResult({ ...honest, wpm: 99999 })));
assert.ok(validateResult(normalizeResult({ ...honest, raw_wpm: 401 })));
assert.ok(validateResult(normalizeResult({ ...honest, accuracy: 101 })));
assert.ok(validateResult(normalizeResult({ ...honest, consistency: -1 })));
assert.ok(validateResult(normalizeResult({ ...honest, errors: -1 })));
assert.ok(validateResult(normalizeResult({ ...honest, test_duration: 0 })));
assert.ok(validateResult(normalizeResult({ ...honest, test_duration: 301 })));

// 5000 chars in 30s is 500 WPM worth of typing - impossible
assert.ok(validateResult(normalizeResult({ ...honest, correct_chars: 5000 })));

// junk values fall back to defaults rather than crashing
assert.strictEqual(normalizeResult({ wpm: 'abc' }).wpm, 0);
assert.strictEqual(normalizeResult({}).test_duration, 30);

console.log('utils: ok');
