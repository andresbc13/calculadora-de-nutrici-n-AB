// ═══════════════════════════════════════════════════════
// AUTH — Uses SUPABASE_URL / SUPABASE_ANON_KEY from config.js
// ═══════════════════════════════════════════════════════
const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function requireAuth() {
  const { data: { session } } = await sbClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  // SEC-3: Reveal app content once authenticated
  const appBody = document.getElementById('appBody');
  if (appBody) appBody.style.display = '';
  const emailEl = document.getElementById('userEmail');
  if (emailEl) emailEl.textContent = session.user.email;
  return session;
}

async function signOut() {
  await sbClient.auth.signOut();
  window.location.href = 'login.html';
}
