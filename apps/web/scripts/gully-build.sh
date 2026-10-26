#!/bin/sh
# Gully Safe: build the static export (apps/web/out) with the values in apps/web/.env.gully.
# Run from the repo root, e.g. in a node:22 container:
#   docker run --rm -v "$PWD":/app -w /app node:22 sh apps/web/scripts/gully-build.sh
set -eu

cd "$(dirname "$0")/../../.."
ROOT="$(pwd)"

# Public build-time values (no secrets). `set -a` exports every variable the file defines.
set -a
. "$ROOT/apps/web/.env.gully"
set +a

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"
export HUSKY=0

# Native modules of the hardware-wallet stack (usb, node-hid) need these headers when no prebuilt binary fits.
if [ "$(id -u)" = "0" ] && command -v apt-get >/dev/null 2>&1 && [ "${GULLY_SKIP_APT:-0}" != "1" ]; then
  apt-get update -qq && apt-get install -y -qq libusb-1.0-0-dev libudev-dev >/dev/null
fi

# The repo may be owned by another uid inside the container.
git config --global --add safe.directory "$ROOT" 2>/dev/null || true
export NEXT_PUBLIC_COMMIT_HASH="${NEXT_PUBLIC_COMMIT_HASH:-$(git rev-parse --short HEAD 2>/dev/null || echo '')}"

corepack enable
yarn install --immutable
yarn workspace @safe-global/web after-install
yarn workspace @safe-global/web build
yarn workspace @safe-global/web integrity

echo "Static export ready: $ROOT/apps/web/out"
