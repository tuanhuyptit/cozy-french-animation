---
name: cozy-french-voice
description: Tạo file voice hội thoại tiếng Pháp Léa & Mathieu cho kênh The Cozy French từ một kịch bản chữ (txt, chỉ có lời thoại) bằng VoiceStudio chạy trên máy — tự tách người nói, tự thêm thẻ cảm xúc ([laughter], [sigh], [surprise-oh], [pause]) và dấu câu, gửi chủ kênh duyệt rồi chạy tools/voice-dialogue.mjs. Dùng khi người dùng gửi file .txt / dán kịch bản và nói "làm voice", "tạo voice", "voice Cozy French". Không dùng cho file audio (đó là cozy-french-episode).
---

# The Cozy French — từ kịch bản chữ ra voice

Trả lời bằng tiếng Việt. Lời thoại tiếng Pháp **không được đổi chữ nào**; chỉ được thêm thẻ, thêm/chỉnh dấu câu, tách dòng.

## 0. Chuẩn bị

- Repo: `~/Desktop/French` (`cozy-french-animation`). Script: `tools/voice-dialogue.mjs` (đọc phần chú thích đầu file). Giọng mẫu: `voices/`.
- Nếu `tools/voice-dialogue.mjs` không có: script đang ở nhánh `voice-dialogue` chưa gộp → `git checkout voice-dialogue` (repo sạch) hoặc báo người dùng.
- `export PATH=/opt/homebrew/bin:$PATH`. Kiểm tra VoiceStudio: `curl -s http://127.0.0.1:3900/health`. Không trả lời → nhờ người dùng mở app VoiceStudio, chờ rồi thử lại.
- `node tools/voice-dialogue.mjs --setup` (tạo profile `Léa`, `Mathieu` nếu thiếu; có rồi thì bỏ qua).

## 1. Đọc kịch bản, tách người nói

File thường chỉ có lời. Ghi lại thành `LÉA: …` / `MATHIEU: …`, mỗi lượt lời một dòng (đoạn dài > ~250 ký tự thì tách thành nhiều dòng ở dấu chấm, dòng sau không cần ghi lại tên — vẫn là người đó).

Đoán người nói theo: tên gọi trong câu (*"Tu sais, Mathieu…"* → Léa nói), giống của tính từ/quá khứ phân từ (*je suis fatiguée* → Léa; *je suis content* → Mathieu), hỏi–đáp xen kẽ, intro/outro (thường Léa mở đầu nếu kịch bản không nói khác). Ghi lại các chỗ không chắc.

Dòng trống giữa hai phần/chủ đề = nghỉ lâu hơn (800 ms). Bỏ tiêu đề, ghi chú đạo diễn, số thứ tự… (hoặc chuyển thành dòng `#`).

## 2. Thêm thẻ cảm xúc

Chỉ các thẻ engine đọc được (thẻ khác sẽ bị đọc thành chữ — script báo lỗi và dừng):

| Thẻ | Khi nào |
|---|---|
| `[laughter]` | sau câu đùa, trêu nhau, chuyện buồn cười; đặt ở đầu câu phản ứng (*"Deux ? [laughter] Tu es impossible."*) |
| `[sigh]` | than thở, mệt, chịu thua, hoài niệm (*"[sigh] Bon, d'accord."*) |
| `[surprise-oh]` / `[surprise-ah]` | ngạc nhiên trước điều người kia vừa nói, ngay sau *Ah bon ?*, *Vraiment ?*, *Sérieux ?* |
| `[pause 300ms]`…`[pause 1s]` | trước câu chốt/quan trọng, khi nhân vật suy nghĩ, sau câu hỏi lớn |

Dấu câu cũng là công cụ cảm xúc: `!` hào hứng, `...` ngập ngừng/buồn/suy nghĩ, `?` lên giọng, câu ngắn dồn dập khi kể chuyện.

Nguyên tắc:
- Tiết chế: ~1–3 thẻ mỗi phút. Không hai `[laughter]` liền nhau; không để một nhân vật cười quá 3 lần mỗi ~5 phút.
- Không thêm `[pause]` ở đầu dòng (đã có khoảng nghỉ giữa các câu).
- Một dòng không được chỉ có thẻ mà không có chữ.
- Thẻ kiểu ElevenLabs có sẵn trong file: `[laughs]`→`[laughter]`, `[sighs]`→`[sigh]`, `[gasps]`/`[surprised]`→`[surprise-oh]`, `[beat]`/`[long pause]`→`[pause 500ms]`/`[pause 1s]`; `[excited]`, `[happy]`, `[sad]`, `[whispers]`… → bỏ thẻ, thể hiện bằng dấu câu.

Lưu thành `~/Downloads/<tên-file>.voice.txt` (cùng thư mục với file gốc), **không sửa file gốc**.

## 3. Gửi duyệt — DỪNG, chờ người dùng OK

Gửi file `.voice.txt` (SendUserFile) và tóm tắt: số dòng mỗi người, số thẻ từng loại, thời lượng ước tính (~13–15 ký tự/giây lời nói), thời gian chạy ước tính (iMac M1: ~20 s cho mỗi câu 3–4 s, tập 20 phút ≈ 1,5–2 giờ), danh sách chỗ không chắc người nói. Người dùng đã nói "chạy luôn, không cần duyệt" thì bỏ bước này.

## 4. Chạy

```bash
cd ~/Desktop/French && node tools/voice-dialogue.mjs ~/Downloads/<tên>.voice.txt --out ~/Downloads/<tên>.mp3
```

Chạy nền (`run_in_background`), báo một câu là đang tạo. Tuỳ chọn: `--gap 350`, `--para-gap 800`, `--steps 32` (sạch hơn, chậm gấp đôi — chỉ khi người dùng muốn), `--speed 0.9`, `--seed`.

## 5. Kiểm tra và báo

- Chép lời file ra bằng `curl -s http://127.0.0.1:3900/v1/audio/transcriptions -F file=@<mp3> -F language=fr` (tập dài: kiểm từng câu trong `<out>.lines/`) và so với kịch bản: câu nào thiếu chữ, có chữ lạ ở đầu câu (như "Annie" — dấu hiệu âm thừa) hoặc đọc thành chữ một thẻ → tạo lại câu đó.
- Tạo lại một câu: sửa dòng đó trong `.voice.txt` (đổi dấu câu / bỏ thẻ) rồi chạy lại cùng lệnh — chỉ dòng đã đổi được tạo lại. Muốn take khác mà không đổi chữ: chạy riêng với `--seed` khác vào `--out` khác là không được (cache theo cả bài) → thay vào đó thêm/bớt một dấu câu ở dòng đó.
- Gửi file mp3 (SendUserFile) + đường dẫn `timeline.json`. Hỏi người dùng có muốn làm video luôn không (skill `cozy-french-episode` với file mp3 này).

## Ghi chú

- Hai giọng mẫu đều đọc khá bình thản → giọng ra cũng bình thản; cảm xúc chủ yếu đến từ dấu câu và thẻ. Không chỉnh được cường độ cảm xúc (engine mặc định không hỗ trợ; IndexTTS2 thì không có tiếng Pháp).
- Profile `Emma` trong VoiceStudio là bản cũ của Léa (đoạn mẫu 63 s, gây âm thừa) — không dùng.
