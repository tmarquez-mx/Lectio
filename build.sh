#!/bin/sh
# Empaqueta el plugin en lectio.xpi y la skill en plan-de-lectura.zip
set -e
mkdir -p dist
cd plugin && rm -f ../dist/lectio.xpi && zip -qr ../dist/lectio.xpi manifest.json bootstrap.js lectio.js icon.svg content locale && cd ..
cd skill && rm -f ../dist/plan-de-lectura.zip && zip -qr ../dist/plan-de-lectura.zip plan-de-lectura && cd ..
echo "Listo: lectio.xpi y plan-de-lectura.zip"
