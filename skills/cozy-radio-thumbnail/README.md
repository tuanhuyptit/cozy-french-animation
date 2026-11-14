# Cozy French Radio — Thumbnail

Skill thumbnail **riêng** cho kênh Cozy French Radio (tách khỏi `cozy-french-thumbnail` của The Cozy French).

## Cách dùng trong Claude Code
Gõ topic, ví dụ "thumb Radio: why it's hard to say no". Claude viết tít tiếng Pháp, chọn layout và render ảnh thật bằng `tools/make-ref.mjs` (dùng đúng hình Léa + cảnh trong `radio/scenes.mjs`, cần Google Chrome).

```bash
node skills/cozy-radio-thumbnail/tools/make-ref.mjs --layout disque --text "Pourquoi c’est si dur de dire *non* ?" --out thumbnail.png
node skills/cozy-radio-thumbnail/tools/make-ref.mjs --layout studio --text "Oser enfin *changer* de vie" --note "ce soir à la radio…" --out thumbnail.png
```

## Dùng với ChatGPT (Custom GPT / Project)
1. **Instructions:** dán `GPT-INSTRUCTIONS.md`.
2. **Knowledge:** upload `references/badge-cozy-french-radio.png`, `references/ref-disque.png`, `references/ref-studio.png`.
3. Bật *Image Generation*. Nếu GPT vẽ badge sai: xuất ảnh không badge rồi đặt badge thật (464×74, góc dưới trái ảnh 1280×720).

## File
| File | Là gì |
|---|---|
| `references/badge-cozy-french-radio.png` | Badge cam `#EE6A1F` + cờ Pháp + "Cozy French Radio" (nền trong suốt) |
| `references/badge.html` | Nguồn của badge — sửa màu/chữ ở đây rồi render lại (lệnh trong `SKILL.md`) |
| `references/ref-disque.png`, `ref-studio.png` | Ảnh mẫu 2 layout, sinh bởi `tools/make-ref.mjs` (chạy không tham số) |
| `tools/make-ref.mjs` | Render thumbnail 1280×720 từ cảnh Radio thật |
