# Hướng dẫn: tạo kênh English Podcast (2 nhân vật) từ template The Cozy French

Mục tiêu: một **thư mục riêng** (repo riêng) cho kênh English Podcast, cùng kiểu animation với The Cozy French (2 nhân vật ngồi trò chuyện, phụ đề karaoke, thẻ từ vựng, bảng giải thích, màn ôn tập), nhưng **nhân vật mới** và **nội dung tiếng Anh**.

## Đã chốt (2026-11-14)

| | |
|---|---|
| Tên kênh | **Talkatoo English Podcast** |
| Nhân vật | **Emma** (nữ) và **Dilo** (nam) — nhãn kịch bản `EMMA:` / `DILO:`, id ngắn `emma` / `dilo` |
| Giọng | **Anh-Mỹ** → IPA từ WikiPron `eng_latn_us_broad.tsv`, chính tả Mỹ (color, center, favorite…), từ vựng Mỹ (apartment, fall, cookie…) |
| Phụ đề | **Chỉ tiếng Anh** — không có dòng dịch; thẻ từ giải nghĩa bằng tiếng Anh đơn giản (English–English) |
| Cấp độ | **B1–B2** (8–15 từ/tập như kênh Pháp) |

Còn chờ: mô tả ngoại hình Emma & Dilo, tông màu kênh, logo.

> Vì phụ đề chỉ có tiếng Anh: bỏ trường dịch `en` trong mỗi đoạn phụ đề (hoặc để trống và sửa `build.mjs` không vẽ dòng thứ hai); thẻ từ đổi "nghĩa tiếng Anh" thành "định nghĩa ngắn bằng tiếng Anh dễ", câu ví dụ không cần dịch; `youtube-seo.mjs` chỉ xuất `captions.en.srt`.

---

## 0. Vì sao tách folder riêng (không làm trong `French/`)

- Kênh Pháp đang chạy mỗi ngày, sửa chung một repo dễ làm hỏng tập Pháp.
- Gần như mọi chỗ đều có "tiếng Pháp cứng": whisper `-l fr`, từ điển FLELex, IPA tiếng Pháp, chữ "Aujourd'hui, on a appris…", tên Léa/Mathieu trong hình vẽ, nhãn bong bóng tiếng Pháp, skill tiếng Pháp.
- Tách ra thì kênh Anh có git riêng, skill riêng, có thể tiến hoá độc lập.

---

## 1. Tạo folder mới và chép phần lõi

Chạy ở Terminal:

```bash
mkdir -p ~/Desktop/English
```

```bash
cd ~/Desktop/French && rsync -a demo-animation-style.html README.md NOTES.md tools brand board-preview ~/Desktop/English/
```

```bash
cd ~/Desktop/French && rsync -a --exclude 'assets/voice.mp3' --exclude 'renders' cozy-ep01/ ~/Desktop/English/english-ep01/
```

```bash
cd ~/Desktop/English && git init && git checkout -b main
```

**Chép gì / bỏ gì:**

| Chép | Không chép |
|---|---|
| `demo-animation-style.html` (nguồn hình nhân vật, bối cảnh, cử chỉ, biểu cảm) | `cozy-ep02` … `cozy-ep13` (tập Pháp) |
| `tools/` (new-episode, pick-setup, board-preview, youtube-seo, voice-dialogue) | `radio/` (kênh Léa solo) |
| `cozy-ep01/` → đổi tên `english-ep01/` (template tập: `tools/build.mjs`, `transcribe.mjs`, `staging.mjs`, `sfx.mjs`, `vocab-help.mjs`…) | `voices/` (giọng Léa/Mathieu) |
| `brand/` (để thay logo mới) | `data/fra_latn_broad.tsv` (IPA tiếng Pháp) |
| `README.md`, `NOTES.md` (sẽ viết lại) | các file `.zip`, `ep-work/`, `script*.txt` |

Skill **không chép nguyên** — sẽ tạo bản tiếng Anh ở bước 7.

---

## 2. Đổi nhân vật (phần quan trọng nhất)

Toàn bộ hình vẽ nằm trong `demo-animation-style.html` — `build.mjs` đọc file này làm nguồn duy nhất. Không vẽ lại từ đầu: **giữ nguyên rig** (khớp xoay, nhép miệng, chớp mắt, cử chỉ, uống cà phê) và chỉ đổi phần nhìn.

| Chỗ trong `demo-animation-style.html` | Đổi gì |
|---|---|
| `function leaSVG(...)` (dòng ~741) → đổi thành `emmaSVG` | Tóc (kiểu, màu), khuôn mặt, màu da, phụ kiện (kẹp tóc, khuyên tai…), dòng `<div class="name">Léa</div>` → `Emma` |
| `function matSVG(...)` (dòng ~773) → `diloSVG` | Tóc (bỏ tóc xoăn + kính tròn của Mathieu, thay bằng nét riêng: râu, mũ len, tóc cắt ngắn…) |
| `OUT_LEA` / `OUT_MAT` | Bộ trang phục. Có thể giữ 16 bộ mỗi người rồi đổi màu, hoặc đặt tên mới kiểu Anh (`hoodie`, `flannel`, `sweater`…) |
| `<div class="char" id="lea">` / `id="mat"` | Đổi id → `emma` / `dilo` (rồi tìm & thay `'lea'`/`'mat'` trong `tools/*.mjs`, `english-ep01/tools/*.mjs`) |
| Bảng màu (kem `#f6eddc`, cam đất `#b8552a`…) | Nên đổi tông chủ đạo để khán giả không nhầm với kênh Pháp (vd. xanh navy + vàng mù tạt, hoặc xanh rừng + đỏ gạch) |

**Mẹo an toàn:** đổi id `lea/mat` là thay đổi lớn, dễ vỡ. Cách ít rủi ro hơn: **giữ id nội bộ `lea`/`mat`**, chỉ đổi hình và tên hiển thị. Người xem không bao giờ thấy id. Sau này rảnh mới đổi.

**Bối cảnh:** 26 cảnh ngồi đều mang chất Pháp (boulangerie, péniche, lavande, guinguette…). Nên:
- Giữ các cảnh trung tính: `cafe`, `salon`, `cuisine`, `biblio`, `bureau`, `train`, `plage`, `cinema`, `laverie`, `atelier`.
- Đổi tên / sửa chi tiết các cảnh Pháp: cờ Pháp → bỏ, tháp Eiffel trong `boule` → Big Ben / tượng Nữ thần Tự do, `boulangerie` → `bakery`, `bistrot` → `diner` hoặc `pub`.
- Đồ trên bàn: `drapeau` (cờ Pháp), `macarons`, `croissants` → đổi thành mug, donut, bánh scone…
- Danh sách cảnh/trang phục còn được nhắc trong `tools/pick-setup.mjs` (luật không trùng tông) — sửa cho khớp.

Mở `demo-animation-style.html` trong trình duyệt để xem ngay sau mỗi lần sửa.

---

## 3. Chuyển pipeline sang tiếng Anh

| File | Chỗ cần sửa |
|---|---|
| `english-ep01/tools/transcribe.mjs` | `'-l', 'fr'` → `'-l', 'en'` (dòng ~49). Ngưỡng cao độ đoán người nói `--threshold 175` Hz: đo lại với giọng mới (nữ thường 170–250 Hz, nam 85–160 Hz). Đổi `'lea' : 'mat'` nếu đã đổi id. |
| `english-ep01/tools/build.mjs` | `"Aujourd'hui, on a appris…"` → `"Today we learned…"`; `'Attention, erreur fréquente !'` và mọi tiêu đề bảng tiếng Pháp → tiếng Anh; `<html lang="fr">` → `lang="en"`. Tìm nhanh: `grep -n "é\|è\|à\|ç" english-ep01/tools/build.mjs` |
| `demo-animation-style.html` (khối `ILLUS`) | Nhãn bong bóng minh hoạ đang là tiếng Pháp (`ILLUS[...].fr`) → viết nhãn tiếng Anh |
| `english-ep01/tools/vocab-help.mjs` | Bỏ FLELex + `fra_latn_broad.tsv`. Thay bằng danh sách cấp độ tiếng Anh (vd. Oxford 3000/5000 có ghi A1–C1, hoặc EVP/CEFR-J — kiểm tra giấy phép trước khi dùng cho kênh kiếm tiền) và IPA từ WikiPron file `eng_latn_us_broad.tsv` (hoặc `eng_latn_uk_broad.tsv` nếu giọng Anh-Anh) để ở `data/`. |
| `tools/youtube-seo.mjs` | Phụ đề `.srt` FR + EN → chỉ EN (có thể thêm phụ đề tiếng Việt / Tây Ban Nha… nếu muốn thị trường khác) |
| `tools/new-episode.mjs` | `cozy-ep01` → `english-ep01`, regex `/^cozy-ep\d+$/` → `/^english-ep\d+$/`, `slice(7)` → `slice(10)` |

**Quyết định cần chốt (ghi vào `NOTES.md` mới):**

1. **Phụ đề thứ hai là gì?** Kênh Pháp: lời Pháp + dịch Anh. Kênh Anh có 2 hướng:
   - Chỉ phụ đề tiếng Anh, thẻ từ giải nghĩa bằng tiếng Anh đơn giản (English–English) → khán giả toàn cầu. **Khuyên dùng.**
   - Tiếng Anh + dịch tiếng Việt → nhắm riêng người Việt.
2. **Giọng Mỹ hay Anh** → quyết định IPA, chính tả (color/colour), từ vựng.
3. **Cấp độ**: B1–B2 như kênh Pháp (dễ copy công thức) hay A2–B1.
4. **Thẻ từ** giữ: loại từ, từ, IPA, nghĩa, câu ví dụ mới. Bỏ kiểu bảng chỉ có nghĩa với tiếng Pháp: `gender` (giống đực/cái), `conjug` (chia động từ) → thay bằng `phrasal` (phrasal verb), `tense` hoặc dùng `compare` / `register` / `idiom` / `pronounce` / `falsefriend` (rất hợp tiếng Anh).

---

## 4. Giọng nói (VoiceStudio)

1. Tạo 2 đoạn giọng mẫu mới 13–15 s (nói tiếng Anh, thu sạch) → `voices/emma.flac`, `voices/dilo.flac`, và `voices/voices.json` ghi lời của từng đoạn (theo mẫu `French/voices/voices.json`).
2. Sửa `tools/voice-dialogue.mjs`: nhãn `LÉA:` / `MATHIEU:` → `EMMA:` / `DILO:`, tên profile VoiceStudio → `Emma` / `Dilo`.
3. Chạy: `node tools/voice-dialogue.mjs --setup` rồi `node tools/voice-dialogue.mjs kichban.txt --out ~/Downloads/voice.mp3`.

> Chỉ nhân bản giọng mà bạn có quyền dùng (giọng tự thu hoặc giọng tổng hợp được phép dùng thương mại).

---

## 5. Nhận diện kênh

- Logo mới: `brand/logo.png` (320 px, góc trên phải video).
- Đổi font nếu muốn (hiện: Nunito + Playfair Display).
- Thumbnail: tạo skill riêng giống `cozy-french-thumbnail` nhưng badge mới (vd. "Talkatoo English Podcast"), nhân vật Emma & Dilo.

---

## 6. Chạy thử một tập ngắn

```bash
cd ~/Desktop/English && node tools/new-episode.mjs ~/Downloads/voice.mp3 --duration 40
```

```bash
cd ~/Desktop/English/english-ep02 && node tools/build.mjs && npx hyperframes check && npx hyperframes preview --background
```

Kiểm tra: đoán đúng người nói, chữ khớp karaoke, thẻ từ hiện tiếng Anh, màn ôn tập "Today we learned…", không còn chữ Pháp nào sót. Ổn rồi mới render cả tập (render 1080p rồi upscale 1440p như kênh Pháp).

---

## 7. Tạo skill cho kênh mới

Tạo `~/Desktop/English/skills/` với 4 skill, chép từ `French/skills/` rồi viết lại cho tiếng Anh:

| Skill mới | Gốc | Ghi chú |
|---|---|---|
| `cozy-english-script` | `cozy-french-script` | Viết kịch bản Emma & Dilo ~20 phút từ topic + script đối thủ; không cần "Pháp hoá" nữa, thay bằng "viết lại cho tự nhiên, đúng cấp độ" |
| `cozy-english-voice` | `cozy-french-voice` | Nhãn `EMMA:` / `DILO:` |
| `cozy-english-episode` | `cozy-french-episode` | Voice → video; whisper `en`, từ vựng tiếng Anh |
| `cozy-english-thumbnail` | `cozy-french-thumbnail` | Badge + nhân vật mới |

Đổi `name:` và `description:` trong phần đầu mỗi `SKILL.md` để Claude không nhầm với skill Pháp (mô tả nên ghi rõ "KHÔNG dùng cho The Cozy French"). Cài:

```bash
cd ~/Desktop/English && for s in skills/*; do ln -s "$PWD/$s" ~/.claude/skills/$(basename $s); done
```

---

## 8. Cách nhanh nhất: để Claude làm

Mở **một phiên Claude Code mới** với thư mục `~/Desktop/English` (sau bước 1), rồi gửi lần lượt từng câu, duyệt xong câu này mới gửi câu sau:

1. *"Đọc README.md, NOTES.md và HUONG-DAN-KENH-ENGLISH.md. Đây là bản sao template The Cozy French, tôi muốn chuyển thành kênh English Podcast 2 nhân vật Emma & Dilo. Lên kế hoạch, chưa sửa gì."*
2. *"Vẽ lại 2 nhân vật trong demo-animation-style.html: Emma — [mô tả: tóc vàng buộc đuôi ngựa, tàn nhang…], Dilo — [mô tả: tóc đen ngắn, râu quai nón…]. Giữ nguyên rig. Mở demo cho tôi xem."*
3. *"Đổi bảng màu sang [tông], sửa các bối cảnh/đồ trên bàn mang chất Pháp sang chất Anh/Mỹ."*
4. *"Chuyển pipeline sang tiếng Anh theo mục 3 của hướng dẫn, rồi chạy thử 40 giây đầu voice ~/Downloads/voice.mp3."*
5. *"Tạo 4 skill tiếng Anh theo mục 7, viết lại README.md và NOTES.md cho kênh mới, rồi commit."*

Chép file hướng dẫn này sang folder mới để phiên đó đọc được:

```bash
cp ~/Desktop/French/HUONG-DAN-KENH-ENGLISH.md ~/Desktop/English/
```

---

## Checklist cuối

- [ ] Folder `~/Desktop/English` có git riêng, không còn tập Pháp
- [ ] Emma & Dilo vẽ xong, tên hiển thị đúng, rig vẫn chạy (chớp mắt, nhép miệng, cử chỉ, uống cà phê)
- [ ] Bảng màu + logo mới, không trùng kênh Pháp
- [ ] Bối cảnh / đồ trên bàn không còn cờ Pháp, tháp Eiffel, macaron (trừ khi cố ý)
- [ ] whisper `-l en`, ngưỡng giọng đo lại
- [ ] Danh sách từ vựng + IPA tiếng Anh, đã kiểm tra giấy phép
- [ ] Mọi chữ trên màn hình là tiếng Anh (recap, tiêu đề bảng, nhãn bong bóng)
- [ ] Giọng mẫu Emma & Dilo trong `voices/`, `voice-dialogue.mjs` dùng nhãn mới
- [ ] 4 skill tiếng Anh đã cài, mô tả tách bạch với skill Pháp
- [ ] Render thử 40 s đạt, rồi mới làm tập đầy đủ
