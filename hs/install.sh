#!/bin/bash
# Headscale install for the Altare sandbox (no systemd; PID1=tini).
# Idempotent-ish: re-running restarts headscale with the same config/db.
exec > /tmp/hs-install.log 2>&1
set -x
HSVER=0.29.7
cd /tmp
# Sandbox DNS is intermittent: retry aggressively on all errors.
curl -fsSL --retry 10 --retry-delay 3 --retry-all-errors -o hs.deb "https://github.com/juanfont/headscale/releases/download/v${HSVER}/headscale_${HSVER}_linux_amd64.deb" || exit 1
rm -rf /tmp/hs-extract && mkdir -p /tmp/hs-extract
dpkg -x hs.deb /tmp/hs-extract || exit 1
install -m 755 /tmp/hs-extract/usr/bin/headscale /usr/local/bin/headscale || exit 1
/usr/local/bin/headscale version || exit 1
mkdir -p /etc/headscale /var/lib/headscale /var/run/headscale
[ -f /etc/headscale/config.yaml ] || cp /tmp/hs-extract/etc/headscale/config.yaml /etc/headscale/config.yaml
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
