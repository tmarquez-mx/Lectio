/* Vista semanal de Lectio (solo lectura). Recibe los datos en window.arguments[0]. */
(function () {
  const data = window.arguments && window.arguments[0];
  const bloques = (data && data.bloques) || [];
  const dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const p = n => String(n).padStart(2, "0");
  const fecha = d => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const lunes = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };

  let inicioSemana = lunes(new Date());
  if (!bloques.some(b => { const t = new Date(b.inicio); return t >= inicioSemana && t < new Date(inicioSemana.getTime() + 7 * 864e5); })
      && data && data.quincena) {
    inicioSemana = lunes(new Date(data.quincena.inicio + "T00:00"));
  }

  function rangoHoras() {
    let min = 24, max = 0;
    for (const b of bloques) {
      min = Math.min(min, new Date(b.inicio).getHours());
      max = Math.max(max, Math.ceil(new Date(b.fin).getHours() + new Date(b.fin).getMinutes() / 60));
    }
    if (min >= max) { min = 8; max = 20; }
    return [Math.max(0, min - 1), Math.min(24, max + 1)];
  }

  function dibujar() {
    const [h0, h1] = rangoHoras();
    const g = document.getElementById("grid");
    g.replaceChildren();
    const el = (cls, txt) => { const e = document.createElement("div"); e.className = cls; if (txt) e.textContent = txt; return e; };
    g.append(el("h"));
    const hoy = fecha(new Date());
    const fechas = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(inicioSemana.getTime() + i * 864e5);
      fechas.push(fecha(d));
      g.append(el("h" + (fecha(d) === hoy ? " hoy" : ""), `${dias[i]} ${d.getDate()}`));
    }
    // Franjas: cada lectura abarca desde su primera sesión hasta el día
    // anterior a la siguiente lectura (o al bloque de escritura).
    const inicios = {};
    for (const b of bloques) {
      const k = b.lectura || "escritura:" + b.inicio;
      const t = new Date(b.inicio);
      if (!inicios[k] || t < inicios[k].t) inicios[k] = { t, b };
    }
    const orden = Object.values(inicios).sort((x, y) => x.t - y.t);
    const finQuincena = data && data.quincena && data.quincena.fin ? new Date(data.quincena.fin + "T23:59") : null;
    const finSemana = new Date(inicioSemana.getTime() + 7 * 864e5);
    const soloDia = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dia = d => Math.round((soloDia(d) - inicioSemana) / 864e5);
    let filas = 0;
    orden.forEach((o, i) => {
      if (!o.b.lectura) return;
      const ini = soloDia(o.t);
      let fin;
      if (orden[i + 1]) fin = new Date(soloDia(orden[i + 1].t).getTime() - 864e5);
      else fin = finQuincena ? soloDia(finQuincena) : ini;
      if (fin < ini) fin = ini;
      if (fin < inicioSemana || ini >= finSemana) return;
      const antes = ini < inicioSemana, despues = fin >= finSemana;
      const desde = antes ? 0 : dia(ini);
      const hasta = despues ? 6 : dia(fin);
      g.append(el("hr", filas ? "" : "Lecturas"));
      const barra = el("arco", `${antes ? "… " : ""}${o.b.titulo}`);
      barra.style.gridColumn = `${2 + desde} / ${3 + hasta}`;
      barra.title = o.b.titulo;
      g.append(barra);
      filas++;
    });
    for (let h = h0; h < h1; h++) {
      g.append(el("hr", `${p(h)}:00`));
      for (let i = 0; i < 7; i++) {
        const celda = el("s");
        for (const b of bloques) {
          const ini = new Date(b.inicio), fin = new Date(b.fin);
          if (fecha(ini) !== fechas[i] || ini.getHours() !== h) continue;
          const dur = (fin - ini) / 36e5;
          const div = el(`b ${b.funcion} ${b.estado === "leida" ? "leida" : ""}`, b.titulo + (b.parte ? ` (${b.parte})` : ""));
          div.style.top = (2 + ini.getMinutes() / 60 * 40) + "px";
          div.style.height = (dur * 40 - 4) + "px";
          div.addEventListener("click", () => {
            document.getElementById("info").textContent =
              `${b.titulo}${b.parte ? " (" + b.parte + ")" : ""} · ${b.funcion} · ${b.pregunta || ""}`;
          });
          celda.append(div);
        }
        g.append(celda);
      }
    }
    const fin = new Date(inicioSemana.getTime() + 6 * 864e5);
    document.getElementById("titulo").textContent =
      `Plan de lectura · ${inicioSemana.getDate()}/${inicioSemana.getMonth() + 1} al ${fin.getDate()}/${fin.getMonth() + 1}`;
  }

  document.getElementById("prev").addEventListener("click", () => { inicioSemana = new Date(inicioSemana.getTime() - 7 * 864e5); dibujar(); });
  document.getElementById("next").addEventListener("click", () => { inicioSemana = new Date(inicioSemana.getTime() + 7 * 864e5); dibujar(); });
  document.getElementById("hoy").addEventListener("click", () => { inicioSemana = lunes(new Date()); dibujar(); });
  dibujar();
})();
