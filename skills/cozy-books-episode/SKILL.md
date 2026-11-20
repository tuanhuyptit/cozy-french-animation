---
name: cozy-books-episode
description: Làm video cho playlist Cozy French Books (Léa một mình review một cuốn sách bằng tiếng Pháp B1–B2) từ voice + script — chép lời, sửa theo script, chia phụ đề kiểu The Cozy French (≤ 50/56 ký tự, 44 px), dịch Anh, chọn từ vựng, lên plan cảnh (góc đọc, sổ tay, trang tranh giấy cắt, thẻ chương, phiếu đọc sách, bản đồ hành trình), vẽ thêm trang tranh bằng thư viện dùng chung, build HyperFrames có hiệu ứng âm thanh + âm nền + nhạc nền, gửi link Studio chờ duyệt, render 1080p → 1440p, viết SEO kèm khối ghi công nhạc. Dùng khi người dùng nói "Cozy Books", "Cozy French Books", "review sách", "tập sách mới", gửi voice/script về một cuốn sách cho Léa. KHÔNG dùng cho Cozy French Radio (cozy-radio-episode) hay hội thoại Léa & Mathieu (cozy-french-episode).
---

# Cozy French Books — từ voice Léa ra video review sách

Trả lời người dùng bằng tiếng Việt. Chữ trong video (dịch, nghĩa từ, ví dụ) bằng **tiếng Anh**, chữ minh hoạ trong tranh/sổ tay bằng **tiếng Pháp**.
Tài liệu kỹ thuật đầy đủ: `books/README.md`. Tập mẫu: `books/ep01/` (L'Alchimiste).

## Nguyên tắc đã chốt

- **Chuyển động nhẹ nhàng, đơn giản**: mờ dần, trượt ngắn, máy quay trôi chậm, nhân vật nhún/đi bộ, bong bóng bật lên. Không làm hoạt hình kể chuyện đầy đủ, không lật trang 3D.
- **Ưu tiên tái sử dụng.** Animation được thêm dần qua từng tập: mỗi thứ mới vẽ ra phải dùng lại được cho sách khác (xem "Thêm hình mới" bên dưới).
- **Phụ đề y như The Cozy French**: khung viền + nhãn "Léa", Pháp và Anh cùng 44 px, mỗi dòng ≤ 50 ký tự Pháp / ≤ 56 ký tự Anh.
- **Không chép bìa sách thật**: bìa do kênh tự vẽ (`COVER` trong `books/art.mjs`). Nhân vật tự vẽ theo nét kênh. Lời Léa đã là diễn giải; chữ trong tranh không trích dài nguyên văn.
- **Không render trước khi người dùng duyệt link preview.**

## 1. Tạo tập + chép lời (ở gốc repo `~/Desktop/French`)

Tập mới = số kế tiếp trong `books/ep*`.
```bash
mkdir -p books/epNN/{tools,work,assets,renders}; cp cozy-ep01/tools/transcribe.mjs books/epNN/tools/
cd books/epNN && node tools/transcribe.mjs "<voice.mp3>" > work/transcribe.log 2>&1     # chạy nền, ~0,7× thời lượng
```
Nhiều file voice: ghép trước bằng ffmpeg (concat), rồi transcribe file ghép.

## 2. Sửa lời theo script, chia phụ đề (trong `books/epNN/`)

```bash
(echo "Tiêu đề"; cat "<script>.txt") > work/script.txt      # align bỏ dòng đầu → luôn thêm dòng tiêu đề
node ../../radio/tools/align-script.mjs                      # xem chỗ khác nhau
node ../../radio/tools/align-script.mjs --write              # lấy chính tả + dấu câu theo script
node ../tools/chunk.mjs > work/chunks.txt                    # ≤ 50 ký tự, chia đều từng câu, không chữ mồ côi
```
- Chỗ whisper tách/gộp chữ khác script (tên ghép "Saint-Jacques-de-Compostelle", "d'eux", "raconte-le-moi", "un autre" bị nghe thành "notre"): sửa thẳng `assets/words.json` bằng một script node nhỏ (gộp token: giữ `s` của chữ đầu, `e` của chữ cuối; tách token: chia đôi thời gian), rồi chạy lại `chunk.mjs`. Báo người dùng các chỗ đọc khác thật.
- `work/en.json`: mảng tiếng Anh, **đúng một dòng cho mỗi đoạn** của `chunks.json`, ≤ 56 ký tự, tự nhiên, người học B1 đọc kịp. Kiểm số dòng + độ dài bằng node trước khi build.

## 3. Plan cảnh — `books/epNN/plan.mjs`

Định dạng đầy đủ ở `books/README.md`; mẫu `books/ep01/plan.mjs`. Mốc = số đoạn trong `chunks.txt` hoặc `[đoạn, 'chữ trong đoạn']`.

Khung một tập (giữ nhịp đổi cảnh ~20–60 s):
1. `shelf` (0:00) → `nook` có `book` (thẻ "Le livre du jour") + `q` (câu hỏi xuyên suốt tập).
2. `carnet` cho phần mở vấn đề (các câu hỏi, so sánh).
3. Mỗi đoạn Léa **kể cốt truyện** → `page` (tranh) có `beats`; mỗi đoạn Léa **nói với người nghe** → `nook` (thêm `q` khi có câu hỏi hay) hoặc `carnet` (liệt kê, so sánh, checklist).
4. Mỗi ý lớn của bài → `chap` (I, II, III…, có `icon` lấy từ `ICON`).
5. Đoạn khuyên đọc → `fiche` (Pour qui ? / Le style / Ce que j'aime / À relire + `rating`).
6. Đoạn kêu gọi người xem → `carnet` "À toi" → `nook` cuối (có `q` câu mẫu để bình luận).
- `BOOK.map.stops`: 3–5 chặng của cuốn sách (nơi chốn, mùa, giai đoạn đời…). Beat `map: i` di chuyển chấm, `ret: true` vẽ đường quay về.
- `BOOK.music`: luôn để `{ src: 'books/assets/music/meditation-impromptu-03.mp3', db: -15 }` (trừ khi chủ kênh đổi).
- `VOCAB`: ~1 từ / 1,5 phút (tập 20 phút ≈ 12–15), B1–B2, cách nhau ≥ 15 s, `phrase` = đúng các chữ trong đoạn đó, câu ví dụ **mới** + dịch. IPA: `cd cozy-ep01 && node tools/vocab-help.mjs ipa "…"` hoặc tự viết.
- Thẻ từ hiện góc trên phải; tag/bong bóng/note trong trang tranh tránh vùng đó (x > 1300, y 150–550) lúc có thẻ.

### Ảnh thật — `PHOTOS` trong plan.mjs (mỗi tập nên có ~1 ảnh / phút)

Tìm ảnh **được phép dùng thương mại**: Wikimedia Commons (public domain/CC0/CC BY: chân dung tác giả, trang tên sách cũ, tranh cổ điển, ảnh lịch sử Library of Congress, NASA), Flickr CC qua Openverse API. Không lấy ảnh Google/Bing không rõ giấy phép; tránh CC BY-SA/ND. API Commons giới hạn tốc độ → nghỉ 5–12 s giữa các lần gọi, User-Agent chung chung.
```bash
mkdir -p books/epNN/assets/photos/src            # bản gốc ở src/, bản dùng ở assets/photos/
npx --yes hyperframes@0.9.16 remove-background src/x.jpg -o x.png      # tách nền đồ vật, chân dung
ffmpeg -i x.png -vf "scale='min(700,iw)':-1" x.png ; ảnh in: jpg ≤ 1000 px, -q:v 4
```
- `.png` = sticker viền trắng (đồ vật, người); `.jpg` = ảnh in dán băng keo (phong cảnh, tranh, trang sách). Xem ảnh đã tách trên nền hồng trước khi dùng — tách hỏng thì dùng bản `.jpg`.
- `{ c, until?, src, x, y, w?, rot?, cap?, sub? }`: tránh thẻ từ (góc trên phải lúc đang hiện), phụ đề (y > 760), nhãn kênh góc trên trái của `nook` (y ≥ 165), bản đồ góc trên trái của `page`.
- Ghi từng ảnh vào `assets/photos/CREDITS.md`; ảnh CC BY → dòng "Photo credits" trong mô tả YouTube (trước khối nhạc).

## 4. Trang tranh — `books/epNN/art.mjs`

```js
import { SCENES as S, page } from '../scenes.mjs';
import { PERSON, pup, pupSvg, BOAT, PROP } from '../kit.mjs';
export const PAGES = { marche: page(S.marche(), [pup({ robe: '#4a3a30', head: 'hood' }, 800, 790, { name: 'thief' })], PROP.pouch(1000, 640)) };
```
- **Luôn tra trước** `books/scenes.mjs` (bảng nơi chốn ở đầu file), `books/kit.mjs` (`PERSON` với `head: none/turban/scarf/crown/hood/fez`, `beard`, `old`; `ICON`; `PROP`; `BOAT`), `books/art.mjs` (`SANTIAGO`, `PILGRIM`, `SHEEP`). Dùng lại + đổi màu/vị trí trước khi vẽ mới.
- Chân nhân vật y ≤ 800 (khung phụ đề che phần dưới). `name` của pup là thứ beat gọi bằng `who`.
- Đồ vật ẩn lúc đầu dùng class có sẵn (`chest`, `hole`, `tea`, `jar`/`jc`, `stones`, `sparks`) hoặc beat `hide` ở đầu trang; hiện bằng `show`/`seq`/`fadeIn`.

### Thêm hình mới (ưu tiên tái sử dụng)

| Cần gì mới | Thêm vào đâu |
|---|---|
| Nơi chốn có thể dùng cho sách khác (phố, rừng, ga tàu, lớp học, biển…) | `books/scenes.mjs` + một dòng trong bảng đầu file (id, mô tả, tập dùng). Có `amb` (âm nền) |
| Nhân vật kiểu mới (áo khoác, mũ, tuổi tác…) | tham số mới cho `PERSON` trong `kit.mjs` (mặc định không đổi hình cũ) |
| Đồ vật / icon | `PROP` hoặc `ICON` trong `kit.mjs` |
| Chuyển động mới (vd. mưa trong tranh, lá rơi, cửa mở) | class trong hình + một dòng `loop(...)` trong khối page ambience của `books/tools/build.mjs`; hoặc beat mới trong `beats.forEach` + ghi vào README |
| Âm thanh mới | kind trong `books/tools/sfx.mjs` (`KINDS` cho tiếng ngắn, `BEDS` cho âm nền) |
| Chỉ cuốn này mới có (diễn viên, đồ vật riêng) | `books/epNN/art.mjs` |

Mọi chuyển động phải seek được: GSAP trên timeline (`ft`, `loop` hữu hạn), không `Math.random` không seed, không CSS animation. Không dùng `clip-path`, `filter` CSS, `radial-gradient` cho phần tử (gây khung đen khi render); bóng đổ dùng `box-shadow`, nét vẽ dùng SVG filter `#pencil`/`#cut`.
Sau khi thêm, cập nhật bảng "Tập đã làm" và danh sách trong `books/README.md`.

## 5. Build + kiểm tra

```bash
node books/tools/build.mjs books/epNN                    # ở gốc repo
cd books/epNN && npx --yes hyperframes@0.9.16 check
npx --yes hyperframes@0.9.16 snapshot --at <15–20 mốc rải đều, mỗi loại cảnh ≥ 1> --no-end -o work/snaps
```
- Cảnh báo **bình thường**, bỏ qua: `line_unread` (phụ đề), tương phản chữ karaoke chưa đọc (`✗ … need 3:1`), `timeline_track_too_dense`, `composition_file_too_large`, `text_below_floor` của tên bản đồ.
- **Phải sửa**: `composition_heavy_overlay_count_high`, `console_warning: GSAP target … not found` (sai `who`/`sel` trong plan), lỗi build (chunk không khớp, cue không có trong đoạn).
- Xem contact sheet: chữ không đè nhân vật, bong bóng không ra khỏi khung, thẻ từ không che tag, chấm bản đồ đúng ga.
- Độ to: `ffmpeg -i assets/<track>.mp3 -af volumedetect -f null -` — giọng ≈ −15 dB mean, nhạc ≈ −41, âm nền ≈ −40, hiệu ứng nhỏ hơn giọng rõ.

## 6. Link preview — DỪNG, chờ duyệt

```bash
npx --yes hyperframes@0.9.16 preview --background --no-open      # trong books/epNN/
npx --yes hyperframes@0.9.16 preview --status --json             # lấy result.studioUrl
```
Mở `studioUrl` trong Browser pane, gửi link + danh sách cảnh, từ vựng, chỗ lời voice khác script. Kết thúc bằng `wrap_up` "Render tập này?" (**Render** / **Cần sửa**). Sửa → build lại → Studio tự tải lại.

## 7. Render (chỉ sau OK) — 1080p rồi upscale 1440p

```bash
npx --yes hyperframes@0.9.16 preview --stop
npx --yes hyperframes@0.9.16 render -o "$PWD/renders/books-epNN-1080p.mp4"     # chạy nền, ~2× thời lượng
ffmpeg -i renders/books-epNN-1080p.mp4 -vf "scale=2560:1440:flags=lanczos" -c:v h264_videotoolbox -b:v 16M -maxrate 20M -bufsize 32M -profile:v high -pix_fmt yuv420p -c:a copy -movflags +faststart renders/books-epNN-1440p.mp4
```
Kiểm cả hai file bằng `ffprobe` (thời lượng, 2560×1440, có audio).

## 8. YouTube SEO

```bash
node tools/youtube-seo.mjs books/epNN     # ở gốc repo → books/epNN/youtube/{outline.txt, vocab.md, captions.fr.srt, captions.en.srt}
```
Viết `books/epNN/youtube-seo.md` theo mẫu `books/ep01/youtube-seo.md`: 3 tiêu đề ≤ 100 ký tự (tên sách + tác giả + "Slow French" + B1–B2), mô tả (câu mở về câu hỏi của tập, tóm tắt hành trình, ✔ lợi ích, chương = mốc đổi cảnh/chương, 📚 từ vựng, câu bình luận mẫu từ cuối tập, link đăng ký `@TheCozyFrench`, một dòng nguồn sách "personal review… illustrations are original", 3 hashtag), tags ≤ 500 ký tự.
Nếu tập có ảnh CC BY: chép khối "Photo credits" trong `assets/photos/CREDITS.md` vào mô tả, **ngay trước** khối nhạc.
**Mô tả phải kết thúc bằng khối ghi công nhạc**, chép nguyên văn `books/assets/music/CREDIT.txt`:
```
"Meditation Impromptu 03" by Kevin MacLeod is licensed under Creative Commons Attribution 4.0. https://creativecommons.org/licenses/by/4.0/
Source: http://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100161 Artist: http://incompetech.com/
```
Thiếu khối này là vi phạm giấy phép CC BY 4.0. Kiểm độ dài tiêu đề/mô tả/tags bằng script trước khi gửi.
