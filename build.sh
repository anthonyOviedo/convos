#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo "[conVos] Construyendo imagen..."
podman build -f Dockerfile -t localhost/convos:localatest .
echo "[conVos] ✓ localhost/convos:localatest"
