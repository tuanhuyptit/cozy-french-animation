---
name: cozy-radio-episode
description: Làm video hoạt hình cho kênh Cozy French Radio (kênh chị em, CHỈ có Léa nói một mình, podcast phát triển bản thân kèm học tiếng Pháp) từ các file voice của Léa + script — ghép voice, chép lời, sửa theo script, chia phụ đề Pháp + dịch Anh, chọn từ vựng, bốc ngẫu nhiên MỘT cảnh Radio cho cả tập (studio, grenier, matin, train, cheminee, carnet, tsf, polaroid, lettre, metro, journal), build HyperFrames, gửi link preview chờ duyệt, render 1080p → 1440p, viết SEO (mô tả kết thúc bằng khối ghi công nhạc). Dùng khi người dùng nói "Cozy French Radio", "tập Radio", "làm video Radio", "voice Léa một mình", hoặc muốn thêm/sửa/xem cảnh Radio. KHÔNG dùng cho The Cozy French (Léa & Mathieu hai người) — cái đó là cozy-french-episode.
---

# Cozy French Radio — từ voice Léa ra video

Đây là kênh **riêng**, tách khỏi The Cozy French. Không trộn file, không trộn số tập.
Trả lời người dùng bằng tiếng Việt. Chữ trong video (dịch, nghĩa từ, câu ví dụ) bằng **tiếng Anh**.

## Khác kênh chính ở đâu

| | The Cozy French | Cozy French Radio |
|---|---|---|
| Người nói | Léa & Mathieu | **Chỉ Léa** (không đoán người nói) — trong voice cô tự giới thiệu là "Lia" |
| Thư mục tập | `cozy-epNN/` | `radio/epNN/` |
| Cảnh | `demo-animation-style.html` | `radio/scenes.mjs` (nguồn duy nhất) |
| Cảnh trong tập | 1 cảnh bốc ngẫu nhiên | **1 cảnh bốc ngẫu nhiên cho cả tập** (chủ kênh chốt 2026-11-14: không đổi cảnh giữa tập) |
| Đầu vào | 1 file voice | nhiều file voice (1.script…, 2.script…) **+ script .txt** |
| Bảng giải thích, bong bóng, biểu cảm | có | chưa có (chỉ phụ đề karaoke + thẻ từ + màn ôn tập) |
| Âm thanh | voice + sfx | voice + **nhạc nền bắt buộc** + sfx nhẹ |

Hình Léa (16 trang phục, nhép miệng, chớp mắt, cử chỉ, nhấp cà phê) lấy từ `demo-animation-style.html` — sửa Léa ở đó thì cả hai kênh cùng đổi.

## 0. Chuẩn bị

- Repo: thư mục chứa `demo-animation-style.html` và `radio/`. Đọc `radio/README.md` và `NOTES.md`.
- Mọi lệnh shell: `export PATH=/opt/homebrew/bin:$PATH`.
- Tập mới = số kế tiếp trong `radio/ep*`. Tạo `radio/epNN/{tools,work,assets}`, chép `cozy-ep01/tools/transcribe.mjs` vào `radio/epNN/tools/`.

## 1. Ghép voice + chép lời

```bash
# ghép các file theo thứ tự, chèn 0,8 s im lặng giữa các file
ffmpeg -y -f lavfi -t 0.8 -i anullsrc=r=44100:cl=mono -i 1.mp3 -i 2.mp3 … -filter_complex "[1:a]aresample=44100,aformat=channel_layouts=mono[a1];…;[a1][0:a][a2][0:a]…concat=n=…:v=0:a=1[o]" -map "[o]" -c:a libmp3lame -q:a 2 radio/epNN/work/voice-merged.mp3
cd radio/epNN && node tools/transcribe.mjs work/voice-merged.mp3      # chạy nền, ~1–5 phút cho 20 phút voice
```
→ `assets/voice.mp3`, `assets/words.json` (bỏ qua phần đoán người nói trong `episode.draft.json`).

## 2. Sửa lời theo script, chia phụ đề (trong `radio/epNN/`)

```bash
cp "<script>.txt" work/script.txt
node ../tools/align-script.mjs            # in các chỗ whisper khác script
node ../tools/align-script.mjs --write    # chữ 1:1 lấy theo script (chính tả, dấu câu, « »), giữ mốc thời gian
node ../tools/chunk.mjs > work/chunks.txt # → work/chunks.json, mỗi đoạn ≤ ~10 chữ, một dòng
```
- `align-script` tự bỏ dòng tiêu đề/`Section n —`/`[Word count]` của script. Chỗ khác nhau mà **đọc khác nhau thật** (không phải đồng âm) → nghe lại (whisper đoạn ngắn) và giữ đúng lời trong voice (vd. ep01: voice "des mois", script "les mois"). Bản whisper gốc lưu ở `work/words.whisper.json`.
- Đọc `work/chunks.txt`; đoạn nào ngắt xấu thì sửa luật trong `chunk.mjs` hoặc chấp nhận.

## 3. Nội dung

- `work/en.json`: mảng chuỗi tiếng Anh, **đúng một dòng cho mỗi đoạn** của `chunks.json` (tự nhiên, ngắn, người học B1 đọc kịp).
- `work/plan.json`:
  ```json
  { "title": "Rien ne change si rien ne change", "edition": "…", "parts": ["…"],
    "vocab": [ { "at": 17, "phrase": "enregistrement,", "tag": "nom masculin", "word": "un enregistrement",
                 "ipa": "/…/", "mean": "a recording", "ex": "Câu ví dụ MỚI.", "exEn": "…" } ] }
  ```
  `at` = số thứ tự đoạn, `phrase` = đúng các chữ liền nhau trong đoạn đó (sẽ được bọc `[ ]`).
- Từ vựng: ~1 từ / 1,5 phút (tập 20 phút ≈ 12–14), B1–B2, rải đều, cách nhau ≥ 20 s, không lặp từ các tập Radio trước. IPA lấy từ Wiktionary: `cd cozy-ep01 && node tools/vocab-help.mjs ipa "un enregistrement" …` (chữ báo `missing` hoặc thiếu nối âm thì tự viết, vd. /œ̃.n‿ɑ̃.ʁə.ʒis.tʁə.mɑ̃/).
- **Cảnh + trang phục — bốc ngẫu nhiên** (giống kênh chính):
  ```bash
  node radio/tools/pick-setup.mjs radio/epNN --write     # ở gốc repo → work/setup.json { scene, lea }
  ```
  Bốc trong các cảnh dẫn, không trùng cảnh/trang phục của 2 tập Radio trước, tránh đồ trùng tông với nền. Bốc lại: `--seed 2`. Chủ kênh chỉ định: `--scene lettre --lea camel`. Cảnh chuyển (`lettre`, `journal`, `polaroid`…) dùng cả tập được khi chủ kênh yêu cầu: thêm `"ctx": { "letter": { "head": "Et toi ?", "sign": "— ton histoire ✎" } }` (hoặc `mot`, `note`) vào `work/setup.json`. ep01 dùng `lettre` cả tập theo yêu cầu.
- `node ../tools/assemble.mjs` (trong `radio/epNN/`) → `episode.json`.

## 4. Build + kiểm tra

```bash
node radio/tools/build.mjs radio/epNN                 # ở gốc repo
cd radio/epNN && npx --yes hyperframes@0.9.16 check
npx --yes hyperframes@0.9.16 snapshot --at <t1>,<t2>,…
```
- Build tạo `index.html`, `compositions/radio.html`, `assets/music.mp3` (nhạc nền, xem dưới), `assets/sfx.mp3`, và `meta.json`/`package.json`/`hyperframes.json` nếu chưa có.
- Cảnh báo được bỏ qua (cố ý): chữ chưa đọc tương phản thấp (karaoke), `line_unread` (Léa nói nhanh), chữ trang trí trong cảnh.
- **Mở ảnh ra xem**: miệng Léa mấp máy (chụp 4 khung cách 0,1 s rồi so vùng mặt), phụ đề không đè vật/đường kẻ, thẻ từ không che mặt, màn ôn tập cuối.
- Thẻ từ: góc trên phải ở cảnh dẫn; góc dưới trái (`.cardWrap.low`) ở cảnh đồ hoạ (`sub: 'kin'`).

## 5. Link preview — DỪNG, chờ người dùng duyệt

**Không render trước khi người dùng nói OK.**
```bash
npx --yes hyperframes@0.9.16 preview --background --no-open      # trong radio/epNN/
npx --yes hyperframes@0.9.16 preview --status --json             # lấy result.studioUrl
```
Mở `studioUrl` trong Browser pane và gửi link + cảnh/trang phục + từ vựng (từ — nghĩa — mốc) + chỗ lời voice khác script. Kết thúc bằng `wrap_up` "Render tập này?" (**Render** / **Cần sửa**). Sửa → build lại → Studio tự tải lại, gửi lại link cũ.

## 6. Render (chỉ sau OK) — 1080p rồi upscale 1440p

```bash
npx --yes hyperframes@0.9.16 preview --stop
npx --yes hyperframes@0.9.16 render -o "$PWD/renders/radio-epNN-1080p.mp4"     # chạy nền, ~2× thời lượng
ffmpeg -i renders/radio-epNN-1080p.mp4 -vf "scale=2560:1440:flags=lanczos" -c:v h264_videotoolbox -b:v 16M -maxrate 20M -bufsize 32M -profile:v high -pix_fmt yuv420p -c:a copy -movflags +faststart renders/radio-epNN-1440p.mp4
```
Kiểm tra cả hai file bằng `ffprobe` (thời lượng, 2560×1440, có audio).

## 7. YouTube SEO (làm trong lúc render)

```bash
node tools/youtube-seo.mjs radio/epNN      # ở gốc repo → radio/epNN/youtube/{outline.txt, vocab.md, captions.fr.srt, captions.en.srt}
```
Viết `radio/epNN/youtube-seo.md` theo mẫu `radio/ep01/youtube-seo.md`: 3 tiêu đề ≤ 100 ký tự, mô tả (chương 12–18 mốc từ `outline.txt`, 📚 vocabulary, câu hỏi bình luận lấy từ cuối tập, link đăng ký kênh Radio + link The Cozy French, 3 hashtag), tags ≤ 500 ký tự. **Mô tả phải kết thúc bằng khối ghi công nhạc** (dưới). Kiểm độ dài trước khi gửi.

## Nhạc nền (bắt buộc) + ghi công

- File: `radio/assets/music/meditation-impromptu-03.mp3` ("Meditation Impromptu 03" — Kevin MacLeod, 4:15). Bản gốc ở Google Drive: `My Drive/0. Tài Nguyên Huy/0. Dự án Huy/0. Jennie Podcast/2. Nhạc nền/`.
- Build tự làm `assets/music.mp3`: lặp đủ độ dài video, **−15 dB** (`"musicDb"` trong `episode.json` để đổi), fade in 3 s, fade out 4 s cuối video (nhạc chạy qua cả màn ôn tập).
- **Mô tả YouTube của MỌI tập Radio phải kết thúc bằng đúng khối này** (chép nguyên văn từ `radio/assets/music/CREDIT.txt`, đặt cuối cùng, sau hashtag):
  ```
  "Meditation Impromptu 03" by Kevin MacLeod is licensed under Creative Commons Attribution 4.0. https://creativecommons.org/licenses/by/4.0/
  Source: http://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100161 Artist: http://incompetech.com/
  ```
  Thiếu khối này là vi phạm giấy phép CC BY 4.0.

## Thêm / sửa cảnh

Sửa `radio/scenes.mjs` (chú thích các trường ở đầu file; cảnh chuyển nhận `ctx` = `{ parts, part, edition, mot, note, letter }`), rồi:
```bash
node radio/tools/build-demo.mjs
python3 -m http.server -d radio 8766   # http://localhost:8766/radio-demo.html
```
- Chuyển động CSS trong `SCENE_CSS` chỉ cho demo; video dùng khối "scene ambience" trong `radio/tools/build.mjs` (mỗi class một tween GSAP lặp hữu hạn). Thêm class chuyển động mới → viết cả hai.
- Cảnh mới là cảnh dẫn (`kind: 'host'`) thì thêm luật tránh trùng tông vào `AVOID` trong `radio/tools/pick-setup.mjs`.
- Ghi cảnh mới vào bảng trong `radio/README.md`.

## Ghi chú

- Mọi chuyển động phải seek được: không `Math.random()` không seed, không `repeat:-1`.
- Id trong SVG của cảnh được thêm hậu tố theo đoạn (`scoped()` trong build) — **không** cho Léa vào trong phần bị đổi id (lỗi ep01: miệng/chớp mắt/cử chỉ không chạy).
- Font chữ viết tay Caveat (OFL) nhúng từ `radio/assets/fonts/caveat-600-latin.woff2`.
