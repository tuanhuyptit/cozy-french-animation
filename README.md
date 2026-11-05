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

## Làm một tập mới

1. Chép lời voice có mốc thời gian từng chữ (whisper.cpp):
   ```bash
   ffmpeg -i voice.mp3 -ar 16000 -ac 1 clip16k.wav
   whisper-cli -m ggml-medium.bin -l fr -f clip16k.wav -ml 1 -sow -oj -of words
   ```
   rồi chuyển thành `assets/words.json` dạng `[{ "s": 0.19, "e": 0.5, "t": "Pas" }, …]`.
2. Sửa `episode.json` (phụ đề phải khớp đúng thứ tự chữ trong transcript).
3. Dựng và xuất video:
   ```bash
   cd cozy-ep01
   node tools/build.mjs
   npx hyperframes check
   npx hyperframes render -o ../episode.mp4
   ```
