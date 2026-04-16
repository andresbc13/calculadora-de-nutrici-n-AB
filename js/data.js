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
// CARGAR DATOS GUARDADOS
// ═══════════════════════════════════════════════════════
async function cargarDatos() {
  const { data: { session } } = await sbClient.auth.getSession();
  if (!session) return;

  const { data } = await sbClient
    .from('perfiles')
    .select('datos')
    .eq('user_id', session.user.id)
    .single();

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
// GUARDAR DATOS (con debounce de 1.5s)
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

    await sbClient.from('perfiles').upsert({
      user_id: session.user.id,
      datos,
      updated_at: new Date().toISOString()
    });

    const ind = document.getElementById('saveIndicator');
    if (ind) {
      ind.textContent = '✓ Guardado';
      ind.style.opacity = '1';
      setTimeout(() => { ind.style.opacity = '0'; }, 2000);
    }
  }, 1500);
}

// ═══════════════════════════════════════════════════════
// INICIALIZAR: cargar al entrar y escuchar cambios
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  cargarDatos();
  document.addEventListener('input', guardarDatos);
  document.addEventListener('change', guardarDatos);
});
