/* ==========================================================
   Food Place · prototipo interactivo
   Estado compartido entre: simulador de app, tablero de lotes,
   contadores globales, actividad en vivo y mercados.
   ========================================================== */
(() => {
  'use strict';

  // ---------- Utilidades ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const nf0 = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });
  const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = 60e3;
  const HOUR = 60 * MIN;

  // ---------- Supuestos de impacto ----------
  const COMIDAS_POR_KG = 2.5;   // supuesto del equipo
  const CO2_POR_KG = 2.5;       // kg CO2e por kg de alimento que no llega a consumirse (FAO, 2013)
  const AGUA_POR_KG = 190;      // litros por kg de alimento que no llega a consumirse (FAO, 2013)
  const CO2_POR_KM_AUTO = 0.2;  // kg CO2e por km, auto compacto aprox.
  const SEMANAS_MES = 4.33;

  // ---------- Recompensas ----------
  const PUNTOS_POR_RESERVA = 50; // Puntos Semilla por cada rescate reservado
  const META_PUNTOS = 200;       // puntos necesarios para un canje (envío gratis o acceso prioritario)

  // ---------- Catálogos ----------
  const PRODUCTOS = {
    mango: {
      nombre: 'Mango ataulfo', corto: 'mango', precio: 25, tono: '#FBE9C8',
      svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="36" rx="22" ry="24" fill="#E9A23B"/><path d="M32 12c2-6 6-8 10-8-1 4-4 7-10 8z" fill="#2F6B4F"/><circle cx="24" cy="30" r="3" fill="#C57F1E" opacity=".5"/><circle cx="38" cy="44" r="2" fill="#C57F1E" opacity=".45"/></svg>'
    },
    jitomate: {
      nombre: 'Jitomate saladet', corto: 'jitomate', precio: 22, tono: '#F6D5CC',
      svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 14c12-2 24 6 22 20-2 14-12 26-22 26S12 48 10 34C8 20 20 16 32 14z" fill="#B8402B"/><path d="M32 14c0-4 2-7 5-8" stroke="#2F6B4F" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M22 16c4 3 7 3 10 0 3 3 6 3 10 0" stroke="#2F6B4F" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
    },
    aguacate: {
      nombre: 'Aguacate Hass', corto: 'aguacate', precio: 60, tono: '#E2E9CF',
      svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6c9 0 14 12 16 22 3 14-4 30-16 30S13 42 16 28C18 18 23 6 32 6z" fill="#3E5F2C"/><path d="M32 16c6 0 9 9 10 15 2 10-3 20-10 20s-12-10-10-20c1-6 4-15 10-15z" fill="#C9D77A"/><circle cx="32" cy="38" r="7" fill="#7A4A26"/></svg>'
    },
    platano: {
      nombre: 'Plátano tabasco', corto: 'plátano', precio: 16, tono: '#FBF0C8',
      svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 18c4 24 22 36 44 32 2 0 3-3 1-4-18 2-32-8-38-28-1-3-7-3-7 0z" fill="#F0C24A"/><path d="M10 18l-2-6 6 2z" fill="#5B4A1E"/><path d="M55 46l4 3-5 1z" fill="#5B4A1E"/><circle cx="28" cy="38" r="2" fill="#8A6B1E" opacity=".6"/><circle cx="38" cy="43" r="1.6" fill="#8A6B1E" opacity=".6"/><circle cx="21" cy="30" r="1.4" fill="#8A6B1E" opacity=".6"/></svg>'
    },
    calabaza: {
      nombre: 'Calabaza criolla', corto: 'calabaza', precio: 18, tono: '#FBEFC6',
      svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="36" rx="26" ry="20" fill="#F0C24A"/><path d="M14 30c6 6 6 14 0 20M26 22c4 8 4 18 0 26M40 22c-4 8-4 18 0 26M50 30c-6 6-6 14 0 20" stroke="#D39B1F" stroke-width="2" fill="none"/><path d="M32 17c0-5 2-8 6-9" stroke="#2F6B4F" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
    },
    guayaba: {
      nombre: 'Guayaba', corto: 'guayaba', precio: 30, tono: '#EEF2D2',
      svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="36" r="22" fill="#C3D46A"/><path d="M28 14l4-6 4 6z" fill="#6B7A2E"/><circle cx="24" cy="32" r="2.5" fill="#9AAE3E"/><circle cx="40" cy="42" r="2" fill="#9AAE3E"/><circle cx="36" cy="28" r="1.6" fill="#9AAE3E"/></svg>'
    },
    chayote: {
      nombre: 'Chayote', corto: 'chayote', precio: 15, tono: '#E3EDD9',
      svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6c8 0 10 14 14 24 4 10 2 28-14 28S18 40 18 30C22 20 24 6 32 6z" fill="#7FA66B"/><path d="M32 6v10" stroke="#4E7A46" stroke-width="2"/><path d="M26 30c2 6 2 12 0 18M38 30c-2 6-2 12 0 18" stroke="#4E7A46" stroke-width="1.6" fill="none" opacity=".6"/></svg>'
    },
    naranja: {
      nombre: 'Naranja', corto: 'naranja', precio: 14, tono: '#FCE2C8',
      svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="36" r="22" fill="#EE8A2A"/><path d="M32 14c4-6 10-8 14-6-3 4-8 6-14 6z" fill="#2F6B4F"/><circle cx="32" cy="15" r="2" fill="#7A5A1E"/><circle cx="24" cy="40" r="1.2" fill="#C96A14"/><circle cx="40" cy="32" r="1.2" fill="#C96A14"/></svg>'
    },
    zanahoria: {
      nombre: 'Zanahoria', corto: 'zanahoria', precio: 14, tono: '#FCE0CB',
      svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 20h24L34 60c-1 3-3 3-4 0z" fill="#E9782F"/><path d="M26 30h6M30 40h5M28 50h4" stroke="#C25D1F" stroke-width="2" stroke-linecap="round"/><path d="M32 20c-1-8 0-13 2-16M34 20c3-7 7-10 11-10M30 20c-5-5-10-6-13-4" stroke="#2F6B4F" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
    },
    fresa: {
      nombre: 'Fresa', corto: 'fresa', precio: 45, tono: '#F7D3CF',
      svg: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 58C18 48 10 36 12 26c2-8 10-10 20-10s18 2 20 10c2 10-6 22-20 32z" fill="#C8352B"/><path d="M20 16c4 3 8 3 12-2 4 5 8 5 12 2-2 6-8 8-12 6-4 2-10 0-12-6z" fill="#2F6B4F"/><g fill="#F3D27A"><circle cx="24" cy="30" r="1.3"/><circle cx="32" cy="28" r="1.3"/><circle cx="40" cy="30" r="1.3"/><circle cx="28" cy="38" r="1.3"/><circle cx="36" cy="38" r="1.3"/><circle cx="32" cy="46" r="1.3"/></g></svg>'
    }
  };

  const MERCADOS = {
    independencia: { nombre: 'Mercado Independencia', corto: 'Independencia' },
    abastos: { nombre: 'Central de Abastos', corto: 'Abastos' },
    sanjuan: { nombre: 'Mercado San Juan', corto: 'San Juan' }
  };

  const MOTIVOS = ['Manchas en la piel', 'Golpeado', 'Forma irregular', 'Tamaño fuera de norma', 'Muy maduro', 'Cáscara rayada'];

  const RECEPTORES = {
    banco: { nombre: 'Banco de Alimentos', ini: 'BA', desc: 'Recibe y distribuye en Morelia', corto: 'Banco' },
    familia: { nombre: 'Familia registrada', ini: 'FR', desc: 'Recoge en el mercado más cercano', corto: 'Familia' },
    comedor: { nombre: 'Comedor comunitario', ini: 'CC', desc: 'Prepara comidas diarias', corto: 'Comedor' }
  };

  const GUIAS = {
    com: {
      titulo: 'Comerciante: lo que no vendiste todavía vale',
      pasos: [
        '<b>No tires tu esfuerzo a la basura.</b> Elige el producto y por qué no se vendió: una mancha no le quita lo nutritivo.',
        '<b>Tú pones las reglas.</b> Indica el mercado y el horario que te acomoda, sin cambiar tu rutina.',
        '<b>Publica y recupera valor.</b> Tu lote aparece al instante y tu puesto se suma como líder solidario de tu mercado.'
      ]
    },
    ban: {
      titulo: 'Familias y Banco de Alimentos: comida digna',
      pasos: [
        '<b>Elige cómo recibes:</b> Banco de Alimentos, familia o comedor. Todos reciben el mismo trato.',
        '<b>Fresco, nutritivo y de calidad.</b> Cada lote muestra su frescura real y el mercado de donde sale.',
        '<b>Reserva sin filas ni estigmas.</b> Recibes un folio y recoges como cualquier cliente.'
      ]
    }
  };

  const ICON = {
    pin: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M10 18s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z"/><circle cx="10" cy="8" r="2.2"/></svg>',
    clock: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M10 6v4l2.5 2" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 10.5l3.2 3L15 6.5"/></svg>',
    plus: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg>',
    x: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg>',
    basket: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8h13l-1.6 8.5h-9.8z"/><path d="M7 8a3 3 0 0 1 6 0"/></svg>',
    coin: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="7.5"/><path d="M12.4 7.6c-.5-.9-1.4-1.4-2.4-1.4-1.4 0-2.4.8-2.4 1.9s1 1.6 2.4 1.9 2.4.8 2.4 1.9-1 1.9-2.4 1.9c-1.1 0-2-.5-2.5-1.4M10 4.6v1.6M10 13.8v1.6"/></svg>',
    bowl: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 10h15a7.5 6.5 0 0 1-15 0z"/><path d="M7.5 6.5c0-1 1-1.2 1-2.3M11.5 6.5c0-1 1-1.2 1-2.3"/></svg>',
    leaf: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 16c0-7 4-11 12-12 0 8-4 12-11 12"/><path d="M4 16l6-6"/></svg>',
    drop: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M10 2.5s5.5 6 5.5 9.7a5.5 5.5 0 0 1-11 0C4.5 8.5 10 2.5 10 2.5z"/></svg>',
    heart: '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 17s-7-4.1-7-9a3.8 3.8 0 0 1 7-1.9A3.8 3.8 0 0 1 17 8c0 4.9-7 9-7 9z"/></svg>'
  };

  // ---------- Estado ----------
  const state = {
    lotes: [],
    feed: [],
    receptor: 'banco',
    boardFiltro: 'todos',
    banFiltro: 'todos',
    sort: 'urgencia',
    nextId: 1,
    nextFolio: 1040,
    lastSignature: '',
    puntos: 0,
    aliados: []
  };

  // ---------- Tiempo ----------
  const hhmm = (ts) => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const roundUp = (ts, mins = 30) => Math.ceil(ts / (mins * MIN)) * (mins * MIN);
  const startOfDay = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const diaTxt = (ts) => {
    const diff = Math.round((startOfDay(ts) - startOfDay(Date.now())) / (24 * HOUR));
    return diff === 0 ? 'Hoy' : diff === 1 ? 'Mañana' : new Date(ts).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
  };
  const ventanaTxt = (l) => `${diaTxt(l.desde)} ${hhmm(l.desde)}–${hhmm(l.hasta)}`;
  const countdown = (ms) => {
    if (ms <= 0) return 'Vencido';
    const s = Math.floor(ms / 1000);
    return `Quedan ${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  };

  // ---------- Lógica de lotes ----------
  const restante = (l, now = Date.now()) => l.expira - now;
  const frescura = (l, now = Date.now()) => Math.max(0, Math.min(1, restante(l, now) / l.vida));
  const freshClass = (r) => (r > 0.6 ? 'f-alta' : r > 0.35 ? 'f-media' : 'f-baja');
  const isNuevo = (l, now = Date.now()) => l.propio && now - l.creado < 60e3;

  function estado(l, now = Date.now()) {
    if (l.reserva) return 'reservado';
    const r = restante(l, now);
    if (r <= 0) return 'vencido';
    if (r / l.vida < 0.35 || r < 3 * HOUR) return 'urgente';
    return 'disponible';
  }
  const disponible = (l, now) => { const e = estado(l, now); return e === 'disponible' || e === 'urgente'; };
  const ESTADO_TXT = { disponible: 'Disponible', urgente: 'Aprovecha hoy', reservado: 'Reservado', vencido: 'Vencido' };
  const badge = (e) => `<span class="badge badge--${e}">${ESTADO_TXT[e]}</span>`;

  function stats() {
    const now = Date.now();
    let kg = 0, rescates = 0, activos = 0, kgDisp = 0;
    state.lotes.forEach((l) => {
      if (l.reserva) { kg += l.kg; rescates++; }
      else if (disponible(l, now)) { activos++; kgDisp += l.kg; }
    });
    return { kg, rescates, comidas: kg * COMIDAS_POR_KG, activos, kgDisp };
  }

  function addFeed(tipo, html, t = Date.now(), silent = false) {
    state.feed.unshift({ id: Math.random().toString(36).slice(2), tipo, html, t, fresh: !silent });
    state.feed = state.feed.slice(0, 30);
  }

  // ---------- Datos semilla (relativos a la hora actual) ----------
  function seed() {
    const now = Date.now();
    const lote = (o) => {
      const desde = roundUp(now + o.ventanaEn * HOUR);
      const l = {
        id: state.nextId++, reserva: null, propio: false,
        producto: o.producto, kg: o.kg, motivo: o.motivo, mercado: o.mercado, puesto: o.puesto,
        creado: now - o.haceMin * MIN,
        vida: o.vidaH * HOUR, expira: now + o.restaH * HOUR,
        desde, hasta: desde + o.duracionH * HOUR
      };
      state.lotes.push(l);
      return l;
    };

    const mango = lote({ producto: 'mango', kg: 18, motivo: 'Manchas en la piel', mercado: 'independencia', puesto: 'Puesto 14 · Frutas', haceMin: 52, vidaH: 24, restaH: 16.5, ventanaEn: 0.5, duracionH: 3 });
    const jito = lote({ producto: 'jitomate', kg: 25, motivo: 'Muy maduro', mercado: 'abastos', puesto: 'Bodega 32 · Legumbres', haceMin: 38, vidaH: 12, restaH: 2.25, ventanaEn: 0, duracionH: 1.5 });
    const agua = lote({ producto: 'aguacate', kg: 12, motivo: 'Cáscara rayada', mercado: 'sanjuan', puesto: 'Local 8 · Aguacates', haceMin: 31, vidaH: 48, restaH: 40, ventanaEn: 1, duracionH: 4 });
    const plat = lote({ producto: 'platano', kg: 30, motivo: 'Muy maduro', mercado: 'independencia', puesto: 'Puesto 51 · Frutas', haceMin: 24, vidaH: 12, restaH: 4, ventanaEn: 0.5, duracionH: 2 });
    const cala = lote({ producto: 'calabaza', kg: 15, motivo: 'Forma irregular', mercado: 'abastos', puesto: 'Bodega 9 · Verduras', haceMin: 75, vidaH: 48, restaH: 30, ventanaEn: 1.5, duracionH: 3 });
    const guay = lote({ producto: 'guayaba', kg: 10, motivo: 'Tamaño fuera de norma', mercado: 'sanjuan', puesto: 'Local 21 · Frutas', haceMin: 12, vidaH: 24, restaH: 9, ventanaEn: 1, duracionH: 2 });

    cala.reserva = { folio: 'FP-' + state.nextFolio++, receptor: 'banco', t: now - 58 * MIN };

    const pub = (l) => `<b>${esc(l.puesto.split(' · ')[0])}</b> publicó ${nf1.format(l.kg)} kg de ${PRODUCTOS[l.producto].corto} · ${MERCADOS[l.mercado].corto}`;
    addFeed('publicar', pub(cala), cala.creado, true);
    addFeed('reservar', `<b>Banco de Alimentos</b> reservó ${nf1.format(cala.kg)} kg de calabaza · ${cala.reserva.folio}`, cala.reserva.t, true);
    [mango, jito, agua, plat, guay].forEach((l) => addFeed('publicar', pub(l), l.creado, true));
    state.feed.sort((a, b) => b.t - a.t);
  }

  // ---------- Contadores animados ----------
  const STAT_FMT = {
    kg: (v) => nf1.format(Math.round(v * 10) / 10),
    rescates: (v) => nf0.format(Math.round(v)),
    comidas: (v) => nf0.format(Math.round(v)),
    activos: (v) => nf0.format(Math.round(v)),
    kgDisp: (v) => nf1.format(Math.round(v * 10) / 10)
  };

  function setStat(el, value, fmt) {
    const had = el.dataset.val !== undefined;
    const from = had ? parseFloat(el.dataset.val) : value;
    el.dataset.val = String(value);
    if (!had || reduceMotion || from === value) { el.textContent = fmt(value); return; }
    cancelAnimationFrame(el._raf);
    const t0 = performance.now(), dur = 700;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (value - from) * e);
      if (k < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
    el.classList.remove('bump');
    void el.offsetWidth; // reinicia la animación
    el.classList.add('bump');
  }

  function renderStats() {
    const s = stats();
    $$('[data-stat]').forEach((el) => {
      const k = el.dataset.stat;
      if (k in s) setStat(el, s[k], STAT_FMT[k]);
    });
  }

  // ---------- Render: tablero ----------
  function loteCard(l, now) {
    const p = PRODUCTOS[l.producto];
    const e = estado(l, now);
    const r = frescura(l, now);
    const nuevo = isNuevo(l, now);
    let foot;
    if (e === 'reservado') {
      foot = `<div class="reserva-ok">
          <span><b>Reservado por ${esc(RECEPTORES[l.reserva.receptor].nombre)}</b>Folio ${esc(l.reserva.folio)}</span>
          <button type="button" class="btn-link" data-action="cancelar" data-id="${l.id}" data-fk="board-${l.id}">Cancelar</button>
        </div>`;
    } else if (e === 'vencido') {
      foot = `<button type="button" class="btn btn-block" disabled>Vencido</button><p class="lote-hint">Se sugiere enviarlo a composta.</p>`;
    } else {
      foot = `<button type="button" class="btn btn-primary btn-block" data-action="reservar" data-id="${l.id}" data-fk="board-${l.id}">${ICON.check} Reservar rescate</button>
        <p class="lote-hint">≈ ${nf0.format(l.kg * COMIDAS_POR_KG)} comidas para ${esc(RECEPTORES[state.receptor].nombre)}</p>`;
    }
    return `<article class="lote lote--${e}${nuevo ? ' is-nuevo' : ''}${l.glow ? ' glow' : ''}" data-id="${l.id}" aria-label="${esc(p.nombre)}, ${nf1.format(l.kg)} kilos, ${ESTADO_TXT[e]}">
      <div class="lote-top">
        <div class="lote-icon" style="background:${p.tono}">${p.svg}</div>
        <div class="lote-title">
          <h3>${esc(p.nombre)}</h3>
          <p>${esc(l.puesto)}</p>
        </div>
      </div>
      <div class="lote-badges">${badge(e)}${nuevo ? '<span class="badge badge--nuevo">Nuevo</span>' : ''}<span class="badge badge--motivo">${esc(l.motivo)}</span></div>
      <div class="lote-kg"><strong>${nf1.format(l.kg)}</strong><span class="u">kg</span></div>
      <div class="lote-meta">
        <div><span class="mi">${ICON.pin}</span><span class="mv"><span class="k">Mercado de origen</span>${esc(MERCADOS[l.mercado].nombre)}</span></div>
        <div><span class="mi">${ICON.clock}</span><span class="mv"><span class="k">Recolección</span>${ventanaTxt(l)}</span></div>
      </div>
      <div class="fresh">
        <div class="fresh-head"><span>Frescura <span data-fpct="${l.id}">${Math.round(r * 100)} %</span></span><span class="fresh-time" data-cd="${l.id}">${countdown(restante(l, now))}</span></div>
        <div class="fresh-bar" aria-hidden="true"><span data-fresh="${l.id}" class="${freshClass(r)}" style="width:${(r * 100).toFixed(2)}%"></span></div>
      </div>
      <div class="lote-foot">${foot}</div>
    </article>`;
  }

  function sortLotes(list, mode, now) {
    const grupo = (l) => { const e = estado(l, now); return e === 'vencido' ? 3 : e === 'reservado' ? 2 : 1; };
    return list.slice().sort((a, b) => {
      const na = isNuevo(a, now) ? 0 : 1, nb = isNuevo(b, now) ? 0 : 1;
      if (na !== nb) return na - nb;
      const ga = grupo(a), gb = grupo(b);
      if (ga !== gb) return ga - gb;
      if (mode === 'kg') return b.kg - a.kg;
      if (mode === 'reciente') return b.creado - a.creado;
      return restante(a, now) - restante(b, now);
    });
  }

  function renderFiltroChips(container, current, key) {
    const counts = { todos: state.lotes.length };
    Object.keys(MERCADOS).forEach((m) => { counts[m] = state.lotes.filter((l) => l.mercado === m).length; });
    const opts = [['todos', 'Todos']].concat(Object.keys(MERCADOS).map((m) => [m, MERCADOS[m].corto]));
    container.innerHTML = opts.map(([v, t]) =>
      `<button type="button" class="chip-btn" aria-pressed="${v === current}" data-filter="${key}" data-value="${v}" data-fk="${key}-${v}">${esc(t)} <span class="n">${counts[v]}</span></button>`
    ).join('');
  }

  function renderBoard(now) {
    renderFiltroChips($('#boardFiltro'), state.boardFiltro, 'board');
    const list = state.lotes.filter((l) => state.boardFiltro === 'todos' || l.mercado === state.boardFiltro);
    const board = $('#board');
    if (!list.length) {
      board.innerHTML = '<p class="empty board-empty">No hay lotes en este mercado por ahora.</p>';
    } else {
      board.innerHTML = sortLotes(list, state.sort, now).map((l) => loteCard(l, now)).join('');
    }
    const disp = list.filter((l) => disponible(l, now));
    const kg = disp.reduce((a, l) => a + l.kg, 0);
    $('#boardSummary').textContent = `${disp.length} ${disp.length === 1 ? 'lote disponible' : 'lotes disponibles'} · ${nf1.format(kg)} kg`;
  }

  // ---------- Render: app (comerciante) ----------
  function appItem(l, now, side) {
    const p = PRODUCTOS[l.producto];
    const r = frescura(l, now);
    return `<li class="app-item${l.glow ? ' glow' : ''}">
      <span class="ico" style="background:${p.tono}">${p.svg}</span>
      <div>
        <strong>${esc(p.nombre)} · ${nf1.format(l.kg)} kg</strong>
        <small>${esc(MERCADOS[l.mercado].corto)} · ${ventanaTxt(l)}</small>
        <div class="mini-bar" aria-hidden="true"><span data-fresh="${l.id}" class="${freshClass(r)}" style="width:${(r * 100).toFixed(2)}%"></span></div>
      </div>
      <div class="side">${side}</div>
    </li>`;
  }

  function renderComerciante(now) {
    const mios = state.lotes.filter((l) => l.propio).sort((a, b) => b.creado - a.creado);
    $('#comCount').textContent = nf0.format(mios.length);
    $('#comKg').textContent = nf1.format(mios.reduce((a, l) => a + l.kg, 0));
    $('#comValor').textContent = money.format(mios.reduce((a, l) => a + l.kg * PRODUCTOS[l.producto].precio, 0));
    const ul = $('#misLotes');
    if (!mios.length) {
      ul.innerHTML = '<li class="empty">Aún no publicas lotes. Lo que no se publica, se pierde: registra el primero arriba y aparecerá aquí al instante.</li>';
      return;
    }
    ul.innerHTML = mios.map((l) => {
      const e = estado(l, now);
      const extra = l.reserva ? `<small>${esc(RECEPTORES[l.reserva.receptor].corto)} · ${esc(l.reserva.folio)}</small>` : `<small data-cd="${l.id}">${countdown(restante(l, now))}</small>`;
      return appItem(l, now, badge(e) + extra);
    }).join('');
  }

  // ---------- Render: app (banco / familia) ----------
  function renderBanco(now) {
    const rec = RECEPTORES[state.receptor];
    $('#recIni').textContent = rec.ini;
    $('#recNombre').textContent = rec.nombre;
    $('#recDesc').textContent = rec.desc;

    $('#recSeg').innerHTML = Object.keys(RECEPTORES).map((k) =>
      `<button type="button" role="radio" aria-checked="${k === state.receptor}" tabindex="${k === state.receptor ? 0 : -1}" data-receptor="${k}" data-fk="rec-${k}">${esc(RECEPTORES[k].corto)}</button>`
    ).join('');

    renderFiltroChips($('#banFiltro'), state.banFiltro, 'ban');

    const disp = sortLotes(
      state.lotes.filter((l) => disponible(l, now) && (state.banFiltro === 'todos' || l.mercado === state.banFiltro)),
      'urgencia', now
    );
    $('#banCount').textContent = disp.length;
    $('#banLista').innerHTML = disp.length
      ? disp.map((l) => appItem(l, now,
          `${badge(estado(l, now))}<button type="button" class="btn btn-primary" data-action="reservar" data-id="${l.id}" data-fk="ban-${l.id}">Reservar</button>`
        )).join('')
      : '<li class="empty">No hay lotes disponibles con este filtro.</li>';

    renderSeeds();

    const res = state.lotes.filter((l) => l.reserva).sort((a, b) => b.reserva.t - a.reserva.t);
    $('#resCount').textContent = res.length;
    $('#misReservas').innerHTML = res.length
      ? res.map((l) => appItem(l, now,
          `<span class="badge badge--reservado">${esc(l.reserva.folio)}</span><small>${esc(RECEPTORES[l.reserva.receptor].corto)}</small><button type="button" class="btn-link" data-action="cancelar" data-id="${l.id}" data-fk="res-${l.id}">Cancelar</button>`
        )).join('')
      : '<li class="empty">Todavía no reservas ningún lote.</li>';
  }

  // ---------- Render: Puntos Semilla ----------
  function seedsMensaje(p) {
    if (p >= META_PUNTOS) {
      const canjes = Math.floor(p / META_PUNTOS);
      return `¡Listo! Tienes ${canjes} ${canjes === 1 ? 'canje' : 'canjes'}: envío gratis o acceso prioritario.`;
    }
    return p === 0
      ? `Reserva un lote y gana +${PUNTOS_POR_RESERVA} puntos.`
      : `Te faltan ${META_PUNTOS - p} puntos para tu primer canje.`;
  }

  function renderSeeds() {
    const p = state.puntos;
    $('#seedsPts').textContent = nf0.format(p);
    $('#seedsBar').style.width = Math.min(100, (p / META_PUNTOS) * 100) + '%';
    $('#seedsMsg').textContent = seedsMensaje(p);
    $('#seedsCard').classList.toggle('is-ready', p >= META_PUNTOS);
  }

  // ---------- Render: actividad ----------
  const FEED_ICON = { publicar: ICON.plus, reservar: ICON.check, cancelar: ICON.x, aliado: ICON.heart };
  function feedItem(f) {
    return `<li class="${f.fresh ? 'is-fresh' : ''}">
      <span class="feed-ico feed-ico--${f.tipo}">${FEED_ICON[f.tipo]}</span>
      <span>${f.html}</span>
      <time datetime="${new Date(f.t).toISOString()}">${hhmm(f.t)}</time>
    </li>`;
  }
  function renderFeed() {
    $('#feed').innerHTML = state.feed.slice(0, 8).map(feedItem).join('');
    $('#heroFeed').innerHTML = state.feed.slice(0, 3).map(feedItem).join('');
    state.feed.forEach((f) => { f.fresh = false; });
  }

  // ---------- Render: mercados (sección Morelia) ----------
  function renderMercados(now) {
    const data = Object.keys(MERCADOS).map((m) => {
      const ls = state.lotes.filter((l) => l.mercado === m);
      const disp = ls.filter((l) => disponible(l, now));
      return {
        m,
        lotes: disp.length,
        kg: disp.reduce((a, l) => a + l.kg, 0),
        rescatado: ls.filter((l) => l.reserva).reduce((a, l) => a + l.kg, 0)
      };
    });
    const max = Math.max(1, ...data.map((d) => d.kg + d.rescatado));
    $('#marketList').innerHTML = data.map((d) => `<li>
        <div class="mk-head"><strong>${esc(MERCADOS[d.m].nombre)}</strong><span>${d.lotes} ${d.lotes === 1 ? 'lote' : 'lotes'} · ${nf1.format(d.kg)} kg disponibles</span></div>
        <div class="mini-bar" aria-hidden="true" style="display:flex;height:6px">
          <span class="f-alta" style="width:${(d.rescatado / max) * 100}%;border-radius:0"></span>
          <span class="f-media" style="width:${(d.kg / max) * 100}%;border-radius:0"></span>
        </div>
        <div class="mk-head" style="margin-top:6px"><span>${nf1.format(d.rescatado)} kg rescatados</span></div>
      </li>`).join('');
  }

  // ---------- Render general (conserva el foco) ----------
  function signature(now) {
    return state.lotes.map((l) => l.id + estado(l, now) + (isNuevo(l, now) ? 'n' : '')).join('|');
  }

  function renderAll() {
    const now = Date.now();
    const active = document.activeElement;
    const fk = active && active.dataset ? active.dataset.fk : null;

    renderBoard(now);
    renderComerciante(now);
    renderBanco(now);
    renderFeed();
    renderMercados(now);
    renderAliados();
    renderStats();
    state.lastSignature = signature(now);
    // Las animaciones de destaque solo se ven una vez; después el tablero ya no re-anima sus tarjetas.
    state.lotes.forEach((l) => { l.glow = false; });
    $('#board').classList.add('is-ready');

    if (fk) {
      const target = document.querySelector(`[data-fk="${fk}"]`);
      if (target) target.focus({ preventScroll: true });
    }
  }

  // ---------- Acciones ----------
  function reservar(id) {
    const l = state.lotes.find((x) => x.id === id);
    if (!l || !disponible(l)) return;
    // Quién tenía el foco antes de reservar, para devolvérselo al cerrar la recompensa
    const fk = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.fk : null;
    l.reserva = { folio: 'FP-' + state.nextFolio++, receptor: state.receptor, t: Date.now(), puntos: PUNTOS_POR_RESERVA };
    l.glow = true;
    const antes = state.puntos;
    state.puntos += PUNTOS_POR_RESERVA;
    const rec = RECEPTORES[state.receptor];
    addFeed('reservar', `<b>${esc(rec.nombre)}</b> reservó ${nf1.format(l.kg)} kg de ${PRODUCTOS[l.producto].corto} · ${l.reserva.folio}`);
    renderAll();
    openReward(l, antes, state.puntos, fk);
  }

  function cancelar(id) {
    const l = state.lotes.find((x) => x.id === id);
    if (!l || !l.reserva) return;
    const folio = l.reserva.folio;
    const puntos = l.reserva.puntos || 0; // las reservas de demostración no dieron puntos
    state.puntos = Math.max(0, state.puntos - puntos);
    l.reserva = null;
    addFeed('cancelar', `Se canceló la reserva ${folio} · ${nf1.format(l.kg)} kg de ${PRODUCTOS[l.producto].corto}`);
    renderAll();
    toast(`Reserva ${folio} cancelada. El lote vuelve a estar disponible${puntos ? ` y se descontaron ${puntos} Puntos Semilla` : ''}.`, 'x');
  }

  // ---------- Modal de recompensa ----------
  let rewardReturnFk = null;

  function lanzarConfeti(box = $('#rewardConfetti')) {
    box.innerHTML = '';
    if (reduceMotion) return;
    const colores = ['#10B981', '#34D399', '#A3E635', '#FBBF24', '#5EEAD4', '#047857'];
    for (let i = 0; i < 26; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colores[i % colores.length];
      c.style.animationDelay = Math.random() * 0.35 + 's';
      c.style.setProperty('--r', (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360) + 'deg');
      if (i % 3 === 0) { c.style.width = '10px'; c.style.height = '10px'; c.style.borderRadius = '50%'; }
      box.appendChild(c);
    }
  }

  function openReward(l, antes, despues, fk) {
    const p = PRODUCTOS[l.producto];
    rewardReturnFk = fk;
    $('#rewardFolio').textContent = l.reserva.folio;
    $('#rewardLote').textContent =
      `${nf1.format(l.kg)} kg de ${p.corto} · ${MERCADOS[l.mercado].nombre} · ≈ ${nf0.format(l.kg * COMIDAS_POR_KG)} comidas para ${RECEPTORES[l.reserva.receptor].nombre}`;

    const bar = $('#rewardBar');
    const pct = (v) => Math.min(100, (v / META_PUNTOS) * 100) + '%';
    bar.style.transition = 'none';
    bar.style.width = pct(antes);
    void bar.offsetWidth; // fija el punto de partida antes de animar
    bar.style.transition = '';

    $('#rewardPts').textContent = nf0.format(despues);
    const listo = despues >= META_PUNTOS;
    $('#rewardFalta').textContent = listo
      ? (antes < META_PUNTOS ? '¡Desbloqueaste tu primer canje!' : '¡Tienes canjes disponibles!')
      : `Te faltan ${META_PUNTOS - despues}`;
    $('#rewardPerks').classList.toggle('is-unlocked', listo);

    const modal = $('#reward');
    const card = $('.reward-card', modal);
    card.classList.remove('is-settled');
    modal.hidden = false;
    document.documentElement.classList.add('no-scroll');
    // Red de seguridad: si el navegador o la app pausan las animaciones, el modal queda visible igual
    setTimeout(() => card.classList.add('is-settled'), 800);
    lanzarConfeti();
    requestAnimationFrame(() => { bar.style.width = pct(despues); });
    $('#rewardClose').focus({ preventScroll: true });
  }

  function closeReward() {
    const modal = $('#reward');
    if (modal.hidden) return;
    modal.hidden = true;
    document.documentElement.classList.remove('no-scroll');
    $('#rewardConfetti').innerHTML = '';
    const target = rewardReturnFk && document.querySelector(`[data-fk="${rewardReturnFk}"]`);
    if (target) target.focus({ preventScroll: true });
    rewardReturnFk = null;
  }

  function initReward() {
    const modal = $('#reward');
    modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-reward]')) closeReward();
    });
    $('#rewardClose').addEventListener('click', closeReward);
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeReward(); return; }
      if (e.key !== 'Tab') return;
      // Mantiene el foco dentro del modal
      const f = $$('button', modal);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  // ---------- Toasts ----------
  function toast(msg, icon = 'check', link) {
    const box = $('#toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="toast-ico">${ICON[icon] || ICON.check}</span><span>${esc(msg)}</span>${link ? `<a href="${link.href}">${esc(link.text)}</a>` : ''}`;
    box.appendChild(t);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), reduceMotion ? 0 : 320);
    }, 4200);
  }

  // ---------- Formulario del comerciante ----------
  function initForm() {
    const fProducto = $('#fProducto'), fKg = $('#fKg'), fMercado = $('#fMercado');
    const fDesde = $('#fDesde'), fHasta = $('#fHasta'), fVida = $('#fVida'), err = $('#formError');

    fProducto.innerHTML = Object.keys(PRODUCTOS).map((k) => `<option value="${k}">${esc(PRODUCTOS[k].nombre)}</option>`).join('');
    fMercado.innerHTML = Object.keys(MERCADOS).map((k) => `<option value="${k}">${esc(MERCADOS[k].nombre)}</option>`).join('');
    $('#fMotivo').innerHTML = MOTIVOS.map((m, i) =>
      `<label class="chip"><input type="radio" name="motivo" value="${esc(m)}"${i === 0 ? ' checked' : ''}><span>${esc(m)}</span></label>`
    ).join('');

    const setDefaultTimes = () => {
      const d = roundUp(Date.now(), 30);
      fDesde.value = hhmm(d);
      fHasta.value = hhmm(d + 3 * HOUR);
    };
    setDefaultTimes();

    $$('.stepper button').forEach((b) => b.addEventListener('click', () => {
      const v = parseFloat(fKg.value) || 0;
      fKg.value = Math.min(500, Math.max(0.5, v + Number(b.dataset.step)));
    }));

    const showError = (msg) => { err.textContent = msg; err.hidden = false; };

    $('#loteForm').addEventListener('submit', (ev) => {
      ev.preventDefault();
      err.hidden = true;
      const now = Date.now();
      const kg = parseFloat(String(fKg.value).replace(',', '.'));
      const motivo = ($('input[name="motivo"]:checked') || {}).value;

      if (!Number.isFinite(kg) || kg < 0.5 || kg > 500) { showError('Indica entre 0.5 y 500 kilos.'); fKg.focus(); return; }
      if (!motivo) { showError('Elige el motivo estético.'); return; }
      if (!fDesde.value || !fHasta.value) { showError('Completa el horario de recolección.'); fDesde.focus(); return; }

      // Construye la ventana: si "desde" ya pasó hace más de 30 min, se interpreta como mañana.
      const [dh, dm] = fDesde.value.split(':').map(Number);
      const [hh, hm] = fHasta.value.split(':').map(Number);
      let desde = startOfDay(now) + dh * HOUR + dm * MIN;
      if (desde < now - 30 * MIN) desde += 24 * HOUR;
      let hasta = startOfDay(desde) + hh * HOUR + hm * MIN;
      if (hasta <= desde) hasta += 24 * HOUR;
      if (hasta - desde > 12 * HOUR) { showError('La ventana de recolección no puede durar más de 12 horas.'); fHasta.focus(); return; }

      const vida = Number(fVida.value) * HOUR;
      if (hasta > now + vida) { showError('La recolección termina después de la vida útil estimada. Adelanta el horario o aumenta la vida útil.'); fHasta.focus(); return; }

      const l = {
        id: state.nextId++, reserva: null, propio: true, glow: true,
        producto: fProducto.value, kg: Math.round(kg * 10) / 10, motivo, mercado: fMercado.value,
        puesto: 'Puesto 27 · Tú', creado: now, vida, expira: now + vida, desde, hasta
      };
      state.lotes.push(l);
      addFeed('publicar', `<b>Puesto 27 (tú)</b> publicó ${nf1.format(l.kg)} kg de ${PRODUCTOS[l.producto].corto} · ${MERCADOS[l.mercado].corto}`);

      // Que el lote nuevo sea visible en el tablero aunque haya un filtro activo.
      if (state.boardFiltro !== 'todos' && state.boardFiltro !== l.mercado) state.boardFiltro = 'todos';
      renderAll();

      toast(`Lote publicado: ${nf1.format(l.kg)} kg de ${PRODUCTOS[l.producto].corto} en ${MERCADOS[l.mercado].corto}.`, 'check', { href: '#lotes', text: 'Ver en tablero' });

      // Lleva la vista del teléfono a "Mis lotes publicados".
      const body = $('#appBody');
      const title = $('#misLotes').previousElementSibling;
      body.scrollTo({ top: title.offsetTop - body.offsetTop - 8, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // ---------- Pestañas del simulador ----------
  function initTabs() {
    const tabs = $$('.tab');
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
      $('#appBody').scrollTop = 0;
      const g = GUIAS[tab.id === 'tab-com' ? 'com' : 'ban'];
      $('#guideTitle').textContent = g.titulo;
      $('#guideList').innerHTML = g.pasos.map((p) => `<li><span>${p}</span></li>`).join('');
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        select(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true);
      });
    });
    select(tabs[0]);
  }

  // ---------- Delegación de eventos ----------
  function initEvents() {
    document.addEventListener('click', (e) => {
      const act = e.target.closest('[data-action]');
      if (act) {
        const id = Number(act.dataset.id);
        if (act.dataset.action === 'reservar') reservar(id);
        if (act.dataset.action === 'cancelar') cancelar(id);
        return;
      }
      const f = e.target.closest('[data-filter]');
      if (f) {
        if (f.dataset.filter === 'board') state.boardFiltro = f.dataset.value;
        else state.banFiltro = f.dataset.value;
        renderAll();
        return;
      }
      const r = e.target.closest('[data-receptor]');
      if (r) { state.receptor = r.dataset.receptor; renderAll(); }
    });

    // Flechas en el selector de receptor (radiogroup)
    $('#recSeg').addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      e.preventDefault();
      const keys = Object.keys(RECEPTORES);
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      state.receptor = keys[(keys.indexOf(state.receptor) + dir + keys.length) % keys.length];
      renderAll();
      $(`[data-fk="rec-${state.receptor}"]`).focus();
    });

    $('#boardSort').addEventListener('change', (e) => { state.sort = e.target.value; renderAll(); });
  }

  // ---------- Reloj: cuentas regresivas en vivo ----------
  function tick() {
    const now = Date.now();
    $('#phoneClock').textContent = hhmm(now);

    if (signature(now) !== state.lastSignature) { renderAll(); return; }

    state.lotes.forEach((l) => {
      const r = frescura(l, now);
      const cd = countdown(restante(l, now));
      $$(`[data-cd="${l.id}"]`).forEach((el) => { if (el.textContent !== cd) el.textContent = cd; });
      $$(`[data-fpct="${l.id}"]`).forEach((el) => { el.textContent = Math.round(r * 100) + ' %'; });
      $$(`[data-fresh="${l.id}"]`).forEach((el) => {
        el.style.width = (r * 100).toFixed(2) + '%';
        el.className = freshClass(r);
      });
    });
  }

  // ==========================================================
  // MÓDULO 3 · Calculadora de impacto
  // ==========================================================
  // Orden de impacto: agua y CO2 primero. Analogías: familia de 4 bebe 8 L/día (2,920 L/año);
  // Morelia–CDMX ≈ 300 km en auto.
  const METRICAS = [
    { id: 'agua', label: 'Agua que se aprovecha', color: 'var(--agua)', icon: ICON.drop,
      fmt: (v) => (v >= 1e6 ? nf1.format(v / 1e6) + ' M L' : nf0.format(v) + ' L'),
      eq: (v) => (v >= 2920
        ? `Equivale al agua que beben <b>${nf0.format(v / 2920)} familias</b> de 4 en todo un año`
        : `Equivale al agua que bebe una familia de 4 durante <b>${nf0.format(v / 8)} días</b>`) },
    { id: 'co2', label: 'CO₂e que no llega al aire', color: 'var(--hoja)', icon: ICON.leaf,
      fmt: (v) => (v >= 1000 ? nf1.format(v / 1000) + ' t' : nf0.format(v) + ' kg'),
      eq: (v) => (v >= CO2_POR_KM_AUTO * 300
        ? `Como evitar <b>${nf0.format(v / (CO2_POR_KM_AUTO * 300))} viajes</b> en auto de Morelia a la CDMX`
        : `Como dejar el auto en casa durante <b>${nf0.format(v / CO2_POR_KM_AUTO)} km</b>`) },
    { id: 'comidas', label: 'Platos de comida para Morelia', color: 'var(--chile)', icon: ICON.bowl,
      fmt: (v) => nf0.format(v),
      eq: (v) => (v >= 12
        ? `Para que <b>${nf0.format(v / 12)} familias</b> de 4 coman bien todo un día`
        : `<b>${nf0.format(v)} platos</b> servidos con dignidad`) },
    { id: 'kg', label: 'Alimento salvado de la basura', color: 'var(--esmeralda)', icon: ICON.basket,
      fmt: (v) => nf0.format(v) + ' kg',
      eq: (v) => `≈ <b>${nf0.format(v / 20)} cajas</b> de 20 kg que no llegan al tiradero` },
    { id: 'mxn', label: 'Dinero que recuperan los puestos', color: 'var(--mango)', icon: ICON.coin,
      fmt: (v) => money.format(v),
      eq: (v, c) => `≈ <b>${money.format(v / c.puestos)}</b> que regresan a cada puesto` }
  ];

  // Siguiente hito en la serie 1 · 2.5 · 5 × 10^n
  function siguienteHito(v) {
    if (v < 1) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 2.5, 5, 10]) if (m * p > v) return m * p;
    return 10 * p;
  }

  function initCalc() {
    const inputs = { kg: $('#cKg'), pct: $('#cPct'), precio: $('#cPrecio'), puestos: $('#cPuestos') };
    let periodo = 'mes';

    $('#metrics').innerHTML = METRICAS.map((m) => `<div class="metric">
        <div class="metric-head">
          <span class="metric-ico" style="background:${m.color}">${m.icon}</span>
          <span class="metric-label">${m.label}</span>
          <span class="metric-val" id="mv-${m.id}">0</span>
        </div>
        <div class="mbar" aria-hidden="true"><span id="mb-${m.id}" style="background:${m.color};width:0"></span></div>
        <div class="metric-foot"><span id="me-${m.id}"></span><span id="mh-${m.id}"></span></div>
      </div>`).join('');

    const fill = (el) => {
      const p = ((el.value - el.min) / (el.max - el.min)) * 100;
      el.style.setProperty('--p', p + '%');
    };

    function calc() {
      const c = {
        kg: +inputs.kg.value, pct: +inputs.pct.value, precio: +inputs.precio.value, puestos: +inputs.puestos.value
      };
      Object.values(inputs).forEach(fill);
      $('#cKgOut').textContent = c.kg + ' kg';
      $('#cPctOut').textContent = c.pct + ' %';
      $('#cPrecioOut').textContent = money.format(c.precio);
      $('#cPuestosOut').textContent = c.puestos;

      const semanas = periodo === 'mes' ? SEMANAS_MES : 52;
      const kg = c.kg * c.puestos * (c.pct / 100) * semanas;
      const v = {
        kg,
        mxn: kg * c.precio,
        comidas: kg * COMIDAS_POR_KG,
        co2: kg * CO2_POR_KG,
        agua: kg * AGUA_POR_KG
      };
      const txtPeriodo = periodo === 'mes' ? 'al mes' : 'al año';
      $('#calcTitle').textContent = 'Impacto estimado ' + txtPeriodo;
      $('#calcFormula').textContent =
        `${c.kg} kg × ${c.puestos} ${c.puestos === 1 ? 'puesto' : 'puestos'} × ${c.pct} % × ${periodo === 'mes' ? '4.33' : '52'} semanas = ${nf0.format(kg)} kg rescatados ${txtPeriodo}.`;

      METRICAS.forEach((m) => {
        const val = v[m.id];
        const hito = siguienteHito(val);
        $('#mv-' + m.id).textContent = m.fmt(val);
        $('#mb-' + m.id).style.width = Math.min(100, (val / hito) * 100).toFixed(1) + '%';
        $('#me-' + m.id).innerHTML = m.eq(val, c);
        $('#mh-' + m.id).innerHTML = `Próximo hito: <b>${m.fmt(hito)}</b>`;
      });
    }

    Object.values(inputs).forEach((el) => el.addEventListener('input', calc));

    const segBtns = $$('#periodoSeg [data-periodo]');
    const setPeriodo = (btn, focus) => {
      periodo = btn.dataset.periodo;
      segBtns.forEach((b) => { const on = b === btn; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
      if (focus) btn.focus();
      calc();
    };
    segBtns.forEach((b, i) => {
      b.addEventListener('click', () => setPeriodo(b));
      b.addEventListener('keydown', (e) => {
        if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
        e.preventDefault();
        setPeriodo(segBtns[(i + 1) % segBtns.length], true);
      });
    });

    calc();
  }

  // ==========================================================
  // MÓDULO 4 · Aliados solidarios
  // Los aportes no van a comerciantes ni a familias: cubren lo que
  // cuesta mantener la plataforma en línea (servidor, avisos, dominio, mejoras).
  // ==========================================================
  const META_MES = 1500;            // costo mensual estimado de la plataforma (supuesto del equipo)
  const COSTO_DIA = META_MES / 30;  // $50 = un día de Food Place en línea
  const NIVELES = {
    semilla: { nombre: 'Semilla', monto: 50 },
    raiz: { nombre: 'Raíz', monto: 250 },
    arbol: { nombre: 'Árbol', monto: 750 }
  };
  const MURO_LUGARES = 6;

  const diasTxt = (monto) => {
    const d = Math.round((monto / COSTO_DIA) * 10) / 10;
    return `${nf1.format(d)} ${d === 1 ? 'día' : 'días'}`;
  };
  const iniciales = (nombre) => nombre.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => Array.from(w)[0]).join('').toUpperCase();

  function renderAliados() {
    const total = state.aliados.reduce((a, x) => a + NIVELES[x.nivel].monto, 0);
    $('#allyMonto').textContent = money.format(total);
    $('#allyMeta').textContent = money.format(META_MES);
    $('#allyBar').style.width = Math.min(100, (total / META_MES) * 100) + '%';
    $('#allyDias').innerHTML = total === 0
      ? `Sé el primer aliado: cada ${money.format(COSTO_DIA)} mantienen Food Place en línea un día completo.`
      : total >= META_MES
        ? '<b>¡Meta cubierta!</b> Food Place tiene asegurado todo el mes en línea.'
        : `Con lo reunido, Food Place tiene asegurados <b>${diasTxt(total)}</b> de este mes. Faltan ${money.format(META_MES - total)}.`;

    // Los aliados Árbol van primero; después, del más reciente al más antiguo.
    const lista = state.aliados.slice().sort((a, b) => ((b.nivel === 'arbol') - (a.nivel === 'arbol')) || b.t - a.t);
    $('#allyCount').textContent = lista.length;
    const llenos = lista.map((x) => `<li class="${x.nivel === 'arbol' ? 'is-arbol' : ''}">
        <div class="ally-slot ally-slot--${x.nivel}${x.fresh ? ' is-fresh' : ''}">
          <span class="ally-ini" aria-hidden="true">${esc(iniciales(x.nombre))}</span>
          <span><b>${esc(x.nombre)}</b><small>Aliado ${NIVELES[x.nivel].nombre} · ${x.freq === 'mes' ? 'cada mes' : 'aporte único'}</small></span>
        </div>
      </li>`);
    const vacios = Array.from({ length: Math.max(1, MURO_LUGARES - lista.length) }, (_, i) => `<li${i >= 2 ? ' class="is-extra"' : ''}>
        <button type="button" class="ally-slot ally-empty" data-ally="semilla" data-fk="ally-empty-${i}">
          <span class="ally-ini" aria-hidden="true">+</span>
          <span><b>Tu nombre aquí</b><small>Lugar disponible</small></span>
        </button>
      </li>`);
    $('#allyWall').innerHTML = llenos.concat(vacios).join('');
    state.aliados.forEach((x) => { x.fresh = false; });
  }

  let allyNivel = 'raiz';
  let allyReturn = null;

  const allyFreq = () => ($('input[name="allyFreq"]:checked') || {}).value || 'mes';

  function allyResumen() {
    const n = NIVELES[allyNivel];
    $('#allyResumen').innerHTML = allyFreq() === 'mes'
      ? `<b>${money.format(n.monto)} cada mes</b> · mantienen Food Place en línea ${diasTxt(n.monto)} al mes.`
      : `<b>${money.format(n.monto)} una sola vez</b> · mantienen Food Place en línea ${diasTxt(n.monto)}.`;
  }

  function openAlly(nivel, opener) {
    allyNivel = NIVELES[nivel] ? nivel : 'raiz';
    allyReturn = opener || null;
    $$('input[name="allyNivel"]').forEach((r) => { r.checked = r.value === allyNivel; });
    $('#allyError').hidden = true;
    $('#allyForm').hidden = false;
    $('#allyDone').hidden = true;
    $('#allyConfetti').innerHTML = '';
    allyResumen();

    const modal = $('#allyModal');
    const card = $('.reward-card', modal);
    card.classList.remove('is-settled');
    modal.hidden = false;
    document.documentElement.classList.add('no-scroll');
    setTimeout(() => card.classList.add('is-settled'), 800);
    // Foco en el nivel elegido (no en el texto, para no abrir el teclado del celular de golpe)
    const sel = $('input[name="allyNivel"]:checked');
    if (sel) sel.focus({ preventScroll: true });
  }

  function closeAlly() {
    const modal = $('#allyModal');
    if (modal.hidden) return;
    modal.hidden = true;
    document.documentElement.classList.remove('no-scroll');
    $('#allyConfetti').innerHTML = '';
    if (allyReturn && document.contains(allyReturn)) allyReturn.focus({ preventScroll: true });
    allyReturn = null;
  }

  function initAliados() {
    $('#allyNivel').innerHTML = Object.keys(NIVELES).map((k) =>
      `<label class="chip"><input type="radio" name="allyNivel" value="${k}"><span>${NIVELES[k].nombre} · ${money.format(NIVELES[k].monto)}</span></label>`
    ).join('');
    $('#allyNivel').addEventListener('change', (e) => { allyNivel = e.target.value; allyResumen(); });
    $$('input[name="allyFreq"]').forEach((r) => r.addEventListener('change', allyResumen));

    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ally]');
      if (b) openAlly(b.dataset.ally, b);
    });

    const modal = $('#allyModal');
    modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-ally]')) closeAlly();
    });
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeAlly(); return; }
      if (e.key !== 'Tab') return;
      // Mantiene el foco dentro del modal (solo elementos visibles)
      const f = $$('button, input', modal).filter((el) => el.getClientRects().length);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    $('#allyForm').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const input = $('#allyNombre');
      const err = $('#allyError');
      const nombre = input.value.trim().replace(/\s+/g, ' ');
      if (nombre.length < 2) {
        err.textContent = 'Escribe tu nombre o el de tu negocio para aparecer en el muro.';
        err.hidden = false;
        input.focus();
        return;
      }
      err.hidden = true;

      const n = NIVELES[allyNivel];
      const freq = allyFreq();
      state.aliados.push({ nombre, nivel: allyNivel, freq, t: Date.now(), fresh: true });
      addFeed('aliado', `<b>${esc(nombre)}</b> se sumó como Aliado ${n.nombre}`);
      renderAll();

      $('#allyDoneKicker').textContent = `Aporte simulado · Aliado ${n.nombre}`;
      $('#allyDoneTitle').textContent = `¡Gracias, ${nombre}!`;
      $('#allyDoneMsg').textContent = freq === 'mes'
        ? `Con ${money.format(n.monto)} al mes, Food Place sigue en línea ${diasTxt(n.monto)} cada mes, gratis para comerciantes y familias. Ya apareces en el muro de aliados.`
        : `Con tu aporte de ${money.format(n.monto)}, Food Place sigue en línea ${diasTxt(n.monto)} más, gratis para comerciantes y familias. Ya apareces en el muro de aliados.`;
      input.value = '';
      $('#allyForm').hidden = true;
      $('#allyDone').hidden = false;
      lanzarConfeti($('#allyConfetti'));
      $('#allyDoneBtn').focus({ preventScroll: true });
    });

    $('#allyDoneBtn').addEventListener('click', () => {
      allyReturn = null;
      closeAlly();
      $('#allyWall').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
  }

  // ---------- Arranque ----------
  seed();
  initForm();
  initTabs();
  initEvents();
  initReward();
  initCalc();
  initAliados();
  renderAll();
  setInterval(tick, 1000);
})();
