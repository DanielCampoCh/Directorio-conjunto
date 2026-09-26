/* ================== CONFIGURACIÓN ================== */
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbxpaV4AO8jLtHC9n_2RXOohmpbH-_EyQBMmAPP_ZzK9lPad6ykvhty3jqh3xMj7lfwqOQ/exec', // termina en /exec
  CONJUNTO: 'Conjunto Residencial',
  TITULO: 'Bosques de Chipichape',
  SUBTITULO: 'Directorio de emprendimientos y empresas de los residentes. Conoce lo que hacen tus vecinos y cuenta con ellos.',
  LOGO_URL: '',            // ej. 'logo.png' (en la misma carpeta)
  INDICATIVO: '57',        // se antepone a celulares de 10 dígitos
  VINCULOS: ['Dueño o emprendedor', 'Empleado', 'Independiente'], // debe coincidir con Code.gs
  CATEGORIAS: [
    'Alimentos y postres', 'Belleza y estética', 'Salud y bienestar', 'Hogar y reparaciones',
    'Tecnología', 'Educación y clases', 'Moda y accesorios', 'Mascotas',
    'Eventos', 'Transporte', 'Servicios profesionales', 'Otra'
  ]
};
/* =================================================== */

const $ = s => document.querySelector(s);
let personas = [];
let clave = '';
let ultimaClaveLista = '';
const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)');
try { clave = localStorage.getItem('dir_clave') || ''; } catch (e) {}

const ICON = {
  correo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z"/></svg>',
  tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  etiqueta:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
  lupa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8.5 11h5"/></svg>',
  vacio:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21C7 17 5 12 8 6c2.5 2 4 4.5 4 15zM12 21c5-4 7-9 4-15-2.5 2-4 4.5-4 15z"/></svg>',
  error:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 8.8a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16.2a5 5 0 0 1 6 0M12 20h.01M3 3l18 18"/></svg>'
};

const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function urlSegura(v, base){
  v = String(v || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(javascript|data|vbscript):/i.test(v)) return '';
  v = v.replace(/^@/, '');
  if (base && !v.includes('.')) return base + v;
  return 'https://' + v.replace(/^\/+/, '');
}
function numeroWa(tel){
  let d = String(tel || '').replace(/\D/g, '');
  if (d.length === 10) d = CONFIG.INDICATIVO + d;
  return d;
}
function iniciales(n){
  return String(n || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
}
function textoApto(a){
  a = String(a || '').trim();
  if (!a) return '';
  return /^\d/.test(a) ? 'Apto ' + a : a;
}
function textoRol(p){
  const cargo = p.cargo || '';
  if (p.vinculo === 'Empleado') return cargo ? `${cargo} en` : 'Trabaja en';
  if (p.vinculo === 'Independiente') return cargo ? `${cargo}, independiente:` : 'Independiente:';
  return cargo ? `${cargo}, dueño/a de` : 'Dueño/a de';
}

/* ---------- Inicio ---------- */
function init(){
  document.title = 'Directorio ' + CONFIG.TITULO;
  $('#conjunto').textContent = CONFIG.CONJUNTO;
  $('#titulo').textContent = CONFIG.TITULO;
  $('#subtitulo').textContent = CONFIG.SUBTITULO;
  $('#pie').textContent = `${CONFIG.CONJUNTO} ${CONFIG.TITULO}, ${new Date().getFullYear()}`;
  if (CONFIG.LOGO_URL){ const l = $('#logo'); l.src = CONFIG.LOGO_URL; l.alt = CONFIG.TITULO; l.hidden = false; }

  llenarSelect($('#categoria'), CONFIG.CATEGORIAS);
  llenarSelect($('#vinculo'), CONFIG.VINCULOS);
  llenarSelect($('#fVinculo'), CONFIG.VINCULOS);

  const renderSuave = debounce(render, 140);
  ['#qNombre', '#qServicio'].forEach(s => $(s).addEventListener('input', renderSuave));
  ['#fCategoria', '#fVinculo'].forEach(s => $(s).addEventListener('change', render));
  $('#btnLimpiar').addEventListener('click', limpiarFiltros);
  // Clic en la categoría de una tarjeta: filtra por esa categoría
  $('#lista').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    $('#fCategoria').value = b.dataset.cat;
    render();
    $('#filtros').scrollIntoView({ behavior: sinMovimiento.matches ? 'auto' : 'smooth', block: 'start' });
  });
  $('#estado').addEventListener('click', e => {
    if (e.target.closest('[data-limpiar]')) limpiarFiltros();
    if (e.target.closest('[data-registrar]')) abrirModal();
    if (e.target.closest('[data-recargar]')) cargar(false);
  });

  $('#btnRegistro').addEventListener('click', abrirModal);
  $('#fab').addEventListener('click', abrirModal);
  document.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', cerrarModal));
  $('#modal').addEventListener('click', e => { if (e.target === $('#modal')) cerrarModal(); });
  $('#modal').addEventListener('cancel', e => { e.preventDefault(); cerrarModal(); });
  $('#descripcion').addEventListener('input', e => {
    const n = e.target.value.length, a = $('#ayudaDesc');
    $('#contador').textContent = n;
    a.classList.toggle('casi', n >= 500 && n < 600);
    a.classList.toggle('lleno', n >= 600);
  });
  $('#foto').addEventListener('change', previsualizar);
  prepararArrastre();
  $('#form').addEventListener('input', e => e.target.classList.remove('invalido'));
  $('#form').addEventListener('change', e => e.target.classList.remove('invalido'));
  $('#form').addEventListener('submit', enviar);
  prepararFab();
  $('#acceso').addEventListener('submit', e => {
    e.preventDefault();
    clave = $('#claveInput').value.trim();
    cargar(true);
  });

  cargar(false);
}

function llenarSelect(sel, valores){
  valores.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); });
}

/* ---------- Datos ---------- */
async function cargar(intentoConClave){
  const estado = $('#estado');
  if (!CONFIG.API_URL.startsWith('https://')){
    estado.innerHTML = '<strong>Falta configurar la conexión</strong>Pega la URL de Apps Script en CONFIG.API_URL dentro de index.html.';
    return;
  }
  mostrarEsqueleto();
  try{
    const r = await fetch(CONFIG.API_URL + '?clave=' + encodeURIComponent(clave) + '&t=' + Date.now());
    const data = await r.json();

    if (data.codigo === 'CLAVE'){ pedirClave(intentoConClave); return; }
    if (!data.ok) throw new Error(data.error || 'Respuesta inválida');

    try { if (clave) localStorage.setItem('dir_clave', clave); } catch (e) {}
    $('#acceso').hidden = true;
    $('#filtros').hidden = false;
    $('#btnRegistro').hidden = false;
    $('#fab').hidden = false;

    personas = data.items || [];
    const sel = $('#fCategoria');
    sel.length = 1;
    const cats = [...new Set(personas.map(p => p.categoria).filter(Boolean))].sort((a,b) => a.localeCompare(b,'es'));
    llenarSelect(sel, cats);
    render();
  }catch(err){
    console.error(err);
    $('#lista').hidden = true;
    estado.hidden = false;
    estado.innerHTML = `${ICON.error}<strong>No se pudo cargar el directorio</strong>Revisa tu conexión e intenta de nuevo.<br><button class="btn btn-verde" type="button" data-recargar>Reintentar</button>`;
  }finally{
    $('#lista').classList.remove('esqueleto');
    $('#lista').removeAttribute('aria-busy');
  }
}

function mostrarEsqueleto(){
  const lista = $('#lista');
  $('#estado').hidden = true;
  $('#conteo').textContent = 'Cargando directorio…';
  ultimaClaveLista = '';
  lista.classList.add('esqueleto'); lista.setAttribute('aria-busy', 'true'); lista.hidden = false;
  lista.innerHTML = Array.from({ length: 3 }, () => `<li class="item" aria-hidden="true">
    <div class="hueso circ"></div>
    <div><div class="hueso t"></div><div class="hueso l" style="width:70%"></div><div class="hueso l" style="width:90%"></div></div>
    <div class="acciones"><div class="hueso b"></div></div>
  </li>`).join('');
}

function pedirClave(fallo){
  try { localStorage.removeItem('dir_clave'); } catch (e) {}
  $('#filtros').hidden = true;
  $('#btnRegistro').hidden = true;
  $('#conteo').textContent = '';
  $('#lista').hidden = true;
  $('#estado').hidden = true;
  $('#fab').hidden = true;
  const acceso = $('#acceso');
  acceso.hidden = false;
  $('#claveError').hidden = !fallo;
  if (fallo){
    acceso.classList.remove('sacude'); void acceso.offsetWidth; acceso.classList.add('sacude');
    $('#claveInput').select();
  }
  $('#claveInput').focus();
}

function filtrar(){
  const qn = norm($('#qNombre').value);
  const qs = norm($('#qServicio').value);
  const fc = $('#fCategoria').value;
  const fv = $('#fVinculo').value;
  return personas.filter(p =>
    (!qn || norm([p.nombre, p.empresa, p.apartamento].join(' ')).includes(qn)) &&
    (!qs || norm([p.descripcion, p.productos, p.categoria, p.empresa, p.cargo].join(' ')).includes(qs)) &&
    (!fc || p.categoria === fc) &&
    (!fv || p.vinculo === fv)
  );
}

function render(){
  const lista = $('#lista'), estado = $('#estado');
  const res = filtrar();
  const hayFiltro = $('#qNombre').value || $('#qServicio').value || $('#fCategoria').value || $('#fVinculo').value;
  $('#btnLimpiar').hidden = !hayFiltro;
  ['#qNombre', '#qServicio', '#fCategoria', '#fVinculo'].forEach(s => $(s).classList.toggle('activo', !!$(s).value));

  const total = personas.length;
  const palabra = n => n === 1 ? 'vecino' : 'vecinos';
  $('#conteo').innerHTML = hayFiltro
    ? `<b>${res.length}</b> de ${total} ${palabra(total)}`
    : `<b>${total}</b> ${palabra(total)} en el directorio`;

  // Solo se vuelve a pintar (y animar) si cambió el conjunto de resultados
  const claveLista = res.map(p => personas.indexOf(p)).join(',');
  if (claveLista === ultimaClaveLista && (res.length ? !lista.hidden : !estado.hidden)) return;
  ultimaClaveLista = claveLista;

  if (!res.length){
    lista.hidden = true; estado.hidden = false;
    estado.innerHTML = total
      ? `${ICON.lupa}<strong>Nadie coincide con esta búsqueda</strong>Prueba con otra palabra o limpia los filtros.<br><button class="btn btn-verde" type="button" data-limpiar>Limpiar filtros</button>`
      : `${ICON.vacio}<strong>El directorio aún está vacío</strong>Registra tu emprendimiento y sé el primero.<br><button class="btn btn-sol" type="button" data-registrar><span class="mas" aria-hidden="true">+</span> Registrar mi emprendimiento</button>`;
    return;
  }
  estado.hidden = true; lista.hidden = false;
  lista.classList.remove('animar');
  lista.innerHTML = res.map((p, i) => tarjeta(p, i)).join('');
  void lista.offsetWidth; // reinicia la animación de entrada
  lista.classList.add('animar');
}

function tarjeta(p, i = 0){
  const foto = urlSegura(p.foto);
  const wa = numeroWa(p.telefono);
  const apto = textoApto(p.apartamento);
  const redes = [
    ['Instagram', urlSegura(p.instagram, 'https://instagram.com/')],
    ['Facebook', urlSegura(p.facebook, 'https://facebook.com/')],
    ['LinkedIn', urlSegura(p.linkedin, 'https://www.linkedin.com/in/')],
    ['Sitio web', urlSegura(p.web)]
  ].filter(r => r[1]);

  return `<li class="item" style="--i:${Math.min(i, 8)}">
    <div class="avatar" aria-hidden="true">${esc(iniciales(p.nombre))}
      ${foto ? `<img src="${esc(foto)}" alt="" loading="lazy" referrerpolicy="no-referrer" onload="this.classList.add('cargada')" onerror="this.remove()">` : ''}
    </div>
    <div>
      <div class="nombre-fila">
        <h2>${esc(p.nombre)}</h2>
        ${apto ? `<span class="apto">${esc(apto)}</span>` : ''}
      </div>
      <p class="empresa"><span class="rol">${esc(textoRol(p))}</span> <strong>${esc(p.empresa)}</strong></p>
      <div class="meta">${p.correo ? `<a href="mailto:${esc(p.correo)}">${ICON.correo}${esc(p.correo)}</a>` : ''}</div>
      <p class="desc">${esc(p.descripcion)}</p>
      <div class="chips">
        ${p.categoria ? `<button class="chip" type="button" data-cat="${esc(p.categoria)}" title="Ver todos en ${esc(p.categoria)}">${ICON.etiqueta}${esc(p.categoria)}</button>` : ''}
        ${redes.map(r => `<a class="chip" href="${esc(r[1])}" target="_blank" rel="noopener noreferrer">${r[0]}</a>`).join('')}
      </div>
    </div>
    <div class="acciones">
      ${wa ? `<a class="btn btn-wa" href="https://wa.me/${wa}" target="_blank" rel="noopener noreferrer">${ICON.wa}WhatsApp</a>` : ''}
      ${wa ? `<a class="btn btn-tel" href="tel:+${esc(wa)}">${ICON.tel}Llamar</a>` : ''}
    </div>
  </li>`;
}

function limpiarFiltros(){
  $('#qNombre').value = ''; $('#qServicio').value = '';
  $('#fCategoria').value = ''; $('#fVinculo').value = '';
  render();
}

/* ---------- Registro ---------- */
function abrirModal(){
  const m = $('#modal');
  m.classList.remove('cerrando');
  $('#form').hidden = false; $('#exito').hidden = true; $('#formError').hidden = true;
  if (!m.open) m.showModal();
  m.scrollTop = 0;
}

function cerrarModal(){
  const m = $('#modal');
  if (!m.open || m.classList.contains('cerrando')) return;
  if (sinMovimiento.matches){ m.close(); return; }
  m.classList.add('cerrando');
  let hecho = false;
  const fin = () => { if (hecho) return; hecho = true; m.classList.remove('cerrando'); m.close(); };
  m.addEventListener('animationend', fin, { once: true });
  setTimeout(fin, 320); // respaldo por si el navegador no dispara animationend
}

let urlPreview = '';
function previsualizar(e){
  const f = e.target.files[0], pv = $('#preview');
  if (urlPreview){ URL.revokeObjectURL(urlPreview); urlPreview = ''; }
  $('#fotoIcono').hidden = !!f;
  $('#fotoNombre').textContent = f ? f.name : 'Elige una imagen o arrástrala aquí';
  if (!f){ pv.hidden = true; pv.removeAttribute('src'); return; }
  urlPreview = URL.createObjectURL(f);
  pv.src = urlPreview; pv.hidden = false;
}

function prepararArrastre(){
  const zona = $('#fotoZona'), input = $('#foto');
  ['dragenter', 'dragover'].forEach(t => zona.addEventListener(t, e => { e.preventDefault(); zona.classList.add('arrastrando'); }));
  ['dragleave', 'drop'].forEach(t => zona.addEventListener(t, () => zona.classList.remove('arrastrando')));
  zona.addEventListener('drop', e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f || !/^image\/(jpeg|png|webp)$/.test(f.type)) return;
    const dt = new DataTransfer(); dt.items.add(f);
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
  });
}

// Botón flotante en móvil: aparece cuando el botón principal sale de la pantalla
function prepararFab(){
  const fab = $('#fab'), btn = $('#btnRegistro');
  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => {
    const ver = !e.isIntersecting && !btn.hidden;
    fab.classList.toggle('visible', ver);
    fab.tabIndex = ver ? 0 : -1;
    fab.setAttribute('aria-hidden', String(!ver));
  }).observe(btn);
}

function limpiarForm(){
  const form = $('#form');
  form.reset();
  form.querySelectorAll('.invalido').forEach(el => el.classList.remove('invalido'));
  $('#foto').dispatchEvent(new Event('change'));
  $('#contador').textContent = '0';
  $('#ayudaDesc').classList.remove('casi', 'lleno');
}

function recortarFoto(file, tam = 400){
  return new Promise((ok, fallo) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const lado = Math.min(img.width, img.height);
      const sx = (img.width - lado) / 2, sy = (img.height - lado) / 2;
      const out = Math.min(tam, lado);
      const c = document.createElement('canvas'); c.width = c.height = out;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, out, out);
      ctx.drawImage(img, sx, sy, lado, lado, 0, 0, out, out);
      URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); fallo(new Error('No se pudo leer la imagen. Prueba con otro archivo.')); };
    img.src = url;
  });
}

function mostrarError(msg){ const e = $('#formError'); e.textContent = msg; e.hidden = false; e.scrollIntoView({block:'nearest'}); }

async function enviar(ev){
  ev.preventDefault();
  const form = ev.target, btn = $('#btnEnviar');
  $('#formError').hidden = true;

  if (!form.checkValidity()){
    form.querySelectorAll(':invalid').forEach(el => el.classList.add('invalido'));
    const inv = form.querySelector(':invalid');
    const nombre = inv.closest('.campo')?.querySelector('label')?.textContent || 'la autorización de datos';
    mostrarError(inv.type === 'email' && inv.value ? 'El correo no tiene un formato válido.' : `Completa el campo: ${nombre}.`);
    inv.focus();
    return;
  }

  const fd = new FormData(form);
  const datos = Object.fromEntries(fd.entries());
  datos.acepta = fd.get('acepta') === 'on';
  datos.clave = clave;
  delete datos.foto;

  btn.disabled = true; btn.innerHTML = '<span class="giro" aria-hidden="true"></span>Enviando…';
  try{
    const file = fd.get('foto');
    if (file && file.size) datos.foto = await recortarFoto(file);

    const r = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(datos)
    });
    const res = await r.json();
    if (!res.ok) throw new Error(res.error || 'No se pudo guardar el registro.');

    limpiarForm();
    form.hidden = true; $('#exito').hidden = false;
    $('#modal').scrollTop = 0;
    $('#exito [data-cerrar]').focus();
  }catch(err){
    mostrarError(err.message || 'No se pudo enviar. Intenta de nuevo.');
  }finally{
    btn.disabled = false; btn.textContent = 'Enviar registro';
  }
}

init();