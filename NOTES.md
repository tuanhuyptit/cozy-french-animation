# Ghi chú dự án — The Cozy French animation

File này ghi lại các quyết định đã chốt để làm tiếp trên máy khác (hoặc với một phiên Claude mới).
Claude: đọc file này trước khi sửa gì trong repo.

## Kênh & khán giả
- Kênh: https://www.youtube.com/@TheCozyFrench — podcast tiếng Pháp B1–B2, hội thoại 2 người, 17–23 phút/tập, đăng mỗi ngày.
- Khán giả học bằng tiếng Anh → phụ đề dịch, nghĩa từ và câu ví dụ viết bằng **tiếng Anh**.
- Trước đây: ảnh minh hoạ tĩnh (nét bút chì màu, áo len vàng, quần jeans) + phụ đề cứng. Chuyển sang animation có highlight từ vựng.

## Phong cách đã chốt
- **Kiểu A — nhân vật cozy cố định**: 2 nhân vật ngồi bên bàn, chớp mắt, thở, mấp máy miệng theo từng chữ, nghiêng đầu khi nói. Không làm hoạt hình kể chuyện đầy đủ (quá tốn công cho lịch đăng mỗi ngày).
- **Nhân vật**: **Léa** (nữ, tóc nâu ngang vai) và **Mathieu** (nam, tóc xoăn, kính tròn). Không còn tên Hugo.
- **Chất liệu**: viền rung kiểu vẽ tay + hạt bút chì (SVG filter `#pencil`) + lớp grain giấy phủ toàn cảnh, để gần với nét minh hoạ cũ của kênh.
- **Bảng màu**: kem `#f6eddc`, mực `#3a2e28`, cam đất `#b8552a`/`#d9774b`, vàng bơ `#f3c96b`, xanh sage `#8fae8b`.
- **Font**: Nunito (phụ đề, thẻ), Playfair Display (tiêu đề từ, logo). Bản demo trình duyệt dùng Fraunces, bản video dùng Playfair Display vì HyperFrames có sẵn.
- 10 bối cảnh: `cafe`, `salon`, `parc`, `cuisine`, `biblio`, `terrasse`, `chalet` (tuyết + lò sưởi), `boulangerie`, `train` (phong cảnh trôi ngoài cửa sổ), `quai` (sông Seine buổi tối). 5 trang phục mỗi người (xem README). Chọn trang phục khác tông với bối cảnh (vd. tránh bếp xanh + đồ xanh).

## Highlight từ vựng
- Phụ đề karaoke: chữ xám nâu → sáng dần đúng lúc được đọc; từ khoá đổi màu cam đất + gạch chân vàng chạy.
- Thẻ từ: loại từ, từ, IPA, nghĩa tiếng Anh, câu ví dụ **mới** (không lặp câu trong hội thoại) + dịch.
- Mỗi tập khoảng **8–15 từ** B1–B2. Thẻ hiện ~4,5 s; nếu 2 từ quá sát nhau (< ~3 s) thì chọn từ khác (ví dụ tập thử đã đổi *déranger* → *il me faudra*).
- Bộ đếm "Mots clés n / N" góc trái; cuối video có màn "Aujourd'hui, on a appris…" ôn lại các từ.

## Quy trình một tập
Tự động: skill `skills/cozy-french-episode` (người dùng chỉ gửi voice). Bằng tay:
0. `node tools/new-episode.mjs voice.mp3` (gốc repo) tạo `cozy-epNN/` rồi chạy bước 1.
1. `node tools/transcribe.mjs voice.mp3` → `assets/voice.mp3`, `assets/words.json`, `episode.draft.json` (đã đoán người nói).
2. Duyệt `episode.draft.json`: sửa người nói nếu sai, viết `en`, bọc từ vựng bằng `[ ]`, thêm mục `vocab`, lưu thành `episode.json`. Mỗi đoạn phụ đề nên ≤ 1 dòng (~10 chữ).
3. `node tools/build.mjs` → `npx hyperframes check` → `npx hyperframes snapshot --at …` → `npx hyperframes render`.

## Chi tiết kỹ thuật cần nhớ
- **Nhận diện người nói** bằng cao độ giọng: Mathieu ~115–170 Hz, Léa ~180–230 Hz; ngưỡng mặc định 175 Hz (`--threshold`). Đây chỉ là đoán — luôn nghe lại các câu nối tiếp (vd. "Et que le repos…" là Léa nói tiếp ý của Mathieu).
- Whisper trên iMac này chạy ~bằng thời lượng audio (34 s voice ≈ 33 s).
- Whisper: `whisper-cli` + model đa ngôn ngữ `ggml-medium.bin`, `-l fr -ml 1 -sow -oj` để có mốc từng chữ. Model không nằm trong repo.
- `tools/build.mjs` lấy hình nhân vật + bối cảnh từ `../demo-animation-style.html` (nguồn duy nhất). Sửa hình ở file demo, rồi build lại.
- Chữ trong `episode.json` phải khớp đúng thứ tự chữ trong `words.json` (build báo lỗi nếu lệch).
- HyperFrames: mọi chuyển động phải seek được (không `Math.random` không seed, không `repeat:-1`). Các cảnh báo còn lại của `check` là cố ý: chữ chưa đọc có tương phản thấp (hiệu ứng karaoke), thẻ từ ~4,4 s.

## Trạng thái (2026-11-06)
- 2026-11-06: thêm 4 bối cảnh (chalet, boulangerie, train, quai), `new-episode.mjs`, `assemble.mjs`, skill `cozy-french-episode`; build cảnh báo khi 2 từ vựng < 3 s.
- Xong: demo trình duyệt (10 bối cảnh, 10 trang phục), video thử 34 s đầu của voice `4f.mp3` (`cozy-ep01-test-30s.mp4`), script transcribe + build.
- Chưa làm: nhạc nền / hiệu ứng âm thanh; tự động chia đoạn + dịch + chọn từ vựng cho tập 20 phút (nên để Claude làm từ `episode.draft.json`); intro/outro kênh; thumbnail.
