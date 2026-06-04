// Supabase client — loaded by login.html and quiz.html
// ANON_KEY is intentionally public. Data is protected by RLS policies, not key secrecy.
const SUPABASE_URL = 'https://xoqxvihynantxsikfuxy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcXh2aWh5bmFudHhzaWtmdXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDkxMjksImV4cCI6MjA5NjEyNTEyOX0.lQOPoF4_dUHhZfzB3Gr53GIbEXaRamc_UHoq06E9ZWQ';

// Minimal Supabase client (no npm, no bundler — works in plain HTML)
const supabase = (() => {
  const SESSION_KEY = 'cosmo_sb_session';

  function _saveSession(session) {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }

  function _getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
  }

  function _getToken() {
    return _getSession()?.access_token || null;
  }

  const headers = () => ({
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${_getToken() || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  });

  // Attempt to refresh the access token using the stored refresh_token.
  // Called automatically before authenticated requests when the session looks stale.
  async function _refreshIfNeeded() {
    const session = _getSession();
    if (!session?.refresh_token) return;
    // Supabase tokens are JWTs — decode exp from payload without a library
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 60) return; // still valid for >1 min, skip refresh
    } catch { return; }
    // Token expired or about to — refresh
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh_token })
      });
      const data = await res.json();
      if (data.access_token) _saveSession(data);
    } catch {} // silent — worst case next request fails and falls back to localStorage
  }

  function _mapAuthError(data) {
    const e = data.error;
    if (!e) return null;
    const msg = e === 'invalid_grant'         ? 'Incorrect email or password.' :
                e === 'user_already_exists'   ? 'An account with this email already exists.' :
                e === 'weak_password'         ? 'Password too weak — use at least 8 characters.' :
                e === 'email_not_confirmed'   ? 'Check your email to confirm your account first.' :
                data.msg || data.error_description || e;
    return { message: msg };
  }

  async function _authRequest(path, body) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.access_token) _saveSession(data);
    return { data, error: _mapAuthError(data) };
  }

  const auth = {
    async signUp({ email, password }) {
      return _authRequest('/signup', { email, password });
    },
    async signInWithPassword({ email, password }) {
      return _authRequest('/token?grant_type=password', { email, password });
    },
    async signOut() {
      try {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${_getToken()}` }
        });
      } catch {}
      _saveSession(null);
    },
    async resetPasswordForEmail(email) {
      return _authRequest('/recover', { email });
    },
    async getSession() {
      const session = _getSession();
      return { data: { session } };
    },
    getUser() {
      const session = _getSession();
      return session ? { id: session.user?.id || session.user_id, email: session.user?.email } : null;
    }
  };

  const db = {
    from(table) {
      return {
        async insert(rows) {
          await _refreshIfNeeded();
          const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(Array.isArray(rows) ? rows : [rows])
          });
          const data = res.ok ? await res.json() : null;
          const error = res.ok ? null : { message: `Insert failed (${res.status})` };
          return { data, error };
        },
        select(cols = '*') {
          let _filters = [];
          let _order = null;
          let _limit = null;
          const q = {
            // encodeURIComponent ensures filter values with special chars don't break the query
            eq(col, val) { _filters.push(`${col}=eq.${encodeURIComponent(val)}`); return q; },
            order(col, { ascending = true } = {}) { _order = `${col}.${ascending ? 'asc' : 'desc'}`; return q; },
            limit(n) { _limit = n; return q; },
            async then(resolve, reject) {
              await _refreshIfNeeded();
              let url = `${SUPABASE_URL}/rest/v1/${table}?select=${cols}`;
              if (_filters.length) url += '&' + _filters.join('&');
              if (_order) url += `&order=${_order}`;
              if (_limit) url += `&limit=${_limit}`;
              try {
                const res = await fetch(url, { headers: headers() });
                const data = res.ok ? await res.json() : [];
                const error = res.ok ? null : { message: `Select failed (${res.status})` };
                resolve({ data, error });
              } catch (e) { reject(e); }
            }
          };
          return q;
        }
      };
    }
  };

  return { auth, from: (t) => db.from(t) };
})();
