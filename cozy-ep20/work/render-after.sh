#!/bin/zsh
# render 1080p → upscale 1440p → check → put the Mac to sleep (owner's request for ep20)
export PATH=/opt/homebrew/bin:$PATH
cd "$(dirname "$0")/.."
echo "start $(date)" > work/render.log
if npx --yes hyperframes@0.9.16 render -o "$PWD/renders/cozy-ep20-1080p.mp4" >> work/render.log 2>&1 \
  && ffmpeg -v error -y -i renders/cozy-ep20-1080p.mp4 -vf "scale=2560:1440:flags=lanczos" -c:v h264_videotoolbox -b:v 16M -maxrate 20M -bufsize 32M -profile:v high -pix_fmt yuv420p -c:a copy -movflags +faststart renders/cozy-ep20-1440p.mp4 >> work/render.log 2>&1; then
  echo "ALLDONE $(date)" >> work/render.log
  for f in renders/cozy-ep20-1080p.mp4 renders/cozy-ep20-1440p.mp4; do echo "$f $(ffprobe -v error -show_entries format=duration:stream=width,height -of csv=p=0 $f | tr '\n' ' ')" >> work/render.log; done
else
  echo "FAILED $(date)" >> work/render.log
fi
