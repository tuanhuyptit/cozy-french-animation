# Cozy French Radio — animation

Kênh chị em của The Cozy French: **chỉ có Léa**, nói về phát triển bản thân, podcast kèm học tiếng Pháp. Léa dùng chung rig với kênh chính (`../demo-animation-style.html`), nên mọi trang phục, nhép miệng, chớp mắt, cử chỉ đều có sẵn.

## File

| Đường dẫn | Là gì |
|---|---|
| `scenes.mjs` | **Nguồn duy nhất** của các cảnh Radio: vẽ nền (`bg`), tiền cảnh (`fg`), vị trí Léa, kiểu phụ đề, logo. Thêm hoặc sửa cảnh ở đây. |
| `tools/build-demo.mjs` | Dựng `radio-demo.html` từ `scenes.mjs` và hình Léa trong demo kênh chính. Chạy: `node radio/tools/build-demo.mjs` |
| `epNN/` | Thư mục từng tập Radio (riêng, không dùng chung số tập với `cozy-epNN/`). |
| `../skills/cozy-radio-episode/` | Skill riêng của Radio. Cài: `ln -s "$PWD/skills/cozy-radio-episode" ~/.claude/skills/cozy-radio-episode` (chạy ở gốc repo). |
| `../skills/cozy-radio-thumbnail/` | Skill thumbnail riêng của Radio (badge cam "Cozy French Radio", layout disque/studio). |
| `radio-demo.html` | Thư viện cảnh để xem thử (file sinh ra, không sửa tay). Mở qua web server cục bộ vì file lớn: `python3 -m http.server -d radio 8766` rồi vào `http://localhost:8766/radio-demo.html`. Có ô chọn trang phục Léa. |

## Cảnh

| id | Tên | Loại | Trang phục mặc định | Ghi chú |
|---|---|---|---|---|
| `studio` | Studio de nuit | dẫn | `cardigan` + tai nghe | Phòng thu ban đêm, đèn ON AIR, micro cổ điển, kim VU, mưa ngoài cửa sổ |
| `grenier` | La chambre sous les toits | dẫn | `torsade` | Gác mái hoàng hôn kiểu lofi, đĩa than, bụi nắng, mèo ngủ; phụ đề nền tối |
| `matin` | Le balcon du matin | dẫn | `mariniere` | Ban công Paris buổi sáng, bàn bistro, croissant, chim bay, chậu hoa |
| `train` | Le train du matin | dẫn | `trench` | Khoang tàu, cảnh ngoài cửa sổ trôi nhiều lớp (đồi, oải hương, cột điện) |
| `cheminee` | Soir d'hiver | dẫn | `doudoune` | Phòng khách mùa đông, lửa lò sưởi bập bùng, tuyết rơi ngoài cửa sổ |
| `carnet` | Carnet radio | chuyển | `pull` + tai nghe | Đồ hoạ: Léa trong khung tròn trên đĩa than, chữ lớn, sóng âm, thanh tiến độ 4 phần |
| `tsf` | La radio TSF | chuyển | `lilas` | Léa trong ô cửa vòm của chiếc radio cổ; mặt dò đài tần số là thanh tiến độ, kim đỏ chỉ phần đang phát. Hợp lúc đổi phần |
| `metro` | Station Léa | chuyển | `camel` | Ga métro Paris: tường gạch men trắng, Léa trong biển tròn viền xanh, câu chữ trên bảng men xanh; bản đồ tuyến "Ligne L" với 4 ga là thanh tiến độ, đoàn tàu nhỏ chạy giữa các ga. Hợp lúc đổi phần ("Prochaine station : …") |
| `journal` | À la une | chuyển | `chemise` + tai nghe | Trang nhất "Le Petit Journal de Léa": Léa trong ảnh báo có chấm in, dấu "À LA UNE", câu nói là tít lớn, cột chữ bên dưới. Hợp mở đầu tập / câu chốt của Le thème |
| `polaroid` | Polaroïd du mot | chuyển | `rose` | Léa trong ảnh polaroid; bên phải chữ "mot du jour" thật lớn + IPA + nghĩa, câu ví dụ chạy chữ, tab 4 phần ở trên. Dành cho **Le mot du jour** |
| `lettre` | Le courrier | chuyển | `foulard` | Léa trên con tem dán phong bì, dấu bưu điện; lá thư bên phải chữ viết tay (Caveat) với "Chère Léa," và tên người gửi. Dành cho **Le courrier** |

## Cách dùng cảnh trong một tập

- **Le thème** (phần chính): một **cảnh dẫn**. Đổi luân phiên giữa các tập, không lặp cảnh của 2 tập gần nhất. Chọn theo chủ đề và giờ đăng (sáng: `matin`, `train`; tối: `studio`, `cheminee`; thư giãn: `grenier`).
- **Mở tập / câu chốt của Le thème**: `journal`.
- **Đổi phần**: chen `carnet`, `tsf` hoặc `metro` vài giây, thanh tiến độ / kim dò đài / đoàn tàu nhảy sang phần mới.
- **Le mot du jour**: `polaroid` (hoặc `carnet` với tờ note vàng).
- **Le courrier**: `lettre`; tên người gửi và lời chào lấy từ bình luận được đọc.
- **La question de la semaine**: quay lại cảnh dẫn, hoặc đổi sang `grenier` cho đoạn kết nhẹ nhàng.
- Livestream 24/7 sau này: ưu tiên `grenier` (Léa nhỏ trong khung, phòng là nhân vật chính).
- Trang phục: lấy mặc định của cảnh hoặc chọn bộ khác tông với nền (tương tự luật trong `tools/pick-setup.mjs` của kênh chính).

## Cử chỉ tay

Léa dùng chung bộ cử chỉ của kênh chính (`gestTL` trong khối GEST-RUNTIME của demo): tay ngoài lần lượt `palm`, `up`, `count`, `think`, `beat`, `shrug`, `wave`, xen nghỉ. Cảnh có khung cắt hẹp đặt `gest: [...]` để chỉ dùng cử chỉ mà bàn tay nằm trong khung (vd. `tsf`, `lettre`). Trang demo chạy bằng gsap như video thật.

## Thêm cảnh mới

1. Thêm một mục vào `SCENES` trong `scenes.mjs` (xem chú thích các trường ở đầu file). Dùng tiền tố riêng cho id của `<defs>` (vd. `mt-`, `tr-`) để không trùng cảnh khác.
   Cảnh chuyển có thể đặt `kin: { x, y, w, cls }` để dời khối chữ lớn (`cls: 'hand'` = chữ viết tay) và `lea.clip` (CSS `clip-path`, toạ độ trong hộp 360×480 của Léa, vd. `path('…')`) để cắt Léa theo khung.
2. Chuyển động: đặt class (`.rain`, `.flame`, `.scroll`…) và viết keyframes trong `SCENE_CSS`. Đây mới là CSS cho bản xem thử; khi dựng video bằng HyperFrames, mỗi class sẽ được viết lại thành tween GSAP seek được (không `repeat:-1`, không `Math.random`; hình đã dùng seed cố định).
3. `node radio/tools/build-demo.mjs`, mở demo kiểm tra: Léa không bị bàn/micro che mặt, phụ đề không đè vật quan trọng.

## Chưa làm

- Build video thật (HyperFrames) cho Radio: cần bản `build.mjs` một người nói, đổi cảnh theo phần, chuyển động GSAP thay cho CSS ở trên.
