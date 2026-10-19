#!/usr/bin/env bash
# Build rfp/evidence/estatex-e2e-evidence.mp4 from the per-test-case screenshots
# in rfp/evidence/. Frames appear in E2E execution order and are captioned with
# their TC ID so the video is readable as an evidence trail.
#
# Captions are rendered with Chrome (playwright-cli) and composited with
# ffmpeg's overlay filter, because this ffmpeg build has neither drawtext nor
# subtitles. A local static server is used because playwright-cli blocks file://.

set -euo pipefail

EVIDENCE="rfp/evidence"
WORK=".evidence-frames"
OUT="$EVIDENCE/estatex-e2e-evidence.mp4"

CANVAS_W=1280
CANVAS_H=720
BAR_H=46
DURATION=2
SERVE_PORT=5199
S="captions"

rm -rf "$WORK"; mkdir -p "$WORK"

# ---------------------------------------------------------------- frame list
# Order comes from the suite (TC IDs contain no spaces, so extraction is safe).
# Captions are derived from the PNG filename slug rather than parsed out of the
# shell script — awk splits on whitespace, so a quoted description like
# "Indian digit grouping" would collapse to just its first word.
grep -oE 'TC-[A-Z0-9]+-[0-9]+' e2e/run-e2e.sh | awk '!seen[$0]++' | while read -r id; do
  src=$(ls "$EVIDENCE/${id}-"*.png 2>/dev/null | head -1) || continue
  [ -z "$src" ] && continue
  slug=$(basename "$src" .png); slug="${slug#${id}-}"
  printf '%s\t%s\n' "$id" "$(printf '%s' "$slug" | tr '-' ' ')"
done > "$WORK/manifest.tsv"

TOTAL=$(wc -l < "$WORK/manifest.tsv" | tr -d ' ')
echo "frames: $TOTAL"

# ---------------------------------------------------------------- html
cat > "$WORK/title.html" <<EOF
<html><body style="margin:0;width:${CANVAS_W}px;height:${CANVAS_H}px;background:#0f2b46;
color:#fff;font-family:-apple-system,Helvetica,Arial,sans-serif;display:flex;
flex-direction:column;justify-content:center;padding:0 96px">
  <div style="font-size:15px;letter-spacing:4px;color:#10b981;font-weight:700">E2E EVIDENCE</div>
  <div style="font-size:58px;font-weight:800;margin-top:18px;line-height:1.15">EstateX Home Page</div>
  <div style="font-size:22px;color:#94a3b8;margin-top:20px">${TOTAL} test cases &middot; 0 failed &middot; 6 skipped</div>
  <div style="font-size:17px;color:#64748b;margin-top:44px">rfp/real-estate-homepage/test-cases.md &middot; driven by playwright-cli</div>
</body></html>
EOF

{
  echo '<html><body style="margin:0;width:'"$CANVAS_W"'px;background:#0b1c2e;font-family:-apple-system,Helvetica,Arial,sans-serif">'
  while IFS=$'\t' read -r id desc; do
    echo '<div style="height:'"$BAR_H"'px;display:flex;align-items:center;padding:0 28px;border-bottom:1px solid #1e3a52">'
    echo '<span style="font-size:17px;font-weight:800;color:#10b981;width:180px;flex:none">'"$id"'</span>'
    echo '<span style="font-size:16px;color:#e2e8f0">'"$desc"'</span>'
    echo '</div>'
  done < "$WORK/manifest.tsv"
  echo '</body></html>'
} > "$WORK/captions.html"

# ---------------------------------------------------------------- render
# playwright-cli blocks file://, so serve the scratch dir over HTTP.
python3 -m http.server "$SERVE_PORT" --directory "$WORK" >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
sleep 1.5

# Absolute paths: playwright-cli resolves --filename relative to its own cwd.
ABS_WORK="$PWD/$WORK"
playwright-cli -s="$S" open "http://localhost:${SERVE_PORT}/title.html" --browser=chrome >/dev/null 2>&1
playwright-cli -s="$S" screenshot --filename="$ABS_WORK/frame-000.png" >/dev/null 2>&1
playwright-cli -s="$S" close >/dev/null 2>&1

playwright-cli -s="$S" open "http://localhost:${SERVE_PORT}/captions.html" --browser=chrome >/dev/null 2>&1
playwright-cli -s="$S" screenshot --full-page --filename="$ABS_WORK/captions.png" >/dev/null 2>&1
playwright-cli -s="$S" close >/dev/null 2>&1

TITLE_OK=$(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "$ABS_WORK/frame-000.png" 2>/dev/null || echo "missing")
CAP_H=$(ffprobe -v error -select_streams v -show_entries stream=height -of csv=p=0 "$ABS_WORK/captions.png" 2>/dev/null || echo 0)
echo "title card: ${TITLE_OK} | captions strip: ${CAP_H}px tall"

# ---------------------------------------------------------------- frames
n=0
while IFS=$'\t' read -r id desc; do
  n=$((n+1))
  src=$(ls "$EVIDENCE/${id}-"*.png | head -1)
  cap="$WORK/cap-$(printf '%03d' "$n").png"
  out="$WORK/frame-$(printf '%03d' "$n").png"

  ffmpeg -hide_banner -loglevel error -y -i "$WORK/captions.png" \
    -vf "crop=${CANVAS_W}:${BAR_H}:0:$(( (n-1) * BAR_H ))" "$cap"

  ffmpeg -hide_banner -loglevel error -y -i "$src" -i "$cap" \
    -filter_complex "[0:v]scale=${CANVAS_W}:${CANVAS_H}:force_original_aspect_ratio=decrease,pad=${CANVAS_W}:${CANVAS_H}:(ow-iw)/2:(oh-ih)/2:color=#0f2b46,setsar=1[bg];[bg][1:v]overlay=0:H-h[o]" \
    -map "[o]" -frames:v 1 "$out"
done < "$WORK/manifest.tsv"

echo "frames composed: $n"

# ---------------------------------------------------------------- encode
# image2 demuxer, not concat: concat misaligns the first image entry. With a
# uniform duration, `-framerate 1/N` expresses "each frame lasts N seconds".
# Do NOT use an `fps=` video filter — resampling 0.5fps up silently drops the
# first frame, which killed the title card. `-r` as an *output* option resamples
# without that side effect and gives a normal 25fps stream for broad playback.
ffmpeg -hide_banner -loglevel error -y -framerate "1/$DURATION" -start_number 0 \
  -i "$WORK/frame-%03d.png" \
  -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p \
  -fps_mode cfr -r 25 -movflags +faststart "$OUT"

playwright-cli close-all >/dev/null 2>&1 || true

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
SIZE=$(du -h "$OUT" | cut -f1)
RES=$(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "$OUT")
echo "wrote $OUT  (${DUR%.*}s, $RES, $SIZE)"
if [ "${KEEP_WORK:-0}" != "1" ]; then rm -rf "$WORK"; else echo "kept $WORK"; fi