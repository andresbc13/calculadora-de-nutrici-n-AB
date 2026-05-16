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
// INDICADOR DE GUARDADO
// ═══════════════════════════════════════════════════════
let _autoHideTimeout;

function showSaveIndicator(state) {
  const indicator = document.getElementById('saveIndicator');
  if (!indicator) return;

  clearTimeout(_autoHideTimeout);

  const icon = indicator.querySelector('.save-icon');
  const text = indicator.querySelector('.save-text');
  const closeBtn = indicator.querySelector('.save-close-btn');

  indicator.className = 'save-indicator show';

  if (state === 'saving') {
    indicator.classList.add('saving');
    icon.textContent = '⏳';
    text.textContent = 'Guardando...';
    closeBtn.style.display = 'none';
  } else if (state === 'success') {
    indicator.classList.add('success');
    icon.textContent = '✓';
    text.textContent = 'Guardado';
    closeBtn.style.display = 'none';
    _autoHideTimeout = setTimeout(() => {
      indicator.classList.remove('show');
    }, 3000);
  } else if (state === 'error') {
    indicator.classList.add('error');
    icon.textContent = '❌';
    text.textContent = 'Error al guardar';
    closeBtn.style.display = 'block';
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

    showSaveIndicator('saving');

    try {
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

      if (error) throw error;
      showSaveIndicator('success');
    } catch (e) {
      showSaveIndicator('error');
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

  document.querySelector('.save-close-btn')?.addEventListener('click', () => {
    document.getElementById('saveIndicator').classList.remove('show');
  });
});
