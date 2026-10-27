# Lectio

**Plan de lectura quincenal para tesistas, dentro de Zotero.**

## ⬇️ Instalar o actualizar

### [Descargar Lectio (última versión)](https://github.com/tmarquez-mx/Lectio/raw/main/dist/lectio.xpi)

1. Descarga el archivo con el enlace de arriba. **No le des doble clic**: si el navegador pregunta, elige *guardar*.
2. Abre Zotero (versión 7 o posterior) y ve a **Herramientas › Plugins**.
3. Haz clic en el engrane ⚙️ y elige **Instalar complemento desde archivo…**.
4. Selecciona `lectio.xpi` y reinicia Zotero.

**Actualizaciones:** Zotero las busca solo. Para forzarlo: Herramientas › Plugins › ⚙️ › *Buscar actualizaciones*. También puedes descargar de nuevo el enlace de arriba e instalarlo encima; tu plan no se pierde.

### [Descargar la skill plan-de-lectura para Claude](https://github.com/tmarquez-mx/Lectio/raw/main/dist/plan-de-lectura.zip)

Funciona en Claude, Gemini y ChatGPT, porque los tres usan el formato SKILL.md:

- **Claude:** sube el .zip completo desde la configuración, apartado de capacidades.
- **Gemini:** descomprime el .zip y, en Personalizar › Skills, importa solo el archivo `SKILL.md` (versión web o app para Mac). Requiere cuenta personal de Google; las cuentas escolares todavía no tienen skills.
- **ChatGPT:** sube el `SKILL.md` como skill. Si tu cuenta no tiene la opción, puede estar desactivada por tu plan o tu administrador.

Si el asistente no puede generar el archivo del plan para descargar, lo entregará en un bloque de texto: cópialo y guárdalo con extensión `.json`.

---

## Qué hace

Lectio trabaja junto con la skill **plan-de-lectura**:

1. Importas en Zotero las recomendaciones de tu buscador (Consensus, Undermind…) en RIS o BibTeX.
2. La skill confirma tu pregunta de investigación, te pregunta cuántas lecturas quieres en la quincena, las jerarquiza y entrega un archivo `lectio-plan-AAAA-MM-DD.json`.
3. En Zotero: **Herramientas › Lectio › Importar plan de la skill**.

Con eso, Lectio:

- crea la colección de la quincena (solo lo programado), **Siguientes** y **Reserva**;
- agrega etiquetas `lectura/<función>` y `estado/<estado>`, y las columnas Prio., Función y Estado (clic derecho sobre los encabezados para mostrarlas);
- añade al panel de cada referencia la función, justificación y pregunta guía (editables), las sesiones con botón *Reprogramar* y los botones *Leída*, *A medias*, *Pendiente*, *Útil* y *Nota de lectura*;
- muestra la **Vista semanal**, con flechas que indican el periodo de cada lectura;
- exporta el calendario (`.ics`) para Google Calendar, Outlook o Apple Calendar;
- exporta el **estado** (avance, notas de lectura, ajustes y versiones de la pregunta) para iniciar la siguiente quincena con la skill.

### Principio de diseño

Zotero es la única fuente de verdad. El flujo va en un solo sentido: skill → Lectio → calendario. Los horarios se cambian en Zotero y se vuelve a exportar el calendario; para actualizarlo sin duplicar eventos, borra el calendario "Lecturas" e importa el nuevo archivo.

El plan se guarda en una nota de Zotero con la etiqueta `lectio/datos`, para que se sincronice entre computadoras. No la edites ni la borres.

## Para desarrollo

```
./build.sh        # genera lectio.xpi y plan-de-lectura.zip
```

Para publicar una versión: sube el número en `plugin/manifest.json` y en `updates.json`, ejecuta `build.sh` y haz *commit* de la carpeta `dist/`. Los enlaces de descarga y las actualizaciones automáticas apuntan siempre a `dist/` en la rama `main`.

## Estado

Versión en prueba (0.2.0). Reporta problemas en [Issues](https://github.com/tmarquez-mx/Lectio/issues), con el mensaje de *Ayuda › Salida de depuración* de Zotero.

Licencia MIT · Teresa Márquez, Universidad Iberoamericana Ciudad de México
