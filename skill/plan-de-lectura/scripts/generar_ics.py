"""Genera un archivo .ics a partir del plan de lectura en JSON.

Uso: python generar_ics.py plan.json salida.ics
Solo usa la biblioteca estándar de Python.
"""

import hashlib
import json
import sys
from datetime import datetime, timezone


def escapar(texto):
    """Escapa caracteres especiales según el estándar iCalendar."""
    return (
        texto.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


def plegar(linea):
    """Divide líneas largas a 75 octetos, como pide el estándar."""
    datos = linea.encode("utf-8")
    if len(datos) <= 75:
        return linea
    partes, actual = [], b""
    for caracter in linea:
        c = caracter.encode("utf-8")
        limite = 75 if not partes else 74
        if len(actual) + len(c) > limite:
            partes.append(actual.decode("utf-8"))
            actual = b""
        actual += c
    partes.append(actual.decode("utf-8"))
    return "\r\n ".join(partes)


def formato_local(fecha_iso):
    return datetime.fromisoformat(fecha_iso).strftime("%Y%m%dT%H%M%S")


def main(entrada, salida):
    with open(entrada, encoding="utf-8") as f:
        plan = json.load(f)

    tz = plan.get("zona_horaria", "America/Mexico_City")
    sello = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    lineas = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//plan-de-lectura//ES",
        "CALSCALE:GREGORIAN",
        "X-WR-CALNAME:Lecturas",
        f"X-WR-TIMEZONE:{tz}",
    ]

    for evento in plan["eventos"]:
        # UID estable: el mismo evento conserva su identificador si se regenera.
        base = f"{evento['titulo']}|{evento['inicio']}"
        uid = hashlib.sha1(base.encode("utf-8")).hexdigest() + "@plan-de-lectura"
        lineas += [
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{sello}",
            f"DTSTART;TZID={tz}:{formato_local(evento['inicio'])}",
            f"DTEND;TZID={tz}:{formato_local(evento['fin'])}",
            f"SUMMARY:{escapar(evento['titulo'])}",
            f"DESCRIPTION:{escapar(evento.get('descripcion', ''))}",
            "BEGIN:VALARM",
            "ACTION:DISPLAY",
            "DESCRIPTION:Bloque de lectura",
            "TRIGGER:-PT15M",
            "END:VALARM",
            "END:VEVENT",
        ]

    lineas.append("END:VCALENDAR")

    with open(salida, "w", encoding="utf-8", newline="") as f:
        f.write("\r\n".join(plegar(l) for l in lineas) + "\r\n")

    print(f"Archivo generado: {salida} ({len(plan['eventos'])} eventos)")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python generar_ics.py plan.json salida.ics")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
