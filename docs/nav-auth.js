// nav-auth.js — loaded on every page
// Swaps the "Sign In" nav link to "Account" if a session exists in localStorage.
// Lightweight: no network calls, no supabase client needed.
(function () {
  const SESSION_KEY = 'cosmo_sb_session';
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!session || !session.access_token) return;
    const link = document.querySelector('.nav-auth-link');
    if (!link) return;
    link.textContent = 'Account';
    link.href = 'account.html';
  } catch {}
})();
