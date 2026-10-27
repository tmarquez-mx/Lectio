/* global Zotero, ChromeUtils, Services, PathUtils */
/*
 * Lectio: plan de lectura quincenal en Zotero.
 * Zotero es la única fuente de verdad del plan. Flujo en un solo sentido:
 * skill (JSON) -> Lectio (Zotero) -> calendario personal (.ics regenerado).
 */
var Lectio = {
  id: null, version: null, rootURI: null,
  store: { version: 1, quincenas: [] },
  storePath: null,
  noteID: null,
  saving: false,
  observerID: null,
  FUNCIONES: ["Mapa", "Núcleo", "Método", "Periferia", "Por definir"],
  addedElementIDs: [],
  sectionKey: null,
  columnKeys: [],

  AYUDA: {
    "Mapa": "Mapa: ofrece panorama del campo (revisión, estado del arte o texto introductorio). Conviene leerla primero.",
    "Núcleo": "Núcleo: aborda directamente el problema, los conceptos o el objeto de tu investigación.",
    "Método": "Método: útil sobre todo por su diseño, técnicas o fuentes.",
    "Periferia": "Periferia: se relaciona de manera lateral con tu pregunta; puede esperar.",
    "Por definir": "Por definir: sin resumen; no se clasificó para no adivinar su contenido.",
    "programada": "Programada: tiene sesiones en esta quincena.",
    "pendiente": "Pendiente: sigue en la jerarquía, pero no cupo en el número de lecturas que elegiste.",
    "reserva": "Reserva: más abajo en la jerarquía; no se prevé leerla pronto.",
    "verificar": "Verificar: datos incompletos o dudosos; confirma que la obra existe antes de leerla o citarla.",
    "leida": "Leída: la marcaste como terminada.",
    "a_medias": "A medias: la empezaste; tendrá prioridad en la siguiente quincena."
  },

  ESTADOS: {
    programada: "Programada", pendiente: "Pendiente", reserva: "Reserva",
    verificar: "Verificar", leida: "Leída", a_medias: "A medias"
  },

  async init({ id, version, rootURI }) {
    this.id = id; this.version = version; this.rootURI = rootURI;
    this.storePath = PathUtils.join(Zotero.DataDirectory.dir, "lectio.json");
    await this.loadStore();
    await this.registerColumns();
    this.registerSection();
    // Si la nota de datos cambia (por ejemplo, al sincronizar desde otra computadora), se recarga.
    this.observerID = Zotero.Notifier.registerObserver({
      notify: async (event, type, ids) => {
        if (this.saving || !this.noteID) return;
        if (["modify", "add"].includes(event) && ids.includes(this.noteID)) {
          await this.loadStore();
          Zotero.ItemTreeManager.refreshColumns();
        }
      }
    }, ["item"], "lectio");
  },

  shutdown() {
    for (let win of Zotero.getMainWindows()) this.removeFromWindow(win);
    if (this.sectionKey) Zotero.ItemPaneManager.unregisterSection(this.sectionKey);
    for (let k of this.columnKeys) Zotero.ItemTreeManager.unregisterColumn(k);
    if (this.observerID) Zotero.Notifier.unregisterObserver(this.observerID);
  },

  // ---------- Almacenamiento (en una nota de Zotero, para que se sincronice) ----------
  async notaDatos() {
    const libraryID = Zotero.Libraries.userLibraryID;
    if (this.noteID) {
      const n = Zotero.Items.get(this.noteID);
      if (n && !n.deleted) return n;
    }
    const s = new Zotero.Search();
    s.libraryID = libraryID;
    s.addCondition("itemType", "is", "note");
    s.addCondition("tag", "is", "lectio/datos");
    const ids = await s.search();
    if (ids.length) { this.noteID = ids[0]; return Zotero.Items.get(ids[0]); }
    return null;
  },

  async loadStore() {
    try {
      const nota = await this.notaDatos();
      if (nota) {
        const html = nota.getNote();
        const m = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
        if (m) {
          const txt = m[1].replace(/<br\s*\/?>/g, "\n").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
          this.store = JSON.parse(txt);
          return;
        }
      }
      // Migración desde versiones anteriores (archivo local).
      if (await IOUtils.exists(this.storePath)) {
        this.store = JSON.parse(await Zotero.File.getContentsAsync(this.storePath));
        await this.saveStore();
      }
    } catch (e) { Zotero.logError(e); }
  },

  async saveStore() {
    const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = "<h1>Lectio · datos del plan (no editar)</h1>"
      + "<p>Esta nota guarda tu plan de lectura para que se sincronice entre computadoras. No la modifiques ni la borres.</p>"
      + "<pre>" + esc(JSON.stringify(this.store)) + "</pre>";
    this.saving = true;
    try {
      let nota = await this.notaDatos();
      if (!nota) {
        nota = new Zotero.Item("note");
        nota.libraryID = Zotero.Libraries.userLibraryID;
        nota.addTag("lectio/datos");
        const padre = await this.coleccionPadre(nota.libraryID);
        nota.setCollections([padre.id]);
      }
      nota.setNote(html);
      await nota.saveTx();
      this.noteID = nota.id;
    } finally {
      this.saving = false;
    }
  },

  quincenaActual() {
    const q = this.store.quincenas;
    return q.length ? q[q.length - 1] : null;
  },

  lecturaDe(item) {
    const q = this.quincenaActual();
    if (!q || !item) return null;
    return q.lecturas.find(l => l.zotero_key === item.key && l.libraryID === item.libraryID) || null;
  },

  // ---------- Interfaz: menú ----------
  addToWindow(win) {
    const doc = win.document;
    win.MozXULElement.insertFTLIfNeeded("lectio.ftl");
    const popup = doc.getElementById("menu_ToolsPopup");
    if (!popup) return;
    const sep = doc.createXULElement("menuseparator");
    sep.id = "lectio-sep";
    popup.appendChild(sep);
    const menu = doc.createXULElement("menu");
    menu.id = "lectio-menu";
    menu.setAttribute("label", "Lectio");
    const mp = doc.createXULElement("menupopup");
    const items = [
      ["Importar plan de la skill…", () => this.importarPlan(win)],
      ["Vista semanal", () => this.abrirSemana(win)],
      ["Exportar calendario (.ics)…", () => this.exportarICS(win)],
      ["Exportar estado para la skill…", () => this.exportarEstado(win)],
      ["Historial de la pregunta", () => this.historialPregunta(win)]
    ];
    for (let [label, fn] of items) {
      const mi = doc.createXULElement("menuitem");
      mi.setAttribute("label", label);
      mi.addEventListener("command", fn);
      mp.appendChild(mi);
    }
    menu.appendChild(mp);
    popup.appendChild(menu);
    this.addedElementIDs.push("lectio-sep", "lectio-menu");
  },

  removeFromWindow(win) {
    for (let id of this.addedElementIDs) win.document.getElementById(id)?.remove();
  },

  alert(win, msg) { Services.prompt.alert(win, "Lectio", msg); },

  async pickFile(win, mode, title, defaultName) {
    const { FilePicker } = ChromeUtils.importESModule("chrome://zotero/content/modules/filePicker.mjs");
    const fp = new FilePicker();
    fp.init(win, title, mode === "save" ? fp.modeSave : fp.modeOpen);
    if (mode === "save") {
      fp.defaultString = defaultName;
    } else {
      fp.appendFilter("JSON", "*.json");
    }
    const rv = await fp.show();
    if (rv === fp.returnOK || rv === fp.returnReplace) return fp.file;
    return null;
  },

  // ---------- Importar ----------
  async importarPlan(win) {
    const path = await this.pickFile(win, "open", "Selecciona el plan generado por la skill");
    if (!path) return;
    let plan;
    try { plan = JSON.parse(await Zotero.File.getContentsAsync(path)); }
    catch (e) { return this.alert(win, "El archivo no es un JSON válido."); }
    if (!plan.lectio || !Array.isArray(plan.lecturas)) {
      return this.alert(win, "El archivo no tiene el formato de Lectio (faltan \"lectio\" o \"lecturas\").");
    }

    const libraryID = Zotero.Libraries.userLibraryID;
    const etiqueta = plan.quincena.etiqueta || plan.quincena.inicio;
    const coleccion = await this.asegurarColeccion(libraryID, `${etiqueta} · ${plan.quincena.inicio}`);
    const reserva = await this.asegurarColeccion(libraryID, "Reserva");
    const siguientes = await this.asegurarColeccion(libraryID, "Siguientes");

    const sinCoincidencia = [];
    const lecturas = [];
    for (let l of plan.lecturas) {
      const item = await this.buscarItem(libraryID, l);
      if (!item) { sinCoincidencia.push(l.titulo || l.zotero_key || "(sin título)"); continue; }
      // Etiquetas: se reemplazan las de Lectio, las del estudiante no se tocan.
      for (let t of item.getTags()) {
        if (t.tag.startsWith("lectura/") || t.tag.startsWith("estado/")) item.removeTag(t.tag);
      }
      item.addTag("lectura/" + this.slug(l.funcion));
      item.addTag("estado/" + l.estado);
      // La quincena muestra solo lo programado; lo demás va a Siguientes o Reserva.
      for (const c of [coleccion, reserva, siguientes]) item.removeFromCollection(c.id);
      const destino = l.estado === "pendiente" ? siguientes
        : ["reserva", "verificar"].includes(l.estado) ? reserva : coleccion;
      item.addToCollection(destino.id);
      await item.saveTx();
      lecturas.push(Object.assign({}, l, {
        zotero_key: item.key, libraryID: item.libraryID, util: false,
        original_skill: { funcion: l.funcion, justificacion: l.justificacion, pregunta_guia: l.pregunta_guia }
      }));
    }

    this.store.quincenas.push({
      quincena: plan.quincena, pregunta: plan.pregunta || null,
      zona_horaria: plan.zona_horaria || "America/Mexico_City",
      lecturas, escritura: plan.escritura || [], importado: new Date().toISOString()
    });
    await this.saveStore();
    Zotero.ItemTreeManager.refreshColumns();

    const prog = lecturas.filter(l => l.estado === "programada").length;
    let msg = `Plan importado: ${prog} lecturas programadas en "${coleccion.name}"; las siguientes en la jerarquía están en "Siguientes" y el resto en "Reserva".`;
    if (sinCoincidencia.length) {
      msg += `\n\nNo encontré en tu biblioteca:\n- ${sinCoincidencia.join("\n- ")}\n\nAgrégalas a Zotero y vuelve a importar el plan.`;
    }
    this.alert(win, msg);
  },

  async buscarItem(libraryID, l) {
    if (l.zotero_key) {
      const it = Zotero.Items.getByLibraryAndKey(libraryID, l.zotero_key);
      if (it) return it;
    }
    for (let [campo, valor] of [["DOI", l.doi], ["title", l.titulo]]) {
      if (!valor) continue;
      const s = new Zotero.Search();
      s.libraryID = libraryID;
      s.addCondition(campo, "is", valor);
      const ids = await s.search();
      if (ids.length === 1) return Zotero.Items.get(ids[0]);
    }
    return null;
  },

  async coleccionPadre(libraryID) {
    let padre = Zotero.Collections.getByLibrary(libraryID).find(c => c.name === "Plan de lectura" && !c.parentID);
    if (!padre) {
      padre = new Zotero.Collection({ name: "Plan de lectura", libraryID });
      await padre.saveTx();
    }
    return padre;
  },

  async asegurarColeccion(libraryID, nombre) {
    const padre = await this.coleccionPadre(libraryID);
    let hija = Zotero.Collections.getByParent(padre.id).find(c => c.name === nombre);
    if (!hija) {
      hija = new Zotero.Collection({ name: nombre, libraryID, parentID: padre.id });
      await hija.saveTx();
    }
    return hija;
  },

  slug(s) {
    return (s || "por definir").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
  },

  // ---------- Estado ----------
  async cambiarEstado(item, estado) {
    const l = this.lecturaDe(item);
    if (!l) return;
    l.estado = estado;
    for (let t of item.getTags()) if (t.tag.startsWith("estado/")) item.removeTag(t.tag);
    item.addTag("estado/" + estado);
    await item.saveTx();
    await this.saveStore();
    Zotero.ItemTreeManager.refreshColumns();
  },

  async alternarUtil(item) {
    const l = this.lecturaDe(item);
    if (!l) return;
    l.util = !l.util;
    await this.saveStore();
  },

  async reprogramar(item, indice, nuevoInicio) {
    const l = this.lecturaDe(item);
    if (!l || !l.sesiones[indice]) return;
    const s = l.sesiones[indice];
    const dur = new Date(s.fin) - new Date(s.inicio);
    const ini = new Date(nuevoInicio);
    const fin = new Date(ini.getTime() + dur);
    const fmt = d => {
      const p = n => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
    };
    s.inicio = fmt(ini); s.fin = fmt(fin);
    await this.saveStore();
  },

  async guardarCampos(item, cambios) {
    const l = this.lecturaDe(item);
    if (!l) return;
    l.original_skill = l.original_skill || { funcion: l.funcion, justificacion: l.justificacion, pregunta_guia: l.pregunta_guia };
    Object.assign(l, cambios);
    // Registro de ajustes del estudiante respecto de la propuesta de la skill.
    l.ajustes = {};
    for (const k of ["funcion", "justificacion", "pregunta_guia"]) {
      if ((l[k] || "") !== (l.original_skill[k] || "")) l.ajustes[k] = { skill: l.original_skill[k] || "", estudiante: l[k] || "" };
    }
    for (let t of item.getTags()) if (t.tag.startsWith("lectura/")) item.removeTag(t.tag);
    item.addTag("lectura/" + this.slug(l.funcion));
    await item.saveTx();
    await this.saveStore();
    Zotero.ItemTreeManager.refreshColumns();
  },

  notaLecturaDe(item) {
    for (const id of item.getNotes()) {
      const n = Zotero.Items.get(id);
      if (n && n.hasTag("lectio/nota")) return n;
    }
    return null;
  },

  async abrirNotaLectura(item) {
    const l = this.lecturaDe(item);
    let nota = this.notaLecturaDe(item);
    if (!nota) {
      const esc = t => (t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      nota = new Zotero.Item("note");
      nota.libraryID = item.libraryID;
      nota.parentID = item.id;
      nota.addTag("lectio/nota");
      nota.setNote(
        "<h2>Nota de lectura (Lectio)</h2>"
        + `<p><strong>Pregunta guía:</strong> ${esc(l && l.pregunta_guia) || "-"}</p>`
        + "<p><strong>Qué encontré:</strong> </p>"
        + "<p><strong>Cómo se relaciona con mi pregunta de investigación:</strong> </p>"
        + "<p><strong>Qué me queda pendiente o en duda:</strong> </p>");
      await nota.saveTx();
    }
    Zotero.getActiveZoteroPane().selectItem(nota.id);
  },

  textoNota(item) {
    const n = this.notaLecturaDe(item);
    if (!n) return "";
    return Zotero.Utilities.unescapeHTML(n.getNote()).trim();
  },

  historialPregunta(win) {
    const versiones = [];
    for (const q of this.store.quincenas) {
      const t = q.pregunta && q.pregunta.texto;
      if (t && (!versiones.length || versiones[versiones.length - 1].texto !== t)) {
        versiones.push({ texto: t, fecha: q.pregunta.fecha || q.quincena.inicio, quincena: q.quincena.etiqueta || q.quincena.inicio });
      }
    }
    if (!versiones.length) return this.alert(win, "Todavía no hay preguntas registradas en tus planes.");
    this.alert(win, "Historial de tu pregunta de investigación\n\n"
      + versiones.map((v, i) => `${i + 1}. ${v.fecha} (${v.quincena})\n${v.texto}`).join("\n\n"));
  },

  // ---------- Columnas ----------
  async registerColumns() {
    const cols = [
      ["lectio-prioridad", "Prio.", l => (l.prioridad ?? "-").toString(), l => "Posición en la jerarquía según tu pregunta de investigación"],
      ["lectio-funcion", "Función", l => l.funcion || "", l => this.AYUDA[l.funcion] || ""],
      ["lectio-estado", "Estado", l => this.ESTADOS[l.estado] || l.estado || "", l => this.AYUDA[l.estado] || ""]
    ];
    for (let [dataKey, label, fn, ayuda] of cols) {
      const key = await Zotero.ItemTreeManager.registerColumn({
        dataKey, label, pluginID: this.id,
        dataProvider: (item) => {
          const l = this.lecturaDe(item);
          // Se codifica el texto y su ayuda para recuperarla al dibujar la celda.
          return l ? fn(l) : "";
        },
      });
      if (key) this.columnKeys.push(key);
    }
  },

  // ---------- Panel lateral ----------
  registerSection() {
    this.sectionKey = Zotero.ItemPaneManager.registerSection({
      paneID: "lectio-plan",
      pluginID: this.id,
      header: { l10nID: "lectio-section-header", icon: this.rootURI + "icon.svg" },
      sidenav: { l10nID: "lectio-section-sidenav", icon: this.rootURI + "icon.svg" },
      onRender: ({ body, item }) => this.renderSection(body, item)
    });
  },

  renderSection(body, item) {
    const doc = body.ownerDocument;
    const h = (tag, text, style) => {
      const e = doc.createElementNS("http://www.w3.org/1999/xhtml", tag);
      if (text != null) e.textContent = text;
      if (style) e.setAttribute("style", style);
      return e;
    };
    body.replaceChildren();
    const l = this.lecturaDe(item);
    if (!l) {
      body.append(h("div", "Esta referencia no está en el plan de la quincena actual.", "color:GrayText"));
      return;
    }
    const etiqueta = t => body.append(h("div", t, "color:GrayText;font-size:0.9em;margin-top:6px"));
    const ayuda = t => { if (t) body.append(h("div", t.split(": ").slice(1).join(": "), "color:GrayText;font-size:0.85em")); };

    etiqueta("Función");
    const sel = h("select");
    for (const f of this.FUNCIONES) {
      const o = h("option", f);
      o.value = f;
      if (f === l.funcion) o.selected = true;
      sel.append(o);
    }
    body.append(sel);
    ayuda(this.AYUDA[l.funcion]);

    etiqueta("Justificación");
    const just = h("textarea", null, "width:100%;box-sizing:border-box");
    just.setAttribute("rows", "2");
    just.value = l.justificacion || "";
    body.append(just);

    etiqueta("Pregunta guía");
    const preg = h("textarea", null, "width:100%;box-sizing:border-box");
    preg.setAttribute("rows", "2");
    preg.value = l.pregunta_guia || "";
    body.append(preg);

    const guardar = h("button", "Guardar cambios", "margin-top:4px");
    guardar.addEventListener("click", async () => {
      await this.guardarCampos(item, { funcion: sel.value, justificacion: just.value.trim(), pregunta_guia: preg.value.trim() });
      this.renderSection(body, item);
    });
    body.append(guardar);
    if (l.ajustes && Object.keys(l.ajustes).length) {
      body.append(h("div", "Ajustaste la propuesta de la skill en: " + Object.keys(l.ajustes)
        .map(k => ({ funcion: "función", justificacion: "justificación", pregunta_guia: "pregunta guía" }[k])).join(", ") + ".",
        "color:GrayText;font-size:0.85em;margin-top:2px"));
    }

    etiqueta("Estado");
    body.append(h("div", (this.ESTADOS[l.estado] || l.estado) + (l.util ? " · marcada como útil" : "")));
    ayuda(this.AYUDA[l.estado]);

    body.append(h("div", "Sesiones", "color:GrayText;font-size:0.9em;margin-top:6px"));
    (l.sesiones || []).forEach((s, i) => {
      const fila = h("div", null, "display:flex;gap:4px;align-items:center;margin-top:2px");
      const inp = h("input");
      inp.setAttribute("type", "datetime-local");
      inp.value = s.inicio;
      const btn = h("button", "Reprogramar");
      btn.addEventListener("click", async () => {
        await this.reprogramar(item, i, inp.value);
        this.renderSection(body, item);
      });
      fila.append(h("span", s.parte ? `(${s.parte})` : ""), inp, btn);
      body.append(fila);
    });

    const acciones = h("div", null, "display:flex;gap:4px;flex-wrap:wrap;margin-top:8px");
    for (let [estado, label] of [["leida", "Leída"], ["a_medias", "A medias"], ["pendiente", "Pendiente"]]) {
      const b = h("button", label);
      b.addEventListener("click", async () => {
        await this.cambiarEstado(item, estado);
        if (estado === "leida" && !this.notaLecturaDe(item)) await this.abrirNotaLectura(item);
        else this.renderSection(body, item);
      });
      acciones.append(b);
    }
    const bu = h("button", l.util ? "Quitar «útil»" : "Útil");
    bu.addEventListener("click", async () => { await this.alternarUtil(item); this.renderSection(body, item); });
    acciones.append(bu);
    const bn = h("button", this.notaLecturaDe(item) ? "Ver nota de lectura" : "Nota de lectura");
    bn.addEventListener("click", () => this.abrirNotaLectura(item));
    acciones.append(bn);
    body.append(acciones);
  },

  // ---------- Vista semanal (solo consulta) ----------
  bloques() {
    const q = this.quincenaActual();
    if (!q) return [];
    const out = [];
    for (let l of q.lecturas) {
      (l.sesiones || []).forEach((s, i) => {
        out.push({ uid: `${l.zotero_key || this.slug(l.titulo)}-${i}`, lectura: l.zotero_key || this.slug(l.titulo), titulo: `${l.autoria || ""} (${l.anio || "s. f."})`.trim(), parte: s.parte || "",
          funcion: l.funcion, pregunta: l.pregunta_guia, inicio: s.inicio, fin: s.fin, estado: l.estado });
      });
    }
    q.escritura.forEach((e, i) => out.push({ uid: `escritura-${i}`, titulo: e.titulo, parte: "", funcion: "Escritura", pregunta: e.descripcion || "", inicio: e.inicio, fin: e.fin, estado: "" }));
    return out;
  },

  abrirSemana(win) {
    const q = this.quincenaActual();
    if (!q) return this.alert(win, "Primero importa un plan.");
    const datos = { quincena: q.quincena, bloques: this.bloques() };
    if (!datos.bloques.length) {
      return this.alert(win, "El plan de esta quincena no tiene sesiones programadas.");
    }
    try {
      const w = win.openDialog("chrome://lectio/content/semana.xhtml", "lectio-semana",
        "chrome,centerscreen,resizable,width=960,height=600", datos);
      if (!w) throw new Error("La ventana no se abrió");
    } catch (e) {
      Zotero.logError(e);
      this.alert(win, "No pude abrir la vista semanal: " + e.message);
    }
  },

  // ---------- Exportar .ics ----------
  ics() {
    const q = this.quincenaActual();
    const tz = q.zona_horaria;
    const esc = t => (t || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    const loc = s => s.replace(/[-:]/g, "") + "00";
    const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const seq = Math.floor(Date.now() / 1000);
    const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Lectio//ES", "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH", "X-WR-CALNAME:Lecturas", `X-WR-TIMEZONE:${tz}`];
    this.bloques().forEach(b => {
      if (b.estado === "leida") return;
      const uid = `${q.quincena.inicio}-${b.uid}@lectio`;
      L.push("BEGIN:VEVENT", `UID:${uid}`, `SEQUENCE:${seq}`, `DTSTAMP:${now}`,
        `DTSTART;TZID=${tz}:${loc(b.inicio)}`, `DTEND;TZID=${tz}:${loc(b.fin)}`,
        `SUMMARY:${esc((b.funcion === "Escritura" ? "" : "Lectura: ") + b.titulo + (b.parte ? ` (${b.parte})` : ""))}`,
        `DESCRIPTION:${esc(`Función: ${b.funcion}. ${b.pregunta}\nGenerado por Lectio. Para cambiar el horario, reprograma en Zotero y vuelve a exportar.`)}`,
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Bloque de lectura", "TRIGGER:-PT15M", "END:VALARM", "END:VEVENT");
    });
    L.push("END:VCALENDAR");
    // Plegado de líneas a 75 octetos (RFC 5545).
    const plegar = linea => {
      const enc = new TextEncoder();
      if (enc.encode(linea).length <= 75) return linea;
      const partes = []; let actual = "";
      for (const c of linea) {
        const lim = partes.length ? 74 : 75;
        if (enc.encode(actual + c).length > lim) { partes.push(actual); actual = ""; }
        actual += c;
      }
      partes.push(actual);
      return partes.join("\r\n ");
    };
    return L.map(plegar).join("\r\n") + "\r\n";
  },

  async exportarICS(win) {
    const q = this.quincenaActual();
    if (!q) return this.alert(win, "Primero importa un plan.");
    const path = await this.pickFile(win, "save", "Guardar calendario", `lecturas-${q.quincena.inicio}.ics`);
    if (!path) return;
    await Zotero.File.putContentsAsync(path, this.ics());
    this.alert(win, "Calendario exportado.\n\nPara actualizarlo sin duplicar eventos: borra el calendario \"Lecturas\" en tu aplicación de calendario y vuelve a importar este archivo. Los cambios de horario se hacen siempre en Zotero.");
  },

  // ---------- Exportar estado para la skill ----------
  async exportarEstado(win) {
    const q = this.quincenaActual();
    if (!q) return this.alert(win, "Primero importa un plan.");
    const path = await this.pickFile(win, "save", "Guardar estado", `lectio-estado-${q.quincena.inicio}.json`);
    if (!path) return;
    const historial = [];
    for (const qq of this.store.quincenas) {
      const t = qq.pregunta && qq.pregunta.texto;
      if (t && (!historial.length || historial[historial.length - 1].texto !== t)) historial.push({ texto: t, fecha: qq.pregunta.fecha || qq.quincena.inicio });
    }
    const estado = {
      lectio: 1, tipo: "estado", quincena: q.quincena, pregunta: q.pregunta, historial_pregunta: historial,
      lecturas: q.lecturas.map(l => {
        const item = Zotero.Items.getByLibraryAndKey(l.libraryID, l.zotero_key);
        return {
          zotero_key: l.zotero_key, autoria: l.autoria, anio: l.anio, titulo: l.titulo,
          funcion: l.funcion, prioridad: l.prioridad, estado: l.estado, util: !!l.util,
          ajustes_del_estudiante: l.ajustes || {},
          nota_de_lectura: item ? this.textoNota(item) : ""
        };
      })
    };
    await Zotero.File.putContentsAsync(path, JSON.stringify(estado, null, 2));
    this.alert(win, "Estado exportado. Adjunta este archivo a la skill al iniciar la siguiente quincena.");
  }
};
