#!/bin/bash
# Headscale install v3 for the Altare sandbox: bare binary + config via
# GitHub Pages (the sandbox cannot dpkg-extract: its tar fails on the deb).
exec > /tmp/hs-install.log 2>&1
set -x
BASE=https://dengzy1998.github.io/tools-hub/hs
cd /tmp
# Sandbox DNS is intermittent: retry aggressively on all errors.
curl -fsSL --retry 10 --retry-delay 3 --retry-all-errors -o headscale.bin "$BASE/headscale" || exit 1
curl -fsSL --retry 10 --retry-delay 3 --retry-all-errors -o hs-config.yaml "$BASE/config.yaml" || exit 1
install -m 755 headscale.bin /usr/local/bin/headscale || exit 1
/usr/local/bin/headscale version || exit 1
mkdir -p /etc/headscale /var/lib/headscale /var/run/headscale
cp hs-config.yaml /etc/headscale/config.yaml
sed -i 's|^server_url:.*|server_url: http://sg-sgp12.tryaltare.ai:27899|' /etc/headscale/config.yaml
sed -i 's|^listen_addr:.*|listen_addr: 0.0.0.0:27899|' /etc/headscale/config.yaml
export HEADSCALE_CONFIG=/etc/headscale/config.yaml
# Create the user before first serve (writes directly to the DB).
/usr/local/bin/headscale users create muse || true
pkill -f "headscale serve" || true
sleep 1
nohup /usr/local/bin/headscale serve > /var/log/headscale.log 2>&1 &
sleep 4
curl -s -m 5 http://127.0.0.1:27899/health || true
/usr/local/bin/headscale users list || true
echo DONE > /tmp/hs-status.txt
