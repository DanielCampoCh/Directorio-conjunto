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
try { clave = localStorage.getItem('dir_clave') || ''; } catch (e) {}

const ICON = {
  correo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  wa:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z"/></svg>',
  tel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>'
};

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

  ['#qNombre', '#qServicio'].forEach(s => $(s).addEventListener('input', render));
  ['#fCategoria', '#fVinculo'].forEach(s => $(s).addEventListener('change', render));
  $('#btnLimpiar').addEventListener('click', limpiarFiltros);

  $('#btnRegistro').addEventListener('click', abrirModal);
  document.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', () => $('#modal').close()));
  $('#modal').addEventListener('click', e => { if (e.target === $('#modal')) $('#modal').close(); });
  $('#descripcion').addEventListener('input', e => $('#contador').textContent = e.target.value.length);
  $('#foto').addEventListener('change', previsualizar);
  $('#form').addEventListener('submit', enviar);
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
  estado.hidden = false; estado.textContent = 'Cargando directorio…';
  try{
    const r = await fetch(CONFIG.API_URL + '?clave=' + encodeURIComponent(clave) + '&t=' + Date.now());
    const data = await r.json();

    if (data.codigo === 'CLAVE'){ pedirClave(intentoConClave); return; }
    if (!data.ok) throw new Error(data.error || 'Respuesta inválida');

    try { if (clave) localStorage.setItem('dir_clave', clave); } catch (e) {}
    $('#acceso').hidden = true;
    $('#filtros').hidden = false;
    $('#btnRegistro').hidden = false;

    personas = data.items || [];
    const sel = $('#fCategoria');
    sel.length = 1;
    const cats = [...new Set(personas.map(p => p.categoria).filter(Boolean))].sort((a,b) => a.localeCompare(b,'es'));
    llenarSelect(sel, cats);
    render();
  }catch(err){
    console.error(err);
    estado.innerHTML = '<strong>No se pudo cargar el directorio</strong>Revisa tu conexión y recarga la página.';
  }
}

function pedirClave(fallo){
  try { localStorage.removeItem('dir_clave'); } catch (e) {}
  $('#filtros').hidden = true;
  $('#btnRegistro').hidden = true;
  $('#conteo').textContent = '';
  $('#lista').hidden = true;
  $('#estado').hidden = true;
  $('#acceso').hidden = false;
  $('#claveError').hidden = !fallo;
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

  const total = personas.length;
  const palabra = n => n === 1 ? 'vecino' : 'vecinos';
  $('#conteo').textContent = hayFiltro
    ? `${res.length} de ${total} ${palabra(total)}`
    : `${total} ${palabra(total)} en el directorio`;

  if (!res.length){
    lista.hidden = true; estado.hidden = false;
    estado.innerHTML = total
      ? '<strong>Nadie coincide con esta búsqueda</strong>Prueba con otra palabra o limpia los filtros.'
      : '<strong>El directorio aún está vacío</strong>Registra tu emprendimiento y sé el primero.';
    return;
  }
  estado.hidden = true; lista.hidden = false;
  lista.innerHTML = res.map(tarjeta).join('');
}

function tarjeta(p){
  const foto = urlSegura(p.foto);
  const wa = numeroWa(p.telefono);
  const apto = textoApto(p.apartamento);
  const redes = [
    ['Instagram', urlSegura(p.instagram, 'https://instagram.com/')],
    ['Facebook', urlSegura(p.facebook, 'https://facebook.com/')],
    ['LinkedIn', urlSegura(p.linkedin, 'https://www.linkedin.com/in/')],
    ['Sitio web', urlSegura(p.web)]
  ].filter(r => r[1]);

  return `<li class="item">
    <div class="avatar" aria-hidden="true">${esc(iniciales(p.nombre))}
      ${foto ? `<img src="${esc(foto)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
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
        ${p.categoria ? `<span class="chip">${esc(p.categoria)}</span>` : ''}
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
  $('#form').hidden = false; $('#exito').hidden = true; $('#formError').hidden = true;
  $('#modal').showModal();
}

function previsualizar(e){
  const f = e.target.files[0], pv = $('#preview');
  if (!f){ pv.hidden = true; return; }
  pv.src = URL.createObjectURL(f); pv.hidden = false;
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

  btn.disabled = true; btn.textContent = 'Enviando…';
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

    form.reset(); $('#preview').hidden = true; $('#contador').textContent = '0';
    form.hidden = true; $('#exito').hidden = false;
  }catch(err){
    mostrarError(err.message || 'No se pudo enviar. Intenta de nuevo.');
  }finally{
    btn.disabled = false; btn.textContent = 'Enviar registro';
  }
}

init();