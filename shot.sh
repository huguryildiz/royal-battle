#!/bin/sh
# Kullanım: ./shot.sh <çıktı.png> [url-fragment]
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# --disable-gpu KULLANMA: headless'ta WebGL context'i açılamıyor, sahne boş çıkıyor.
"$CHROME" --headless --user-data-dir=/tmp/rb-shot-profile \
  --window-size=1180,820 --screenshot="$1" "http://localhost:8080/$2" 2>/dev/null &
P=$!; sleep 12; kill $P 2>/dev/null; ls -la "$1"
