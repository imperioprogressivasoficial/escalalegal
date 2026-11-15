# Vídeo da Sua Escala 5x2 (motion, 1080x1920, 33 s)

- `sua-escala-blindada-reels.mp4`: o vídeo pronto, vertical, para Reels, Stories e anúncio. Sem som: coloque a música ou a narração por cima.
- `video.html`: as 7 cenas. Cada cena tem `--s` (início em ms) e `--l` (duração). Troque textos e imagens aqui.
- `render.js`: gera o vídeo quadro a quadro (30 fps).

Para gerar de novo:
```bash
cd marketing/video && node render.js && ffmpeg -y -framerate 30 -i quadros/%05d.jpg -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart sua-escala-blindada-reels.mp4
```
