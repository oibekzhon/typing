function safeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeResult(payload) {
  return {
    wpm: safeNumber(payload.wpm, 0),
    raw_wpm: safeNumber(payload.raw_wpm, 0),
    accuracy: safeNumber(payload.accuracy, 0),
    consistency: safeNumber(payload.consistency, 0),
    errors: safeNumber(payload.errors, 0),
    correct_chars: safeNumber(payload.correct_chars, 0),
    incorrect_chars: safeNumber(payload.incorrect_chars, 0),
    test_duration: safeNumber(payload.test_duration, 30),
  };
}

module.exports = { safeNumber, normalizeResult };
