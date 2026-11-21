#!/bin/zsh
export PATH=/opt/homebrew/bin:$PATH
cd "$(dirname "$0")/.."
echo "start $(date)" > work/render.log
npx --yes hyperframes@0.9.16 render -o "$PWD/renders/cozy-ep19-1080p.mp4" >> work/render.log 2>&1 || { echo "FAILED $(date)" >> work/render.log; exit 1; }
ffmpeg -v error -y -i renders/cozy-ep19-1080p.mp4 -vf "scale=2560:1440:flags=lanczos" -c:v h264_videotoolbox -b:v 16M -maxrate 20M -bufsize 32M -profile:v high -pix_fmt yuv420p -c:a copy -movflags +faststart renders/cozy-ep19-1440p.mp4 >> work/render.log 2>&1 && echo "ALLDONE $(date)" >> work/render.log
