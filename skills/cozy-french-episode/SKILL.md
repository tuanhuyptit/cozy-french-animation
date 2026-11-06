---
name: cozy-french-episode
description: Biến một file voice podcast của kênh The Cozy French (Léa & Mathieu nói tiếng Pháp) thành video hoạt hình hoàn chỉnh — transcribe, chia phụ đề, dịch tiếng Anh, chọn từ vựng B1–B2, chọn bối cảnh + trang phục, build HyperFrames và render MP4. Dùng khi người dùng gửi/chỉ đường dẫn một file voice (mp3, m4a, wav) cho The Cozy French, hoặc nói "làm tập mới", "làm video từ voice này", "tập Cozy French mới". Không dùng để sửa hình nhân vật/bối cảnh (sửa trực tiếp demo-animation-style.html).
---

# The Cozy French — từ voice ra video

Người dùng chỉ gửi voice. Bạn tự làm hết, chỉ hỏi lại khi thật sự không đoán được (ví dụ không tìm thấy file).
Trả lời người dùng bằng tiếng Việt. Nội dung trong video (dịch, nghĩa từ, câu ví dụ) bằng **tiếng Anh**.

## 0. Chuẩn bị

- Repo: `~/Desktop/Claude French/cozy-french-animation` (nếu không có, tìm thư mục chứa `demo-animation-style.html` + `cozy-ep01/`). Đọc `NOTES.md` trước.
- `git pull` nếu repo sạch.
- Mọi lệnh shell: `export PATH=/opt/homebrew/bin:$PATH` (không đặt `WHISPER_MODEL`: `transcribe.mjs` tự chọn `~/ggml-large-v3-turbo.bin`, rồi mới tới `~/ggml-medium.bin`).
- Thiếu `ffmpeg`/`whisper-cli`/model → dừng lại, chỉ người dùng các bước cài trong `README.md`.
- Dữ liệu từ vựng: `data/fra_latn_broad.tsv` (IPA, có trong repo); FLELex ở `~/.cache/cozy-french/` (không có trong repo — thiếu thì tải theo README; vẫn làm tiếp được nếu không có, chỉ mất bước lọc theo cấp độ).

## 1. Tạo tập + transcribe

```bash
node tools/new-episode.mjs "<đường dẫn voice>"          # chạy ở gốc repo
```

- Tạo `cozy-epNN/` (số kế tiếp), chép công cụ từ `cozy-ep01`, chạy whisper → `assets/voice.mp3`, `assets/words.json`, `episode.draft.json`.
- Whisper turbo trên iMac M1 chạy ~0,7× thời lượng audio (tập 20 phút ≈ 14 phút) → chạy nền (`run_in_background`), báo người dùng một câu là đang chép lời.
- Script in ra bối cảnh/trang phục/từ vựng của các tập trước — ghi lại để tránh lặp.

## 2. Viết nội dung (trong `cozy-epNN/work/`)

Đọc `episode.draft.json` (mỗi đoạn có `who` đoán theo cao độ `hz`, `fr`).

**Người nói.** Mathieu ~115–170 Hz, Léa ~180–230 Hz. Đoán theo cao độ dễ sai ở đoạn ngắn, đoạn nối tiếp hoặc khi `hz` = 0 → sửa theo mạch hội thoại (ai hỏi, ai trả lời, xưng hô, giống của tính từ: *fatiguée* → Léa). Ghi lại những chỗ bạn không chắc để báo người dùng.

**Chia đoạn phụ đề.** Được gộp/tách lại đoạn tuỳ ý, nhưng:
- Chữ trong `fr` phải là **đúng các chữ của `assets/words.json`, đúng thứ tự, không thêm/bớt** (dấu câu dính vào chữ giữ nguyên). Mỗi chữ thuộc đúng một đoạn.
- Mỗi đoạn ≤ ~10 chữ, một dòng; ngắt ở dấu câu; không để chữ lẻ loi ở đầu/cuối. Không gộp hai người nói vào một đoạn.
- Whisper nghe sai một chữ → sửa `t` của chữ đó trong `assets/words.json` **và** trong `fr`.

**Dịch `en`.** Tiếng Anh tự nhiên, sát nghĩa, ngắn gọn (người học B1–B2 đọc kịp).

**Từ vựng.** Bọc cụm từ trong `fr` bằng `[ ]` (vd. `[garder pour toi.]`, ngoặc mở ở chữ đầu, đóng ở chữ cuối).
- Bắt đầu từ danh sách gợi ý theo cấp độ CEFR (FLELex), trong `cozy-epNN/`:
  ```bash
  node tools/vocab-help.mjs candidates            # B1–C1, kèm mốc thời gian + số lần xuất hiện
  node tools/vocab-help.mjs level "se débrouiller" "davantage"
  ```
  Đây là gợi ý (ghép lemma theo kiểu đoán) — tự đánh giá lại; cụm thành ngữ hay mà FLELex không có vẫn được chọn.
- IPA lấy từ Wiktionary, không tự viết:
  ```bash
  node tools/vocab-help.mjs ipa "garder pour soi" "un accompagnement"    # → /ɡaʁ.de puʁ swa/
  ```
  Chữ nào báo `missing` thì mới tự viết; kiểm tra nối âm (liaison) trong cụm từ (vd. *les_amis* /le.z‿a.mi/).
- Số lượng: ~1 từ / 1,5–2 phút, tổng **8–15** cho tập 17–23 phút (tập ngắn thì ít hơn, tối thiểu 2).
- Chọn từ/cụm B1–B2 hữu ích: động từ, thành ngữ, cụm cố định, từ nối. Không chọn từ quá dễ (A1–A2) hay tên riêng. Không lặp từ của các tập trước.
- Rải đều cả tập; hai từ cách nhau **≥ 3 s** (tốt nhất ≥ 20 s). Quá sát → chọn từ khác.
- Mỗi mục `work/vocab.json`, đúng thứ tự xuất hiện:
  ```json
  { "tag": "verbe | adjectif | adverbe | nom masculin | nom féminin | expression | connecteur",
    "word": "dạng từ điển (động từ nguyên mẫu, danh từ kèm un/une)",
    "ipa": "/…/", "mean": "English meaning",
    "ex": "Câu ví dụ MỚI, ngắn (không lấy câu trong hội thoại).", "exEn": "Its English translation." }
  ```

**Biểu cảm** (thêm vào đoạn phụ đề): `"emote": "<loại>"` = người nói biểu cảm khi nói câu đó; `"react": "<loại>"` = người nghe phản ứng gần cuối câu.
- `rire` (câu đùa, chuyện buồn cười) · `surpris` (tin bất ngờ, "Ah bon ?", "Sérieux ?") · `idee` ("Ah, je vois", vừa hiểu ra, có ý tưởng) · `question` (thắc mắc, phân vân) · `coeur` (ấm áp, cảm ơn, quan tâm) · `gene` (ngại, khó xử, lo lắng) · `triste` (buồn, tin xấu) · `fatigue` (mệt, buồn ngủ).
- Chỉ đặt khi lời thoại thật sự có cảm xúc đó; khoảng 1 lần / 45–90 s mỗi nhân vật (tập 20 phút ≈ 15–25 lần). Build báo lỗi nếu cùng một người có hai biểu cảm cách nhau < ~3 s.

**Minh hoạ** (bong bóng giữa phía trên): `"illus": "<loại>"`, `"label": "<chữ tiếng Pháp>"` — hiện 3,8 s từ đầu đoạn.
- Loại có sẵn (nhãn mặc định): `travail` le travail · `pluie` la pluie · `soleil` le soleil · `argent` l'argent · `telephone` le téléphone · `sommeil` le sommeil · `sante` la santé · `voyage` le voyage · `cafe` le café · `repas` le repas · `sport` le sport · `lecture` la lecture · `etudes` les études · `famille` la famille · `amis` les amis · `temps` le temps · `stress` le stress · `musique` la musique · `paris` Paris · `nature` la nature · `hiver` l'hiver · `courses` les courses · `rendezvous` le rendez-vous · `voiture` la voiture.
- Đặt ở đoạn mà chủ đề được **nhắc rõ**; `label` dùng đúng từ trong câu, kèm mạo từ (vd. câu nói *le boulot* → `"label": "le boulot"`). Khoảng 1 lần / 1–2 phút (tập 20 phút ≈ 10–15).
- Bong bóng nằm cùng chỗ với thẻ từ: build báo lỗi nếu trùng thời gian với thẻ hoặc hai bong bóng cách nhau < 10 s → chuyển sang đoạn khác.
- Cần chủ đề chưa có: vẽ thêm vào `ILLUS` + `ILLUS_ANIM` trong `demo-animation-style.html` (hình 300×200, nét `#3a2e28` dày 5, bảng màu của kênh, chuyển động chỉ dùng gsap, không random), xem trước bằng nút "Minh hoạ" trong demo, rồi báo người dùng đã thêm loại mới.

**Bối cảnh + trang phục** → `work/setup.json` `{ "scene": "…", "lea": "…", "mat": "…" }`
- Bối cảnh: `cafe` (mưa, ấm) · `salon` (tối, đèn) · `parc` (ngày, xanh) · `cuisine` (sáng, gạch xanh) · `biblio` (tối, xanh rêu) · `terrasse` (hoàng hôn, mái nhà tím) · `chalet` (tuyết, lò sưởi, gỗ) · `boulangerie` (sáng, xanh sage, bánh mì) · `train` (tàu chạy, ghế đỏ) · `quai` (sông Seine buổi tối, tím).
- Ưu tiên bối cảnh hợp chủ đề tập (du lịch → `train`, ăn uống → `boulangerie`/`cuisine`, mùa đông → `chalet`, tâm sự buổi tối → `salon`/`quai`); không trùng 3 tập gần nhất.
- Léa: `pull` vàng · `mariniere` sọc navy · `trench` be + béret đỏ · `chemise` xanh sage · `cardigan` cam đất.
  Mathieu: `denim` xanh · `hoodie` xám · `colroule` đen · `blazer` navy · `pull` xanh rêu.
- Trang phục phải khác tông nền: tránh đồ xanh sage/rêu ở `cuisine`, `parc`, `boulangerie`, `biblio`; tránh `colroule`/`blazer` (tối) ở `quai`, `salon`, `biblio`; tránh `cardigan` cam ở `chalet` (gỗ cam), `terrasse`. Hai nhân vật khác tông nhau.

**Ghi file theo lô** (tập dài rất nhiều đoạn): `work/parts/01.json`, `02.json`, … mỗi file một mảng ~60 đoạn `{ "who": "lea|mat", "fr": "…", "en": "…" }` (thêm `emote` / `react` / `illus` / `label` khi cần), theo thứ tự. Rồi:

```bash
node tools/assemble.mjs      # trong cozy-epNN/ → episode.json, kiểm tra khớp words.json
```

Sửa đến khi hết lỗi (lỗi báo đúng đoạn + chữ lệch).

## 3. Build + kiểm tra

```bash
node tools/build.mjs                         # cảnh báo "only X s apart" → đổi từ vựng
npx --yes hyperframes@0.9.16 check           # trong cozy-epNN/
npx --yes hyperframes@0.9.16 snapshot --at <t1>,<t2>,<t3>
```

- Cảnh báo được bỏ qua (cố ý): tương phản thấp của chữ chưa đọc (karaoke), thẻ từ ~4,4 s, track dày.
- Chụp ít nhất: một lúc đang có thẻ từ, một bong bóng minh hoạ, một biểu cảm, một lúc Léa nói, một lúc Mathieu nói, màn ôn tập cuối (`RECAP` ≈ giây cuối − 5). **Mở ảnh ra xem** (Read) trước khi render: phụ đề một dòng, thẻ không che mặt, đúng người đang nói.

## 4. Render

```bash
npx --yes hyperframes@0.9.16 render -o "$PWD/renders/<cozy-epNN>.mp4"    # trong cozy-epNN/
```

Chạy nền; tập 20 phút có thể mất khá lâu. Xong thì kiểm tra file tồn tại và thời lượng (`ffprobe`).

## 5. Báo người dùng

Ngắn gọn, tiếng Việt: đường dẫn MP4 (link markdown), bối cảnh + trang phục đã chọn, danh sách từ vựng (từ — nghĩa), số biểu cảm + minh hoạ đã đặt (và loại minh hoạ mới nếu có vẽ thêm), những đoạn đoán người nói không chắc (mốc thời gian) để họ nghe lại. **Không tự commit/push**: hỏi trước; khi commit thì không đưa `renders/` (đã gitignore) và hỏi có đưa `assets/voice.mp3` lên không (file lớn).

## Ghi chú

- Sửa hình nhân vật/bối cảnh: chỉ sửa `demo-animation-style.html` ở gốc repo (nguồn duy nhất), rồi build lại. Hiệu ứng chuyển động của bối cảnh trong video nằm ở `tools/build.mjs` (khối `scene ambience`), theo class: `.star .drop .glow .curtain .leaf .mote .bulbg .bird .snow .flame .ripple`, id `#leaves #canopy #clouds #hills #hillsfar #poles`.
- Công cụ của tập mới được chép từ `cozy-ep01/tools/` — sửa công cụ thì sửa ở `cozy-ep01` trước.
- Mọi chuyển động phải seek được: không `Math.random()` không seed, không `repeat:-1`.
