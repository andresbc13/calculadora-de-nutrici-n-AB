// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════
const state = {
  objetivo: 'mantenimiento',
  macroMethod: 'gkg',
  locks: { prot: false, fat: false },
  macros: { protG: 0, carbG: 0, fatG: 0 },
  bmrSelected: 0, tdee: 0, calObj: 0,
  bmrHB: 0, bmrMSJ: 0, bmrCUN: 0
};

// ═══════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════
function val(id) { return parseFloat(document.getElementById(id).value) || 0; }
function setVal(id, v) { document.getElementById(id).value = v; }
function setText(id, t) { document.getElementById(id).textContent = t; }
function setHTML(id, h) { document.getElementById(id).innerHTML = h; }
function round(v, d = 0) { const m = Math.pow(10, d); return Math.round(v * m) / m; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function $(id) { return document.getElementById(id); }

// ═══════════════════════════════════════════════════════
// BMR FORMULAS
// ═══════════════════════════════════════════════════════
function calcHB(p, h, a, s) { return s==='M' ? 88.362+(13.397*p)+(4.799*h)-(5.677*a) : 447.593+(9.247*p)+(3.098*h)-(4.330*a); }
function calcMSJ(p, h, a, s) { return s==='M' ? (10*p)+(6.25*h)-(5*a)+5 : (10*p)+(6.25*h)-(5*a)-161; }
function calcCUN(ffm) { return 500 + (22 * ffm); }
function calcIMC(p, hcm) { const m = hcm/100; return p/(m*m); }
function imcCat(i) { return i<18.5?'Bajo peso':i<25?'Normal':i<30?'Sobrepeso':i<35?'Obesidad I':i<40?'Obesidad II':'Obesidad III'; }

// ═══════════════════════════════════════════════════════
// MAIN RECALC
// ═══════════════════════════════════════════════════════
function recalc() {
  const peso=val('peso'), est=val('estatura'), edad=val('edad'), sexo=$('sexo').value, grasa=val('grasa'), factor=val('factorActividad');
  let ffm=0;
  if(peso>0&&grasa>0){ ffm=peso*(1-grasa/100); setVal('ffm',round(ffm,1)); } else { setVal('ffm',''); }

  let bmrHB=0,bmrMSJ=0,bmrCUN=0;
  if(peso>0&&est>0&&edad>0){ bmrHB=calcHB(peso,est,edad,sexo); bmrMSJ=calcMSJ(peso,est,edad,sexo); state.bmrHB=bmrHB; state.bmrMSJ=bmrMSJ; }
  if(ffm>0){ bmrCUN=calcCUN(ffm); state.bmrCUN=bmrCUN; }

  setText('val-hb', bmrHB>0?round(bmrHB):'—');
  setText('val-msj', bmrMSJ>0?round(bmrMSJ):'—');
  setText('val-cun', bmrCUN>0?round(bmrCUN):'—');

  let rec='msj', recText='';
  document.querySelectorAll('.formula-card').forEach(c=>{c.classList.remove('recommended');const b=c.querySelector('.badge');if(b)b.remove();});

  if(bmrCUN>0){ rec='cun'; recText='✅ <strong>Cunningham recomendada</strong> — Se dispone de % grasa corporal. Ecuación basada en FFM, más precisa para atletas.'; }
  else if(bmrMSJ>0){ rec='msj'; recText='✅ <strong>Mifflin-St Jeor recomendada</strong> — Sin % grasa. Mejor validación que Harris-Benedict. Ingresa % grasa para activar Cunningham.'; }
  else { recText='Ingresa los datos del atleta para ver la fórmula recomendada.'; }

  const cardMap={hb:'card-hb',msj:'card-msj',cun:'card-cun'};
  const recCard=$(cardMap[rec]);
  if(recCard&&(bmrHB>0||bmrCUN>0)){ recCard.classList.add('recommended'); const badge=document.createElement('div'); badge.className='badge'; badge.textContent='RECOMENDADA'; recCard.appendChild(badge); }
  setHTML('formulaRecommendation', recText);

  const sel=$('formulaSeleccionada').value;
  let bmrUsed=0;
  if(sel==='auto') bmrUsed=rec==='cun'?bmrCUN:(rec==='hb'?bmrHB:bmrMSJ);
  else if(sel==='hb') bmrUsed=bmrHB;
  else if(sel==='msj') bmrUsed=bmrMSJ;
  else if(sel==='cun') bmrUsed=bmrCUN;
  state.bmrSelected=bmrUsed;

  const tdee=bmrUsed*factor+val('extraCardio')+val('extraNeat')+(val('pasos')*0.04)+val('extraEntreno');
  state.tdee=tdee;
  setText('tdeeValue', tdee>0?round(tdee):'—');

  calcCalObj();
  recalcMacros();
  updateExtras();
  runValidations();
}

// ═══════════════════════════════════════════════════════
// CALORIC OBJECTIVE
// ═══════════════════════════════════════════════════════
function setObjetivo(obj, btn) {
  state.objetivo=obj;
  document.querySelectorAll('#sec4 .preset-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const m=$('metodoAjuste').value;
  if(obj==='mantenimiento') setVal('ajusteKcal',0);
  else if(obj==='volumen') setVal('ajusteKcal',m==='pct'?15:350);
  else if(obj==='definicion') setVal('ajusteKcal',m==='pct'?-15:-400);
  recalc();
}

function calcCalObj() {
  const m=$('metodoAjuste').value, aj=val('ajusteKcal'), tdee=state.tdee;
  let c=tdee;
  if(m==='pct'){ c=tdee*(1+aj/100); $('ajusteUnit').textContent='%'; $('ajusteHint').textContent=`Ajuste: ${aj>0?'+':''}${aj}% sobre TDEE`; }
  else { c=tdee+aj; $('ajusteUnit').textContent='kcal'; $('ajusteHint').textContent=`Ajuste: ${aj>0?'+':''}${aj} kcal sobre TDEE`; }
  if(c<0) c=0;
  state.calObj=c;
  setText('calObjetivo', c>0?round(c):'—');
}

function updateActivityFactor() { setVal('factorActividad',$('nivelActividad').value); recalc(); }

// ═══════════════════════════════════════════════════════
// MACRO METHOD
// ═══════════════════════════════════════════════════════
function setMacroMethod(method, tab) {
  state.macroMethod=method;
  document.querySelectorAll('#sec5 .tab').forEach(t=>t.classList.remove('active'));
  if(tab) tab.classList.add('active');
  ['gkg','gkg_ffm','pct','manual'].forEach(m=>{ $('macroMode_'+m).classList.toggle('hidden',m!==method); });
  recalcMacros();
}

function applyMacroPreset(preset) {
  const presets={volumen_limpio:{p:2.0,f:0.9},volumen_agresivo:{p:1.8,f:1.0},definicion_conservadora:{p:2.2,f:0.8},definicion_agresiva:{p:2.5,f:0.7},recomp:{p:2.4,f:0.9},mantenimiento:{p:1.8,f:1.0},peak_week:{p:2.7,f:0.6},resistencia:{p:1.6,f:0.8},rendimiento:{p:1.8,f:0.9},perdida_grasa:{p:2.5,f:0.7}};
  const pr=presets[preset]; if(!pr)return;
  setMacroMethod('gkg',document.querySelector('#sec5 .tab'));
  document.querySelectorAll('#sec5 .tab').forEach(t=>t.classList.remove('active'));
  document.querySelector('#sec5 .tab').classList.add('active');
  setVal('protGkg',pr.p); setVal('fatGkg',pr.f);
  recalcMacros();
  document.querySelectorAll('#sec5 .preset-btn').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
}

function toggleLock(macro) {
  state.locks[macro]=!state.locks[macro];
  const btn=$('lock'+(macro==='prot'?'Prot':'Fat'));
  btn.classList.toggle('locked',state.locks[macro]);
  btn.textContent=state.locks[macro]?'🔒':'🔓';
}

// ═══════════════════════════════════════════════════════
// MACRO CALCULATION
// ═══════════════════════════════════════════════════════
function recalcMacros() {
  const peso=val('peso'),ffm=val('ffm'),cal=state.calObj,m=state.macroMethod;
  let pG=0,fG=0,cG=0;

  if(m==='gkg'&&peso>0&&cal>0){ pG=val('protGkg')*peso; fG=val('fatGkg')*peso; cG=Math.max(0,(cal-pG*4-fG*9)/4); setVal('carbGkg',round(cG/peso,1)); }
  else if(m==='gkg_ffm'&&ffm>0&&cal>0){ pG=val('protGkgFfm')*ffm; fG=val('fatGkgFfm')*ffm; cG=Math.max(0,(cal-pG*4-fG*9)/4); setVal('carbGkgFfm',round(cG/ffm,1)); }
  else if(m==='pct'&&cal>0){ const pp=val('protPct'),fp=val('fatPct'),cp=clamp(100-pp-fp,0,100); setVal('carbPct',round(cp)); pG=(cal*pp/100)/4; fG=(cal*fp/100)/9; cG=(cal*cp/100)/4; }
  else if(m==='manual'){ pG=val('protManual'); fG=val('fatManual'); cG=val('carbManual'); }

  state.macros={protG:round(pG,1),carbG:round(cG,1),fatG:round(fG,1)};
  updateMacroDisplay();
  updateResults();
  recalcComidas();
  recalcCiclado();
  recalcTrainRest();
}

function updateMacroDisplay() {
  const{protG,carbG,fatG}=state.macros, peso=val('peso'), cal=state.calObj;
  const pK=protG*4,cK=carbG*4,fK=fatG*9,total=pK+cK+fK;
  const pP=total>0?pK/total*100:0,cP=total>0?cK/total*100:0,fP=total>0?fK/total*100:0;

  setText('mPG',round(protG)+'g'); setText('mPK',round(pK)); setText('mPP',round(pP,1)+'%'); setText('mPGkg',peso>0?round(protG/peso,2)+' g/kg':'—');
  setText('mCG',round(carbG)+'g'); setText('mCK',round(cK)); setText('mCP',round(cP,1)+'%'); setText('mCGkg',peso>0?round(carbG/peso,2)+' g/kg':'—');
  setText('mFG',round(fatG)+'g'); setText('mFK',round(fK)); setText('mFP',round(fP,1)+'%'); setText('mFGkg',peso>0?round(fatG/peso,2)+' g/kg':'—');
  setText('mTG',round(protG+carbG+fatG)+'g'); setText('mTK',round(total)); setText('mTP',round(pP+cP+fP,1)+'%');

  $('macroBarVisual').innerHTML=`<div class="bar-protein" style="width:${pP}%">${round(pP)}%</div><div class="bar-carbs" style="width:${cP}%">${round(cP)}%</div><div class="bar-fat" style="width:${fP}%">${round(fP)}%</div>`;

  const alerts=[];
  if(peso>0&&protG/peso<1.2) alerts.push({t:'warning',m:`Proteína baja: ${round(protG/peso,1)} g/kg. Mínimo atletas: 1.6 g/kg.`});
  if(peso>0&&protG/peso>3.5) alerts.push({t:'warning',m:`Proteína muy alta: ${round(protG/peso,1)} g/kg.`});
  if(peso>0&&fatG/peso<0.5) alerts.push({t:'danger',m:`Grasas muy bajas: ${round(fatG/peso,1)} g/kg. Riesgo hormonal.`});
  if(peso>0&&fatG/peso>2.0) alerts.push({t:'warning',m:`Grasas elevadas: ${round(fatG/peso,1)} g/kg.`});
  if(carbG<50&&carbG>0) alerts.push({t:'warning',m:`Carbohidratos < 50g: nivel cetogénico.`});
  if(cal>0&&Math.abs(total-cal)>50) alerts.push({t:'danger',m:`Diferencia de ${round(Math.abs(total-cal))} kcal entre macros (${round(total)}) y objetivo (${round(cal)}).`});
  setHTML('macroAlerts',alerts.map(a=>`<div class="alert alert-${a.t}"><span class="alert-icon">${a.t==='danger'?'🚨':'⚠️'}</span>${a.m}</div>`).join(''));
}

// ═══════════════════════════════════════════════════════
// RESULTS & SUMMARY
// ═══════════════════════════════════════════════════════
function updateResults() {
  const{protG,carbG,fatG}=state.macros, peso=val('peso'), est=val('estatura');
  setText('resBmr',state.bmrSelected>0?round(state.bmrSelected):'—');
  setText('resTdee',state.tdee>0?round(state.tdee):'—');
  setText('resObj',state.calObj>0?round(state.calObj):'—');
  if(peso>0&&est>0){const i=calcIMC(peso,est);setText('resImc',round(i,1));setText('resImcCat',imcCat(i));}
  setText('resP',round(protG)+'g'); $('resPsub').textContent=peso>0?round(protG/peso,1)+' g/kg':'';
  setText('resC',round(carbG)+'g'); $('resCsub').textContent=peso>0?round(carbG/peso,1)+' g/kg':'';
  setText('resF',round(fatG)+'g'); $('resFsub').textContent=peso>0?round(fatG/peso,1)+' g/kg':'';
  setText('resFfm',val('ffm')>0?round(val('ffm'),1):'—');

  const pK=protG*4,cK=carbG*4,fK=fatG*9,total=pK+cK+fK;
  const pP=total>0?pK/total*100:33,cP=total>0?cK/total*100:34,fP=total>0?fK/total*100:33;
  $('macroBarResult').innerHTML=`<div class="bar-protein" style="width:${pP}%">${round(pP)}%</div><div class="bar-carbs" style="width:${cP}%">${round(cP)}%</div><div class="bar-fat" style="width:${fP}%">${round(fP)}%</div>`;

  updateSummary();
}

function updateSummary() {
  const nombre=$('nombre').value||'el atleta', peso=val('peso'), grasa=val('grasa'), {protG,carbG,fatG}=state.macros;
  if(state.bmrSelected<=0){ setText('professionalSummary','Completa los datos del atleta para generar el resumen.'); return; }
  const sel=$('formulaSeleccionada').value;
  let fn='Mifflin-St Jeor';
  if(sel==='auto')fn=grasa>0?'Cunningham':'Mifflin-St Jeor'; else if(sel==='hb')fn='Harris-Benedict'; else if(sel==='cun')fn='Cunningham';
  const fr=fn==='Cunningham'?'por disponer de % grasa corporal (basada en FFM, más precisa para atletas)':'al no disponer de % grasa corporal';
  const objMap={mantenimiento:'mantenimiento',volumen:'volumen (superávit)',definicion:'definición (déficit)'};
  const na=$('nivelActividad').options[$('nivelActividad').selectedIndex].text;
  let s=`Andrés Bahena — Strength & Conditioning\nCalculadora de Nutrición Deportiva\n${'─'.repeat(45)}\n\n`;
  s+=`Para ${nombre}, usando la ecuación de ${fn} ${fr}, el metabolismo basal estimado es de ${round(state.bmrSelected)} kcal/día.\n\n`;
  s+=`Nivel de actividad: "${na}" (×${val('factorActividad')}). TDEE estimado: ${round(state.tdee)} kcal/día.\n\n`;
  s+=`Fase: ${objMap[state.objetivo]||'mantenimiento'}. Recomendación calórica: ${round(state.calObj)} kcal/día.\n\n`;
  s+=`• Proteína: ${round(protG)} g (${peso>0?round(protG/peso,1):'—'} g/kg)\n`;
  s+=`• Carbohidratos: ${round(carbG)} g (${peso>0?round(carbG/peso,1):'—'} g/kg)\n`;
  s+=`• Grasas: ${round(fatG)} g (${peso>0?round(fatG/peso,1):'—'} g/kg)\n\n`;
  s+=`Total macros: ${round(protG*4+carbG*4+fatG*9)} kcal.\nFecha: ${$('fecha').value||'—'}`;
  const n=$('notasNutriologo').value; if(n)s+=`\n\nNotas: ${n}`;
  s+=`\n\n⚠️ Estimación inicial. No sustituye juicio clínico. Monitorear y ajustar.`;
  setText('professionalSummary',s);
}

// ═══════════════════════════════════════════════════════
// EXTRAS
// ═══════════════════════════════════════════════════════
function updateExtras() {
  const p=val('peso'),e=val('estatura'),g=val('grasa');
  if(p>0&&e>0){const i=calcIMC(p,e);setText('extraImc',round(i,1));setText('extraImcCat',imcCat(i));}
  if(g>0&&p>0){setText('extraFatMass',round(p*g/100,1));setText('extraFfm',round(p*(1-g/100),1));}
  setText('extraLb',p>0?round(p*2.20462,1):'—');
}
function cmToFtIn(){const cm=val('convCm'),ti=cm/2.54;setVal('convFtIn',Math.floor(ti/12)+"' "+round(ti%12,1)+'"');}

function recalcComidas() {
  const n=parseInt($('numComidas').value)||4, dist=$('carbDistribucion').value, {protG,carbG,fatG}=state.macros;
  if(protG<=0)return;
  let rows='';
  for(let i=1;i<=n;i++){
    const pm=round(protG/n,1);
    let cm;
    if(dist==='periEntreno'&&n>=3){ cm=(i===1||i===n)?round(carbG*0.30,1):round(carbG*0.40/(n-2),1); }
    else { cm=round(carbG/n,1); }
    const fm=round(fatG/n,1), km=round(pm*4+cm*4+fm*9);
    let label=`Comida ${i}`;
    if(dist==='periEntreno'){if(i===1)label=`Comida ${i} (Pre)`;if(i===n)label=`Comida ${i} (Post)`;}
    rows+=`<tr><td>${label}</td><td class="mono">${pm}</td><td class="mono">${cm}</td><td class="mono">${fm}</td><td class="mono">${km}</td></tr>`;
  }
  $('tablaComidasBody').innerHTML=rows;
}

function recalcCiclado() {
  const tipo=$('tipoCiclado').value, ec=val('refeedExtraCarbs'), {protG,carbG,fatG}=state.macros, cal=state.calObj;
  if(tipo==='none'||cal<=0){setHTML('cicladoResultado','<p class="text-muted text-sm">Sin ciclado.</p>');return;}
  const hc=carbG+ec, hk=protG*4+hc*4+fatG*9;
  let ld,hd; if(tipo==='refeed1'){ld=6;hd=1;}else{ld=5;hd=2;}
  const wt=cal*7,ht=hk*hd,lk=(wt-ht)/ld,lc=Math.max(0,(lk-protG*4-fatG*9)/4);
  setHTML('cicladoResultado',`<table class="clean-table"><thead><tr><th>Día</th><th>kcal</th><th>Prot</th><th>Carbs</th><th>Grasas</th></tr></thead><tbody><tr><td>Regular (×${ld})</td><td class="mono">${round(lk)}</td><td class="mono">${round(protG)}</td><td class="mono">${round(lc)}</td><td class="mono">${round(fatG)}</td></tr><tr style="background:var(--accent-light);"><td>High/Refeed (×${hd})</td><td class="mono">${round(hk)}</td><td class="mono">${round(protG)}</td><td class="mono">${round(hc)}</td><td class="mono">${round(fatG)}</td></tr><tr style="font-weight:700;"><td>Prom. semanal</td><td class="mono">${round(wt/7)}</td><td class="mono">${round(protG)}</td><td class="mono">${round((lc*ld+hc*hd)/7)}</td><td class="mono">${round(fatG)}</td></tr></tbody></table>`);
}

function recalcTrainRest() {
  const diff=val('restDayDiff'),str=$('restDayStrategy').value,{protG,carbG,fatG}=state.macros,cal=state.calObj;
  if(cal<=0){setHTML('trainRestResultado','');return;}
  let rc=carbG,rf=fatG;
  if(str==='carbs')rc=Math.max(0,carbG+diff/4);
  else if(str==='fat')rf=Math.max(0,fatG+diff/9);
  else{const r=(carbG*4)/((carbG*4)+(fatG*9));rc=Math.max(0,carbG+(diff*r)/4);rf=Math.max(0,fatG+(diff*(1-r))/9);}
  setHTML('trainRestResultado',`<table class="clean-table"><thead><tr><th>Día</th><th>kcal</th><th>Prot</th><th>Carbs</th><th>Grasas</th></tr></thead><tbody><tr style="background:var(--accent-light);"><td>🏋️ Entrenamiento</td><td class="mono">${round(cal)}</td><td class="mono">${round(protG)}</td><td class="mono">${round(carbG)}</td><td class="mono">${round(fatG)}</td></tr><tr><td>😴 Descanso</td><td class="mono">${round(cal+diff)}</td><td class="mono">${round(protG)}</td><td class="mono">${round(rc)}</td><td class="mono">${round(rf)}</td></tr></tbody></table>`);
}

function showExtraTab(tab,el){['conversiones','comidas','ciclado','trainrest','notas'].forEach(t=>{$('extraTab_'+t).classList.toggle('hidden',t!==tab);});document.querySelectorAll('#sec8 .tab').forEach(t=>t.classList.remove('active'));if(el)el.classList.add('active');}

// ═══════════════════════════════════════════════════════
// VALIDATIONS
// ═══════════════════════════════════════════════════════
function runValidations() {
  const alerts=[], peso=val('peso'), grasa=val('grasa'), sexo=$('sexo').value, cal=state.calObj;
  if(grasa>0){ if(sexo==='M'&&grasa<5)alerts.push({t:'danger',m:'% grasa muy bajo para hombre (<5%). Riesgo para la salud.'}); if(sexo==='F'&&grasa<12)alerts.push({t:'danger',m:'% grasa muy bajo para mujer (<12%). Riesgo para la salud.'}); if(grasa>40)alerts.push({t:'warning',m:'% grasa >40%. Verificar dato.'}); }
  if(cal>0){ if(sexo==='F'&&cal<1200)alerts.push({t:'danger',m:`Calorías (${round(cal)}) < 1200. Muy bajo para mujeres activas.`}); if(sexo==='M'&&cal<1500)alerts.push({t:'danger',m:`Calorías (${round(cal)}) < 1500. Muy bajo para hombres activos.`}); }
  setHTML('alerts-container',alerts.map(a=>`<div class="alert alert-${a.t}"><span class="alert-icon">${a.t==='danger'?'🚨':'⚠️'}</span>${a.m}</div>`).join(''));
}

// ═══════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════
function copySummary(){const t=$('professionalSummary').textContent;navigator.clipboard.writeText(t).then(()=>alert('Resumen copiado.')).catch(()=>{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);alert('Copiado.');});}

function exportJSON(){
  const data={fecha:$('fecha').value,atleta:{nombre:$('nombre').value,sexo:$('sexo').value,edad:val('edad'),peso:val('peso'),estatura:val('estatura'),grasa:val('grasa'),ffm:val('ffm'),deporte:$('deporte').value,nivel:$('nivel').value},metabolismo:{harrisBenedict:round(state.bmrHB),mifflinStJeor:round(state.bmrMSJ),cunningham:round(state.bmrCUN),seleccionado:round(state.bmrSelected)},actividad:{factor:val('factorActividad'),tdee:round(state.tdee)},objetivo:{tipo:state.objetivo,calorias:round(state.calObj)},macros:{proteina_g:round(state.macros.protG),carbohidratos_g:round(state.macros.carbG),grasas_g:round(state.macros.fatG)},notas:$('notasNutriologo').value};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`AB_nutricion_${($('nombre').value||'atleta').replace(/\s+/g,'_')}_${$('fecha').value||'sin_fecha'}.json`;a.click();URL.revokeObjectURL(url);
}

function exportText(){const t=$('professionalSummary').textContent,blob=new Blob([t],{type:'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`AB_resumen_${($('nombre').value||'atleta').replace(/\s+/g,'_')}.txt`;a.click();URL.revokeObjectURL(url);}

// ═══════════════════════════════════════════════════════
// LOAD EXAMPLE & RESET
// ═══════════════════════════════════════════════════════
function loadExample(){
  setVal('nombre','Carlos Méndez');setVal('fecha',new Date().toISOString().split('T')[0]);$('sexo').value='M';setVal('edad',28);setVal('peso',82);setVal('estatura',178);setVal('grasa',14);setVal('deporte','Fisicoculturismo Natural');$('nivel').value='avanzado';setVal('diasEntreno',5);setVal('minSesion',90);setVal('sesiones',1);$('nivelActividad').value='1.725';setVal('factorActividad',1.725);setVal('pasos',8000);setVal('protGkg',2.2);setVal('fatGkg',0.9);setObjetivo('volumen',document.querySelectorAll('#sec4 .preset-btn')[1]);setVal('ajusteKcal',350);setVal('notasNutriologo','Atleta en fase de volumen limpio. Priorizar proteína de alta calidad. Creatina 5g/día. Considerar refeed semanal.');recalc();
}

function resetAll(){
  if(!confirm('¿Restablecer todos los datos?'))return;
  document.querySelectorAll('input[type="number"],input[type="text"],textarea').forEach(el=>{if(!el.hasAttribute('readonly'))el.value='';});
  setVal('factorActividad',1.55);$('nivelActividad').value='1.55';setVal('extraCardio',0);setVal('extraNeat',0);setVal('extraEntreno',0);setVal('pasos','');setVal('ajusteKcal',0);setVal('protGkg',2.0);setVal('fatGkg',0.9);
  state.objetivo='mantenimiento';state.macroMethod='gkg';state.locks={prot:false,fat:false};
  document.querySelectorAll('.preset-btn').forEach(b=>b.classList.remove('active'));document.querySelector('#sec4 .preset-btn').classList.add('active');recalc();
}

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  setVal('fecha',new Date().toISOString().split('T')[0]);
  recalc();
  const sections=document.querySelectorAll('.section[id]'), navLinks=document.querySelectorAll('.sidebar-nav a');
  const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting){navLinks.forEach(l=>l.classList.remove('active'));const link=document.querySelector(`.sidebar-nav a[href="#${e.target.id}"]`);if(link)link.classList.add('active');}});},{rootMargin:'-20% 0px -70% 0px'});
  sections.forEach(s=>obs.observe(s));
});
