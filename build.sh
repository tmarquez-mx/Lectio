#!/bin/sh
# Empaqueta el plugin en lectio.xpi y la skill en plan-de-lectura.zip
set -e
cd plugin && rm -f ../lectio.xpi && zip -qr ../lectio.xpi manifest.json bootstrap.js lectio.js icon.svg content locale && cd ..
cd skill && rm -f ../plan-de-lectura.zip && zip -qr ../plan-de-lectura.zip plan-de-lectura && cd ..
echo "Listo: lectio.xpi y plan-de-lectura.zip"
