#!/bin/sh
# Empaqueta el plugin en lectio.xpi
set -e
mkdir -p dist
cd plugin && rm -f ../dist/lectio.xpi && zip -qr ../dist/lectio.xpi manifest.json bootstrap.js lectio.js icon.svg content locale && cd ..
echo "Listo: dist/lectio.xpi"
