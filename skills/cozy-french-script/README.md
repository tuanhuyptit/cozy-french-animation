# Cozy French — Script GPT

Skill cho ChatGPT viết kịch bản tiếng Pháp cho The Cozy French: gửi **topic + script tiếng Anh của đối thủ** → GPT phân tích, lên kế hoạch Pháp hoá, rồi viết kịch bản Léa & Mathieu (~2.500 từ ≈ 18–19 phút), đúng định dạng để đưa thẳng vào bước làm voice.

## Cài vào ChatGPT (Custom GPT)
1. ChatGPT → Explore GPTs → **Create** → tab **Configure**.
2. **Name:** Cozy French Script · **Description:** Gửi topic + script đối thủ, nhận kịch bản Léa & Mathieu.
3. **Instructions:** dán toàn bộ `GPT-INSTRUCTIONS.md` (~5.500 ký tự, dưới giới hạn 8.000).
4. **Knowledge:** upload `references/episode-blueprint.md` (khung 11 phần, Pháp hoá, đổi thành ngữ) và `references/exemple-ep03.txt` (đoạn kịch bản thật của kênh để bắt giọng).
5. **Capabilities:** tắt Image Generation; Web Search tuỳ (không cần).
6. **Conversation starter:** `Topic: Night routine` + dán script.

Không dùng Custom GPT? Tạo một **ChatGPT Project**, dán `GPT-INSTRUCTIONS.md` vào Project instructions và upload 2 file trong `references/` vào Project files.

## Cách dùng
1. Gửi: `Topic: <chủ đề>` + dán script tiếng Anh của đối thủ (lấy từ transcript YouTube). Có thể thêm `Level: A2–B1` nếu muốn khác B1–B2.
2. GPT trả **kế hoạch** bằng tiếng Việt (phân tích đối thủ, 2 câu chuyện mới kiểu Pháp, 14 từ vựng, tên tập) → sửa hoặc gõ `ok`.
3. GPT viết **3 phần**; gõ `suite` để sang phần tiếp. Phần 3 kèm danh sách từ vựng + tự kiểm tra + gợi ý tiêu đề YouTube.
4. Chép phần lời thoại (bỏ khối `# Vocabulaire`) vào file `.txt` → gửi Claude "làm voice" (skill `cozy-french-voice`). Các dòng `#` là tiêu đề phần, script voice tự bỏ qua; dòng trống = nghỉ dài hơn.

Kịch bản **không có thẻ cảm xúc** — chỉ `LÉA:` / `MATHIEU:` và dấu câu. Nếu GPT lỡ thêm `[rires]`, `(pause)`… hãy nhắc: "bỏ hết ngoặc và thẻ".

## Phân tích đối thủ (11/2026) — vì sao khung như vậy
| | Speak English With Class (English Leap) | Mr. English Channel |
|---|---|---|
| Quy mô | 1,61M sub; video top 5,4M view | 1,56M sub; đăng gần như mỗi ngày |
| Độ dài | 22–37 phút, ~200 từ/phút | 15–18 phút |
| Cấu trúc | Chào + mục tiêu tập → kêu gọi tương tác bằng emoji riêng (🚀/🌱) → chuyện cá nhân hài, cụ thể → từ giải thích ngay khi xuất hiện → insight cảm xúc → nhập vai, dừng cho người nghe trả lời → bài tập nói theo khung câu → Word Tour (5 từ) + Say It Better (5 thành ngữ) → chào + câu chốt gọi lại chuyện đầu tập | Chuyện nhỏ hài → chủ đề → chức năng giao tiếp từng bước → hội thoại mẫu có báo đầu/cuối → góc nhìn ngược lại → chào + gọi lại câu đùa đầu |

Chuyển sang kênh mình: tiếng Pháp chậm ~135 từ/phút nên script đối thủ phải **cô đọng còn 2.400–2.700 từ**; đổi tên, địa điểm, văn hoá, thành ngữ sang đời sống Pháp; và **chỉ mượn cấu trúc** — câu chuyện, câu đùa, ví dụ phải mới (tránh bị coi là nội dung phái sinh / reused content khi bật kiếm tiền).
