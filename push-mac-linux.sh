#!/bin/sh
# Puts the videos on the Car Thing. Run: ./push-mac-linux.sh
cd "$(dirname "$0")" || exit 1

missing() { echo "$1 is missing. Install it with: $2"; exit 1; }
command -v bun    >/dev/null || missing Bun    "curl -fsSL https://bun.sh/install | bash"
command -v ffmpeg >/dev/null || missing ffmpeg "brew install ffmpeg (Linux: sudo apt install ffmpeg)"
command -v ssh    >/dev/null || missing ssh    "sudo apt install openssh-client"

ping -c 1 bridgething.local >/dev/null 2>&1 || {
  echo "Car Thing not found. Plug it in with the USB cable, wait for the screen to turn on, then try again."
  exit 1
}

[ -d node_modules ] || bun install
bun run push "$@" && echo "Done! The Car Thing is updated."
