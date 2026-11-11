# Cozy French — Script GPT

Skill cho ChatGPT viết kịch bản tiếng Pháp cho The Cozy French: gửi **topic + script tiếng Anh của đối thủ** → GPT phân tích, lên kế hoạch Pháp hoá, rồi viết kịch bản Léa & Mathieu (~2.750 từ ≈ 20 phút), đúng định dạng để đưa thẳng vào bước làm voice.

## Cài vào ChatGPT (Custom GPT)
1. ChatGPT → Explore GPTs → **Create** → tab **Configure**.
2. **Name:** Cozy French Script · **Description:** Gửi topic + script đối thủ, nhận kịch bản Léa & Mathieu.
3. **Instructions:** dán toàn bộ `GPT-INSTRUCTIONS.md` (~7.100 ký tự, dưới giới hạn 8.000).
4. **Knowledge:** upload `references/episode-blueprint.md` (khung 11 phần, Pháp hoá, đổi thành ngữ, §9 phong cách nói chuyện), `references/exemple-style.txt` (đoạn mẫu giọng mới), `references/conversation-moves.md` (kho cách nói tự nhiên), `references/character-bible.md` (hồ sơ nhân vật) và `references/exemple-ep03.txt` (đoạn kịch bản thật của kênh để bắt giọng).
5. **Capabilities:** tắt Image Generation; Web Search tuỳ (không cần).
6. **Conversation starter:** `Topic: Night routine` + dán script.

Không dùng Custom GPT? Tạo một **ChatGPT Project**, dán `GPT-INSTRUCTIONS.md` vào Project instructions và upload 5 file trong `references/` vào Project files.

## Dùng trong Claude Code (khuyên dùng)
Cài một lần mỗi máy (từ gốc repo):
```bash
ln -s "$PWD/skills/cozy-french-script" ~/.claude/skills/cozy-french-script
```
1. **Lấy script đối thủ:** mở video YouTube → "Show transcript" → chép hết vào một file `.txt` (vd. `~/Downloads/script.txt`). Không cần dọn `[music]`, `[laughter]`.
2. **Gửi cho Claude:** `viết kịch bản từ ~/Downloads/script.txt` — thêm nếu muốn: `topic: ...`, `level: A2–B1` (mặc định B1–B2), ý riêng (vd. "câu chuyện của Léa ở chợ").
3. **Duyệt kế hoạch** (tiếng Việt): phân tích nhịp tập đối thủ, 8–12 "cách nói" nhặt từ 2 người dẫn đối thủ (đã đổi sang câu tiếng Pháp mới), góc Pháp hoá, 2 câu chuyện mới, 2–3 hình ảnh có tên, 14 từ vựng, tên tập + tiêu đề YouTube. Sửa gì thì nói thẳng, xong gõ `ok`.
4. **Nhận 2 file trong `~/Downloads/`:** `<chủ-đề>.txt` (chỉ lời thoại `LÉA:` / `MATHIEU:` + dòng `#`, 2.700–2.850 chữ ≈ 20 phút, đã đếm bằng `wc -w`) và `<chủ-đề>.vocab.md` (từ vựng + nghĩa tiếng Anh + ví dụ).
5. **Sửa nếu cần:** "đoạn 6 dài quá", "Mathieu hài hơn", "đổi từ X" — Claude sửa thẳng trong file.
6. **Bước tiếp:** "làm voice từ file này" (`cozy-french-voice`) → "làm tập mới từ voice này" (`cozy-french-episode`).

Mẹo: gửi 1 script mỗi lần; script đối thủ chỉ để mượn khung và nhịp — câu chuyện, câu đùa, hình ảnh luôn được viết mới.

## Dùng trên ChatGPT
1. Gửi: `Topic: <chủ đề>` + dán script tiếng Anh của đối thủ (lấy từ transcript YouTube). Có thể thêm `Level: A2–B1` nếu muốn khác B1–B2.
2. GPT trả **kế hoạch** bằng tiếng Việt (phân tích đối thủ, 8–12 "cách nói" nhặt từ 2 người dẫn đối thủ kèm câu tiếng Pháp mới, 2 câu chuyện mới kiểu Pháp, 14 từ vựng, tên tập) → sửa hoặc gõ `ok`.
3. GPT viết **3 phần**; gõ `suite` để sang phần tiếp. Phần 3 kèm danh sách từ vựng + tự kiểm tra + gợi ý tiêu đề YouTube.
4. Chép phần lời thoại (bỏ khối `# Vocabulaire`) vào file `.txt` → gửi Claude "làm voice" (skill `cozy-french-voice`). Các dòng `#` là tiêu đề phần, script voice tự bỏ qua; dòng trống = nghỉ dài hơn.

Kịch bản **không có thẻ cảm xúc** — chỉ `LÉA:` / `MATHIEU:` và dấu câu. Nếu GPT lỡ thêm `[rires]`, `(pause)`… hãy nhắc: "bỏ hết ngoặc và thẻ".

## Phân tích đối thủ (11/2026) — vì sao khung như vậy
| | Speak English With Class (English Leap) | Mr. English Channel |
|---|---|---|
| Quy mô | 1,61M sub; video top 5,4M view | 1,56M sub; đăng gần như mỗi ngày |
| Độ dài | 22–37 phút, ~200 từ/phút | 15–18 phút |
| Cấu trúc | Chào + mục tiêu tập → kêu gọi tương tác bằng emoji riêng (🚀/🌱) → chuyện cá nhân hài, cụ thể → từ giải thích ngay khi xuất hiện → insight cảm xúc → nhập vai, dừng cho người nghe trả lời → bài tập nói theo khung câu → Word Tour (5 từ) + Say It Better (5 thành ngữ) → chào + câu chốt gọi lại chuyện đầu tập | Chuyện nhỏ hài → chủ đề → chức năng giao tiếp từng bước → hội thoại mẫu có báo đầu/cuối → góc nhìn ngược lại → chào + gọi lại câu đùa đầu |

Chuyển sang kênh mình: tiếng Pháp chậm ~137 từ/phút (đo trên voice tập 02–08) nên script đối thủ phải **cô đọng còn 2.700–2.850 từ**; đổi tên, địa điểm, văn hoá, thành ngữ sang đời sống Pháp; và **chỉ mượn cấu trúc** — câu chuyện, câu đùa, ví dụ phải mới (tránh bị coi là nội dung phái sinh / reused content khi bật kiếm tiền).
