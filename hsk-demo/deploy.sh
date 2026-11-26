#!/bin/sh
# HSK escrow demo deploy for the Altare sandbox (port 31585).
# Serves /root/hsk (demo/ + src/) with static-web-server.
set -e
BASE=https://dengzy1998.github.io/tools-hub/hsk-demo
mkdir -p /root/hsk/demo /root/hsk/src /root/bin
curl -fsSL --retry 10 --retry-delay 3 --retry-all-errors "$BASE/bin/sws" -o /root/bin/sws
chmod +x /root/bin/sws
curl -fsSL --retry 10 --retry-delay 3 --retry-all-errors "$BASE/demo/index.html" -o /root/hsk/demo/index.html
for f in agents.js chain-adapter.js escrow-core.js hsk-adapter.js sim-adapter.js; do
  curl -fsSL --retry 10 --retry-delay 3 --retry-all-errors "$BASE/src/$f" -o "/root/hsk/src/$f"
done
pkill -f "sws --port 31585" 2>/dev/null || true
sleep 1
nohup /root/bin/sws --host 0.0.0.0 --port 31585 --root /root/hsk > /root/hsk/sws.log 2>&1 &
sleep 2
code=$(curl -s -o /dev/null -w "%{http_code}" -m 5 http://127.0.0.1:31585/demo/index.html || true)
echo "HSK_DEMO_LOCAL_HTTP=$code"
