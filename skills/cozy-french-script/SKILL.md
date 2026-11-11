---
name: cozy-french-script
description: Viết kịch bản tiếng Pháp Léa & Mathieu (~2.750 từ, ~20 phút, B1–B2) cho kênh The Cozy French từ một topic + script tiếng Anh của kênh đối thủ (English podcast) — chỉ mượn cấu trúc, Pháp hoá câu chuyện, văn hoá, thành ngữ; xuất dạng LÉA:/MATHIEU: không thẻ cảm xúc, sẵn sàng cho cozy-french-voice. Dùng khi người dùng gửi topic/script đối thủ và nói "viết kịch bản", "viết script", "làm nội dung tập mới". Bản cho ChatGPT nằm ở GPT-INSTRUCTIONS.md.
---

# The Cozy French — viết kịch bản

Làm đúng theo `GPT-INSTRUCTIONS.md` trong thư mục này (bản dùng chung với ChatGPT), đọc thêm:
- `references/episode-blueprint.md` — khung 11 phần + số chữ, bảng Pháp hoá, bảng đổi thành ngữ.
- `references/exemple-style.txt` — đoạn mẫu giọng nói chuyện mục tiêu (blueprint §9); ưu tiên bắt giọng theo file này.
- `references/conversation-moves.md` — kho "cách nói" tự nhiên rút từ script đối thủ + 3 quy tắc biến đổi; mỗi tập nhặt 8–12 cách nói từ script mới, đưa vào kế hoạch.
- `references/character-bible.md` — chi tiết nhân vật dùng xuyên các tập; đọc trước khi lên kế hoạch, không được mâu thuẫn. Viết xong tập thì tự thêm chi tiết mới vào file này.
- `references/exemple-ep03.txt` — đoạn kịch bản thật của kênh (giọng cũ, nhiều giải thích hơn).

Khác với bản ChatGPT:
- Không cần chia 3 tin nhắn: sau khi người dùng duyệt kế hoạch, viết cả kịch bản vào `~/Downloads/<topic-slug>.txt` (chỉ lời thoại + dòng `#`), từ vựng vào `~/Downloads/<topic-slug>.vocab.md`, rồi gửi cả hai bằng SendUserFile.
- Đếm chữ thật bằng `wc -w` (mục tiêu 2.700–2.850) và grep kiểm tra không còn `[`, `(` hay `*` trong lời thoại.
- Xong thì hỏi có làm voice luôn không (skill `cozy-french-voice`).
