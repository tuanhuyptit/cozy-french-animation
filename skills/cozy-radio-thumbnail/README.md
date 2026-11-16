# Cozy French Radio — Thumbnail GPT

Giống hệt skill thumbnail của The Cozy French (`../cozy-french-thumbnail`), **chỉ khác badge góc dưới trái**: pill cam `#EE6A1F` + cờ Pháp + chấm vàng + "Cozy French Radio". Ảnh tham chiếu là thumbnail thật của kênh chính đã được thay badge cam.

Skill cho ChatGPT tạo thumbnail kênh Cozy French Radio. Chỉ cần gõ topic (vd. `Why do we procrastinate`).

## Cài vào ChatGPT (Custom GPT)
1. ChatGPT → Explore GPTs → **Create** → tab **Configure**.
2. **Name:** Cozy French Radio Thumbnail · **Description:** Gõ topic, nhận thumbnail đúng style kênh.
3. **Instructions:** dán toàn bộ nội dung `GPT-INSTRUCTIONS.md` (~7.000 ký tự, dưới giới hạn 8.000).
4. **Knowledge:** upload `references/badge-cozy-french-radio.png` + 4–8 ảnh `references/ref-0*.jpg` (thumbnail thật của kênh để GPT bám style).
5. **Capabilities:** bật *Image Generation*. Tắt Web Search (không cần).
6. **Conversation starter:** `Why do we procrastinate` / `How to stop overthinking`.

Không dùng Custom GPT? Dán nội dung đó vào **Project instructions** của một ChatGPT Project và upload ảnh tham chiếu vào Project files — kết quả như nhau.

## Mẹo
- Kèm 1–2 ảnh ref ngay trong tin nhắn (“làm theo style ảnh này”) khi kết quả bị lệch style.
- Nếu GPT vẽ badge sai: xuất ảnh không badge rồi đặt `badge-cozy-french-radio.png` (464×74 px, góc dưới trái ảnh 1280×720) bằng Canva/Photoshop — badge thật luôn chuẩn nhất.
- ChatGPT thường xuất 1536×1024 (3:2): crop về 16:9 rồi resize 1280×720 trước khi upload.

## Phân tích style (từ 16 thumbnail mới nhất của kênh)
| Yếu tố | Quy luật |
|---|---|
| Phong cách vẽ | Flat vector 2D “cozy editorial”, đổ bóng mềm, grain nhẹ, nhân vật mặt đơn giản má hồng |
| Bố cục | Chữ trái ~55% / nhân vật phải ~45%; hoặc chữ trên giữa + cảnh rộng (ẩn dụ phong cảnh) |
| Nhân vật | 1 người, cảm xúc cường điệu khớp topic: lo âu, mệt, giận, mơ màng, tự hào, thư thái đeo tai nghe |
| Tiêu đề | Tiếng Pháp, 2–8 chữ, dạng câu hỏi (POURQUOI / COMMENT / EST-CE QUE / PEUT-ON) hoặc câu khẳng định ngắn |
| Typography | Sans condensed đậm VIẾT HOA, nhiều cỡ chữ; 1–2 từ khoá to nhất, tô màu nhấn; tối đa 3 màu chữ |
| Trang trí | Vạch “burst” quanh từ khoá, gạch chân nét cọ, bong bóng thoại bao một từ, sparkle, lá cây góc |
| Màu nền | 1 màu chủ đạo theo mood: navy/tím đêm, vàng (FOMO), xanh lá (nghe/sức khỏe), be (học), tím nhạt (cảm xúc), xám (công việc) |
| Badge | Cố định góc dưới trái: pill **cam `#EE6A1F`** + cờ Pháp tròn + chấm vàng + “Cozy French Radio” trắng |
| Tiêu đề YouTube | `<English Topic> \| French Podcast \| French Listening Practice (B1-B2)` |

## Badge
Nguồn: `references/badge.html` (sửa màu/chữ ở đây). Render lại PNG trong suốt 464×74:

```bash
cd skills/cozy-radio-thumbnail/references && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 --window-size=464,74 --virtual-time-budget=4000 --screenshot=badge-cozy-french-radio.png "file://$PWD/badge.html"
```

Sau khi đổi badge, cập nhật lại 8 ảnh tham chiếu (lấy ảnh gốc của kênh chính, dán badge cam đè lên badge cũ):

```bash
cd skills/cozy-radio-thumbnail && for i in 01 02 03 04 05 06 07 08; do ffmpeg -v error -y -i ../cozy-french-thumbnail/references/ref-$i.jpg -i references/badge-cozy-french-radio.png -filter_complex "overlay=0:H-h" -q:v 2 references/ref-$i.jpg; done
```
