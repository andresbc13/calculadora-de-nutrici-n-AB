// ═══════════════════════════════════════════════════════
// CAMPOS A GUARDAR
// ═══════════════════════════════════════════════════════
const CAMPOS = [
  'nombre','fecha','sexo','edad','peso','estatura','grasa','deporte','nivel',
  'diasEntreno','minSesion','sesiones','nivelActividad','factorActividad',
  'extraCardio','extraNeat','extraEntreno','pasos',
  'metodoAjuste','ajusteKcal',
  'protGkg','fatGkg','protGkgFfm','fatGkgFfm',
  'protPct','fatPct','protManual','carbManual','fatManual',
  'numComidas','carbDistribucion','tipoCiclado','refeedExtraCarbs',
  'restDayDiff','restDayStrategy','notasNutriologo'
];

// ═══════════════════════════════════════════════════════
// CARGAR DATOS GUARDADOS  (CQ-3: error handling added)
// ═══════════════════════════════════════════════════════
async function cargarDatos() {
  const { data: { session } } = await sbClient.auth.getSession();
  if (!session) return;

  const { data, error } = await sbClient
    .from('perfiles')
    .select('datos')
    .eq('user_id', session.user.id)
    .single();

  if (error) {
    console.warn('cargarDatos — no profile yet or error:', error.message);
    return; // first-time user has no row — that's OK
  }

  if (data?.datos && Object.keys(data.datos).length > 0) {
    const d = data.datos;
    CAMPOS.forEach(id => {
      const el = document.getElementById(id);
      if (el && d[id] !== undefined && !el.hasAttribute('readonly')) {
        el.value = d[id];
      }
    });
    recalc();
  }
}

// ═══════════════════════════════════════════════════════
// GUARDAR DATOS  (CQ-3: error handling + CQ-4: debounce)
// ═══════════════════════════════════════════════════════
let _saveTimeout;

async function guardarDatos() {
  clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(async () => {
    const { data: { session } } = await sbClient.auth.getSession();
    if (!session) return;

    const datos = {};
    CAMPOS.forEach(id => {
      const el = document.getElementById(id);
      if (el) datos[id] = el.value;
    });

    const { error } = await sbClient.from('perfiles').upsert({
      user_id: session.user.id,
      datos,
      updated_at: new Date().toISOString()
    });

    const ind = document.getElementById('saveIndicator');
    if (ind) {
      if (error) {
        // CQ-3: surface save failures to the user
        console.error('guardarDatos — save failed:', error.message);
        ind.textContent = '❌ Error';
        ind.style.color = 'var(--danger)';
        ind.style.opacity = '1';
        setTimeout(() => { ind.style.opacity = '0'; ind.style.color = 'var(--success)'; }, 4000);
      } else {
        ind.textContent = '✓ Guardado';
        ind.style.color = 'var(--success)';
        ind.style.opacity = '1';
        setTimeout(() => { ind.style.opacity = '0'; }, 2000);
      }
    }
  }, 1500);
}

// ═══════════════════════════════════════════════════════
// RECALC DEBOUNCE  (PERF-2: separate from save debounce)
// ═══════════════════════════════════════════════════════
let _recalcRAF;

function debouncedRecalc() {
  cancelAnimationFrame(_recalcRAF);
  _recalcRAF = requestAnimationFrame(() => {
    recalc();
  });
}

// ═══════════════════════════════════════════════════════
// INICIALIZAR  (CQ-4: scope listener to calculator body)
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  cargarDatos();

  // CQ-4: Only listen inside the calculator, not the whole document
  const appBody = document.getElementById('appBody');
  if (appBody) {
    appBody.addEventListener('input', () => { debouncedRecalc(); guardarDatos(); });
    appBody.addEventListener('change', () => { debouncedRecalc(); guardarDatos(); });
  } else {
    // fallback if appBody not found
    document.addEventListener('input', guardarDatos);
    document.addEventListener('change', guardarDatos);
  }
});
