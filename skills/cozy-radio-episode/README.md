# Cozy French Radio — GPT

Bản cho ChatGPT của kênh Cozy French Radio. ChatGPT **không dựng được animation** (việc đó làm trong Claude Code với `SKILL.md` + thư mục `radio/` của repo). Trên ChatGPT, GPT này lo phần nội dung của một tập:

1. **Kịch bản** Léa nói một mình, ~20 phút (2.600–2.800 chữ), chia 6 phần: Ouverture → Le thème → Le mot du jour → Le courrier → La question de la semaine → Clôture. Chỉ có dòng `LÉA:`, không thẻ cảm xúc, đưa thẳng vào bước làm voice.
2. **Kế hoạch cảnh** cho animation (cảnh nào cho phần nào) để đưa sang Claude.
3. **Gói YouTube**: tiêu đề, mô tả tiếng Anh, chương theo từng phần, từ vựng, hashtag, và **luôn kết thúc bằng khối ghi công nhạc nền** "Meditation Impromptu 03" (Kevin MacLeod, CC BY 4.0).

## Cài vào ChatGPT (Custom GPT)
1. ChatGPT → Explore GPTs → **Create** → tab **Configure**.
2. **Name:** Cozy French Radio · **Description:** Gửi topic, nhận kịch bản Léa + gói YouTube cho kênh Radio.
3. **Instructions:** dán toàn bộ `GPT-INSTRUCTIONS.md` (~6.000 ký tự, dưới giới hạn 8.000).
4. **Knowledge:** upload `references/radio-blueprint.md` (6 phần, số chữ, phong cách, danh sách cảnh), `references/character-bible.md` (hồ sơ Léa — chép từ skill script của kênh chính; khi kênh chính cập nhật thì upload lại) và `references/music-credit.txt` (khối ghi công).
5. **Capabilities:** tắt Image Generation (thumbnail dùng GPT riêng `cozy-radio-thumbnail`). Web Search không cần.
6. **Conversation starter:** `Topic: Oser dire non` / `Topic: Patience` + dán bình luận người xem để đọc trong phần Le courrier.

Không dùng Custom GPT? Tạo **ChatGPT Project**, dán `GPT-INSTRUCTIONS.md` vào Project instructions, upload 3 file trong `references/` vào Project files.

## Dùng
1. Gửi `Topic: …` (thêm script đối thủ nếu có, thêm bình luận thật nếu muốn Léa đọc thư thật).
2. GPT trả **kế hoạch** bằng tiếng Việt → sửa hoặc gõ `ok`.
3. GPT viết **3 phần**, gõ `suite` để sang phần tiếp. Phần 3 kèm từ vựng, kế hoạch cảnh, tự kiểm tra và gói YouTube.
4. Chép lời thoại (các dòng `LÉA:` và `#`) vào file `.txt` → đưa Claude làm voice → làm video Radio.

Kiểm tra lần cuối trước khi đăng: mô tả YouTube phải **kết thúc** bằng đúng 2 dòng trong `references/music-credit.txt`.
