---
name: cozy-radio-thumbnail
description: Làm thumbnail YouTube cho kênh Cozy French Radio (kênh chị em, chỉ có Léa, podcast phát triển bản thân kèm học tiếng Pháp) từ một topic — viết tít tiếng Pháp, chọn layout (disque / studio), render ảnh 1280×720 bằng đúng hình Léa và cảnh Radio, gắn badge cam "Cozy French Radio", đưa tiêu đề YouTube. Dùng khi người dùng nói "thumb Radio", "thumbnail Cozy French Radio", "ảnh bìa tập Radio". KHÔNG dùng cho The Cozy French (badge navy "Slow French Podcast") — cái đó là cozy-french-thumbnail.
---

# Cozy French Radio — Thumbnail

Kênh **riêng**, phải nhìn khác hẳn thumbnail The Cozy French ngay từ xa. Trả lời người dùng bằng tiếng Việt; chữ trên ảnh bằng tiếng Pháp.

## Khác The Cozy French ở đâu

| | The Cozy French | Cozy French Radio |
|---|---|---|
| Badge góc dưới trái | pill navy `#0F2233` + cờ Pháp + "Slow French Podcast" | pill **cam `#EE6A1F`** + cờ Pháp + chấm vàng ON AIR + **"Cozy French Radio"** (`references/badge-cozy-french-radio.png`, 464×74) |
| Nhân vật | cô gái tóc dài / chàng trai, thay đổi theo topic | **luôn là Léa** (tóc nâu ngang vai, má hồng), thường đeo tai nghe, tay giơ chào/giải thích |
| Chữ | sans condensed đậm VIẾT HOA | **serif đậm Playfair Display, viết thường kiểu câu**, 1 từ khoá nghiêng màu đất nung `#C9502E` gạch chân vàng bơ `#F3C96B` |
| Bố cục | chữ trái / người phải | **người trái / chữ phải**: Léa trong khung tròn đĩa than (disque) hoặc ngồi trước micro trong studio |
| Họa tiết | burst, bong bóng, icon app | đĩa than, micro cổ, đèn ON AIR, sóng âm nguệch ngoạc, sao 4 cánh, giấy kẻ dòng |

## Quy trình (Claude Code — render thật, không cần model vẽ ảnh)

1. Từ topic viết **tít tiếng Pháp** (quy tắc bên dưới), đánh dấu từ khoá bằng `*…*`.
2. Chọn layout:
   - `disque` (mặc định): nền giấy kẻ, Léa trong khung tròn trên đĩa than bên trái, tít bên phải. Hợp topic suy ngẫm, cảm xúc, câu hỏi.
   - `studio`: Léa ở phòng thu đêm với micro + ON AIR, tít trên thẻ giấy bên phải, có dòng viết tay nhỏ (`--note`, mặc định "ce soir à la radio…"). Hợp topic hành động, thay đổi, động lực.
3. Render (ở gốc repo, cần Google Chrome):
   ```bash
   node skills/cozy-radio-thumbnail/tools/make-ref.mjs --layout disque --text "Pourquoi c’est si dur de dire *non* ?" --out radio/epNN/thumbnail.png
   ```
4. Mở ảnh kiểm tra: chữ và dấu tiếng Pháp đúng, tít không quá 4 dòng và không đè badge, từ khoá đã tô màu. Sai thì sửa tít/ngắt dòng rồi render lại.
5. Gửi ảnh + **tiêu đề YouTube**:
   `<English Topic In Title Case> | Cozy French Radio | French Podcast with Léa`
6. Đề xuất thêm 1 tít khác trong một dòng.

Muốn thêm layout: viết thêm một hàm như `disque()` / `studio()` trong `tools/make-ref.mjs`, lấy cảnh từ `radio/scenes.mjs` (nguồn duy nhất của cảnh Radio), rồi chạy không tham số để cập nhật ảnh mẫu `references/ref-*.png`.

## Tít tiếng Pháp

- 3–9 chữ, tối đa 4 dòng ở cỡ chữ mặc định. Kiểu thân mật như Léa đang nói với người nghe: "Pourquoi c’est si dur de dire *non* ?", "Oser enfin *changer* de vie", "Et si tu arrêtais de *t’excuser* ?", "Le *courage* de recommencer".
- Viết thường kiểu câu (không VIẾT HOA cả câu). Đủ dấu (é è ê à ç ’), dấu cách trước ? ! : theo kiểu Pháp.
- Đúng **một** từ khoá được `*…*` (nghiêng, đất nung, gạch chân vàng).
- Không chữ tiếng Anh, không số tập, không "B1-B2" trên ảnh.

## Badge

Luôn là `references/badge-cozy-french-radio.png` ở sát góc dưới trái (464×74 trên ảnh 1280×720). Sửa màu/chữ trong `references/badge.html` rồi render lại:
```bash
cd skills/cozy-radio-thumbnail/references && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 --window-size=464,74 --virtual-time-budget=4000 --screenshot=badge-cozy-french-radio.png "file://$PWD/badge.html"
```

## Dùng với ChatGPT

Nếu muốn ảnh vẽ bằng model (cảnh tự do hơn): xem `README.md` và `GPT-INSTRUCTIONS.md` trong skill này.
