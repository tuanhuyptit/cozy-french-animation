# The Cozy French — animation template

Template video hoạt hình cho kênh YouTube [The Cozy French](https://www.youtube.com/@TheCozyFrench): hai nhân vật Léa & Mathieu trò chuyện bằng tiếng Pháp, phụ đề karaoke sáng theo từng chữ, highlight từ vựng kèm thẻ giải thích (IPA, nghĩa, ví dụ) và màn ôn tập cuối video.

Animated podcast template for learning French (B1–B2): word-synced karaoke subtitles, vocabulary cards and an end-of-episode recap. Built with [HyperFrames](https://hyperframes.heygen.com) + GSAP.

## Nội dung

| Đường dẫn | Là gì |
|---|---|
| `demo-animation-style.html` | Bản xem trước tương tác: 10 bối cảnh, 5 bộ trang phục mỗi nhân vật, 8 biểu cảm, 24 bong bóng minh hoạ. Mở bằng trình duyệt. |
| `cozy-ep01/tools/vocab-help.mjs` | Gợi ý từ vựng theo cấp độ CEFR (FLELex) và tra IPA (WikiPron). |
| `tools/new-episode.mjs` | Tạo thư mục tập mới `cozy-epNN/` từ mẫu `cozy-ep01` và chép lời voice. |
| `skills/cozy-french-episode/` | Skill Claude Code: gửi voice → Claude tự làm cả tập. |
| `cozy-ep01/` | Project HyperFrames của tập thử (34 giây đầu voice). |
| `cozy-ep01/episode.json` | Cấu hình tập: bối cảnh, trang phục, phụ đề + dịch, từ vựng (đánh dấu bằng `[ ]`), biểu cảm (`emote`/`react`) và minh hoạ (`illus`/`label`) theo từng đoạn. |
| `cozy-ep01/tools/build.mjs` | Ghép phụ đề / thẻ từ vào mốc thời gian từng chữ, sinh `index.html` + `compositions/talk.html`. |
| `cozy-ep01-test-30s.mp4` | Video đã xuất. |

**Bối cảnh:** `cafe` · `salon` · `parc` · `cuisine` · `biblio` · `terrasse` · `chalet` · `boulangerie` · `train` · `quai`
**Léa:** `pull` · `mariniere` · `trench` · `chemise` · `cardigan`
**Mathieu:** `denim` · `hoodie` · `colroule` · `blazer` · `pull`

Các quyết định đã chốt và trạng thái dự án: xem [NOTES.md](NOTES.md).

## Cài đặt (máy mới)

```bash
brew install node ffmpeg whisper-cpp
curl -L -o ~/ggml-large-v3-turbo.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
```

`tools/transcribe.mjs` tự dùng `~/ggml-large-v3-turbo.bin` (nhanh hơn), không có thì dùng `~/ggml-medium.bin`. Đừng đặt `WHISPER_MODEL` trừ khi muốn ép một model khác.

Danh sách cấp độ từ vựng FLELex (tuỳ chọn, để gợi ý từ B1–B2):

```bash
mkdir -p ~/.cache/cozy-french && cd ~/.cache/cozy-french
curl -LO https://cental.uclouvain.be/cefrlex/static/resources/fr/FleLex_TT_Beacco.tsv
curl -LO https://cental.uclouvain.be/cefrlex/static/resources/fr/FleLex_CRF.csv
```

> FLELex dùng giấy phép **CC BY-NC-SA 4.0 (phi thương mại)** nên không đưa vào repo. Dùng nó cho kênh có kiếm tiền có thể vướng điều khoản "NonCommercial" — tự cân nhắc hoặc hỏi tác giả (CENTAL, UCLouvain). Không có FLELex thì mọi thứ khác vẫn chạy.
>
> IPA trong `data/fra_latn_broad.tsv` lấy từ [WikiPron](https://github.com/CUNY-CL/wikipron) (dữ liệu Wiktionary, CC BY-SA).

## Cài skill (một lần mỗi máy)

```bash
ln -s "$PWD/skills/cozy-french-episode" ~/.claude/skills/cozy-french-episode
```

Sau đó chỉ cần gửi cho Claude đường dẫn file voice (vd. "làm tập mới từ ~/Downloads/voice.mp3"), Claude sẽ tự chép lời, dịch, chọn từ vựng, chọn bối cảnh và render.

## Làm một tập mới bằng tay

1. Tạo tập và chép lời voice (ở gốc repo):
   ```bash
   node tools/new-episode.mjs ~/Downloads/voice.mp3                 # → cozy-epNN/
   node tools/new-episode.mjs ~/Downloads/voice.mp3 --duration 36   # chỉ 36 s đầu
   ```
   Tạo `cozy-epNN/assets/voice.mp3`, `assets/words.json` và `episode.draft.json`.
2. Duyệt `episode.draft.json`: sửa người nói nếu sai, điền `en`, bọc từ vựng bằng `[ ]`, thêm `vocab`, lưu thành `episode.json` (chữ phải khớp đúng thứ tự trong transcript). Tập dài có thể viết theo lô vào `work/` rồi chạy `node tools/assemble.mjs` (xem đầu file).
3. Dựng và xuất video:
   ```bash
   cd cozy-epNN
   node tools/build.mjs
   npx hyperframes check
   npx hyperframes render -o "$PWD/renders/cozy-epNN.mp4"
   ```
