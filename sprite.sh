#!/bin/sh
# Kullanım: ./sprite.sh <id> [yaw] [pitch] [bekleme-sn]
# assets/tripo/<id>.glb → assets/sprites/<id>.png (şeffaf, kırpılmış, 512px)
# ./serve.sh çalışıyor olmalı — GLB http üzerinden yükleniyor.
#
# Neden ekran görüntüsü değil de indirme: headless Chrome'un --screenshot'ı `load`
# anında tetikleniyor ve 29 MB'lık GLB o ana yetişmiyor (hep boş PNG çıkıyordu).
# Sayfa render bitince PNG'yi kendisi indiriyor; indirme klasörü profile yazılıyor.
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ID="$1"; YAW="${2:-90}"; PITCH="${3:-18}"; BEKLE="${4:-30}"

[ -n "$ID" ] || { echo "kullanım: ./sprite.sh <id> [yaw] [pitch]"; exit 1; }
[ -f "assets/tripo/$ID.glb" ] || { echo "yok: assets/tripo/$ID.glb"; exit 1; }
curl -sf -o /dev/null http://localhost:8080/ || { echo "önce ./serve.sh çalıştır"; exit 1; }

CIKTI="$(pwd)/assets/sprites"
mkdir -p "$CIKTI"
rm -f "$CIKTI/$ID.png"

# Profil her koşuda benzersiz: aynı profil adıyla ikinci kez açılan Chrome, hâlâ ayakta
# olan örneğe sekme olarak bağlanıp hemen çıkıyor ve indirme hiç gerçekleşmiyor.
PROFIL="/tmp/rb-sprite-$ID-$$"
mkdir -p "$PROFIL/Default"
printf '{"download":{"default_directory":"%s","prompt_for_download":false}}' "$CIKTI" \
  > "$PROFIL/Default/Preferences"

URL="http://localhost:8080/render-sprite.html?glb=assets/tripo/$ID.glb&yaw=$YAW&pitch=$PITCH&dl=$ID"
# --disable-gpu KULLANMA: headless'ta WebGL kırılıyor, sahne boş çıkıyor.
"$CHROME" --user-data-dir="$PROFIL" --window-size=512,512 \
  --no-first-run --no-default-browser-check --disable-session-crashed-bubble \
  "$URL" >/dev/null 2>&1 &
P=$!; sleep "$BEKLE"; kill $P 2>/dev/null
pkill -f "$PROFIL" 2>/dev/null
sleep 1; rm -rf "$PROFIL" 2>/dev/null

BOYUT=$(stat -f%z "$CIKTI/$ID.png" 2>/dev/null || echo 0)
[ "$BOYUT" -gt 8000 ] || { echo "HATA: $ID.png üretilemedi ($BOYUT bayt) — bekleme süresini artır"; exit 1; }
echo "hazır: assets/sprites/$ID.png ($BOYUT bayt)"
