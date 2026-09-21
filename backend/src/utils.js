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

const MAX_WPM = 400;

// Results are computed client-side, so the server can only reject what is
// physically impossible. It cannot tell a real 150 WPM run from a forged one.
function validateResult(payload) {
  if (payload.wpm < 0 || payload.wpm > MAX_WPM) return 'WPM is outside the valid range.';
  if (payload.raw_wpm < 0 || payload.raw_wpm > MAX_WPM) return 'Raw WPM is outside the valid range.';
  if (payload.accuracy < 0 || payload.accuracy > 100) return 'Accuracy is outside the valid range.';
  if (payload.consistency < 0 || payload.consistency > 100) return 'Consistency is outside the valid range.';

  if (!Number.isFinite(payload.test_duration) || payload.test_duration <= 0 || payload.test_duration > 300) {
    return 'Test duration is invalid.';
  }

  if (payload.errors < 0 || payload.correct_chars < 0 || payload.incorrect_chars < 0) {
    return 'Character counts cannot be negative.';
  }

  const maxChars = (MAX_WPM / 60) * 5 * payload.test_duration;
  if (payload.correct_chars > maxChars || payload.incorrect_chars > maxChars) {
    return 'Character counts are not possible for this duration.';
  }

  return null;
}

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-secret');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set when NODE_ENV=production.');
}

module.exports = { safeNumber, normalizeResult, validateResult, JWT_SECRET, MAX_WPM };
