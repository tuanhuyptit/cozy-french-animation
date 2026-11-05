# The Cozy French — animation template

Template video hoạt hình cho kênh YouTube [The Cozy French](https://www.youtube.com/@TheCozyFrench): hai nhân vật Léa & Mathieu trò chuyện bằng tiếng Pháp, phụ đề karaoke sáng theo từng chữ, highlight từ vựng kèm thẻ giải thích (IPA, nghĩa, ví dụ) và màn ôn tập cuối video.

Animated podcast template for learning French (B1–B2): word-synced karaoke subtitles, vocabulary cards and an end-of-episode recap. Built with [HyperFrames](https://hyperframes.heygen.com) + GSAP.

## Nội dung

| Đường dẫn | Là gì |
|---|---|
| `demo-animation-style.html` | Bản xem trước tương tác: 6 bối cảnh, 5 bộ trang phục mỗi nhân vật. Mở bằng trình duyệt. |
| `cozy-ep01/` | Project HyperFrames của tập thử (34 giây đầu voice). |
| `cozy-ep01/episode.json` | Cấu hình tập: bối cảnh, trang phục, phụ đề + dịch, từ vựng (đánh dấu bằng `[ ]`). |
| `cozy-ep01/tools/build.mjs` | Ghép phụ đề / thẻ từ vào mốc thời gian từng chữ, sinh `index.html` + `compositions/talk.html`. |
| `cozy-ep01-test-30s.mp4` | Video đã xuất. |

**Bối cảnh:** `cafe` · `salon` · `parc` · `cuisine` · `biblio` · `terrasse`
**Léa:** `pull` · `mariniere` · `trench` · `chemise` · `cardigan`
**Mathieu:** `denim` · `hoodie` · `colroule` · `blazer` · `pull`

Các quyết định đã chốt và trạng thái dự án: xem [NOTES.md](NOTES.md).

## Cài đặt (máy mới)

```bash
brew install node ffmpeg whisper-cpp
curl -L -o ~/ggml-medium.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin
export WHISPER_MODEL=~/ggml-medium.bin
```

## Làm một tập mới

1. Chép lời voice, lấy mốc thời gian từng chữ và đoán người nói:
   ```bash
   cd cozy-ep01
   node tools/transcribe.mjs ~/Downloads/voice.mp3            # cả file
   node tools/transcribe.mjs ~/Downloads/voice.mp3 --duration 36   # chỉ 36 s đầu
   ```
   Tạo `assets/voice.mp3`, `assets/words.json` và `episode.draft.json`.
2. Duyệt `episode.draft.json`: sửa người nói nếu sai, điền `en`, bọc từ vựng bằng `[ ]`, thêm `vocab`, lưu thành `episode.json` (chữ phải khớp đúng thứ tự trong transcript).
3. Dựng và xuất video:
   ```bash
   cd cozy-ep01
   node tools/build.mjs
   npx hyperframes check
   npx hyperframes render -o ../episode.mp4
   ```
