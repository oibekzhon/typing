// Route-level tests against a real database. Needs the dev postgres running:
//   docker compose up -d db
const assert = require('node:assert/strict');
const { after, before, describe, it } = require('node:test');
const app = require('./server');
const { pool } = require('./db');

let baseUrl;
let server;
const created = [];

function api(path, { token, ...options } = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

async function register(overrides = {}) {
  const username = overrides.username ?? `t${Date.now().toString(36)}${created.length}`;
  const body = { username, password: 'test1234', confirmPassword: 'test1234', ...overrides };
  const response = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });
  if (response.status === 201) created.push(body.username);
  return { response, body, json: await response.json() };
}

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (created.length) {
    await pool.query('DELETE FROM users WHERE username = ANY($1)', [created]);
  }
  await pool.end();
  server.close();
});

describe('registration', () => {
  it('creates an account and hands back a token', async () => {
    const { response, json } = await register();
    assert.equal(response.status, 201);
    assert.ok(json.token);
    assert.equal(json.user.username.length > 0, true);
    assert.equal(json.user.password_hash, undefined, 'must never return the hash');
  });

  it('refuses a username that is already taken', async () => {
    const { body } = await register();
    const { response } = await register({ username: body.username });
    assert.equal(response.status, 409);
  });

  it('refuses mismatched, short, and oversized passwords', async () => {
    const cases = [
      { password: 'test1234', confirmPassword: 'different' },
      { password: 'short1', confirmPassword: 'short1' },
      { password: 'x'.repeat(73), confirmPassword: 'x'.repeat(73) },
    ];

    for (const overrides of cases) {
      const { response } = await register(overrides);
      assert.equal(response.status, 400, JSON.stringify(overrides).slice(0, 60));
    }
  });

  it('refuses a password identical to the username', async () => {
    const username = `same${Date.now().toString(36)}`;
    const { response } = await register({ username, password: username, confirmPassword: username });
    assert.equal(response.status, 400);
  });

  it('refuses usernames outside 3-20 safe characters', async () => {
    for (const username of ['ab', 'a'.repeat(21), 'has space', 'sym!bol']) {
      const { response } = await register({ username });
      assert.equal(response.status, 400, username);
    }
  });
});

describe('login', () => {
  it('accepts the right password and rejects the wrong one', async () => {
    const { body } = await register();

    const ok = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: body.username, password: body.password }),
    });
    assert.equal(ok.status, 200);

    const bad = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: body.username, password: 'wrongpassword' }),
    });
    assert.equal(bad.status, 401);
  });

  it('gives the same answer for an unknown user as for a bad password', async () => {
    const response = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'nobodyhere', password: 'whatever1' }),
    });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).message, 'Invalid username or password.');
  });
});

describe('authentication', () => {
  it('turns away missing, malformed, and forged tokens', async () => {
    for (const token of [undefined, 'not-a-token', 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MX0.forged']) {
      const response = await api('/api/auth/me', { token });
      assert.equal(response.status, 401, String(token));
    }
  });

  it('returns the account behind a valid token', async () => {
    const { body, json } = await register();
    const response = await api('/api/auth/me', { token: json.token });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).user.username, body.username);
  });

  it('rejects a token whose account no longer exists', async () => {
    const { body, json } = await register();
    await pool.query('DELETE FROM users WHERE username = $1', [body.username]);
    const response = await api('/api/auth/me', { token: json.token });
    assert.equal(response.status, 401);
  });
});

describe('saving results', () => {
  const honest = {
    wpm: 82.4, raw_wpm: 88.1, accuracy: 94.2, consistency: 71.5,
    errors: 12, correct_chars: 206, incorrect_chars: 12, test_duration: 30,
  };

  it('stores an honest run and reflects it in the ranking', async () => {
    const { json } = await register();
    const saved = await api('/api/tests/result', {
      method: 'POST',
      token: json.token,
      body: JSON.stringify(honest),
    });
    assert.equal(saved.status, 201);

    const ranked = await (await api('/api/leaderboard/me', { token: json.token })).json();
    assert.equal(Number(ranked.entry.wpm), honest.wpm);
    assert.ok(Number(ranked.entry.rank) >= 1);
  });

  it('rejects scores that no human could produce', async () => {
    const { json } = await register();
    const forged = [
      { ...honest, wpm: 99999 },
      { ...honest, accuracy: 101 },
      { ...honest, test_duration: 0 },
      { ...honest, correct_chars: 5000 },
      { ...honest, errors: -1 },
    ];

    for (const payload of forged) {
      const response = await api('/api/tests/result', {
        method: 'POST',
        token: json.token,
        body: JSON.stringify(payload),
      });
      assert.equal(response.status, 400, JSON.stringify(payload).slice(0, 60));
    }
  });

  it('will not save a result for an anonymous caller', async () => {
    const response = await api('/api/tests/result', { method: 'POST', body: JSON.stringify(honest) });
    assert.equal(response.status, 401);
  });
});

describe('leaderboard', () => {
  it('orders rows by rank with no gaps', async () => {
    const { results } = await (await api('/api/leaderboard?limit=50')).json();
    const ranks = results.map((row) => Number(row.rank));
    assert.deepEqual(ranks, ranks.map((_, index) => index + 1));
  });

  it('lists each user at most once', async () => {
    const { results } = await (await api('/api/leaderboard?limit=50')).json();
    assert.equal(new Set(results.map((row) => row.username)).size, results.length);
  });

  it('clamps a silly page size and reports the real total', async () => {
    const response = await (await api('/api/leaderboard?limit=9999&page=1')).json();
    assert.equal(response.limit, 50);
    assert.equal(typeof response.total, 'number');
  });
});

describe('http hardening', () => {
  it('sets the headers that stop a browser guessing at the response', async () => {
    const response = await api('/api/health');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
  });

  it('throttles repeated login attempts', async () => {
    const attempt = () => api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'nobodyhere', password: 'whatever1' }),
    });

    const ceiling = Number(process.env.AUTH_MAX_ATTEMPTS) || 10;
    let sawThrottle = false;
    for (let i = 0; i < ceiling + 5 && !sawThrottle; i += 1) {
      sawThrottle = (await attempt()).status === 429;
    }
    assert.ok(sawThrottle, `expected a 429 within ${ceiling + 5} attempts`);
  });
});
