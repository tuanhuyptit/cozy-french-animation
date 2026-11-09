# The Cozy French — animation template

Template video hoạt hình cho kênh YouTube [The Cozy French](https://www.youtube.com/@TheCozyFrench): hai nhân vật Léa & Mathieu trò chuyện bằng tiếng Pháp, phụ đề karaoke sáng theo từng chữ, highlight từ vựng kèm thẻ giải thích (IPA, nghĩa, ví dụ) và màn ôn tập cuối video.

Animated podcast template for learning French (B1–B2): word-synced karaoke subtitles, vocabulary cards and an end-of-episode recap. Built with [HyperFrames](https://hyperframes.heygen.com) + GSAP.

## Nội dung

| Đường dẫn | Là gì |
|---|---|
| `demo-animation-style.html` | Bản xem trước tương tác: 23 bối cảnh ngồi + 11 bối cảnh đi dạo, 8 đồ trang trí trên bàn (ô "Trên bàn"), 13 bộ trang phục mỗi nhân vật, 8 biểu cảm, 24 bong bóng minh hoạ, 10 cử chỉ (nút "Cử chỉ"). Mở bằng trình duyệt. |
| `cozy-ep01/tools/vocab-help.mjs` | Gợi ý từ vựng theo cấp độ CEFR (FLELex) và tra IPA (WikiPron). |
| `tools/new-episode.mjs` | Tạo thư mục tập mới `cozy-epNN/` từ mẫu `cozy-ep01`, bốc ngẫu nhiên chế độ/bối cảnh/trang phục và chép lời voice. |
| `tools/pick-setup.mjs` | Bốc ngẫu nhiên chế độ (ngồi / đi dạo), bối cảnh, trang phục cho một tập — không trùng tập gần đây, không trùng tông. `--write` ghi `work/setup.json`. |
| `cozy-ep01/tools/staging.mjs` | Phần riêng của từng chế độ (ngồi / đi dạo) dùng bởi `build.mjs`. |
| `voices/` | Đoạn giọng mẫu Léa & Mathieu (13–15 s, FLAC) để nhân bản giọng trong VoiceStudio. |
| `tools/youtube-seo.mjs` | Xuất mốc chương, khối từ vựng và phụ đề `.srt` (Pháp + Anh) cho YouTube; dùng để viết `cozy-epNN/youtube-seo.md` (tiêu đề, mô tả, tags). |
| `tools/voice-dialogue.mjs` | Tạo voice hội thoại Léa & Mathieu từ kịch bản chữ bằng VoiceStudio (giọng nhân bản, chạy trên máy). Ví dụ: `tools/dialogue-example.txt`. |
| `skills/cozy-french-episode/` | Skill Claude Code: gửi voice → Claude tự làm cả tập. |
| `cozy-ep01/` | Project HyperFrames của tập thử (34 giây đầu voice). |
| `cozy-ep01/episode.json` | Cấu hình tập: bối cảnh, trang phục, phụ đề + dịch, từ vựng (đánh dấu bằng `[ ]`), biểu cảm (`emote`/`react`) và minh hoạ (`illus`/`label`) theo từng đoạn. |
| `cozy-ep01/tools/build.mjs` | Ghép phụ đề / thẻ từ vào mốc thời gian từng chữ, sinh `index.html` + `compositions/talk.html`. |
| `cozy-ep01-test-30s.mp4` | Video đã xuất. |

**Chế độ:** ngồi (`sit`) · đi dạo (`walk`)
**Bối cảnh:** `cafe` · `salon` · `parc` · `cuisine` · `biblio` · `terrasse` · `chalet` · `boulangerie` · `train` · `quai` · `marche` · `plage` · `atelier` · `lavande` · `bureau` · `bistrot` · `verriere` · `peniche` · `toits` · `cinema` · `fleuriste` · `musee` · `disquaire` · đi dạo: `promenade` · `ruelle` · `automne` · `corniche` · `village` · `jardin` · `canal` · `noel` · `vignoble` · `pluie` · `port`
**Léa:** `pull` · `mariniere` · `trench` · `chemise` · `cardigan` · `pois` · `jean` · `lilas` · `foulard` · `doudoune` · `rose` · `tartan` · `torsade`
**Mathieu:** `denim` · `hoodie` · `colroule` · `blazer` · `pull` · `carreaux` · `velours` · `polo` · `gilet` · `tablier` · `raye` · `chale` · `bomber`
**Cử chỉ:** `beat` · `palm` · `up` · `point` · `think` · `wave` · `shrug` · `count` · `scratch` + gật đầu `nod`; khi đi dạo thêm `explain` · `regarde` · `coeur` · `pouce` · `bof` · `pince` · `rire` · `menton` · `poche` · `grand` (tự chọn theo lời thoại, ép bằng `"act"`)
**Bảng giải thích:** nền `liege` · `craie` · `carnet`; kiểu `word` · `sketch` · `compare` · `steps` · `conjug` · `mindmap` · `quiz` · `timeline` · `truefalse` · `fill` · `mistake` · `scale` · `idiom` · `order` (xem skill `cozy-french-episode`)
**Đồ trên bàn (cảnh ngồi):** `drapeau` (cờ Pháp nhỏ bay) · `macarons` (đĩa macaron) · `boule` (boule à neige tháp Eiffel, tuyết bay) · `bougie` (nến cắm chai, lửa lay) · `croissants` · `fleurs` (bình tulip đung đưa) · `livres` (chồng sách + kính) · `theiere` (ấm trà bốc hơi) — `"decor": [...]` trong `episode.json`, tối đa 3

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
ln -s "$PWD/skills/cozy-french-voice" ~/.claude/skills/cozy-french-voice
ln -s "$PWD/skills/cozy-french-script" ~/.claude/skills/cozy-french-script
```

Gửi script đối thủ (vd. "viết kịch bản từ ~/Downloads/script.txt, topic: night routine") → Claude lên kế hoạch Pháp hoá, chờ duyệt rồi viết kịch bản Léa & Mathieu ~20 phút (`cozy-french-script`, hướng dẫn chi tiết trong `skills/cozy-french-script/README.md`).

Gửi kịch bản chữ (vd. "làm voice từ ~/Downloads/ep05.txt") → Claude tự tách người nói, thêm thẻ cảm xúc, gửi duyệt rồi tạo voice (`cozy-french-voice`).

Sau đó chỉ cần gửi cho Claude đường dẫn file voice (vd. "làm tập mới từ ~/Downloads/voice.mp3"), Claude sẽ tự chép lời, dịch, chọn từ vựng, chọn bối cảnh và render.

## Tạo voice từ kịch bản (VoiceStudio)

**Máy mới (một lần):**

```bash
brew install node ffmpeg
brew tap debpalash/tap && brew install --cask debpalash/tap/voicestudio
```

Mở VoiceStudio, đồng ý tải model mặc định OmniVoice (~3 GB) và để app mở. Hai giọng mẫu Léa và Mathieu nằm ở `voices/` (`voices.json` ghi lời của từng đoạn); lần chạy đầu script tự tạo profile `Léa` và `Mathieu` trong VoiceStudio. Muốn tạo trước: `node tools/voice-dialogue.mjs --setup`.

```bash
node tools/voice-dialogue.mjs kichban.txt --out ~/Downloads/voice.mp3
```

Kịch bản: mỗi dòng `LÉA: ...` hoặc `MATHIEU: ...`; dòng trống = nghỉ lâu hơn; dòng bắt đầu bằng `#` bị bỏ qua.
Thẻ dùng được: `[laughter]` `[sigh]` `[surprise-oh]` `[surprise-ah]` `[pause]` `[pause 500ms]`. Thẻ khác (`[happy]`, `[excited]`…) sẽ bị đọc thành chữ nên script báo lỗi và dừng.
Cảm xúc chủ yếu đến từ cách viết: `...`, `!`, câu ngắn.

- Ra `voice.mp3` (-16 LUFS) và `voice.mp3.timeline.json` (ai nói, câu nào, từ giây nào đến giây nào).
- Từng câu lưu sẵn ở `voice.mp3.lines/`: sửa một câu rồi chạy lại thì chỉ câu đó được tạo lại. `--force` tạo lại tất cả.
- Tuỳ chọn: `--gap 350` (ms giữa hai câu), `--para-gap 800` (ở dòng trống), `--seed 42`, `--speed 1.0`, `--steps 16` (32 sạch hơn, chậm gấp đôi), `--voice LEA=<profile>`.
- Tốc độ trên iMac M1: ~20 s cho một câu 3–4 s (đoạn giọng mẫu càng dài càng chậm). Tập 20 phút ≈ 1,5–2 giờ, nên chạy nền.

File ra đưa thẳng vào `node tools/new-episode.mjs` như voice bình thường.

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
