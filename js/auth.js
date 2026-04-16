const SUPABASE_URL = 'https://wkpzibrkvjeabfxlkryw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eHYhxVTeKdVlqqEKEVdT9A_azdrOA0E';
const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function requireAuth() {
  const { data: { session } } = await sbClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  const emailEl = document.getElementById('userEmail');
  if (emailEl) emailEl.textContent = session.user.email;
  return session;
}

async function signOut() {
  await sbClient.auth.signOut();
  window.location.href = 'login.html';
}
