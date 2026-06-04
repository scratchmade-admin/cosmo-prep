// Supabase client — loaded by login.html and quiz.html
const SUPABASE_URL = 'https://xoqxvihynantxsikfuxy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcXh2aWh5bmFudHhzaWtmdXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NDkxMjksImV4cCI6MjA5NjEyNTEyOX0.lQOPoF4_dUHhZfzB3Gr53GIbEXaRamc_UHoq06E9ZWQ';

// Minimal Supabase client (no npm, no bundler — works in plain HTML)
const supabase = (() => {
  const headers = () => ({
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${_getToken() || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  });

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

  async function _authRequest(path, body) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.access_token) _saveSession(data);
    return { data, error: data.error ? { message: data.msg || data.error_description || data.error } : null };
  }

  const auth = {
    async signUp({ email, password }) {
      return _authRequest('/signup', { email, password });
    },
    async signInWithPassword({ email, password }) {
      return _authRequest('/token?grant_type=password', { email, password });
    },
    async signOut() {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${_getToken()}` }
      });
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
            eq(col, val) { _filters.push(`${col}=eq.${val}`); return q; },
            order(col, { ascending = true } = {}) { _order = `${col}.${ascending ? 'asc' : 'desc'}`; return q; },
            limit(n) { _limit = n; return q; },
            async then(resolve, reject) {
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
