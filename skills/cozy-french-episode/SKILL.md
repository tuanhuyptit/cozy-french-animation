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
- Script in ra bối cảnh/trang phục/từ vựng của các tập trước, rồi chạy `tools/pick-setup.mjs` để bốc ngẫu nhiên chế độ + bối cảnh + trang phục vào `work/setup.json`.

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

**Bảng giải thích**: khi một người giải thích một cách nói, so sánh, liệt kê, chia động từ, đố vui, hoặc hai người đóng vai một tình huống, chuyển sang cảnh bảng (nhân vật thu nhỏ ở hai góc dưới, phụ đề vẫn chạy).
- Nền (`"bg"`, mặc định `liege` hoặc `"boardBg"` ở đầu `episode.json`): `liege` bảng ghim gỗ (hiện mờ dần) · `craie` bảng phấn xanh (rơi từ trên xuống, chữ phấn) · `carnet` trang sổ tay kẻ dòng (trượt từ dưới lên, mực xanh + băng dính washi). Đổi nền giữa các lần trong tập cho đỡ đơn điệu (vd. từ vựng → `liege`, ngữ pháp/chia động từ → `carnet`, so sánh/sơ đồ → `craie`).
- Mở ở đoạn đầu: `"board": { "mode": "word", "note": "= giải thích ngắn bằng tiếng Pháp (lấy từ lời thoại)", "icon": "<loại minh hoạ, tuỳ chọn>" }`; đóng ở đoạn cuối: `"boardEnd": true`.
  - `word`: tờ giấy ghi cụm từ (tự lấy từ thẻ từ vựng nằm trong đoạn, thẻ nhỏ không hiện nữa) + giấy note vàng + ảnh polaroid nếu có `icon`. Có thể ghi đè `word`, `tag`, `ipa`, `mean`, `ex`, `exEn`.
  - `sketch`: `{ "mode": "sketch", "title": "En situation : …" }` — mỗi câu trong đoạn thành một bong bóng thoại ghim lên bảng (4 bong bóng một trang; câu cùng người bị cắt đôi tự ghép lại).
  - `compare`: `{ "mode": "compare", "title": "tu ou vous ?", "left": { "head": "tu", "sub": "informel", "items": ["un ami", "la famille"] }, "right": { "head": "vous", "sub": "poli", "items": [...] } }` — hai cột, tiêu đề cột hiện trước, các dòng hiện xen kẽ trái/phải.
  - `steps`: `{ "mode": "steps", "title": "Ma routine du soir", "items": ["…", "…"] }` — 2–6 bước đánh số hiện lần lượt, bước trước mờ đi.
  - `conjug`: `{ "mode": "conjug", "verb": "se changer", "tense": "présent", "rows": [["je","me chang|e"], ["tu","te chang|es"], …], "note": "…" }` — bảng chia động từ, phần sau `|` (đuôi) được tô màu; 2–8 dòng.
  - `mindmap`: `{ "mode": "mindmap", "word": "la routine", "icon": "<minh hoạ, tuỳ chọn>", "items": ["…", …] }` — từ ở giữa, 2–6 nhánh từ liên quan vẽ ra lần lượt.
  - `quiz`: `{ "mode": "quiz", "q": "Câu hỏi ?", "options": ["…","…","…"], "answer": 0, "reveal": 3, "explain": "…" }` — 2–4 lựa chọn, đáp án đúng sáng xanh + dấu ✓ ở đoạn `reveal` (số thứ tự đoạn tính từ đoạn mở bảng, 0 = đoạn đầu; mặc định đoạn cuối), `explain` hiện ngay sau.
  - Mục (`items`, dòng `rows` thêm phần tử thứ 3) tự rải đều theo thời lượng bảng; muốn hiện đúng lúc được nói thì viết `{ "text": "…", "at": n }` (n = đoạn thứ n của bảng). Nội dung trên bảng bằng tiếng Pháp, lấy từ lời thoại.
- Hai đoạn bảng cách nhau < 1,5 s dùng chung một lần chuyển cảnh (vd. `word` rồi `sketch` ngay sau; dùng nền của đoạn đầu).
- Khoảng 6–10 lần mỗi tập 20 phút, mỗi lần 10–40 s; trộn nhiều kiểu (không chỉ `word`). Không đặt bong bóng minh hoạ trong lúc có bảng (build báo lỗi).

**Hành động** (tự động theo lời thoại, không cần đánh dấu): vẫy tay `wave` (bonjour, salut, au revoir, à bientôt…), đếm ngón tay `count` (d'abord, premièrement, deux choses…), nhún vai `shrug` (je sais pas, bof, ça dépend, peut-être…), gãi đầu `scratch` (euh, hmm, comment dire, bonne question…); gật đầu khi câu mở bằng *oui / exactement / voilà / d'accord…*, người nghe thỉnh thoảng gật đầu. Ép bằng `"act": "<kiểu>"` trong đoạn (`wave|shrug|count|scratch|beat|palm|up|point|think`), `"act": "nod"` = người nghe gật đầu, `"act": "none"` = tắt hành động tự động ở đoạn đó.
Khi **đi dạo** có thêm 10 cử chỉ tay (cũng tự chọn theo lời thoại, ép được bằng `"act"`): `explain` ngửa tay giải thích · `regarde` chỉ phía trước (regarde, là-bas, tiens) · `coeur` tay lên ngực (j'adore, merci, franchement) · `pouce` giơ ngón cái (génial, super, parfait) · `bof` lắc bàn tay · `pince` chụm ngón nhấn mạnh (exactement, justement) · `rire` che miệng cười · `menton` vuốt cằm (je me demande, bonne question; câu hỏi) · `poche` đút tay túi (người nghe, tự động) · `grand` dang hai tay (énorme, incroyable).
- Trong `work/src*.txt` (nếu viết dạng dòng `who|fr|en|extra`): thêm `B={json}` ở cuối phần extra để mở, `BE` để đóng; `work/convert.mjs` đổi thành `parts/*.json`.
- Snapshot ít nhất một lần cho mỗi kiểu bảng/nền đã dùng để chắc chữ không tràn khung.

**Chế độ + bối cảnh + trang phục** → `work/setup.json` `{ "scene": "…", "lea": "…", "mat": "…" }` — **chọn ngẫu nhiên**, `new-episode.mjs` đã tự chạy:
```bash
node tools/pick-setup.mjs cozy-epNN --write        # ở gốc repo; in ra lựa chọn + ghi work/setup.json
```
- Script tự chọn chế độ (ngồi / đi dạo, ~30 % đi dạo khi có cảnh đi dạo chưa dùng gần đây), bối cảnh không trùng 3 tập trước, trang phục không trùng 2 tập trước và không bị trùng tông với nền hay giữa hai người (bảng luật nằm trong script). Kết quả cố định theo tên tập; muốn bốc lại: `--seed 2`.
- Giữ nguyên lựa chọn ngẫu nhiên. Chỉ đổi khi chủ đề tập rõ ràng đòi một bối cảnh (vd. tập về mùa đông → `--scene chalet`, tập nấu ăn → `--scene cuisine`) hoặc chủ kênh yêu cầu: chạy lại với `--scene` / `--mode sit|walk` / `--lea` / `--mat`.
- Chế độ **ngồi** (`sit`): hai người ngồi bên bàn — bối cảnh `cafe` · `salon` · `parc` · `cuisine` · `biblio` · `terrasse` · `chalet` · `boulangerie` · `train` · `quai` · `marche` · `plage` · `atelier` · `lavande` · `bureau`.
- Chế độ **đi dạo** (`walk`): hai người đi cạnh nhau giữa màn hình, nền trôi nhiều lớp — bối cảnh `promenade` (dọc sông Seine buổi tối) · `ruelle` (phố Montmartre ban ngày, quán cà phê) · `automne` (đường mòn rừng thu, lá rơi) · `corniche` (đường dạo ven biển, cọ, ghế xanh) · `village` (làng núi tuyết buổi tối, tuyết rơi) · `jardin` (vườn kiểu Pháp, cung điện, hồ thuyền đồ chơi). Mathieu đi trước nhìn đường, chỉ quay đầu lại khi anh ấy nói; có từ mới / bong bóng minh hoạ thì camera lia sang một bên và thẻ rơi xuống phía còn lại; không uống cà phê, không lắc lư — thay bằng cử chỉ tay khi đi. Chế độ do bối cảnh quyết định, `episode.json` chỉ cần `scene`.
- Léa: `pull` vàng · `mariniere` sọc navy · `trench` be + béret đỏ · `chemise` xanh sage · `cardigan` cam đất · `pois` váy chấm bi navy · `jean` áo khoác jean xanh đậm · `lilas` sweat tím lilas chữ Paris · `foulard` sơ mi trắng + khăn đỏ · `doudoune` áo phao đỏ rượu + khăn len (chỉ `chalet`, `village`).
  Mathieu: `denim` xanh · `hoodie` xám · `colroule` đen · `blazer` navy · `pull` xanh rêu · `carreaux` sơ mi caro đỏ · `velours` vest nhung camel · `polo` polo vàng mù tạt · `gilet` cardigan xám + sơ mi xanh nhạt · `tablier` áo thun trắng + tạp dề (chỉ `cuisine`, `boulangerie`).
  Khi đi dạo, quần và giày tự theo bộ đồ (giày búp bê / bốt / giày thể thao / giày da).
- Luật tránh trùng tông (đã có trong `pick-setup.mjs`, chỉ cần nhớ khi chọn tay): tránh đồ xanh sage/rêu ở `cuisine`, `parc`, `boulangerie`, `biblio`; tránh `colroule`/`blazer` (tối) ở `quai`, `salon`, `biblio`; tránh `cardigan` cam ở `chalet` (gỗ cam), `terrasse`; tránh `lilas` ở `lavande`, `quai`, `terrasse` (tím); tránh `velours`/`polo` ở `marche`, `atelier` (gỗ/vàng); tránh đồ trắng (`foulard`, `tablier`, `gilet`) ở `bureau`, `plage` (nền sáng); `jean`/`denim` không đi cùng nhau; `pull` (Léa, vàng) không đi cùng `polo`; `doudoune` chỉ cho `chalet` hoặc tập về mùa đông. Hai nhân vật khác tông nhau.

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

## 4. Link preview — DỪNG, chờ người dùng duyệt

**Không bao giờ render trước khi người dùng nói OK.** Sau bước 3:

```bash
npx --yes hyperframes@0.9.16 preview --background --no-open      # trong cozy-epNN/
npx --yes hyperframes@0.9.16 preview --status --json             # lấy result.studioUrl
```

- Mở `studioUrl` (vd. `http://127.0.0.1:3002/#project/cozy-epNN`) trong Browser pane (`mcp__Claude_Browser__navigate`) để người dùng xem ngay, và gửi link đó trong tin nhắn (link chỉ mở được trên máy này).
- Tin nhắn gửi kèm (tiếng Việt, ngắn): link preview; bối cảnh + trang phục; từ vựng (từ — nghĩa — mốc thời gian); số biểu cảm + minh hoạ; **các đoạn đoán người nói không chắc** (mốc thời gian) để họ nghe lại; hướng dẫn: bấm ▶ trong khung Preview, kéo thanh thời gian để tua.
- Kết thúc lượt bằng `wrap_up` hỏi "Render tập này?" với nút **Render** / **Cần sửa**, rồi chờ.
- Người dùng yêu cầu sửa (người nói, bản dịch, từ vựng, biểu cảm, minh hoạ, bối cảnh…) → sửa `work/` → `node tools/assemble.mjs` → `node tools/build.mjs` → `check`. Studio tự tải lại; báo lại link (vẫn link cũ) và chờ duyệt tiếp.

## 5. Render (chỉ sau khi người dùng OK)

```bash
npx --yes hyperframes@0.9.16 preview --stop                                # trong cozy-epNN/
npx --yes hyperframes@0.9.16 render -o "$PWD/renders/<cozy-epNN>.mp4"
```

Chạy nền; trên iMac M1 mất ~2× thời lượng video (tập 20 phút ≈ 40+ phút) — báo người dùng một câu. Xong thì kiểm tra file tồn tại và thời lượng (`ffprobe`).

## 5b. YouTube SEO (làm trong lúc render chạy nền)

```bash
node tools/youtube-seo.mjs cozy-epNN     # ở gốc repo → cozy-epNN/youtube/{outline.txt, vocab.md, captions.fr.srt, captions.en.srt}
```

Viết `cozy-epNN/youtube-seo.md` theo đúng mẫu `cozy-ep02/youtube-seo.md` (tiếng Anh cho khán giả, ghi chú tiếng Việt cho chủ kênh):
- **3 tiêu đề** ≤ 100 ký tự, từ khoá trong ~50 ký tự đầu: (1) câu móc tiếng Anh + 🇫🇷 + `Slow French Conversation (<trình độ>) | French Podcast with Subtitles`; (2) `Learn/Talk … in French: <chủ đề> (<trình độ>) | FR/EN Subtitles`; (3) `« cụm tiếng Pháp hay nhất tập » — Real French for <chủ đề> | <trình độ> Podcast`. Không đánh số tập trong tiêu đề. Trình độ lấy từ lời thoại nếu tập có nói (vd. "niveau A2 à B1"), không thì ghi A2–B1 và báo chủ kênh kiểm.
- **Mô tả**: 2 dòng đầu chứa "Learn French", "slow conversation", chủ đề, trình độ, "French & English subtitles" → đoạn tóm tắt (nhắc chi tiết vui trong tập) → 4 dòng ✔ → `⏱ CHAPTERS` 12–16 chương lấy từ `outline.txt` (bắt đầu `0:00`, mỗi chương ≥ 10 s, ưu tiên mốc ◆ bảng giải thích, tên chương có cụm tiếng Pháp) → `📚 VOCABULARY` (từ — nghĩa, từ `vocab.md`) → câu hỏi bình luận lấy từ cuối tập + câu mẫu tiếng Pháp → link đăng ký `https://www.youtube.com/@TheCozyFrench?sub_confirmation=1` → đúng 3 hashtag `#LearnFrench #FrenchPodcast #FrenchConversation`.
- **Tags** ≤ 500 ký tự: bộ cố định (the cozy french, french podcast, learn french, french conversation, slow french, french listening practice, french with subtitles, french podcast with subtitles, french A2, french B1, intermediate french, comprehensible input french, podcast français, français facile, apprendre le français) + 5–7 tag theo chủ đề/cụm từ của tập.
- Kiểm độ dài (tiêu đề ≤ 100, mô tả ≤ 5000, tags ≤ 500) trước khi gửi.

## 6. Báo người dùng

Ngắn gọn, tiếng Việt: đường dẫn MP4 (link markdown), thời lượng, link `youtube-seo.md` + tiêu đề đề xuất, nhắc tải 2 file `.srt` lên YouTube Studio. **Không tự commit/push**: hỏi trước; khi commit thì không đưa `renders/` (đã gitignore) và hỏi có đưa `assets/voice.mp3` lên không (file lớn).

## Ghi chú

- Sửa hình nhân vật/bối cảnh: chỉ sửa `demo-animation-style.html` ở gốc repo (nguồn duy nhất), rồi build lại. Hiệu ứng chuyển động của bối cảnh trong video nằm ở `tools/build.mjs` (khối `scene ambience`), theo class: `.star .drop .glow .curtain .leaf .mote .bulbg .bird .snow .flame .ripple .flag .wave .boat .lav .firefly .clockhand`, id `#leaves #canopy #clouds #hills #hillsfar #poles #sunglow #beam`. Cử chỉ tay + gật đầu nằm ở khối GEST-RUNTIME, dáng đi + quay đầu + camera lia ở khối WALK-RUNTIME trong demo (build chép nguyên văn); lớp nền trôi của cảnh đi dạo khai báo bằng `data-roll="bề rộng ô,tốc độ"`. Phần riêng của từng chế độ (vị trí nhân vật, cử chỉ, uống cà phê / đi bộ, camera lia, góc thu nhỏ khi mở bảng) nằm ở `tools/staging.mjs` — mỗi chế độ một khối. Hoa văn vải (`<pattern>`) lấy từ `<defs>` ẩn đầu file demo.
- Công cụ của tập mới được chép từ `cozy-ep01/tools/` — sửa công cụ thì sửa ở `cozy-ep01` trước.
- Mọi chuyển động phải seek được: không `Math.random()` không seed, không `repeat:-1`.
