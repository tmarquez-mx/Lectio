---
name: plan-de-lectura
description: Jerarquiza la bibliografía recomendada por buscadores académicos con IA (Consensus, Undermind, Elicit u otros) según la pregunta de investigación del estudiante y genera el plan de los siguientes 15 días como archivo para el plugin Lectio de Zotero. Úsala cuando un estudiante de posgrado suba o pegue una lista de referencias y pida ordenarla, priorizarla, programar sus lecturas o actualizar su plan quincenal.
---

# Plan de lectura quincenal

Esta skill convierte una lista de referencias recomendadas por un buscador con IA en dos productos:

1. Una lista jerarquizada de lecturas según la pregunta de investigación.
2. Un archivo JSON con el plan de los siguientes 15 días, que el estudiante importa en Zotero con el plugin Lectio.

Está pensada para repetirse cada 15 días durante la etapa de formulación del proyecto. Cada ciclo recoge lo que el estudiante leyó en la quincena anterior, incorpora nuevas recomendaciones y reordena lo pendiente.

## Compatibilidad

Esta skill sigue el formato abierto Agent Skills y funciona en Claude, Gemini y ChatGPT. Las instrucciones son las mismas en los tres; lo único que cambia es cómo se entrega el archivo del plan (ver Paso 6). Si el script de `scripts/` no puede ejecutarse en la plataforma, ignóralo: no es necesario cuando el estudiante usa Lectio.

## Mi pregunta de investigación

<!-- El estudiante escribe aquí su pregunta provisional al crear la skill y la actualiza cuando cambie. -->

**Versión vigente:** [Escribe aquí tu pregunta de investigación provisional]

**Fecha de esta versión:** [AAAA-MM-DD]

**Conceptos o autores de interés:** [Por ejemplo: agencia distribuida, Latour]

## Principio rector

La jerarquía es una propuesta, no un veredicto. Decidir qué es central para una investigación es un juicio teórico que pertenece al estudiante. La skill ordena, justifica y calendariza; el estudiante valida, corrige y decide.

## Paso 1. Confirmar la pregunta de investigación

Al iniciar cada ciclo, sin excepción, pregunta al estudiante si su pregunta de investigación ha cambiado desde la versión registrada en la sección "Mi pregunta de investigación".

- No muestres la pregunta completa en ese primer mensaje, salvo que el estudiante lo pida (por ejemplo, "¿cuál tengo registrada?"). Si lo pide, muéstrala tal como está escrita, con su fecha, sin parafrasearla.
- Si la sección conserva el texto de ejemplo entre corchetes, avisa que la pregunta no ha sido registrada y pídela antes de continuar.
- Si el estudiante indica un cambio, trabaja con la nueva versión. Al final de la entrega, muéstrala junto a la anterior y recuérdale que actualice la sección "Mi pregunta de investigación" de este archivo, con la fecha del cambio, porque la skill no puede modificarse a sí misma.
- Si no hay cambio, trabaja con la versión registrada.

Usa siempre la pregunta confirmada en este paso como criterio para clasificar y jerarquizar.

## Paso 2. Identificar si es el primer ciclo o uno de seguimiento

Pregunta si es la primera vez que usa la skill o si ya tiene un plan anterior.

**Primer ciclo.** Reúne en un solo mensaje, sin suponer respuestas:

1. La fecha de inicio de la quincena.
2. Los días y horarios en que puede leer (por ejemplo, martes y jueves de 17:00 a 19:00).
3. La lista de referencias, como archivo exportado (RIS, BibTeX o CSV) o como texto pegado. Recomiéndale subir el mismo archivo que importó en Zotero, para que los títulos coincidan exactamente y Lectio encuentre cada referencia.

Después de recibir la lista, y antes de jerarquizar, dile cuántas referencias contiene (ya sin duplicados) y pregúntale cuántas quiere calendarizar en esta quincena. No supongas un número. Si el número que indica no cabe en sus horas disponibles (Paso 5), díselo y proponle el máximo que sí cabe, sin reducirlo por tu cuenta.

**Ciclo de seguimiento.** Pide además:

1. El plan anterior (la lista jerarquizada que se le entregó, pegada o adjunta).
2. Qué lecturas completó, cuáles dejó a medias y cuáles no empezó.
3. Cuáles resultaron más útiles o menos útiles de lo esperado.
4. Las nuevas recomendaciones, si las hay.
5. Cuántas lecturas quiere calendarizar en esta quincena, contando las pendientes del plan anterior.

Usa la zona horaria America/Mexico_City salvo que el estudiante indique otra.

## Paso 3. Normalizar la lista

1. Extrae de cada referencia: autoría, año, título, tipo de documento (artículo empírico, revisión, ensayo teórico, capítulo, libro, tesis) y resumen, si viene incluido.
2. Elimina duplicados, incluidas las referencias nuevas que ya estaban en el plan anterior.
3. En ciclos de seguimiento, retira las lecturas completadas y conserva las pendientes y las que quedaron a medias.
4. Marca con "[sin resumen]" las referencias sin resumen. No inventes su contenido ni lo deduzcas del título.
5. Marca con "[verificar]" las referencias con datos incompletos o dudosos. Recuerda que los buscadores con IA pueden equivocarse y que el estudiante debe confirmar que cada obra existe antes de citarla.

## Paso 4. Clasificar y jerarquizar

Asigna a cada referencia una función respecto a la pregunta, con una justificación de una línea basada solo en el resumen:

- **Mapa**: revisiones, estados del arte o textos introductorios.
- **Núcleo**: trabajos que abordan directamente el problema, los conceptos o el objeto del estudiante.
- **Método**: trabajos útiles sobre todo por su diseño, técnicas o fuentes.
- **Periferia**: trabajos laterales que pueden esperar.
- **Por definir**: referencias sin resumen. Su justificación es siempre "Sin resumen; clasifícala tú después de revisarla". No la justifiques por la cercanía del título con la pregunta.

Ordena dentro de cada función con estos criterios, en este orden:

1. Cercanía con la pregunta del estudiante.
2. Tipo de documento (las revisiones van primero en el primer ciclo).
3. Actualidad, sin descartar obras señaladas como fundacionales.
4. Retroalimentación del ciclo anterior: si el estudiante dijo que cierto tipo de texto le resultó más útil, súbelo; las lecturas a medias tienen prioridad para terminarse.

No uses el número de citas como criterio principal; mide visibilidad, no pertinencia.

## Paso 5. Asignar lecturas a la quincena

1. Estima el tiempo por tipo: artículo de 1.5 a 2 horas, revisión extensa de 3 horas, capítulo de 2 horas. Para libros, propone solo la introducción y los capítulos pertinentes.
2. Calcula las horas disponibles en los 15 días a partir de los días y horarios del estudiante.
3. Calendariza exactamente el número de lecturas que indicó el estudiante, tomándolas en estricto orden de jerarquía (de la prioridad 1 hacia abajo), sin saltar ninguna para acomodar mejor los horarios. Las demás quedan con estado "pendiente" o "reserva" y sin sesiones.
4. Si esas lecturas superan el 80% de las horas disponibles, no las recortes en silencio: avisa al estudiante y espera a que decida si reduce el número o amplía sus horarios.
5. Si una lectura no cabe en un solo bloque, divídela en partes ("parte 1 de 2").
6. Reserva el último bloque de la quincena para una sesión de escritura breve (una página sobre cómo cambió la pregunta) y para preparar el siguiente ciclo.

## Paso 6. Generar el plan para Lectio

El plan se entrega siempre como un archivo JSON que el estudiante importa en Zotero con el plugin Lectio. No preguntes ni ofrezcas elegir entre Zotero y un archivo .ics: Zotero es la única fuente de verdad del plan, y el .ics se exporta desde Lectio. Desde ahí el estudiante marca su avance, reprograma sesiones y exporta el calendario.

Nombre del archivo: `lectio-plan-AAAA-MM-DD.json`, con la fecha de inicio de la quincena.

**Cómo entregarlo.** Si puedes crear archivos descargables, entrega el JSON como archivo. Si no puedes (algunas plataformas no lo permiten), escríbelo completo en un único bloque de código marcado como `json`, sin comentarios ni texto dentro del bloque, y debajo da esta instrucción: "Copia todo el contenido del bloque, pégalo en un editor de texto plano (Bloc de notas en Windows, TextEdit en modo texto sin formato en Mac) y guárdalo con el nombre indicado, con extensión .json". En ambos casos, antes de entregarlo comprueba que el JSON sea válido: comillas dobles, sin comas finales y con todas las llaves y corchetes cerrados.

Estructura:

```json
{
  "lectio": 1,
  "tipo": "plan",
  "quincena": { "etiqueta": "Q1", "inicio": "2026-11-02", "fin": "2026-11-15" },
  "pregunta": { "texto": "Pregunta vigente confirmada en el Paso 1", "fecha": "2026-11-02" },
  "zona_horaria": "America/Mexico_City",
  "lecturas": [
    {
      "zotero_key": "ABCD1234",
      "doi": "10.xxxx/xxxx",
      "titulo": "Título exacto como aparece en Zotero",
      "autoria": "Apellido",
      "anio": 2024,
      "prioridad": 1,
      "funcion": "Mapa",
      "justificacion": "Una línea",
      "pregunta_guia": "Pregunta breve",
      "horas": 3,
      "estado": "programada",
      "sesiones": [ { "inicio": "2026-11-03T17:00", "fin": "2026-11-03T19:00", "parte": "1 de 2" } ]
    }
  ],
  "escritura": [ { "titulo": "Escritura: ¿cómo cambió mi pregunta?", "inicio": "2026-11-12T17:00", "fin": "2026-11-12T18:00", "descripcion": "Una página." } ]
}
```

Reglas del archivo:

- `estado` admite: programada, pendiente, reserva, verificar.
- `funcion` admite: Mapa, Núcleo, Método, Periferia, Por definir.
- Usa `zotero_key` si la conoces (por ejemplo, si el estudiante adjuntó el estado exportado por Lectio); si no, deja `null` y llena `doi` y `titulo` exactamente como vienen en los datos, porque Lectio los usa para encontrar la referencia en la biblioteca.
- Incluye todas las lecturas, también las pendientes y de reserva, sin sesiones.

**En ciclos de seguimiento**, el estudiante puede adjuntar el archivo `lectio-estado-AAAA-MM-DD.json` que exporta Lectio. Úsalo como fuente de lo leído, lo que quedó a medias y lo marcado como útil, en lugar de pedirle que lo reporte de memoria, y conserva sus `zotero_key`. Ese archivo trae además:

- `ajustes_del_estudiante`: los cambios que el estudiante hizo a la función, la justificación o la pregunta guía que propusiste. Respétalos en el nuevo plan y, si el patrón se repite (por ejemplo, sube sistemáticamente textos que tú pusiste en periferia), menciónalo en tus preguntas de revisión, porque revela cómo entiende su problema.
- `nota_de_lectura`: lo que el estudiante escribió al terminar cada lectura. Úsalo para reajustar la jerarquía de lo pendiente con base en lo que efectivamente encontró, y cita brevemente la nota cuando justifiques un cambio. No completes ni resumas notas vacías.
- `historial_pregunta`: las versiones anteriores de la pregunta. Si en el Paso 1 el estudiante pide ver su pregunta, puedes mostrar también su evolución.

**Solo si el estudiante dice por iniciativa propia que no puede usar Lectio** (por ejemplo, porque no usa Zotero), genera el .ics con `scripts/generar_ics.py` a partir de las sesiones del mismo JSON.

## Paso 7. Entregar

Entrega, en este orden:

1. **Lista jerarquizada**: una tabla con posición, referencia (autoría, año, título), función, justificación, horas estimadas y estado (programada esta quincena, pendiente o reserva).
2. **Archivo** `lectio-plan-AAAA-MM-DD.json`.
3. **Instrucciones en tres líneas**: en Zotero, menú Herramientas, Lectio, Importar plan; después, Exportar calendario e importarlo en un calendario separado llamado "Lecturas" (en Google Calendar, desde la versión web).
4. **Recordatorio**: los cambios de horario se hacen en Zotero (botón Reprogramar) y después se vuelve a exportar; para actualizar sin duplicar eventos, se borra el calendario "Lecturas" y se importa el nuevo archivo.
5. Las referencias marcadas con "[verificar]".
6. Tres preguntas para que el estudiante revise la jerarquía.
7. Si la pregunta cambió, la versión anterior y la nueva, con el recordatorio de actualizar este archivo.
8. Un recordatorio: en 15 días, volver con el estado exportado desde Lectio (Herramientas, Lectio, Exportar estado para la skill).

## Reglas

- Escribe en español, con tono formal y claro.
- Nunca agregues referencias que no estén en la lista del estudiante. Si detectas un vacío evidente, señálalo y sugiere qué tipo de texto buscar, sin inventar títulos.
- Nunca resumas contenido que no esté en los datos recibidos.
- No programes lecturas fuera de los días y horarios que el estudiante indicó.
- Recuerda que la lista refleja lo que encontraron los algoritmos de recomendación, que suelen favorecer literatura en inglés. Invita a complementar con fuentes en español y de la región (por ejemplo, SciELO o Redalyc).
