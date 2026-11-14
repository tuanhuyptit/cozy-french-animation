---
name: cozy-radio-episode
description: Làm video hoạt hình cho kênh Cozy French Radio (kênh chị em, CHỈ có Léa nói một mình, podcast phát triển bản thân kèm học tiếng Pháp) từ một file voice của Léa — chọn cảnh Radio (studio, grenier, matin, train, cheminee, carnet, tsf, polaroid, lettre, metro, journal), chia phần Le thème / Le mot du jour / Le courrier / La question, phụ đề Pháp + Anh. Dùng khi người dùng nói "Cozy French Radio", "tập Radio", "làm video Radio", "voice Léa một mình", hoặc muốn thêm/sửa/xem cảnh Radio. KHÔNG dùng cho The Cozy French (Léa & Mathieu hai người) — cái đó là cozy-french-episode.
---

# Cozy French Radio — từ voice Léa ra video

Đây là kênh **riêng**, tách khỏi The Cozy French. Không trộn file, không trộn số tập.
Trả lời người dùng bằng tiếng Việt. Chữ trong video (dịch, nghĩa từ, câu ví dụ) bằng **tiếng Anh**.

## Khác kênh chính ở đâu

| | The Cozy French | Cozy French Radio |
|---|---|---|
| Người nói | Léa & Mathieu | **Chỉ Léa** (không đoán người nói, mọi câu là Léa) |
| Thư mục tập | `cozy-epNN/` | `radio/epNN/` |
| Cảnh | `demo-animation-style.html` (SCENES) | `radio/scenes.mjs` (nguồn duy nhất của cảnh Radio) |
| Cấu trúc | một mạch hội thoại | 4 phần: Le thème → Le mot du jour → Le courrier → La question |
| Từ vựng | 8–15 thẻ | ~6–8 thẻ trong Le thème + 1 "mot du jour" lớn trên cảnh `polaroid` |

Hình Léa (16 trang phục, nhép miệng, chớp mắt, cử chỉ) vẫn lấy từ `demo-animation-style.html` — sửa Léa ở đó thì cả hai kênh cùng đổi.

## 0. Chuẩn bị

- Repo: thư mục chứa `demo-animation-style.html` và `radio/`. Đọc `radio/README.md` (luật cảnh) và `NOTES.md` (quy ước chung: bảng màu, render 1440p, không đi dạo nếu không được yêu cầu).
- Mọi lệnh shell: `export PATH=/opt/homebrew/bin:$PATH`.

## 1. Chọn cảnh

Theo `radio/README.md`:
- **Le thème**: một cảnh dẫn (`studio`, `grenier`, `matin`, `train`, `cheminee`). Không lặp cảnh của 2 tập Radio gần nhất (xem `radio/ep*/episode.json`). Sáng → `matin`/`train`; tối → `studio`/`cheminee`; thư giãn → `grenier`.
- **Mở tập / câu chốt của Le thème**: `journal`.
- **Đổi phần**: `carnet`, `tsf` hoặc `metro`.
- **Le mot du jour**: `polaroid` (hoặc `carnet`).
- **Le courrier**: `lettre`.
- **La question**: cảnh dẫn của tập, hoặc `grenier`.
- Trang phục: mặc định của cảnh, hoặc bộ khác tông với nền.
- Cử chỉ tay: Léa dùng chung bộ cử chỉ kênh chính (gestTL); cảnh có trường `gest` thì chỉ dùng các cử chỉ trong danh sách đó.

## 2. Thêm / sửa cảnh

Sửa `radio/scenes.mjs` (chú thích các trường ở đầu file), rồi:
```bash
node radio/tools/build-demo.mjs
python3 -m http.server -d radio 8766   # mở http://localhost:8766/radio-demo.html
```
Kiểm tra: Léa không bị che mặt, phụ đề không đè vật quan trọng. Ghi cảnh mới vào bảng trong `radio/README.md`.

## 3. Từ voice ra video — CHƯA SẴN SÀNG

Bản build video Radio (HyperFrames, một người nói, đổi cảnh theo phần, chuyển động GSAP seek được thay cho CSS trong demo) **chưa được viết**. Nếu người dùng gửi voice Radio:
1. Báo rõ là phần dựng video Radio chưa có, chỉ mới có thư viện cảnh.
2. Đề nghị dùng chính voice này làm tập thử để viết bản build (`radio/tools/build.mjs`, có thể mượn transcribe/chunk/dịch từ `cozy-ep*/tools/` và `cozy-ep*/work/`, bỏ bước đoán người nói).
3. Khi build xong, cập nhật mục này thành các bước đầy đủ như `cozy-french-episode` (transcribe → nội dung → build → preview chờ duyệt → render 1080p rồi upscale 1440p → SEO).
