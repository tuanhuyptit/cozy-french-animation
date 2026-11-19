# Cozy French Books — playlist review sách (Léa một mình)

Khung dùng lại cho mọi tập. Mỗi tập chỉ cần: voice + script, `plan.mjs` (cái gì hiện lúc nào), `art.mjs` (vài trang tranh của cuốn sách đó).

## File

| Đường dẫn | Là gì | Dùng lại? |
|---|---|---|
| `art.mjs` | Góc đọc sách (`NOOK_BG/FG`), kệ sách mở đầu, sổ tay, bìa sách tự vẽ (`COVER`) | dùng chung |
| `scenes.mjs` | Thư viện **nơi chốn** dùng chung (bảng ở đầu file): campagne, chemin, interieur, placeMer, mer, marche, boutique, oasis, desertNuit, pyramides | dùng chung |
| `kit.mjs` | Bộ vẽ: nhân vật giấy `PERSON({robe, head:'turban'/'scarf'/'crown'/'hood'/'fez', beard, old…})`, icon (`ICON`), bong bóng, trời/đồi/biển/đồi cát/cọ/nhà, bản đồ hành trình `MAP(stops)` | dùng chung |
| `tools/chunk.mjs` | Chia phụ đề ≤ 50 ký tự, chia đều từng câu, không chữ mồ côi | dùng chung |
| `tools/build.mjs` | Dựng project HyperFrames của một tập | dùng chung |
| `epNN/plan.mjs` | `BOOK`, `SEGS`, `VOCAB` của tập | mỗi tập |
| `epNN/art.mjs` | `PAGES` = `page(SCENES.x(), nhân vật, đồ vật)`: chỉ phần riêng của cuốn sách | mỗi tập |
| `tools/build-demo.mjs`, `books-demo.html` | Bản demo 2 phút đầu (trình duyệt) | tham khảo |

## Quy trình một tập (ở gốc repo)

```bash
mkdir -p books/epNN/{tools,work,assets}; cp cozy-ep01/tools/transcribe.mjs books/epNN/tools/
cd books/epNN && node tools/transcribe.mjs "<voice.mp3>"            # → assets/voice.mp3, assets/words.json
(echo "Tiêu đề"; cat "<script>.txt") > work/script.txt                 # dòng đầu là tiêu đề (align bỏ qua)
node ../../radio/tools/align-script.mjs --write                         # chính tả theo script
node ../tools/chunk.mjs > work/chunks.txt                               # phụ đề, đánh số
# viết work/en.json (mỗi đoạn một dòng tiếng Anh ≤ 56 ký tự), plan.mjs, art.mjs
cd ../.. && node books/tools/build.mjs books/epNN
cd books/epNN && npx --yes hyperframes@0.9.16 preview --background --no-open   # gửi link Studio, chờ duyệt
```
Render (chỉ sau khi chủ kênh OK): 1080p rồi upscale 1440p như các kênh khác.

## plan.mjs

Mốc (`c`) = số đoạn phụ đề trong `work/chunks.txt`, hoặc `[đoạn, 'chữ trong đoạn']`; `until` âm = số giây trước khi cảnh hết.

- `BOOK`: `{ title, author, year, genre, ep, lea (trang phục), map: { stops: [...] } }`
- `SEGS`: mỗi cảnh bắt đầu ở đoạn `c`, kéo tới cảnh sau:
  - `shelf`: mở đầu (kệ sách, bìa, tên kênh)
  - `nook`: Léa nói ở góc đọc. `book: { c }` thẻ "Le livre du jour"; `q: [{ c, text }]` câu hỏi viết tay
  - `carnet`: sổ tay. `title`, `left/right: { head?, headAt?, items: [{ c, text, label?, icon?, style? }] }`; style: `accent`, `thought`, `check`, `big`, `small`
  - `page`: trang tranh `page: 'tên trong PAGES'`, `beats`:
    `tag`, `bubble: 'icon'`, `say`, `note`, `signs: [...]`, `show/hide/fadeIn` (`who` = nhân vật, `sel` = đồ vật), `walk: [dx, dy, scale]` + `dur`, `flip: -1|1`, `dig`, `glow`, `wind`, `pan`, `map: số ga`, `ret` (đường về)
  - `chap`: thẻ chương `{ n, title, sub, icon }`
  - `fiche`: phiếu đọc sách `{ rows: [{ c, label, text }], rating, ratingAt }`
- `VOCAB`: `{ c, phrase (đúng chữ trong đoạn), tag, word, ipa, mean, ex, exEn }`, ~1 từ/1,5 phút, cách nhau ≥ 15 s

## Trang tranh (epNN/art.mjs)

`{ w, ground, layers: [{ cls: sky|far|mid|near|fore, k, lift?, svg }], pups: [{ name, svg, x, y, s?, flip?, hidden? }], props }`.
Chân nhân vật đặt ở y ≤ 800 (khung phụ đề che phần dưới). Đồ vật ẩn lúc đầu đặt class `chest`, `hole`, `tea`, `jar`, `jc`, `stones`, `sparks` (hoặc dùng `hide` ở beat đầu).

## Phong cách đã chốt

- **Nhạc nền:** "Meditation Impromptu 03" (Kevin MacLeod, CC BY 4.0) ở `assets/music/`, −15 dB, đặt bằng `BOOK.music` trong `plan.mjs`. **Mô tả YouTube của mọi tập phải kết thúc bằng khối trong `assets/music/CREDIT.txt`.**
- **Âm thanh:** `tools/sfx.mjs` tự tổng hợp hiệu ứng (lật trang, bước chân, xu, lấp lánh, đào, gió…) và âm nền theo cảnh (`amb` của từng trang trong `art.mjs`; góc đọc = mưa).
- **SEO:** `node tools/youtube-seo.mjs books/epNN` (gốc repo) → `youtube/` (outline, vocab, phụ đề .srt), rồi viết `youtube-seo.md` theo mẫu `ep01`.

- Chuyển động nhẹ: mờ dần, trượt ngắn, máy quay trôi chậm, nhân vật nhún nhẹ. Không lật trang 3D (chỉ có trong demo).
- Phụ đề giống The Cozy French: khung viền, nhãn "Léa", chữ Pháp và Anh cùng 44 px, mỗi dòng ≤ 50 / 56 ký tự.
- Không dùng `clip-path`, `filter` CSS, `radial-gradient` cho phần tử động (gây khung đen khi render).
- Không chép bìa sách thật; bìa do kênh tự vẽ (`COVER`).

## Tập đã làm

| Tập | Sách | Nơi chốn dùng | Thêm mới vào thư viện |
|---|---|---|---|
| ep01 | L'Alchimiste — Paulo Coelho | cả 10 nơi chốn hiện có | toàn bộ khung: scenes, kit (PERSON, ICON, PROP, BOAT, MAP), sfx + âm nền |

Quy trình đầy đủ (kể cả cách thêm hình mới để dùng lại): skill `skills/cozy-books-episode/SKILL.md`.
