# Super Manual do Editor de Vídeo com IA — por @theouriks

> Tudo o que aprendi editando os vídeos do **@theouriks** com IA (out–nov/2026): ferramentas, repositórios,
> fluxos, códigos, padrões visuais, regras de áudio e vídeo, erros que já aconteceram e como evitá-los.
>
> **Como usar:** este arquivo também é uma **skill do Claude Code** (pasta `editor-de-video-ia`). Instale a skill,
> abra o Claude Code na pasta do seu vídeo e peça: *"edite meu vídeo no estilo o vídeo faz o que eu falo"*.
> Comece pela **seção 0** (instalação).
>
> **Versão 2 (nov/2026).** Novidades: os 20 princípios de fluidez e o formato "um quadradinho é você" (seção 36),
> o formato "tela em cima, fala embaixo" (seção 37), voz/efeitos/trilha com ElevenLabs e ferramenta pronta (seção 38),
> 2 mandamentos novos (17 e 18) e 7 erros novos na seção 20.
>
> A régua é a de um grande editor: **nada sai sem estar bonito, limpo e com qualidade de imagem e
> som igual ou melhor que o arquivo que entrou.** Se um passo piora a imagem ou o som, o passo está errado.

---

## Sumário

0. [⚙️ Instalação e pré-requisitos (comece aqui)](#0-️-instalação-e-pré-requisitos-comece-aqui)
1. [Os 10 mandamentos](#1-os-10-mandamentos)
2. [Ferramentas, repositórios e onde fica cada coisa](#2-ferramentas-repositórios-e-onde-fica-cada-coisa)
3. [Identidade visual (exemplo: Ouriks Web; troque pela sua)](#3-identidade-visual-exemplo-ouriks-web-troque-pela-sua)
4. [Formato vertical e safe zones](#4-formato-vertical-e-safe-zones)
5. [Qualidade de imagem: o fluxo sem perda (HDR 60 fps)](#5-qualidade-de-imagem-o-fluxo-sem-perda-hdr-60-fps)
6. [Áudio: voz, nivelamento, efeitos e trilha](#6-áudio-voz-nivelamento-efeitos-e-trilha)
7. [Transcrição e cortes (pausas, travadas, frases refeitas)](#7-transcrição-e-cortes-pausas-travadas-frases-refeitas)
8. [Legenda que acompanha a voz](#8-legenda-que-acompanha-a-voz)
9. [Animações: cartões de vidro, cascata, zoom e câmera](#9-animações-cartões-de-vidro-cascata-zoom-e-câmera)
10. [HyperFrames na prática (regras e armadilhas)](#10-hyperframes-na-prática-regras-e-armadilhas)
11. [Doutrina de movimento (motion design)](#11-doutrina-de-movimento-motion-design)
12. [Tipos de vídeo e receitas prontas](#12-tipos-de-vídeo-e-receitas-prontas)
13. [Gravação de tela e tutoriais](#13-gravação-de-tela-e-tutoriais)
14. [Showreel / motion graphics 100% em código (com música sintetizada)](#14-showreel--motion-graphics-100-em-código-com-música-sintetizada)
15. [Ganchos, roteiro e CTA](#15-ganchos-roteiro-e-cta)
16. [PDFs de isca (DM) e automação de comentário](#16-pdfs-de-isca-dm-e-automação-de-comentário)
17. [Textos de post (Instagram e LinkedIn)](#17-textos-de-post-instagram-e-linkedin)
18. [Prompts de imagem e vídeo (ChatGPT / Gemini)](#18-prompts-de-imagem-e-vídeo-chatgpt--gemini)
19. [Privacidade e marca do cliente](#19-privacidade-e-marca-do-cliente)
20. [Erros que já aconteceram (e a correção)](#20-erros-que-já-aconteceram-e-a-correção)
21. [Checklist antes de entregar](#21-checklist-antes-de-entregar)
22. [Cola de comandos](#22-cola-de-comandos)
23. [Protocolo de briefing: o que perguntar e quais fotos pedir](#23-protocolo-de-briefing-o-que-perguntar-e-quais-fotos-pedir)
24. [Arsenal de repositórios (skills e bibliotecas)](#24-arsenal-de-repositórios-skills-e-bibliotecas)
25. [Análise das referências "Conteúdo 2.0"](#25-análise-das-referências-conteúdo-20)
26. [Receitas novas inspiradas nas referências](#26-receitas-novas-inspiradas-nas-referências)
27. [Prompts prontos (XML, teste de 1 s, folha de quadros)](#27-prompts-prontos-xml-teste-de-1-s-folha-de-quadros)
28. [O fluxo do editor supremo (do briefing à entrega)](#28-o-fluxo-do-editor-supremo-do-briefing-à-entrega)
29. [3D e animações fluidas (receitas com código)](#29-3d-e-animações-fluidas-receitas-com-código)
30. [Biblioteca dos 17 efeitos (referência "17 efeitos que o Claude cria")](#30-biblioteca-dos-17-efeitos-referência-17-efeitos-que-o-claude-cria)
31. [Prompt Motion: o que 230 prompts reais ensinam](#31-prompt-motion-o-que-230-prompts-reais-ensinam)
32. [Técnicas avançadas tiradas dos prompts mais curtidos](#32-técnicas-avançadas-tiradas-dos-prompts-mais-curtidos)
33. [Nossos templates de prompt (prontos para usar)](#33-nossos-templates-de-prompt-prontos-para-usar)
34. [Lista negra e lista verde](#34-lista-negra-e-lista-verde)
35. [⭐ Método "O vídeo faz o que eu falo": 3D integrado à fala](#35--método-o-vídeo-faz-o-que-eu-falo-3d-integrado-à-fala)
36. [🆕 Os 20 princípios de fluidez (animação + UX) e o formato "um quadradinho é você"](#36-os-20-princípios-de-fluidez-animação--ux-e-o-formato-um-quadradinho-é-você)
37. [🆕 Formato "tela em cima, fala embaixo" (tutorial e demonstração)](#37-formato-tela-em-cima-fala-embaixo-tutorial-e-demonstração)
38. [🆕 Voz, efeitos e trilha com IA (ElevenLabs)](#38-voz-efeitos-e-trilha-com-ia-elevenlabs)

> ### ⭐ Destaque: o método "O vídeo faz o que eu falo" (seção 35)
> O formato que mais funcionou até agora (Reels 7559, out/2026): a pessoa narra e **objetos 3D de verdade
> (Three.js) obedecem à fala**, passando **atrás da cabeça** graças ao recorte por IA, num **fundo reconstruído**
> e com **luz que abraça o recorte**. Serve para casa, prédio, consultório, produto… qualquer nicho.
> A estrutura do projeto e os códigos estão nas seções 35.2 e 35.3.

> ### 🆕 Novo na v2
> - **Fluidez de verdade (seção 36):** os 12 princípios da animação + 8 leis de UX traduzidos em números (durações, eases, recuos) e um checklist antes do render.
> - **Motion sem rosto (36.4 + 38):** "um quadradinho é você": 1 objeto que vira o mundo, câmera em plano-sequência, narração por IA sincronizada na palavra.
> - **Tela + fala ao mesmo tempo (seção 37):** tutorial com a tela em cima e a pessoa embaixo, zoom suave e legenda de 1–2 palavras.
> - **ElevenLabs (seção 38):** voz com tempo por caractere, SFX e trilha, com a ferramenta `scripts/el.mjs` pronta na skill.

## 0. ⚙️ Instalação e pré-requisitos (comece aqui)

> Faça isto uma vez. Depois, cada vídeo novo é só uma pasta nova. Não precisa saber programar: o Claude Code
> roda os códigos por você; aqui está o que ele precisa ter instalado.

### 0.1 O que instalar

| Ferramenta | Para quê | Windows (PowerShell) | Mac (Terminal) |
|---|---|---|---|
| **Node.js LTS** (22 ou mais novo) | Roda o HyperFrames, o Three.js e os scripts `.mjs` | `winget install OpenJS.NodeJS.LTS` | `brew install node` |
| **Python 3.12** | Recorte por IA, compositor HDR, áudio, PDFs | `winget install Python.Python.3.12` | `brew install python@3.12` |
| **Git** | Baixar repositórios e skills (no Windows traz o Git Bash) | `winget install Git.Git` | `brew install git` |
| **FFmpeg** (build completa) | Cortes, cor HDR, áudio e encode (precisa de `zscale`, `libx265`, `libvpx-vp9`) | `winget install Gyan.FFmpeg` | `brew install ffmpeg` |
| **Google Chrome** | Render dos quadros e impressão de PDF | `winget install Google.Chrome` | `brew install --cask google-chrome` |
| **Claude Code** | A IA que edita: escreve, testa e renderiza | `npm install -g @anthropic-ai/claude-code` | `npm install -g @anthropic-ai/claude-code` |
| **yt-dlp** | Baixar vídeos de referência (Instagram, TikTok, YouTube; seção 24.9) | `winget install yt-dlp.yt-dlp` | `brew install yt-dlp` |
| ElevenLabs (opcional) | Narração, efeitos e trilha por IA (seção 38) | conta em elevenlabs.io + chave em `.env.local` | igual |
| Bun (opcional) | Só para rodar o Studio do HyperFrames a partir do código-fonte | `winget install Oven-sh.Bun` | `brew install oven-sh/bun/bun` |

> O Claude Code precisa de uma conta do Claude com assinatura. Se preferir, use o instalador oficial descrito na
> documentação do Claude Code em vez do `npm`.

### 0.2 Bibliotecas de Python
```bash
pip install opencv-python numpy pymupdf pillow onnxruntime
# placa de vídeo para o recorte por IA (opcional, deixa ~3× mais rápido):
pip install onnxruntime-directml   # Windows com AMD/Intel
pip install onnxruntime-gpu        # NVIDIA
```

### 0.3 HyperFrames (o motor de vídeo)
```bash
npx hyperframes init meu-video      # cria a pasta do projeto
cd meu-video
npx hyperframes preview             # abre o Studio no navegador (prévia ao vivo, atualiza sozinha)
npx hyperframes skills update       # instala as skills do HyperFrames no Claude Code
```
O **Three.js** (3D) não precisa de instalação: o Claude baixa uma versão fixa para `assets/vendor/three` do
projeto (ex.: `three@0.170.0` pelo jsDelivr) e o render fica igual sempre.

### 0.4 Conferir se está tudo certo
```bash
node -v && python --version && git --version && ffmpeg -version | head -1 && yt-dlp --version
```
Se algum não for encontrado logo depois de instalar, feche e abra o terminal de novo (o PATH só atualiza assim).
No Windows, se o FFmpeg instalado pelo winget não entrar no PATH, ele fica em
`%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_…\ffmpeg-…-full_build\bin`.

### 0.5 Instalar este manual como skill
Copie a pasta `editor-de-video-ia` para:
- **Windows:** `%USERPROFILE%\.claude\skills\`
- **Mac/Linux:** `~/.claude/skills/`

Reabra o Claude Code. A skill carrega sozinha quando você pede para editar, legendar, animar ou analisar um vídeo.

---

## 1. Os 10 mandamentos

1. **A qualidade de saída nunca é menor que a de entrada.** iPhone grava HEVC 10-bit HDR (HLG), 59,94 fps, ~25 Mbps. A entrega sai assim também.
2. **Nunca converter para 30 fps nem para SDR** sem o usuário pedir. Nunca recomprimir duas vezes "para ficar mais leve".
3. **A voz é sagrada.** Só nivelar (loudnorm). Filtro de ruído (`afftdn`) abafa a voz: não usar no áudio do iPhone.
4. **Vertical 9:16, mobile-first**, respeitando as safe zones do Reels.
5. **Gráfico entra em cima, nunca no lugar do rosto.** Rosto sempre visível.
6. **Minimalista e limpo:** vidro escuro, cascata suave, poucas cores, nada piscando sem motivo.
7. **Tudo sincronizado com a fala** (palavra a palavra, pelo tempo da transcrição), nunca "no olho".
8. **Esperar o material.** Quando o usuário manda algo "para entender a ideia", não sair montando o vídeo inteiro.
9. **Conferir antes de entregar:** `check` do HyperFrames, snapshots dos momentos-chave, `ffprobe` da saída e LUFS.
10. **Entregar onde o usuário vê:** copiar para `Downloads/` e abrir o arquivo (`start ""`).
11. **Perguntar e pedir material antes de inventar.** Faltou foto do produto, logo, dado real ou a palavra do CTA? Pedir (seção 23). Pouco e objetivo, de uma vez só.
12. **Cada cena carrega algo para a próxima** (um elemento atravessa o corte) e **os tempos de cena variam** (o mais longo ≥ 4× o mais curto), senão vira slideshow.
13. **Testar o efeito mais difícil em 1 segundo** e mostrar uma folha de quadros com tempo antes do render final.
14. **Um conceito só por vídeo.** Sem conceito, o vídeo vira um "tour de efeitos". Nomear o conceito numa linha antes de começar.
15. **Lista de banidos sempre** (seção 34): nada de brilho sem motivo, explosão de partículas, crossfade, quique de desenho animado, texto decorativo nos cantos ou cara de template.
16. **Todo movimento nasce de algo que já está na tela** e leva a algum lugar. Efeito solto é decoração.
17. **"Não mexe" é literal.** Se pedirem para não mexer na voz ou na imagem, só vale ajuste global e reversível: ganho linear na voz, a mesma exposição em todos os cortes (seção 37.3).
18. **Fluidez antes de efeito.** Todo movimento tem antecipação ou continuidade; nada `linear` fora de contador; um foco por vez (seção 36).

---

## 2. Ferramentas, repositórios e onde fica cada coisa

### Repositórios e ferramentas

| O quê | Onde / link | Para quê |
|---|---|---|
| **HyperFrames** (HeyGen) | https://github.com/heygen-com/hyperframes · `npx hyperframes …` | Vídeo escrito em HTML + GSAP, renderizado quadro a quadro |
| HyperFrames Studio | `npx hyperframes preview` | Pré-visualizar as composições ao vivo |
| Projetos de vídeo | uma pasta por vídeo, criada com `npx hyperframes init <nome>` | Composição, assets e scripts de cada vídeo |
| CLI | dentro do projeto: `npx hyperframes <cmd>` | `check`, `snapshot`, `render`, `transcribe` |
| **FFmpeg** (build completa) | seção 0 | Cortes, cor, áudio, encode (libx265, libvpx-vp9, zscale) |
| **Three.js** | https://threejs.org · baixado para `assets/vendor/three` | 3D de verdade (casa, prédio, sala, ícones extrudados) |
| **RobustVideoMatting** | https://github.com/PeterL1n/RobustVideoMatting (modelos ONNX) | Recorte da pessoa no vídeo, com coerência entre quadros |
| **Parakeet** (`parakeet-tdt-0.6b-v3`) | `npx hyperframes models install parakeet` | Transcrição PT-BR com tempo por palavra; melhor que o Whisper aqui |
| Python 3.12 + OpenCV + NumPy + PyMuPDF + Pillow | seção 0.2 | Rastreamento, detecção de cliques, PDF → imagem |
| Chrome headless | Google Chrome instalado | Imprimir PDFs a partir de HTML |
| **yt-dlp** · gallery-dl · instaloader | seção 24.9 | Baixar vídeos e posts de referência |
| gosom/google-maps-scraper | https://github.com/gosom/google-maps-scraper | Leads do Google Maps |
| Serper.dev | https://serper.dev (2.500 buscas grátis) | Busca no Google por API |
| Fontes (Fontsource / jsDelivr) | `https://cdn.jsdelivr.net/npm/@fontsource/<fonte>/files/...woff2` | Baixar `.woff2` para o projeto |

### Tipos de projeto que já deram certo (servem de modelo)

| Tipo | O que tem de útil |
|---|---|
| Reels de rosto + cartões | Cartões de vidro acima da cabeça, digitação com cursor, zoom suave na abertura, balão CTA |
| Resultado de IA em tela cheia | Vídeo gerado abrindo da ponta do produto (clip-path), congelamento de quadro, SFX sincronizados |
| Rastreamento de tela | OpenCV seguindo a tela do celular e câmera virtual |
| Tutorial de tela | Rosto → tela → rosto, transição de "puxar o celular", desfoque de privacidade, legenda palavra a palavra |
| Showreel 100% código | 1920×1080 60 fps, música sintetizada, gancho, faixas cinéticas, montagem de números |
| Demonstração com jump cuts | **Fluxo sem perda HDR 60 fps** (camada transparente + composição no FFmpeg) |
| **"O vídeo faz o que eu falo"** | **3D integrado à fala, recorte por IA, fundo reconstruído, entrada na TV** (seção 35) |

---

## 3. Identidade visual (exemplo: Ouriks Web; troque pela sua)

| Token | Cor | Uso |
|---|---|---|
| `--ink` | `#0a0a0a` | Fundo |
| `--red` | `#dc2626` | Cor da marca, botões, balões, números |
| `--red-hi` | `#ef4444` | Vermelho **para texto sobre vídeo** (contraste) |
| `--red-soft` | `#f87171` | Serif itálico de destaque dentro de cartão escuro |
| `--cream` | `#f4ecdf` | Texto principal |
| `--cream-dim` | `rgba(244,236,223,.72)` | Texto secundário |
| `--line` | `rgba(244,236,223,.22)` | Borda de vidro |

- **Tipografia:** Instrument Sans (400/600/700) + **Instrument Serif itálico** nas palavras-chave ("no *automático*", "*passo a passo*").
- **Cartão de vidro escuro** (lê sobre rosto e sobre tela):
  ```css
  background: linear-gradient(160deg, rgba(14,13,12,.86), rgba(14,13,12,.74));
  backdrop-filter: blur(26px) saturate(150%);
  border: 1.5px solid var(--line);
  border-radius: 40px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.2), 0 30px 70px rgba(0,0,0,.45);
  ```
  + um `.glow` radial vermelho no canto superior direito.
- **Kicker** em caixa alta espaçada (`letter-spacing: .22em`) acima do título.
- Para clientes, adotar a identidade **deles** (ex.: uma escola com papel `#f5f4ee`, verde-mata `#173322`, verde `#4b7a37/#8ec43b`, Schibsted Grotesk + Newsreader itálico).

---

## 4. Formato vertical e safe zones

- Canvas **1080×1920**, `data-resolution="portrait"`.
- **Evitar:** topo **~250 px** (nome/ícones do Reels), base **~450 px** (legenda do post, botões), direita **~140 px** (curtir/comentar/compartilhar).
- **Cartões:** faixa **y 270–760**, `left: 90px`, largura ~860 px (sobre a cabeça, sem cobrir o rosto).
- **Legenda:** caixa `top: 1300px; height: 170px; left: 90px; right: 160px` (termina logo antes da área do Instagram).
- Nunca encostar texto nas bordas; mínimo 64–90 px de respiro lateral.

---

## 5. Qualidade de imagem: o fluxo sem perda (HDR 60 fps)

### O que o iPhone entrega
`ffprobe` típico: **HEVC Main 10, yuv420p10le, arib-std-b67 (HLG), bt2020, 60000/1001 fps, ~24,7 Mbps**, áudio AAC 48 kHz + faixa espacial APAC (ignorar a APAC, usar `0:a:0`).

### O fluxo certo
1. **Cortes direto dos `.MOV` originais** (`trim`/`atrim` no `filter_complex`), sem converter antes.
2. **Animações e legenda em uma camada separada e transparente**:
   - projeto irmão `<nome>-overlay` igual ao principal, **sem o `<video>`**, sem `<audio>` e com `html, body, #root { background: transparent }`;
   - `render --format webm --fps 60000/1001 --quality delivery` → `overlay.webm` (VP9 com alpha).
3. **Composição no FFmpeg** (script `scripts/final.py`):
   - decodificar a camada com `-c:v libvpx-vp9 -i overlay.webm` (senão perde o alpha);
   - separar cor e alpha, converter a cor **709 → HLG/BT.2020** com `zscale ... npl=203` (branco do gráfico = branco de referência do HDR), juntar com `alphamerge` e `overlay=format=yuv420p10`;
   - zoom dos jump cuts direto no original: `scale=1146:2038:flags=lanczos,crop=1080:1920`.
4. **Encode final:**
   ```
   -c:v libx265 -preset medium -crf 16 -pix_fmt yuv420p10le
   -x265-params colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited
   -color_primaries bt2020 -color_trc arib-std-b67 -colorspace bt2020nc -tag:v hvc1
   -r 60000/1001 -movflags +faststart
   ```
5. **Testar cor antes do vídeo inteiro:** `final.py --teste 1.5` gera 4 s; conferir um quadro convertido para SDR só para olhar.

### Quando SDR é aceitável
Só quando o destino exige (ex.: material só de tela, gravação já SDR) ou o usuário pedir. Conversão boa:
`zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p`.
Mesmo assim, **manter 60 fps** se a origem for 60.

### Regras
- `-g 30 -keyint_min 30` (ou 60) em intermediários H.264 para busca precisa no HyperFrames.
- Gravação de tela (Windows, 60 fps, BT.709): converter só para H.264 `crf 16`, mantendo resolução.
- **Nunca** fazer um "-insta" com `crf 21` em cima de um render já comprimido.
- Render 100% gráfico (showreel): `render --fps 60 --quality delivery`.

---

## 6. Áudio: voz, nivelamento, efeitos e trilha

### Voz
- **Nivelar em 2 passagens** para **-16 LUFS integrado, -1,5 dBTP, LRA 11** (padrão de redes sociais).
  - Passagem 1: `loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json` → ler `input_i`, `input_tp`, `input_lra`, `input_thresh`, `target_offset`.
  - Passagem 2: `loudnorm=...:measured_I=..:...:linear=true`.
  - Dentro de `filter_complex`, o loudnorm vai **no grafo** (`[c]loudnorm…[voz]`); `-af` não se aplica a saída de grafo.
- Em cada corte: `afade` de **8–15 ms** de entrada e saída (evita clique).
- **Não usar `afftdn`/`highpass` em voz do iPhone.** Se precisar limpar ruído, testar antes e comparar A/B.
- Mixar efeitos sem normalizar: `amix=inputs=N:normalize=0:duration=first`.
- Conferir no fim: `ffmpeg -i saida.mp4 -af ebur128=framelog=quiet -f null -` → `I: -16.0 LUFS`.

### Efeitos (SFX) sintetizados, sem samples
Arquivos em `assets/sfx/`: `key1`, `key2` (tecla), `pop`, `shine`, `whoosh-in`, `whoosh-out`. Volumes de referência (baixinho: SFX alto cansa):

| Evento | Efeito | Volume |
|---|---|---|
| Cartão entrando | `pop` | 0,13–0,18 |
| Número grande / resultado | `pop` 0,26 + `shine` 0,14 | |
| Digitação | `key1/key2` alternados, passo 0,06–0,09 s | 0,16–0,22 |
| Troca de cena / take | `whoosh-in` / `whoosh-out` | 0,24–0,40 |

Montagem: cada evento com `adelay=<ms>:all=1,volume=<v>`, tudo num `amix`, gerando `sfx-track.wav` com a duração exata do vídeo.

### Trilha musical 100% sintetizada (showreel)
Um script `music.mjs` (Node, sem dependências) gera WAV 48 kHz:
- **Instrumentos por fórmula:** kick (seno com queda de pitch), hat (ruído + passa-alta), clap (3 rajadas + passa-faixa), pluck (2 serras desafinadas + filtro que fecha), baixo (serra + sub), pad (vozes desafinadas + passa-baixa), sino FM, riser, whoosh e "boom" de corte.
- **Reverb Schroeder** (4 comb + 2 all-pass) num envio, passa-alta 28 Hz, saturação `tanh`, normalizado a -1 dBFS.
- **A música segue o vídeo:** os tempos de corte (`SEAMS`) e os eventos de cada cena (cliques, sino, digitação) ficam no topo do arquivo, iguais aos do `index.html`.
- **Estrutura que funciona:** intro tensa sem bateria → bateria entra no 1º corte → seção leve → seção cheia → **respiro de 1 s antes do fecho** → acorde brilhante final + fade.

---

## 7. Transcrição e cortes (pausas, travadas, frases refeitas)

### Transcrever
```bash
npx hyperframes transcribe assets/raw/take.mp4 --engine parakeet --language pt --json
# o resultado palavra a palavra fica em assets/raw/transcript.json → copiar para scripts/tr/<take>.json
```

### Ler e decidir
- Imprimir `[tempo]palavra` de todas as falas e **ler como roteiro**.
- **Ordem dos takes:** descobrir pela fala (gancho, demonstração e CTA), não pelo nome do arquivo.
- **Frase refeita:** quando a mesma ideia aparece duas vezes ("olha que legal, ele já cria…" / "olha que legal, ele já criou…"), **cortar a 1ª e manter a 2ª**.
- **Travadas:** cortar frases abandonadas ("Depois aqui, ele vai."), muletas soltas ("É.") e enrolação ("switches, enfim…").
- **Cuidado com a borda do corte:** conferir o `start`/`end` da palavra seguinte. O "Vou" de "Vou atualizar" terminava em 132,04 s, dentro do corte que ia até 132,15 s, e quase sumiu.

### Script de cortes (`scripts/cortes.py`)
- Lista de takes com início, fim e trechos removidos (com comentário do porquê).
- **Pausas:** agrupar palavras com intervalo ≤ **0,42 s**; respiro de **0,16 s antes** e **0,10 s depois** da fala.
- Gera `segs.json` (trechos) e `words.json` (palavras já no tempo final, para legenda e animações).

### Ritmo
- Jump cut alternando o enquadramento (1× ↔ 1,06×) **dentro** de um take esconde o corte.
- Entre takes diferentes: zoom que assenta (1,08 → 1 em 0,6 s) + `whoosh`.

---

## 8. Legenda que acompanha a voz

O estilo que mais funcionou. Como fazer:

- **Blocos curtos:** até ~3 palavras / 18–20 caracteres; quebra em pontuação ou pausa > 0,35 s; **não terminar bloco em palavra fraca** ("de", "o", "que", "pra"…).
- **Cada palavra acende quando é falada:** cor apagada `rgba(244,236,223,.62)` → creme `#f4ecdf`, com escala 1,06 por 0,1 s.
- **Palavras-chave em vermelho** (`#ef4444`), definidas numa lista (`HL`) por vídeo (ex.: leads, Claude Code, 402, 52 leads, de graça, DM…).
- **Legível sobre qualquer fundo:** `-webkit-text-stroke: 9px rgba(10,10,10,.9); paint-order: stroke fill;` + sombra leve. Fonte 60 px, peso 700, centralizada.
- **Corrigir a transcrição** antes de exibir (dicionário `FIX`): "main chat" → ManyChat, "Met Business Switch" → Meta Business Suite, "Claud/Cloud Code" → Claude Code, "Reals" → Reels, "automatão" → automação, além do seu nome e do seu @.
- Expressões que não podem quebrar: usar espaço não separável (`\u00a0`), como em "Meta\u00a0Business\u00a0Suite" e "de\u00a0graça".
- Entrada do bloco: `opacity 0→1, y 14→0` em 0,16 s; saída em 0,1 s.

---

## 9. Animações: cartões de vidro, cascata, zoom e câmera

### Cartão (entrada e saída padrão)
```js
// entrada: sobe do desfoque com clip-path abrindo
{ opacity:0, y:60, scale:.9, filter:"blur(20px)", clipPath:"inset(12% 6% 12% 6% round 56px)" }
→ { opacity:1, y:0, scale:1, filter:"blur(0px)", clipPath:"inset(0% 0% 0% 0% round 40px)", duration:.85, ease:"expo.out" }
// saída: sobe e desfoca
→ { opacity:0, y:-40, filter:"blur(14px)", duration:.35, ease:"power2.in" }
```

### Itens dentro do cartão (cascata)
`opacity 0, x 60, blur 8 → 0` em 0,55 s `expo.out`, cada item **na palavra exata** em que é falado.

### Biblioteca de efeitos que funcionaram
- **Digitação com cursor:** letras `display:none → inline` em passos de 0,06–0,09 s; o cursor acompanha o texto. Usar `display` e não `opacity`, senão o cursor fica flutuando.
- **Contador:** objeto `{v}` animado com `onUpdate` escrevendo o número (0 → 788, 0 → 2.208).
- **Risco por cima** (ManyChat riscado): barra vermelha `scaleX 0 → 1`, `transform-origin: 0 50%`.
- **Balão de comentário "Comente PALAVRA":** entra com `back.out(1.8)` e rotação −8°, recebe pulso de escala 1,08 e a palavra digitada.
- **Vídeo em tela cheia abrindo de um ponto** (da ponta do produto): `clip-path: circle(0px at x y) → circle(2300px at x y)` e fecha de volta no mesmo ponto.
- **Funil com destaque andando:** contorno vermelho que desliza entre as etapas (Leads → Oportunidade → Protótipo).
- **Chips de idioma** PT/EN/ES/FR entrando um por palavra.
- **Zoom suave na abertura:** `scale 1.08 → 1` em 0,8 s (no lugar de vinheta, que parece "quebrada").
- **Transição de tela para rosto:** a janela da gravação se inclina até a posição do monitor no 1º quadro do take seguinte e corta no movimento.
- **Rostinhos inventados** (caricaturas em SVG, sem IA): pele, cabelo, olhos (fechados = dormindo), boca, bochechas; servem para avatares de notificação e painel.

### Câmera virtual
Wrapper com `transform: translate + scale` controlado por um objeto proxy (`onUpdate`). Usar com parcimônia: em tutorial de tela, **zoom confunde**.

---

## 10. HyperFrames na prática (regras e armadilhas)

- Composição: `<div id="root" data-composition-id="main" data-start="0" data-duration="…" data-width data-height>`.
- **Cada elemento com tempo** precisa de `data-start`, `data-duration` e `class="clip"`.
- Uma timeline GSAP **pausada** registrada em `window.__timelines["main"] = tl`, com o **script inline** no `index.html` (o lint não aceita o script externo).
- **Vídeo não pode ficar dentro de elemento com `data-start`:** usar um wrapper sem tempo (`#base-wrap`).
- `data-media-start` corta o início da mídia; vídeo com som: `data-has-audio="true"`; b-roll: `muted`.
- **Não animar `visibility`/`opacity` do próprio `.clip`**; animar um filho (`.mv`).
- Vários `fromTo` no mesmo alvo: todos, menos o primeiro, com `immediateRender:false`.
- **Animar só transform/opacity/filter/clip-path.** `margin`, `left/top`, `width/height` e `letter-spacing` "pulam pixel" no render (o lint bloqueia): trocar por `x/y/scale` ou `clip-path`.
- Canvas (grade de 2.208 cursos): desenhar numa função chamada por um tween "relógio" com `onUpdate`, que funciona em qualquer busca de tempo.
- **Determinístico:** sem `Math.random()` (usar hash próprio), sem `Date.now()` e sem fetch.
- Elementos decorativos (números "fantasma") recebem `data-layout-ignore aria-hidden="true"`; sobreposições de propósito, `data-layout-allow-overlap`.
- **Verificar sempre:**
  ```bash
  npx hyperframes check                 # lint + runtime + layout + contraste
  npx hyperframes snapshot --no-end --at 2.5,30,52   # quadros-chave
  npx hyperframes snapshot --zoom x,y,w,h --zoom-scale 2 --at 12  # detalhe
  ```
- Contraste (WCAG) do `check` pega texto ilegível: corrigir com vidro mais escuro ou cor mais forte, nunca ignorar.

---

## 11. Doutrina de movimento (motion design)

Skills do repositório: `motion-doctrine`, `cut-the-curve`, `oversized-cursor`, `seam-craft` (em `hyperframes/.claude/skills`).

- **Uma corrente por filme** (padrão: para a **esquerda**). Toda troca de cena comum segue essa direção.
- **Lei do vetor:** a cena sai acelerando (`power4.in`) para a esquerda e a próxima **já entra em movimento** (`power4.out`) vindo da direita, com o mesmo eixo e a mesma velocidade. **Nunca crossfade.**
- **Vetores reservados:** para cima = conclusão / fecho; zoom para frente = aprofundar; "explodir" = sair de um mundo.
- **Causa e efeito no mesmo quadro:** o clique do cursor faz a onda, o sino balança e o selo aparece no mesmo instante.
- **Sem balanço à toa** (nada de "respirar" para preencher tempo). Se sobrou tempo na cena, falta história.
- **Pausa antes do clímax:** 0,3–0,75 s entre a ação e o resultado.
- Entrada ≤ 0,8 s; saída ≈ 75% da entrada; stagger total ≤ 0,5 s; easing proibido: `bounce`/`elastic`.
- **HUD de referência** (estilo showreel): capítulo no canto inferior esquerdo, timecode, barra de progresso; a cor troca com o fundo da cena.

---

## 12. Tipos de vídeo e receitas prontas

### A) Rosto + cartões ("códigos" de IA)
Take do rosto → cartão de prompt digitando acima da cabeça → resultado (foto ou vídeo do Gemini) em tela cheia com entrada e saída → capa do PDF + balão "Comente X". SFX baixinhos.

### B) Tutorial: rosto → tela → rosto
1. Take 1 (gancho) com cartões acima da cabeça e cortes com punch-in.
2. Na frase "entra no Meta Business Suite…", a tela sobe e ocupa o vertical (janela 1080×865 centralizada).
3. Etiquetas de passo (1…8) acima da janela. **Sem zoom e sem círculo de clique** (o mouse já guia o olhar).
4. Take final começando no monitor e o celular "puxado" → transição que encaixa a janela no monitor.
5. Legenda palavra a palavra e card final com foto de perfil + "Seguindo ✓".

### B2) 🆕 Tela em cima, fala embaixo
A tela (ou animação) ocupa o quadrado de cima e a pessoa fala embaixo, ao mesmo tempo; legenda amarela de 1–2 palavras na divisória e zoom suave na região da tela que está sendo falada. Receita completa na **seção 37**.

### C) Demonstração de projeto com jump cuts
Gancho → explicação na tela com cartões sincronizados (sistema, números, filtro, resultado, funil, protótipo) → CTA com PDF. **Fluxo sem perda HDR 60 fps.**

### D) Showreel institucional
Gancho com tensão e resposta no fim ("03:12 · A equipe está dormindo · Quem responde?" → "Quem respondeu foi ele.") → título grande em fundo de cor → faixas cinéticas com janela de destaque → capítulos → montagem de números de 1 s cada → assinatura e passos.


### E) 🆕 Motion sem rosto: "um quadradinho é você"
Um objeto simples (1 cubinho = você) cresce de escala até virar o todo (a cidade, o mercado, o planeta), muda de cor por categoria e termina numa pergunta ("de que cor é o seu?") + CTA. Câmera sem corte, narração por IA e cada evento na palavra. **Seções 36.4 e 38.**
---

## 13. Gravação de tela e tutoriais

- **Achar os cliques com precisão:** `scripts/activity.py` mede a mudança de pixels num retângulo quadro a quadro; `scripts/diff.py` lista todas as mudanças de tela com caixa delimitadora.
- **Medir coordenadas reais** com quadros em grade (`drawgrid`) ou recortes em resolução cheia. **Nunca chutar pela miniatura** (os zooms já erraram por isso).
- **Desfoque de privacidade embutido** (nomes, fotos, mensagens, links) com `crop + boxblur + overlay=...:enable='between(t,a,b)'` direto no vídeo da tela.
- Se for usar marcação de clique: círculo **~2 s antes** do clique, menos quando a página rola antes; nesse caso, encurtar a antecedência.
- Narração gravada por cima da tela (CapCut) **sem cortar nem acelerar** a tela, para manter os tempos dos cliques.

---

## 14. Showreel / motion graphics 100% em código (com música sintetizada)

- Sem modelos de imagem, vídeo ou áudio: tudo em HTML/CSS/SVG/Canvas + GSAP, e a música em JS puro.
- **Marca do cliente redesenhada em SVG** (ícone vetorial nítido em qualquer tamanho).
- **Dados reais do projeto** dão credibilidade: curso real do catálogo, botão real ("Acessar o curso"), contagem real do banco.
  - Conferir no banco, não no arquivo velho: o JSON tinha 2.214, mas **ativos eram 2.208** (contando direto no banco).
- 1920×1080 a 60 fps para LinkedIn/feed horizontal; oferecer versão 9:16 para Reels/Stories.
- **Gancho para 60 s:** pergunta que só se responde no final.

---

## 15. Ganchos, roteiro e CTA

- **O começo decide:** a 1ª palavra já é o gancho (nada de "oi gente"); algo se mexendo no 1º quadro; texto na tela repetindo a fala; gancho em ≤ 2 s.
- Modelos de gancho que funcionaram ou foram aprovados:
  - "**Paaara** de dar dinheiro pro ManyChat…"
  - "Acabei automatizando uma geração de leads com funil muito louca."
  - Resultado primeiro, antes e depois, dor do criador, recado direto ("Se você vende no Instagram, salva esse vídeo").
- **Roteiro:** manter a voz de quem fala; revisar só de leve, sem reescrever "enxuto".
- **Vocabulário:** dizer **"código"**, nunca **"comando"** (soa mal para muitos públicos).
- **CTA:** "Comente **PALAVRA** que eu te mando na DM", com a capa do PDF + balão vermelho com a palavra digitada.

---

## 16. PDFs de isca (DM) e automação de comentário

### PDF
- Páginas **390×844** (tela de celular, abre 1:1), Ouriks dark + vermelho, prompts em bloco monoespaçado.
- Guia avulso: HTML em `conteudo/<tema>/guia.html` usando `../../src/styles.css` e impresso com:
  ```bash
  chrome --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=5000 --print-to-pdf=SAIDA.pdf file:///.../guia.html
  ```
- Conferir as páginas renderizando com PyMuPDF (`page.get_pixmap(dpi=60)`). Cuidado: `span` solto num container `flex column` vira linha inteira, então embrulhar num `div`.
- A capa do PDF vira imagem para o CTA do vídeo (`get_pixmap(dpi=200)`).

### Automação "Comentar para enviar mensagem" (Meta Business Suite)
- Caminho: **Caixa de Entrada → Automações → Ver tudo → Comentar para enviar mensagem**.
- **Palavra-chave diferencia maiúscula e minúscula e precisa ser exata:** cadastrar variações (NATIVO, Nativo, nativo…; CLAUDE CODE, Claude Code, claude code).
- A mensagem pode personalizar com o **nome do destinatário** (inserir pelo botão, não digitar `{nome}`).
- Pode levar alguns minutos para começar a funcionar.
- Mensagem da DM: máximo de 1.000 caracteres.

---

## 17. Textos de post (Instagram e LinkedIn)

- **Instagram:** curto e direto ("Comenta **NATIVO** que eu te mando o passo a passo na DM 📩").
- **LinkedIn:** funciona melhor um **"Fala, rede! 👋"**, sem gancho dramático:
  1. o que foi feito;
  2. como funciona, em passos numerados;
  3. o porquê (a IA não substitui o time);
  4. bastidor ("o vídeo foi feito 100% em código");
  5. convite para contato;
  6. hashtags.
- Projeto de cliente: **não citar o nome** quando o cliente pedir sigilo.

---

## 18. Prompts de imagem e vídeo (ChatGPT / Gemini)

- **"Códigos" com barra** (`/droneview`, `/luxury-commercial`, `/story-ad`) funcionam por interpretação do nome, sem ser recurso oficial. Os de 2 palavras com hífen são entendidos melhor.
- **Gemini (Omni):** até 10 s, até 5 imagens de referência, funciona no plano grátis com limite menor; o formato vertical é escolhido no seletor, não no texto; a foto anexada tende a virar o 1º quadro; briefs de 30–80 palavras com linguagem de câmera simples.
- **Teste real vale mais que pesquisa:** se você testou e funcionou, a pesquisa estava errada.
- **Foto artística (estilo "estudos de realidade"):** não basta filtro. Pedir **direção de arte**:
  - cenário abstrato / campo de cor, sem lugar turístico;
  - desfoque luminoso que atinge também a pessoa, com traços parcialmente dissolvidos;
  - clima introspectivo, sem sorriso;
  - paleta dessaturada de 3 cores (dupla complementar + neutro), halação, grão pesado, textura de papel;
  - "evite cores vivas, nitidez, aparência de IA".

---

## 19. Privacidade e marca do cliente

- Borrar nomes, fotos e mensagens de terceiros na tela.
- **Remover logo e nome do cliente quando pedido:** ícone neutro (balão + brilho), textos genéricos ("assistente virtual", "instituição"), sem domínio do site. Guardar a versão com marca em `scripts/bak/`.
- Chaves e segredos nunca aparecem no vídeo (conferir terminais e `.env` na gravação).

---

## 20. Erros que já aconteceram (e a correção)

| Erro | Correção |
|---|---|
| Vídeo final a 30 fps, SDR e voz abafada | Fluxo sem perda da seção 5; voz só com loudnorm |
| "-insta" recomprimido a `crf 21` | Nunca recomprimir; um encode final só |
| Montar o vídeo inteiro antes de o usuário gravar | Esperar o material; perguntar se é só referência |
| Zoom em lugar errado no tutorial | Sem zoom; mostrar a tela inteira e medir as coordenadas reais |
| Círculos de clique e moldura "digitando" | Poluem a tela: só etiquetas de passo |
| Vinheta "quebrada" | Zoom suave 1,08 → 1 |
| Borda preta no fechamento do vídeo em tela cheia | Fundo do contêiner `transparent` |
| Cursor flutuando longe do texto digitado | `display:none → inline` em vez de opacity |
| `$` virando `$` no `String.replace` do JS | Usar função ou escapar `$$` |
| `-filter_complex_script` não existe no FFmpeg 9 | Usar `-/filter_complex arquivo.txt` |
| `-af` ignorado com `filter_complex` | Colocar o loudnorm dentro do grafo |
| Quebra de linha dentro de string ao editar Python por shell | Editar com ferramenta de arquivo; validar com `ast.parse` |
| `drawtext` do FFmpeg travando (sem fontconfig) | Não usar drawtext; texto vai no HTML |
| Lint: layout tween (`margin`, `left`, `letterSpacing`) | Trocar por transform ou clip-path |
| Texto da legenda ilegível sobre camisa clara | Contorno escuro `-webkit-text-stroke` |
| Número desatualizado (2.214) | Conferir no banco (2.208 ativos) |
| "Vou" cortado na borda | Conferir o `start`/`end` da palavra vizinha antes de fixar o corte |
| 🆕 Imagem muda no fim de cada take do iPhone | O .MOV tem áudio ~0,27 s mais curto: cortar pelo fim do áudio |
| 🆕 Branco dos gráficos estourado no vídeo HDR | Converter o gráfico 709→2020 com o branco em 203 nits (BT.2408), no compositor; não usar o HDR embutido do render |
| 🆕 Voz baixa "corrigida" com compressor e EQ quando pediram para não mexer | Só ganho linear até ~−16 LUFS |
| 🆕 Exposição diferente em cada corte | Um único ajuste (ex.: ×0,80 em luz linear) para todos os takes |
| 🆕 Dado sensível na gravação de tela (registro DNS, token) | Desfocar antes do render; conferir quadro a quadro |
| 🆕 ElevenLabs respondeu 402 | Recurso de plano pago (voz da biblioteca, música): usar voz padrão e beds do gerador de SFX |
| 🆕 Node gravou em `C:\c\...` | Em JSON lido pelo Node no Git Bash, escrever `C:/...` em vez de `/c/...` |

---

## 21. Checklist antes de entregar

**Imagem**
- [ ] `ffprobe` da saída = origem (codec 10-bit, HLG/BT.2020 se a origem for HDR, **59,94/60 fps**, 1080×1920).
- [ ] Um encode final só; bitrate coerente (≥ 12–15 Mbps em HEVC 10-bit vertical 60 fps).
- [ ] Quadro de teste convertido para SDR só para conferir a cor dos gráficos.

**Som**
- [ ] `ebur128` = **-16 LUFS**, sem clipping.
- [ ] Voz natural (sem filtro de ruído), fades de 8–15 ms nos cortes.
- [ ] SFX baixinhos e no tempo.

**Conteúdo**
- [ ] Nenhuma travada ou frase repetida; nenhuma palavra cortada na borda.
- [ ] Transcrição corrigida (nomes de produto, @, números).
- [ ] Cartões e legenda dentro das safe zones; rosto livre.
- [ ] `check` do HyperFrames sem erro; snapshots dos momentos-chave olhados.
- [ ] Privacidade (nomes e dados de terceiros borrados) e marca do cliente conforme pedido.
- [ ] CTA com a palavra-chave igual à da automação.

**Entrega**
- [ ] Copiado para `Downloads/` com nome claro e aberto para o usuário.
- [ ] Resumo do que mudou + o que conferir + versões antigas que podem ser apagadas.

---

## 22. Cola de comandos

```bash
# Inspecionar um arquivo
ffprobe -v error -show_entries stream=codec_name,profile,pix_fmt,color_transfer,color_primaries,r_frame_rate,width,height,bit_rate:format=duration -of compact ARQ

# Folha de contato (5 quadros por segundo, ou 1 a cada N s)
ffmpeg -i ARQ -vf "fps=5,scale=216:-1,tile=10x5" -frames:v 1 folha.jpg

# Medir loudness
ffmpeg -i ARQ -af ebur128=framelog=quiet -f null - 2>&1 | grep "I:"

# Achar silêncios
ffmpeg -i ARQ -af silencedetect=n=-35dB:d=0.4 -f null -

# Transcrever (PT-BR, palavra a palavra)
npx hyperframes transcribe ARQ --engine parakeet --language pt --json

# Verificar / ver / renderizar a composição
npx hyperframes check
npx hyperframes snapshot --no-end --at 1.0,5.5,12
npx hyperframes render --fps 60 --quality delivery -o SAIDA.mp4
npx hyperframes render --format webm --fps 60000/1001 --quality delivery -o overlay.webm   # camada transparente

# HDR → SDR só para olhar um quadro
ffmpeg -ss 2 -i HDR.mp4 -frames:v 1 -vf "zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=mobius,zscale=t=bt709:m=bt709:r=tv,format=yuv420p" quadro.png

# PDF a partir de HTML
"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=5000 --print-to-pdf=SAIDA.pdf file:///CAMINHO/guia.html

# Abrir o resultado (Git Bash no Windows; no Mac: open ~/Downloads/ARQUIVO.mp4)
start "" "$USERPROFILE\\Downloads\\ARQUIVO.mp4"
```

---

## 23. Protocolo de briefing: o que perguntar e quais fotos pedir

Um vídeo perfeito começa com o material certo. **Antes de montar**, olhar tudo que chegou (folha de contato a 2–5 quadros por segundo + transcrição) e só então perguntar **o que falta**, numa mensagem curta e de uma vez só. O que tem padrão razoável a gente decide e avisa; não vira pergunta.

### Perguntas que mudam o vídeo (fazer só as que faltam)

| Tema | Pergunta | Padrão se não responder |
|---|---|---|
| Destino | Onde vai postar? (Reels/TikTok, Stories, feed, LinkedIn, YouTube) | Reels 9:16 |
| Duração | Tem uma duração alvo? | O que a fala pedir, cortando pausas |
| Material | Esse vídeo é **referência** ou é **o material** para editar? | Perguntar sempre que houver dúvida |
| Ordem | Qual é o começo, o meio e o fim? | Deduzir pela fala e confirmar no resumo |
| Gancho | Quer que eu sugira um gancho visual para os 2 primeiros segundos? | Sugerir 1 e seguir |
| CTA | Qual a **palavra-chave** do comentário? Vai mandar o quê na DM? | Perguntar (precisa bater com a automação) |
| Estilo | Segue o padrão Ouriks ou é para um cliente com identidade própria? | Padrão Ouriks |
| Marca de cliente | Pode aparecer nome e logo do cliente? | **Não**, até confirmar |
| Dados | Esses números são reais e atuais? (preço, quantidade, prazo) | Conferir na fonte; nunca inventar |
| Música | Quer trilha? Já tem uma? | Só SFX baixinhos; trilha sintetizada se for showreel |

### Fotos e arquivos para pedir

- **Logo** em PNG transparente ou SVG (o print sempre perde qualidade).
- **Foto de perfil** para avatar e card de "Seguir".
- **Fotos do produto / imóvel / prato**, de frente e com boa luz, em alta resolução.
- **Prints ou gravação da tela** do sistema que vai ser mostrado (gravar a **60 fps**, sem cortar nem acelerar).
- **Capa do PDF** ou material da DM.
- **Arquivo original do iPhone** (AirDrop / "Arquivo original"), nunca o reencaminhado pelo WhatsApp, que perde qualidade.
- Referências visuais (vídeos de outros perfis), dizendo **o que** agradou: o ritmo, a legenda, as animações ou a cor.

### Dicas de gravação para passar ao usuário (antes de ele gravar)

- iPhone em **4K ou 1080p a 60 fps**, HDR ligado, lente 1×; limpar a lente.
- Luz de frente (janela ou ring light), fundo com profundidade.
- Microfone de lapela, ou o próprio iPhone a ~30 cm em lugar sem eco.
- Se travar, **pausar 1 s e repetir a frase inteira** (fica fácil de cortar).
- Se for colocar animação **atrás da cabeça** (seção 26), deixar espaço acima da cabeça e evitar fundo da mesma cor do cabelo e da roupa.
- Para mostrar a tela: gravação de tela do computador (60 fps) **e** um take do rosto separado; filmar o monitor com o celular só como estilo.

---

## 24. Arsenal de repositórios (skills e bibliotecas)

> Regra de ouro: **dar o repositório ao Claude, pedir para ele estudar e achar demos, e só então sugerir ideias.** Nunca usar algo que piore a qualidade da imagem nem tenha licença incompatível com o uso.

### 24.1 HyperFrames — a base (já instalado)
- **Repo:** https://github.com/heygen-com/hyperframes.
- **O que é:** vídeo escrito como HTML + GSAP, renderizado quadro a quadro (determinístico), com Studio, CLI, transcrição (Parakeet), lint e verificação de layout e contraste.
- **Skills que vêm junto** (em `hyperframes/.claude/skills` e `skills/`):
  - **Fluxos:** `/hyperframes` (roteador), `/talking-head-recut` (overlays sobre vídeo de rosto, **o nosso caso mais comum**), `/embedded-captions`, `/motion-graphics`, `/product-launch-video`, `/faceless-explainer`, `/music-to-video`, `/general-video`, `/slideshow`, `/pr-to-video`.
  - **Domínio:** `/hyperframes-core` (contrato `data-*`), `/hyperframes-animation`, `/hyperframes-keyframes`, `/hyperframes-creative`, `/media-use` (som, imagem, **remoção de fundo**, voz, LUT), `/hyperframes-audio` (ducking, compressor, envelopes), `/hyperframes-registry` (blocos prontos: `hyperframes catalog` / `hyperframes add`).
  - **Doutrina:** `motion-doctrine`, `cut-the-curve`, `oversized-cursor`, `seam-craft`, `captions-overlay`.
- **Quando usar:** sempre. É o motor de tudo que fizemos.

### 24.2 onetake — "um plano-sequência só"
- **Repo:** https://github.com/feitangyuan/onetake
- **O que é:** skill de motion graphics que faz o filme parecer **uma tomada contínua**, em que cada cena nasce da anterior (a barra de prompt abre e vira a janela do app; uma linha atravessa a mesa e vira a linha da grade).
- **Ideias que viram regra nossa:**
  - **Carry em todo corte:** um elemento na tela sobrevive à fronteira e vira a próxima batida.
  - **Uma câmera só:** a câmera não corta; ela conduz, "chicoteia" até onde o próximo elemento pousa e **para** nos repousos.
  - **Ritmo medido:** os tempos de cena variam **≥ 4×**; ter quietude; não deixar o assunto sair do quadro.
  - **Motion blur de verdade:** média de várias capturas ao longo de um obturador de 180° em luz linear.
  - **Som pelos eventos:** foley e síntese colocados nos eventos do filme, num reverb só, com a música abaixando nos impactos (ducking).
  - **UI reconstruída em HTML a partir de screenshots** (zoom infinito sem gravação de tela).
  - **"Oracle" de verificação:** mede o que cruza cada corte (carry score; o aceito ficou ≥ 0,75) e acusa planos de duração uniforme, falta de pausa, áudio clipado, movimento rápido sem blur e assunto saindo do quadro.
- **Instalar:** `git clone https://github.com/feitangyuan/onetake.git ~/.claude/skills/onetake` (precisa de Python com playwright, numpy, scipy, Pillow e matplotlib, além de ffmpeg e node).
- **⚠️ Licença PolyForm Noncommercial:** **não usar para trabalho pago ou cliente** sem a licença Pro. Estude e aplique **as ideias**, sem copiar código para entregas comerciais.

### 24.3 gbro-collage-broll — B-roll de colagem em papel
- **Repo:** https://github.com/pyang5166/gbro-collage-broll (MIT)
- **O que é:** transforma uma fala de ~5 s em **B-roll de colagem editorial** (fundo de papel colorido chapado, recortes de foto em meio-tom preto e branco, detalhes em cartolina; os elementos entram e **travam no lugar**, com cara de stop-motion).
- **Fluxo com 3 portões de aprovação (copiar a ideia):** 1) metáfora só em texto (de graça) → 2) quadros parados + folha de contato (barato) → 3) vídeo pelo Gemini Omni Flash, com 1º e último quadro, e QA quadro a quadro.
- **Saída:** MP4 9:16, 720×1280, 24 fps, mudo, para ficar **embaixo da narração**.
- **Atenção:** paga por vídeo (Gemini API), resolução baixa (720p) e depende do `image_gen` do Codex. Para nós, serve como **cutaway curto** ilustrando uma frase, nunca como base do vídeo; o vídeo principal continua em 1080p HDR.

### 24.4 ClaudeAnimationBase — desenho animado pintado à mão
- **Repo:** https://github.com/JohnHeibel/ClaudeAnimationBase (MIT)
- **O que é:** kit de animação em **p5.js + p5.brush**, com traço de pincel, aquarela e linha "fervendo", um personagem (Clawd) com 31 emoções e um `ANIMATION_GUIDE.md` que orienta o modelo.
- **Uso:** `npm install` → `node render.mjs --clip --out=out/video.mp4`; `studio.html?loop=emotions` para ver as poses.
- **Regras do guia que valem para nós:** **storyboard antes de código**; uma peça contínua; transição entre cenas; **algo acontece em toda cena**; o modelo renderiza **folhas de contato** para se auto-revisar; dá para pedir subagentes.
- **Atenção:** aquarela é lenta sem GPU dedicada (pedir para trocar por outro efeito). Bom para intros, mascote e explicações lúdicas.

### 24.5 Lemo-Opuscar — 51 estilos de filme feitos em código
- **Repo:** https://github.com/lemomo-ai/lemo-opuscar (MIT; demos CC BY 4.0)
- **O que é:** um "estúdio" de curtas sem modelo de vídeo, com **51 estilos** (aquarela, gravura, design gráfico, games, 3D, tradições do leste asiático…) e os **Evidence Films** (dados reais e citados).
- **Instalar:** `claude plugin marketplace add lemomo-ai/lemo-opuscar` → `claude plugin install lemo-opuscar@lemolab`.
- **Como pede:** "Faça um filme de 45 s no estilo **watercolor** sobre…". O agente pergunta o que falta, oferece **storyboard** e lê `DIRECTOR.md` (história, som, ritmo, câmera, autochecagem), `TECHNIQUE.md` e o `STYLE.md` do estilo.
- **Atenção:** 30–60 min de agente e muitos tokens; sai em 1080p **24 fps**. Para o nosso padrão, pedir **60 fps** e manter o nosso fluxo de qualidade. Ótimo para **escolher uma estética** e reaproveitar o prompt de estilo.

### 24.6 Bibliotecas de efeito (do "Claude Motion Tips")

| Biblioteca | O que acrescenta | Quando usar no nosso vídeo |
|---|---|---|
| **Matter.js** — github.com/liabru/matter-js | Gravidade, colisão, quique, molas | Palavras/cards **caindo e empilhando** (ex.: "402 descartados" caindo) |
| **Rough.js** — github.com/rough-stuff/rough | Contorno rabiscado e hachura | Diagramas e setas "desenhados à mão" sobre a tela |
| **PixiJS + filters** — github.com/pixijs/pixijs · /filters | Glitch, glow, ASCII, distorção, hachura | Transição "tech", destaque de número, efeito em texto |
| **Anime.js** — github.com/juliangarnier/anime | Coreografia de texto, forma e SVG | Alternativa ao GSAP para SVG desenhando (linha, morph) |
| **p5.brush** — github.com/acamposuribe/p5.brush | Lápis, carvão, marcador, aquarela | Textura tátil, marca-texto sobre palavra-chave |
| **thinking-orbs** — github.com/RareFormLabs/thinking-orbs | Orbes pontilhados de "IA pensando" | Momento "a IA está processando" (busca, gerando) |

- **Determinismo:** no HyperFrames, física e partículas precisam ser **semeadas** e avançadas pelo tempo da timeline, sem `requestAnimationFrame` livre nem `Math.random()`. Simular quadro a quadro a partir de `t`, ou pré-calcular as posições.

### 24.7 Coleções para achar movimentos
- **awesome-opus5-5-videos:** https://github.com/yihui-dev/awesome-opus5-5-videos (~700 prompts de vídeos feitos por Claude em código: motion graphics, explainers, 3D, jogos).
- **Skillry gallery:** https://skillry.dev/ai-videos/opus-5-5 (remakes ao vivo).
- **Como usar:** procurar **um movimento** para adaptar (um reveal de texto, uma transição, um padrão de tempo), nunca copiar um vídeo inteiro.

### 24.8 Ferramentas de recorte de pessoa (para texto atrás da cabeça e cenário 3D)
A referência 2 remove o fundo e reconstrói o cenário. Opções locais:
- `/media-use` do HyperFrames (remoção de fundo integrada).
- **rembg / BiRefNet** (imagem a imagem, alta qualidade) ou **RobustVideoMatting** (matte de vídeo com coerência temporal).
- **MediaPipe Selfie Segmentation** (rápido, borda mais dura).
- Sempre gerar o **matte em resolução cheia e 60 fps**, refinar a borda (feather 1–2 px) e conferir o cabelo crespo em quadro ampliado, que é onde a máscara costuma falhar.

### 24.9 Baixar vídeos de referência (Instagram, TikTok, YouTube)

> Para **estudar** a referência quadro a quadro (ritmo, legenda, animação). Não republique conteúdo de terceiros
> e respeite os termos de cada plataforma e os direitos de quem criou.

**yt-dlp** — https://github.com/yt-dlp/yt-dlp (o principal; baixa de YouTube, Shorts, TikTok e Reels)
```bash
# melhor qualidade, em MP4, com nome organizado
yt-dlp -f "bv*+ba/b" --merge-output-format mp4 -o "referencias/%(uploader)s-%(id)s.%(ext)s" "URL"

# Instagram e TikTok às vezes pedem login: usar os cookies do navegador em que você está logado
yt-dlp --cookies-from-browser chrome -f "bv*+ba/b" --merge-output-format mp4 -o "referencias/%(id)s.%(ext)s" "URL"

# só a legenda/transcrição de um vídeo do YouTube (sem baixar o vídeo)
yt-dlp --skip-download --write-auto-subs --sub-langs "pt.*" -o "referencias/%(id)s" "URL"

# manter o yt-dlp atualizado (as plataformas mudam sempre)
yt-dlp -U          # ou: pip install -U yt-dlp
```

**gallery-dl** — https://github.com/mikf/gallery-dl (carrosséis e fotos do Instagram, quando o yt-dlp não pega)
```bash
pip install -U gallery-dl
gallery-dl --cookies-from-browser chrome "URL-do-post"
```

**instaloader** — https://github.com/instaloader/instaloader (perfis inteiros do Instagram, para análise de formato)
```bash
pip install -U instaloader
instaloader NOME-DO-PERFIL
```

**Depois de baixar, analise assim:**
```bash
# folha de contato: 2 quadros por segundo, 8x4 por imagem
ffmpeg -i referencias/ref.mp4 -vf "fps=2,scale=216:-1,tile=8x4" referencias/folha_%02d.png
```
E peça ao Claude: *"assista a referência quadro a quadro, liste as técnicas que ela usa e o tempo de cada uma"*
(é assim que foram feitas as análises das seções 25 e 30).

---

## 25. Análise das referências "Conteúdo 2.0"

### Referência 1 (111 s): "o novo formato de conteúdo 2.0"
**Ideia:** a pessoa fala e **a explicação é desenhada em tempo real** acima dela. Mostra 4 profissões, cada uma com um estilo próprio, e termina com o CTA "comenta EDIÇÃO".

**Estrutura visual:**
- **Tela dividida vertical:** a metade de cima é o painel de animação; a de baixo é o rosto, dentro de um **cartão de cantos arredondados** com margem. O rosto nunca é coberto.
- **Abertura:** selo branco "Claude Editando ☠" (sticker de capa) + título gigante "CONTEÚDO **2.0**" com cor metálica, os dois atrás e acima da cabeça.
- **Diagrama-conceito:** "você fala 🎤 → a IA desenha ✏️ → todos entendem 👁" (3 ícones ligados por setas, com pessoas pequenas embaixo).
- **Antes × hoje:** card "ORÇAMENTO · Animação · 1 minuto · R$ ●●●●" (valor escondido), seguido de nuvem de palavras flutuando.
- **Um estilo por nicho (troca de "pele" visual):**
  - **Corretor:** navy e dourado, serif editorial ("Residencial *Aurora*"), números grandes (13 andares, 4 min, 72 m²), prédio à noite, mapa com pino, planta 3D, preço num card dourado. Selo "imóvel ilustrativo".
  - **Médico:** fundo claro clínico, ilustração anatômica (músculos faciais), corte de pele com legendas técnicas, gráfico "começa a agir dia 3". Selo "conteúdo ilustrativo".
  - **Nutricionista:** papel bege, lata 3D, copo enchendo de açúcar, número "7 sachês", linha "ideal do dia < 25 g" e o valor estourando em vermelho.
  - **Professor de ciências:** espaço escuro, Sol e Terra, cronômetro "TEMPO DA LUZ 00:58 → 08:20", depois "Sol apagado há 06:27".
- **Fecho:** grade 2×2 com as 4 personas, depois o chip "IA" no centro, "Quem explica…", "ChatGPT ou Claude → Máquina de edição" (timeline estilizada) e o card de DM "Aula · EDIÇÃO ✓".
- **Legenda:** 1–3 palavras, **branca, centralizada, com sombra**, no terço inferior do rosto. Sem cor de destaque; muito limpa.
- **Ritmo:** a animação muda a cada frase; cada número aparece **na palavra** em que é dito.
- **Selo "conteúdo ilustrativo"** em toda cena com dado médico ou imobiliário: transparência que protege o criador.

### Referência 2 (58 s): "como ainda vão contratar editores?"
**Ideia:** prova social e bastidor. Mostra um **estúdio rodando dentro do Claude** com o vídeo sendo montado em camadas, e termina com o CTA "comenta EDIÇÃO".

**Técnicas vistas:**
- **Selo de abertura** "Claude 5.5 EDITANDO ☠" (caixa branca, texto preto) por cima do rosto.
- **Câmera filmando o monitor** com o editor (timeline estilo NLE, prévia, código), como bastidor.
- **Vista explodida em camadas** ("ALTO NÍVEL", "CINCO CAMADAS"): o vídeo separado em planos de vidro em perspectiva 3D (fundo, pessoa, elementos, texto), que depois se juntam.
- **Remoção de fundo + cenário 3D:** a pessoa recortada sobre uma grade/arena 3D iluminada (luz neon roxa e laranja).
- **Objeto 3D que obedece à fala:** casa 3D que se abre em cômodos rotulados (cozinha, sala, quarto, suíte) **enquanto ele fala**.
- **Modo documentário:** papel envelhecido, fotos antigas, data grande "6 DE JUNHO DE 1944" e mapa da Europa com marcações animadas.
- **Texto gigante atrás da pessoa** ("MÁQUINA DE EDIÇÃO" atrás da cabeça), que pede matte do sujeito.
- **Terra em corte** mostrando as camadas (crosta, manto, núcleo) com rótulos.
- **Legenda:** branca, minúscula, centralizada, curta.

### O que levar para o @theouriks
1. **Split vertical "explicação em cima, rosto embaixo"** para vídeos de nicho (corretor, médico, nutri…), com uma "pele" visual por nicho.
2. **Selo de capa** no 1º quadro (sticker branco com o título do gancho), o que melhora a miniatura do Reels.
3. **Números ditos = números na tela**, sempre na palavra exata (já fazemos; levar para cenas inteiras).
4. **Texto atrás da cabeça** com matte, para o título do gancho.
5. **Vista explodida em camadas** para mostrar "como o vídeo é feito" (bastidor que vende o serviço).
6. **Selo "ilustrativo"** em dados de saúde e preços.
7. **Grade 2×2 de recapitulação** no fim.

---

## 26. Receitas novas inspiradas nas referências

### 26.1 Split vertical (explicação em cima + rosto embaixo)
- Canvas 1080×1920. **Painel de cima:** y 250 → ~1000 (área de animação, fundo próprio do estilo). **Rosto:** cartão arredondado (`border-radius 36–44px`), y ~1000 → 1470, com margem de 40 px; o vídeo usa `object-fit: cover` centrado no rosto (ajustar o `object-position` pelo quadro).
- A legenda fica **sobre o rosto**, no terço inferior do cartão, em branco com sombra.
- **Transição entre nichos:** o painel de cima troca de "pele" com cut-the-curve para a esquerda; o cartão do rosto fica parado (ele é o *carry*).
- Pedir ao usuário: **uma foto de referência de cada nicho** (ou autorizar ilustração vetorial) e os **dados reais** de cada exemplo.

### 26.2 Texto atrás da cabeça
1. Gerar o matte da pessoa (seção 24.8) a 60 fps → `pessoa_alpha.mov` (ProRes 4444) ou par cor + máscara.
2. **Ordem das camadas:** vídeo original (fundo) → texto/animação → pessoa recortada por cima.
3. No FFmpeg: `[fundo][texto]overlay[a]; [a][pessoa_com_alpha]overlay[v]`, com o texto convertido 709 → HLG (seção 5).
4. Conferir borda do cabelo e das mãos em quadro ampliado; animar o texto **entrando por trás** (escala 1,15 → 1 com blur).

### 26.3 Vista explodida em camadas (bastidor)
Separar o quadro em 4–5 planos (fundo, pessoa, cartões, legenda, efeitos), girar o conjunto em perspectiva (`rotateY −25°`, `rotateX 10°`, `translateZ` crescente por camada), rotular cada plano ("os cortes", "os elementos", "a legenda") e juntar de volta no quadro final. É ótimo para vender o serviço de edição.

### 26.4 Objeto que obedece à fala
Mapear cada palavra-chave da transcrição para um estado do objeto (casa fecha → abre → cômodo destacado → rótulo). Tudo dirigido pela tabela de tempos (`beats.js`), como os nossos cartões.

### 26.5 Documentário
Papel envelhecido (textura em CSS/Canvas), fotos com borda, data em tipografia condensada, mapa em SVG com rota que se desenha (`stroke-dashoffset`) e marcadores pulsando na palavra dita.

---

## 27. Prompts prontos (XML, teste de 1 s, folha de quadros)

> Fonte: "Claude Motion Tips". A Anthropic recomenda **tags XML** quando o pedido mistura instruções, contexto e exemplos, com nomes de tag consistentes e descritivos.

### 27.1 Briefing de motion em XML
```xml
<art_direction>
Fundo #0a0a0a. Texto creme #f4ecdf. Destaque vermelho #dc2626.
Instrument Sans; palavras-chave em Instrument Serif itálico.
Cartões de vidro escuro, cantos 40 px.
</art_direction>
<references>
Use os quadros anexos para o ritmo da legenda e a entrada dos cartões.
</references>
<timing>
1 segundo no total. Pincelada em 0,00 s; texto pousa em 0,35 s;
segura a composição pronta de 0,75 s a 1,00 s.
</timing>
<deliverable>
1080 x 1920, 60 fps. Um plano só. Exportar MP4.
</deliverable>
```

### 27.2 Teste de 1 segundo (antes do vídeo inteiro)
```
Antes de montar o vídeo completo, faça um teste de 1 segundo do efeito mais difícil
(ex.: círculo de pincel texturizado se desenhando na tela), com p5.js + p5.brush,
1080 x 1920 a 60 fps, com a paleta fornecida.
Me mostre uma prévia para eu aprovar a textura e o movimento antes de expandir.
```

### 27.3 Folha de quadros-chave (antes do render final)
```
Antes de exportar o vídeo final, mostre uma folha de contato com o início,
cada batida ou transição principal e o quadro final.
Rotule cada quadro com o tempo.
Verifique texto cortado, sobreposição acidental e elementos sumindo nas transições.
Espere meu retorno antes do render final.
```
(No HyperFrames: `snapshot --no-end --at t1,t2,...`, que já gera `contact-sheet.jpg` rotulado.)

### 27.4 Storyboard primeiro (ClaudeAnimationBase / Lemo)
```
Leia o guia do projeto. Antes de qualquer código, me entregue um storyboard:
uma linha por batida com tempo, o que está na tela, o que atravessa o corte (carry)
e o som. Durações variadas (a maior ≥ 4× a menor). Espere minha aprovação.
```

---

## 28. O fluxo do editor supremo (do briefing à entrega)

1. **Receber e inspecionar:** `ffprobe` de todos os arquivos (codec, HDR, fps, áudio), folha de contato e transcrição Parakeet.
2. **Entender o pedido:** é referência ou material? Qual a ordem? Ler a transcrição como roteiro.
3. **Briefing (seção 23):** perguntar só o que falta e pedir fotos e arquivos. Avisar os padrões que serão usados.
4. **Plano de batidas:** tabela com tempo, fala, o que aparece, o *carry* entre cenas, o SFX e a variação de duração. Para peças grandes, mostrar ao usuário antes.
5. **Teste de 1 s** do efeito mais difícil (matte, física, 3D, textura) quando houver risco.
6. **Cortes** a partir dos originais (seção 7): pausas, travadas e frases refeitas; conferir as bordas das palavras.
7. **Construir a camada gráfica** no HyperFrames: cartões, legenda e efeitos dirigidos pela tabela de tempos; `check` sem erro.
8. **Folha de quadros-chave** rotulada com o tempo → revisar e, em peça grande, pedir aprovação.
9. **Render sem perda** (seção 5): camada transparente a 59,94 fps → composição no FFmpeg → HEVC 10-bit HLG; voz original nivelada a −16 LUFS + SFX.
10. **QA final (seção 21):** `ffprobe`, LUFS, quadros convertidos para SDR para olhar a cor, ouvir os cortes.
11. **Entregar:** Downloads + abrir + resumo curto (o que foi feito, o que conferir, palavra do CTA e da automação, versões antigas que podem ser apagadas).
12. **Aprender:** cada correção do usuário entra na seção 20; regra nova entra na seção 1.

---

## 29. 3D e animações fluidas (receitas com código)

> Fontes: as regras oficiais do HyperFrames em `hyperframes/skills/hyperframes-animation/` (`rules/3d-camera-flight.md`, `depth-of-field-blur.md`, `3d-text-depth-layers.md`, `orbit-3d-entry.md`, `depth-scatter-assemble.md`, `references/motion-blur.md`, `adapters/three.md`, `blueprints/camera-journey.md`) e as ideias do onetake. **Ler o arquivo da regra antes de usar.**

### 29.1 O que faz uma animação parecer fluida (e não "barata")

1. **60 fps reais:** render `--fps 60` (ou `60000/1001` sobre vídeo do iPhone). A 30 fps, movimento rápido "picota".
2. **Só propriedades que interpolam em subpixel:** `transform` (x, y, z, scale, rotate), `opacity`, `filter`, `clip-path`. Nunca `top/left/margin/width/letter-spacing`, que "pulam pixel" no render.
3. **Easing com intenção:**
   - chegada / pouso: `power4.out` (rápido e assenta firme);
   - reposicionamento: `power2.inOut`;
   - saída: `power4.in`;
   - entrada de elemento com personalidade: `back.out(1.4–1.7)`;
   - **câmera nunca usa spring/back**;
   - `bounce` e `elastic` são proibidos.
4. **Uma câmera, um objeto de estado, uma função que escreve o transform** (`applyCamera()`). Nada de dois tweens disputando o mesmo `transform`.
5. **Pousos autorados, não calculados:** testar a pose, tirar um snapshot, ajustar e gravar os números como constantes. Nunca medir com `getBoundingClientRect` dentro de `onUpdate`.
6. **Motion blur só nos golpes rápidos** (1–3 por vídeo: o tapa, o chicote, o mergulho). Em movimento lento, blur parece render ruim (29.6).
7. **Profundidade:** paralaxe com camadas em `translateZ` diferentes + desfoque de profundidade (DoF) nos planos fora de foco.
8. **Pausa antes do clímax** e **duração de planos variada** (≥ 4×). Fluidez também é ritmo.
9. **Sem balanço à toa** para "dar vida". Se a cena precisa de vida, falta acontecimento.
10. **Testar 1 segundo do efeito mais difícil** e olhar quadro a quadro (`snapshot --at`) antes do vídeo inteiro.

### 29.2 Qual 3D usar

| Necessidade | Técnica | Peso |
|---|---|---|
| Cartões, telas e textos inclinando, câmera voando sobre a interface | **CSS 3D** (`perspective` + `preserve-3d`) | Leve, nítido, fácil |
| Título com volume / extrusão | **Camadas de texto empilhadas** (29.7) | Leve |
| Ícones orbitando, logo montando de fragmentos | CSS 3D (`orbit-3d-entry`, `depth-scatter-assemble`) | Leve |
| Objeto 3D de verdade (casa, produto, celular, planeta em corte), luz e sombra | **Three.js** (adaptador `three` do HyperFrames) | Médio/pesado |
| Personagem / desenho animado | p5.js + p5.brush (ClaudeAnimationBase) | Médio |
| Pessoa recortada sobre cenário 3D | Matte (24.8) + Three.js ou CSS 3D atrás | Pesado (testar antes) |

### 29.3 Receita A — câmera voando em 3D sobre um mundo (CSS)

```html
<div class="stage">                         <!-- a lente: perspective fixa, nunca anima -->
  <div class="world" id="world" data-layout-allow-overflow>   <!-- o mundo, preserve-3d -->
    <div class="surface">…grade, cartões, telas…</div>
    <div class="prop" style="transform: translateZ(220px)">402</div>   <!-- paralaxe -->
  </div>
</div>
```
```css
.stage { position:absolute; inset:0; perspective:1600px; }
.world { position:absolute; inset:0; transform-style:preserve-3d; }
```
```js
// Estado único da câmera (pose do MUNDO). Ordem fixa: translate FORA das rotações,
// assim x/y/z sempre andam nos eixos da tela, qualquer que seja a inclinação.
const cam = { x: 0, y: 0, z: -900, rx: 38, ry: -18 };
const world = document.getElementById("world");
const applyCamera = () =>
  (world.style.transform = `translate3d(${cam.x}px,${cam.y}px,${cam.z}px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg)`);
applyCamera();
// Pernas da viagem: câmera entra = z do mundo AUMENTA; câmera vai p/ direita = x NEGATIVO
tl.to(cam, { z: 0, rx: 22, ry: -8, duration: 1.1, ease: "power4.out", onUpdate: applyCamera }, 0);          // mergulho
tl.to(cam, { x: -620, rx: 0, ry: 0, duration: 1.2, ease: "power2.inOut", onUpdate: applyCamera }, 2.4);      // achata e reposiciona
tl.to(cam, { z: 520, duration: 0.6, ease: "power4.out", onUpdate: applyCamera }, 4.2);                       // mergulho final no CTA
```
- **Nunca** colocar `filter` no `.world` (achata o 3D). O blur de velocidade vai no `.stage`; o DoF vai nos **cartões**.
- Variar os verbos: mergulho, achatar, chicote, puxada para trás. Quatro empurrões iguais viram slideshow.

### 29.4 Receita B — vista explodida em camadas ("como o vídeo é feito")

```js
// Cada camada é um plano do quadro: fundo, pessoa, cartões, legenda, efeitos.
const layers = gsap.utils.toArray(".layer");        // dentro de um .world preserve-3d
const GAP = 160;
// 1) explode: o conjunto gira e as camadas se afastam no eixo Z, com rótulos
tl.to(cam, { rx: 12, ry: -32, z: -300, duration: 1.0, ease: "power2.inOut", onUpdate: applyCamera }, 0);
layers.forEach((el, i) =>
  tl.to(el, { z: (i - (layers.length - 1) / 2) * GAP, duration: 1.0, ease: "power2.inOut" }, 0.1 + i * 0.05));
tl.fromTo(".layer-label", { opacity: 0, x: 30 }, { opacity: 1, x: 0, stagger: 0.08, duration: 0.4 }, 0.9);
// 2) recompõe: camadas voltam a z=0 e a câmera achata — o quadro final aparece "montado"
tl.to(".layer", { z: 0, duration: 0.8, ease: "power4.out", stagger: { each: 0.04, from: "end" } }, 3.2);
tl.to(cam, { rx: 0, ry: 0, z: 0, duration: 0.8, ease: "power4.out", onUpdate: applyCamera }, 3.2);
```
Cada camada com borda fina de vidro (`1px rgba(255,255,255,.25)`) e uma sombra leve, para ler como "folha".

### 29.5 Receita C — profundidade de campo (DoF) e foco que puxa o olho

```css
.layer { --dof: 0px; filter: blur(var(--dof)); will-change: filter; }
.focal { z-index: 2; }
```
```js
gsap.utils.toArray(".ctx").forEach((el) => {
  const d = Number(el.dataset.depth) || 1;                 // longe = mais desfoque
  tl.to(el, { "--dof": `${3 * d}px`, opacity: 0.55, duration: 0.6, ease: "power2.inOut" }, FOCO);
});
```
- **Rack focus:** dois tweens na mesma janela (A fica borrado e B fica nítido) para trocar o plano em foco.
- Rodar o DoF **no mesmo instante** do empurrão de câmera: "o mundo recua" e "a gente avança" viram um gesto só.

### 29.6 Receita D — motion blur (rastro de obturador)

- Componente do registro: `hyperframes add motion-blur`. Depois, marcar só o elemento que se move rápido:
  ```html
  <div id="slam" data-hf-motion-blur></div>
  <div id="titulo" data-hf-motion-blur='{"shutterAngle": 360}'></div>
  ```
- **Não borrar:**
  - movimento abaixo de ~1 largura do elemento por quadro;
  - fades;
  - texto que precisa ser lido naquele instante (borrar a chegada e pousar nítido);
  - drift lento;
  - a cena inteira.
- O onetake faz a versão "física": média de várias capturas ao longo de um obturador de 180° em luz linear. É a mesma ideia do `shutterAngle`.

### 29.7 Receita E — título com volume (extrusão em camadas)

4–6 cópias do texto atrás da principal, deslocadas `i × (2px, 3px)`, com cor `rgba` que perde opacidade por camada. A frente fica na cor da marca. Na entrada, as camadas de trás aparecem de trás para frente enquanto o deslocamento cresce de 0 até o total (o volume "se constrói"). Peso 800–900; texto fino perde o efeito. (Regra `3d-text-depth-layers`.)

### 29.8 Receita F — logo ou palavras montando de uma nuvem 3D

Cada fragmento nasce num ponto da nuvem calculado pelo **ângulo de ouro** (`a = i × π(3−√5)`): `x = cos(a)·R`, `y = sin(a)·R`, `z` escalonado, giro `rotateX/Y = sin/cos(a)·TUMBLE`. Depois voa até o lugar plano com `power4.out` e stagger, enquanto o palco gira devagar. Determinístico, sem `Math.random`. Precisa de `perspective` no pai e `preserve-3d` no palco e em cada peça, além de `backface-visibility: hidden`. (Regra `depth-scatter-assemble`.)

### 29.9 Receita G — ícones orbitando (entrada 3D + órbita)

Cada ícone entra girando no lugar (`rotateX/Y` → 0, `back.out`) e passa a orbitar numa elipse, com `onUpdate` calculando `cos/sin(ângulo0 + p·2π)` a partir de um tween de progresso **dentro da timeline**. `z-index` sobe na metade da frente da elipse. Elipse achatada (razão Y/X 0,4–0,7). (Regra `orbit-3d-entry`.) Bom para "as ferramentas que eu uso" ou "as 6 etapas".

### 29.10 Receita H — Three.js de verdade (casa que abre, planeta em corte, produto girando)

```html
<script type="importmap">{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.181.2/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.181.2/examples/jsm/" } }</script>
<canvas id="three-layer" style="width:100%;height:100%;display:block"></canvas>
<script type="module">
  import * as THREE from "three";
  import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
  const canvas = document.getElementById("three-layer");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(1080, 1920, false); renderer.setPixelRatio(1);          // tamanho fixo = render estável
  renderer.toneMapping = THREE.ACESFilmicToneMapping;                       // luz "de cinema"
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1080 / 1920, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x1a1410, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 4); scene.add(key);
  let mixer = null;
  new GLTFLoader().load("assets/casa.glb", (g) => { scene.add(g.scene); mixer = new THREE.AnimationMixer(g.scene); /* clips… */ });
  function renderAt(t) {                                                    // TUDO a partir do tempo
    const p = Math.min(1, t / 3);
    camera.position.set(Math.sin(p * 1.2) * 6, 2.2 + p, Math.cos(p * 1.2) * 6);
    camera.lookAt(0, 0.8, 0);
    if (mixer) mixer.setTime(t);
    renderer.render(scene, camera);
  }
  window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
  renderAt(window.__hfThreeTime || 0);
</script>
```
**Contrato do adaptador `three`:**
- O tempo vem do evento `hf-seek` (ou de `window.__hfThreeTime`); **nunca** de `requestAnimationFrame`, `Date.now` ou `performance.now`.
- O `#root` **precisa de `data-duration`** (o adaptador não deduz a duração sozinho).
- Modelos, texturas e HDRI são carregados **antes** (sem buscar nada na hora do seek). Montagem pesada registra `window.__hf.buildReady["nome"] = promessa`.
- Animação de GLTF: `mixer.setTime(t)` em todos os mixers.
- `setPixelRatio(1)` e tamanho fixo; nada de pós-processamento que dependa do quadro anterior.

**Receitas 3D que combinam com o conteúdo do @theouriks:**
- **Casa que abre em cômodos:** grupos por cômodo; o telhado sobe (`y`) e as paredes giram para fora; rótulos em HTML posicionados pela projeção 3D → 2D calculada **uma vez por pose**. Cada cômodo destaca (emissivo + rótulo) **na palavra** em que é falado.
- **Planeta em corte:** esferas concêntricas (crosta, manto, núcleo) com `clippingPlanes` cortando um gomo; o plano de corte anima de 0 a 90°; rótulos entram em cascata.
- **Celular / produto girando:** modelo GLB, luz de recorte (rim light) atrás, giro em `power2.inOut` e pouso de frente para a câmera no `power4.out`; reflexo com `envMap` de um HDRI local.
- **Partículas** (pontos formando um logo ou número): posições pré-calculadas por índice (sem aleatório), `BufferGeometry` com `Points`, interpolação por tempo.

**Sobre vídeo HDR:** renderizar a camada 3D **transparente** (`alpha: true` + fundo transparente no `#root`) como `--format webm`, e compor no FFmpeg com a conversão 709 → HLG da seção 5.

### 29.11 Componentes prontos do registro (instalar com `hyperframes add <nome>`)

`motion-blur`, `camera-rig-depth-stack` (pilha com profundidade e câmera), `three-orbiting-cards`, `focus-blur-resolve`, `soft-blur-in`, `light-sweep-pass` (reflexo de luz passando), `spotlight-card`, `grain-overlay` / `grain-field` (grão de filme), `particle-text-dissolve`, `particle-image-reveal`, `rgb-glitch-text`, `locked-nucleus-orbit`, `marker-highlight`. Antes de construir algo "na mão", rodar `hyperframes catalog` e procurar.

**Blueprints prontos de 3D** (`skills/hyperframes-animation/blueprints/`):
- `camera-journey`: viagem de câmera com mergulho, blur e DoF;
- `device-surface-showcase`: aparelho ou tela em 3D como herói;
- `zoom-out-workspace-reveal`;
- `spatial-pan-stations`;
- `constellation-hub`.

### 29.12 Desempenho e testes
- Com **GPU de hardware** (até uma integrada, como a AMD Radeon 780M), WebGL e blur funcionam bem. Mesmo assim, aquarela (p5.brush) e muitas cópias de motion blur deixam o render lento: testar 1 s antes.
- `will-change: transform` em quem anima muito; `backface-visibility: hidden` em peças que giram.
- Para conferir a fluidez: `snapshot --at` em 3–4 quadros **seguidos** do movimento (ex.: 2.00, 2.0167, 2.0333) para ver se o deslocamento é uniforme e se o blur aparece só no pico de velocidade.
- Folha de quadros rotulada antes do render final (27.3).

### 29.13 Checklist de 3D fluido
- [ ] `perspective` só no palco (fixo); `preserve-3d` no mundo e nas peças; nenhum `filter` no elemento `preserve-3d`.
- [ ] Uma câmera, um objeto de estado, uma função de escrita; ordem `translate3d → rotateX → rotateY`.
- [ ] Pousos `power4.out`, reposicionamentos `power2.inOut`, sem spring na câmera.
- [ ] Motion blur em no máximo 1–3 golpes; texto pousa nítido.
- [ ] DoF e paralaxe dando profundidade; o foco aponta para o que está sendo falado.
- [ ] Three.js dirigido por `hf-seek`; assets locais pré-carregados; `data-duration` no root; pixel ratio fixo.
- [ ] Render a 60 fps; sobre vídeo do iPhone, camada transparente + composição HDR.

---

## 30. Biblioteca dos 17 efeitos (referência "17 efeitos que o Claude cria")

**O vídeo de referência** (20 s, vertical):
- O apresentador fala para a câmera e segura um microfone de lapela.
- No topo aparece o título "**17** efeitos de vídeo que o Claude cria", com o número em amarelo.
- Nas laterais, duas colunas de vidro escuro listam os 17 efeitos numerados, e o efeito da vez acende em amarelo.
- No centro, uma "tela de celular" com cantos arredondados mostra a demonstração de cada efeito (com contador "08/17") e cresce até ocupar o quadro.
- No fim vem o CTA ("eu juntei o prompt…").

Como formato, isso é uma **lista numerada com prova visual**: excelente gancho de retenção, porque a pessoa fica para ver os 17.

Cada efeito abaixo traz o que é, como fazer no **nosso** fluxo (HyperFrames + FFmpeg, qualidade da seção 5) e o que pedir ao usuário. **Matte** = recorte da pessoa (seção 24.8); exige teste de 1 s, principalmente no cabelo crespo.

| # | Efeito | O que é | Como fazer | Matte? | Pedir |
|---|---|---|---|---|---|
| 01 | **Órbita** | A pessoa (ou o vídeo dela num cartão) gira em volta de um ponto / objetos orbitam ao redor dela | Cartões de vídeo em órbita 3D (`orbit-3d-entry`, 29.9) ou `three-orbiting-cards` do registro | Não | Clipes curtos |
| 02 | **Parede de posts** | Uma parede/grade de posts do Instagram aparece atrás ou em volta dela | Grade de prints em CSS 3D (`preserve-3d`), câmera recua mostrando a parede (29.3) | Opcional (posts atrás da cabeça) | **Prints dos posts** (alta resolução) |
| 03 | **Dentro do app** | O vídeo dela passa a rodar dentro da interface de um app (post do Instagram com legenda "TODO DIA") | Moldura de app em HTML (cabeçalho, ícones, legenda) envolvendo o `<video>`; zoom-out que revela a moldura | Não | Print da interface ou nome do app |
| 04 | **Saindo da tela** | Ela "sai" da tela do celular: parte do corpo passa por cima da moldura | Ordem de camadas: fundo → moldura do celular → **pessoa recortada por cima** da borda | **Sim** | Gravar com espaço ao redor |
| 05 | **Zoom digital** | Zoom rápido e forte num detalhe (efeito de câmera digital, com tom esverdeado na ref.) | Punch-in 1 → 1,35 em 0,25 s `power4.out` + motion blur no golpe (29.6); opcional: leve grade de cor | Não | — |
| 06 | **Mockup de celular** | O vídeo dentro de um celular realista, com moldura e reflexo | Moldura de celular em SVG/CSS (bordas, ilha, reflexo `light-sweep-pass`) e inclinação 3D suave | Não | Modelo de celular desejado |
| 07 | **Checklist** | Lista de tarefas que se marca sozinha ("Gravar o vídeo ✓ Mandar pro Claude ✓ Postar") | Itens com check desenhado (`stroke-dashoffset`) e risco, cada um **na palavra** dita | Não | Os itens |
| 08 | **Mural de manchete** | Recortes de jornal com manchetes presos em volta da cabeça, com um círculo vermelho de caneta | Cartões de papel (serif condensada, textura) entrando inclinados; círculo desenhado em SVG | Opcional | As manchetes (frases curtas) |
| 09 | **Corte no zoom** | Corte seco para um close extremo (rosto) e volta | Jump cut com escala 1 → 1,8 centrada no rosto, alternando (seção 7); casar com batida | Não | Take com boa resolução (4K ajuda) |
| 10 | **Gráfico subindo** | Barras verdes crescem atrás da pessoa, com fundo trocado | Fundo trocado + barras animando `scaleY` com stagger; seta subindo | **Sim** (ou fundo liso + chroma) | Os números reais |
| 11 | **Revelação** | O vídeo encolhe e revela que está dentro de um editor (timeline, painéis) | Zoom-out do vídeo para dentro de uma UI de editor em HTML (timeline colorida, painel lateral) | Não | — |
| 12 | **Chroma key** | Fundo substituído por uma tela de landing page roxa ("Seu editor agora é o Claude.") | Com fundo verde: `colorkey`/`chromakey` do FFmpeg; sem fundo verde: matte. Fundo novo em HTML | Sim / chroma | Gravar com fundo liso; texto da página |
| 13 | **Recorte de papel** | Colagem de papel: letras recortadas estilo bilhete ("CORTA E COLA"), fitas, papel rasgado | Letras com fundos de cores diferentes, leve rotação, entrando uma a uma "coladas"; borda rasgada em SVG; pessoa recortada com contorno branco | **Sim** | A frase |
| 14 | **Rabisco vivo** | Doodles desenhados à mão (coroa, estrelas, coração, espiral, "olha isso") em volta dela, com contorno branco | Traços SVG desenhando (`stroke-dashoffset`) com traço trêmulo (Rough.js) ou p5.brush; contorno branco da pessoa | **Sim** (contorno) | — |
| 15 | **Vertigem** | Fundo vermelho, pessoa em preto e branco, efeito "dolly zoom" (fundo e pessoa em escalas opostas), texto "NUNCA EDITOU?" | Matte: pessoa P&B escala 1 → 1,1 enquanto o fundo escala 1,3 → 1 (sensação de vertigem) + palavras surgindo atrás | **Sim** | — |
| 16 | **Capa de revista** | Título de revista gigante atrás da cabeça ("LUÇÃO"), selos, chamadas ("O FIM DO EDITOR?") | Layout de capa (Didone serif enorme, edição/data, chamadas); título **atrás** da cabeça (26.2) | **Sim** | Nome/título e chamadas |
| 17 | **Letra de vidro** | Palavra 3D de vidro ("CRIA") atrás da pessoa, com bolhas e reflexos | Three.js com `MeshPhysicalMaterial` (transmission, roughness baixo, ior ~1,45) + `RoomEnvironment`; ou camadas de texto com gradiente e reflexo (29.7); atrás da cabeça | **Sim** | A palavra |

**Como montar um vídeo "lista de efeitos" no padrão Ouriks:**
1. **Gancho:** o número grande ("17") em vermelho, na 1ª palavra.
2. A lista de vidro escuro nas laterais respeita as safe zones (direita ≤ 940 px), com o item atual acendendo em vermelho e os já vistos apagados.
3. A demonstração entra num **cartão de cantos arredondados** que cresce até tela cheia e volta (carry: o cartão é o mesmo em todos os efeitos).
4. Contador "08/17" no canto do cartão.
5. Ritmo: ~0,8–1,5 s por efeito, cortes **no tempo da música** (seção 31: grade de batida).
6. CTA no fim com a palavra-chave da DM.

---

## 31. Prompt Motion: o que 230 prompts reais ensinam

**Site:** https://prompt-motion.com. É uma galeria de vídeos de motion feitos com Claude, cada um com o prompt ou a skill que o gerou (curadoria de @p4nthera_).
- **Categorias:** Product UI, Phone, Charts, Diagrams, Kinetic type, Shapes, Particles, Characters, Photos, Music, Code.
- **Páginas úteis:**
  - `/templates`: o template de 3D (`/templates/realtime`) e o de showreel (`/templates/showreel`);
  - `/customize`: adaptar qualquer prompt ao seu projeto;
  - `/blog`: as análises abaixo.
- **Os prompts pertencem aos criadores.** Aqui ficam só as lições, em palavras nossas; para o texto original, abrir a página de cada entrada.

### 31.1 Os números (galeria de set–out/2026)
- Mediana de **26 palavras** por prompt. O mais copiado (um pedido de "showreel para currículo" de 26 palavras) foi usado 33×, com resultados de 0 a 17 mil curtidas. **O mesmo prompt dá resultados muito diferentes.**
- Prompts com **mais de 100 palavras** tiveram mediana de 56 curtidas, contra 5 dos prompts curtos. Não é o tamanho que vale, e sim **responder as perguntas que o prompt curto deixa abertas**.
- **Explainers** (27): os melhores dão um **processo do início ao fim** (ex.: a receita do copo vazio ao drink pronto) ou uma **lista de cenas**. Nenhum pedia checagem de fatos.
- **Lançamentos** (92): só 12 de 92 diziam o formato. **Sempre dizer 9:16 e o tamanho em pixels.**
- **Ferramentas citadas** (56 vídeos): HTML/canvas + Playwright (23), Remotion (13), **HyperFrames (10, maior mediana de curtidas)**, Three.js (5), Manim/Blender (5). **Sempre dizer a ferramenta e o método de build no prompt**, senão o resultado não se repete.

### 31.2 O que entrega que foi feito por IA (os "tells")
Ordem de frequência nas listas de banidos:
1. brilho / neon;
2. "qualquer coisa com cara de template";
3. explosão de partículas;
4. pausas longas e quadro congelado ("tempo morto");
5. crossfade;
6. quique (easing elástico);
7. gradiente genérico;
8. 3D gratuito;
9. stock de vídeo/UI;
10. **texto decorativo nos cantos**;
11. `Math.random` (o render muda a cada vez).

**Por que entregam:**
- Brilho e partícula sem motivo são decoração.
- Crossfade e blur-in aparecem quando ninguém desenhou a transição.
- Quique em tudo parece desenho animado.
- Texto nos cantos finge detalhe sem informar nada.
- Tempo morto deixa o vídeo lento.

### 31.3 Como escrever a lista de banidos
1. Começar pelos tells comuns, acima.
2. Somar o que apareceu de errado nos **seus** testes.
3. **Dizer o substituto**, não só a proibição: em vez de "sem crossfade", escrever "cada cena nasce da anterior".
4. Fechar com o padrão geral: "nada com cara de template".
5. Manter curta: uma linha de 5 a 9 itens.
6. Molas sim, mas **com overshoot mínimo**; não proibir mola.

### 31.4 A estrutura dos prompts que funcionam
Blocos com tags (estilo XML):
- **`<inputs>`**: o que pedir antes (nome, promessa em uma linha, cores, logo, música, fotos), com padrões caso o usuário pule.
- **`<direction>`**: um conceito; estética (1 fonte, até 3 cores + preto e branco); câmera; regras de movimento; o que mostrar; lista de banidos.
- **`<structure>`**: BPM, compassos e "algo acontece em toda batida"; a sequência de cenas ou estados em ordem; o primeiro compasso é gancho; o último compasso cheio é o momento mais forte; o último quadro igual ao primeiro (loop).
- **`<build>`**: como renderizar (arquivo único, tudo calculado a partir do tempo dentro de `seek(t)`, molas em forma fechada, motion blur por subframes, áudio em código ou SFX medidos, verificação de 1 quadro por batida).
- **`<gotchas>`**: armadilhas conhecidas daquele tipo de vídeo.
- **`<start>`**: o que mostrar antes de construir (conceito + storyboard por batida, ou "pergunte os inputs primeiro"), e se pode construir sem perguntar mais nada.

### 31.5 Vocabulário que aparece nos bons prompts
*beat grid, downbeat, "something happens on every beat", one concept, one shape never cut, every state is the same element morphing, closed-form springs, tiny overshoot, motion blur from subframes, headless browser, frame-check, loop, cramped, off the grid, no dead time, anything that looks like a template.*

---

## 32. Técnicas avançadas tiradas dos prompts mais curtidos

> Paráfrases das técnicas descritas nas entradas mais populares do Prompt Motion (ex.: "Shape morphing through UI states" e "Photo print app launch film", de @twoclipping; "Launch video remake comparison", de @notdwd; e os dois templates do site). Adaptar ao HyperFrames, em que o `seek(t)` corresponde à timeline GSAP pausada.

### Tempo e movimento
- **Tudo é função do tempo:** nada de transição CSS, timer ou estado guardado entre quadros. (No HyperFrames: timeline GSAP pausada + `onUpdate` sobre objetos proxy.)
- **Molas em forma fechada:** a posição é a resposta de uma mola calculada pela fórmula em `t`. Um valor que muda de alvo várias vezes é a **soma de uma mola por mudança**, e continua sendo função pura do tempo.
- **Bordas em molas diferentes:** o indicador de aba ou o botão do toggle tem as duas bordas em molas distintas, então a borda da frente estica antes da de trás (efeito "líquido").
- **Arrastar como manipulação direta:** enquanto o cursor segura, o valor vem da posição dele; ao soltar, volta com mola de onde estava.
- **Câmera nunca corta parada:** cada plano entra já em movimento (ease-out exponencial, 12–19% da distância restante por quadro) e sai acelerando ou num ramp de blur.
- **Cursor vivo:** gira para apontar a direção do movimento, cresce no hover (~×1,5), encolhe ~15% no clique; a câmera faz zoom estilo Screen Studio e o cursor escala junto.
- **Cortes cravados no quadro:** cortes secos caem ~2 quadros antes da batida; quando a música cai (drop), o zoom pousa exatamente nela.
- **Loop perfeito:** o último quadro idêntico ao primeiro, incluindo a posição e a velocidade do cursor.

### Transições "feitas do quadro anterior"
- **Um elemento só, sem corte:** botão → loader → check → player → slider → toggle → abas → gráfico → ⌘K → toast → botão. Sempre o **mesmo** elemento mudando tamanho, raio e cor, com o conteúdo trocando por um blur curto.
- **Inundação (flood):** uma forma preta cresce até cobrir o quadro e se contrai na próxima cena. Precisa passar das bordas (overscale) e durar ~0,3 s, senão metade da tela muda num quadro só.
- **Íris de câmera:** 6 lâminas em volta de uma abertura hexagonal fecham sobre um rótulo e abrem numa foto.
- **Wordmark sanfona:** as letras se aproximam do ponto final com o mesmo fator, e a largura desenhada acompanha (fonte variável, eixo `wdth`), para elas continuarem encostadas.
- **Gosma (goo):** blur + limiar de alpha, depois o original composto por cima para o interior ficar nítido.
- **Vidro líquido:** cada elemento de vidro tem um clone da cena atrás dele, distorcido por mapa de deslocamento SVG (campo de distância de retângulo arredondado) em 3 escalas ligeiramente diferentes para borda cromática, mais luz de borda. (No Chromium, `backdrop-filter: url()` lê errado o mapa, por isso clonar a cena.)

### Render e qualidade
- **Motion blur por subframes:** renderizar 3–4 subframes por quadro e misturar no FFmpeg com `tmix`, a 60 fps. É o equivalente "físico" do componente `motion-blur`.
- **Verificação:** 1 quadro por batida antes do render final; depois procurar **pulos de 1 quadro** (diferença entre quadros 3× maior que a dos vizinhos).
- **Vídeo dentro do HTML:** recodificar como **all-intra** (`ffmpeg -g 1`), carregar como blob URL e esperar o evento `seeked` antes de desenhar cada quadro. Senão a busca falha.
- **Som:** a música começa num tempo forte; analisar a batida com numpy; cada SFX posicionado pelo **pico medido** do evento; nivelar o mix (eles usam −14 LUFS; nós, −16).
- **3D (template realtime):**
  - câmera de cinema, sem orbit controls, com **um movimento nomeado por plano** (dolly, grua, órbita, push-in, rack focus);
  - **plano-assinatura** desenhado primeiro, e todos os planos levando a ele;
  - luz principal, de preenchimento e de recorte com sombras suaves;
  - mapa de ambiente (PMREM do RoomEnvironment), neblina para profundidade, materiais físicos com rugosidade variada e ACES;
  - coisas que **reagem umas às outras** (o que é atingido se move, o que está perto acende) por mola ou física;
  - nada de material padrão, texto flutuante, brilho em tudo ou "objeto girando devagar como ideia".

### Armadilhas (gotchas)
- `will-change` em algo que a câmera escala deixa o texto **borrado**: tirar.
- Texto que troca dentro de forma que se transforma precisa de **máscara e tempo próprios**, senão sobrepõe.
- Filho com `visibility: visible` aparece mesmo com o pai escondido: usar `inherit`.
- `python http.server` não faz busca por faixa em vídeo: usar blob URL.
- **Three.js:**
  - definir o `shadow.bias`, senão aparece "acne" listrada;
  - planos near/far apertados, senão superfícies distantes piscam;
  - todo aleatório com semente, senão o render difere da prévia.

---

## 33. Nossos templates de prompt (prontos para usar)

> Escritos para o nosso fluxo: HyperFrames, vertical, qualidade da seção 5, identidade Ouriks. Trocar o que está entre colchetes. Rodar no Opus com esforço alto e **ler a seção 23 antes** (briefing).

### 33.1 Reels com rosto + overlays (o nosso mais comum)
```xml
<inputs>
Peça antes: os takes originais do iPhone (gancho, meio, CTA), a palavra-chave do CTA,
o que vai na DM, prints/fotos de tudo que eu citar, e se há dados (confirme a fonte).
Padrões se eu pular: identidade Ouriks, legenda palavra a palavra, SFX baixinhos.
</inputs>
<direction>
Conceito em uma linha: [ex.: "a explicação é desenhada em cima de mim enquanto eu falo"].
Vertical 1080x1920. Rosto sempre visível; gráficos na faixa y 270–760; legenda em y 1300–1470.
Identidade: #0a0a0a, vermelho #dc2626 (texto #ef4444), creme #f4ecdf, Instrument Sans + Instrument Serif itálico.
Cada cartão entra na palavra exata em que é dito e sai antes do próximo. Um elemento atravessa cada corte.
Banidos: brilho sem motivo, partículas, crossfade, quique, texto nos cantos, cara de template, tempo morto.
</direction>
<structure>
Gancho nos 2 primeiros segundos ([ideia do gancho]) → [bloco 1] → [bloco 2] → … → CTA "Comente [PALAVRA]".
Durações de plano variadas (a maior ≥ 4× a menor). Pausa de 0,3–0,75 s antes do momento mais forte.
</structure>
<build>
1. Corte direto dos .MOV (pausas > 0,42 s, travadas e frases refeitas fora; conferir as bordas das palavras).
2. Camada gráfica no HyperFrames, transparente, 59,94 fps; composição no FFmpeg 709→HLG; HEVC 10-bit.
3. Voz original só nivelada a -16 LUFS; SFX nos eventos.
4. Folha de quadros-chave rotulada antes do render final; `check` sem erro.
</build>
<start>
Mostre o plano de batidas (tempo, fala, o que aparece, o carry) e espere meu ok. Depois construa sem perguntar mais nada.
</start>
```

### 33.2 Showreel / motion graphics 100% código (15–60 s)
```xml
<direction>
Conceito: [um só, nomeado numa linha]. Cada plano nasce do anterior (forma, tipo e cor se transformam), sem corte ou fade.
1 fonte, até 3 cores + preto e branco, uma linguagem de câmera.
Mostrar: tipografia cinética, morph de forma, um momento 2D→3D, um momento de dado/UI e título final.
Banidos: partículas, brilho, lens flare, tremida de câmera, RGB split, crossfade, gradiente genérico, quique,
pausa > 0,5 s, cara de template.
</direction>
<structure>
[120] BPM, algo acontece em toda batida. 1º compasso = gancho; um recurso por compasso;
último compasso cheio = o mais forte; meio compasso final = título; último quadro = primeiro (loop).
</structure>
<build>
1. HyperFrames, [1080x1920 ou 1920x1080], 60 fps; tudo derivado do tempo da timeline; molas com overshoot mínimo.
2. Motion blur só nos golpes rápidos (componente motion-blur).
3. Trilha sintetizada em código (kick em toda batida, riser antes do último compasso, impacto em cada troca), sem samples.
4. Verificar 1 quadro por batida; corrigir o que estiver apertado, fora da batida, sobreposto ou ilegível.
</build>
<start>Diga o conceito e mostre o storyboard por batida; depois construa sem perguntar mais nada.</start>
```

### 33.3 Cena 3D de verdade (Three.js no HyperFrames)
```xml
<direction>
[Assunto] como cena 3D. Plano-assinatura: [descrever]. Tudo leva até ele.
Câmera de cinema: um movimento nomeado por plano (dolly, grua, órbita, push-in, rack focus), com entrada e saída suaves,
nunca atravessando geometria.
Luz: principal, preenchimento e recorte com sombras suaves; mapa de ambiente; neblina; materiais físicos com rugosidade
variada; tone mapping ACES. Nada com cara de material padrão.
Movimento: coisas reagem umas às outras, por mola ou física simples; nunca tween linear.
Banidos: material e luz padrão, texto flutuando, brilho em tudo, objeto girando devagar como ideia, cara de demo técnica.
</direction>
<structure>Planos de ~3 s: [1…6], terminando no plano-assinatura e no título.</structure>
<build>
1. Adaptador three do HyperFrames: render a partir de hf-seek, data-duration no root, assets locais pré-carregados.
2. MeshPhysicalMaterial, PMREM (RoomEnvironment), sombras suaves com shadow.bias, near/far apertados, aleatório com semente.
3. Camada transparente a 60 fps se for sobre vídeo (seção 5).
4. Um quadro por plano: corrigir o que estiver chapado, serrilhado, cortado ou ilegível.
</build>
<start>Descreva o plano-assinatura e a lista de planos em poucas linhas; depois construa.</start>
```

### 33.4 Explainer (processo do início ao fim)
```xml
<direction>
Explicar [tema] para [público, ex.: quem nunca programou]. Mostrar como processo: [etapa 1 → … → resultado].
~5 s por ideia. Estilo: [diagrama / quadro branco / colagem / 3D]. Paleta: [cores].
Precisão: pesquise antes; não invente números, nomes, datas nem citações; marque "conteúdo ilustrativo" onde couber.
Som: [narração / só música / SFX].
</direction>
<structure>Cena por etapa, na ordem, cada uma nascendo da anterior; fecha com a síntese em uma frase.</structure>
<start>Mostre a lista de cenas com os fatos e as fontes; espere meu ok.</start>
```

### 33.5 Lançamento de produto (vertical)
1. Produto + promessa em uma linha.
2. **3–5 telas ou ações** em ordem.
3. Visual: hex das cores, uma fonte, claro ou escuro.
4. Tempo: duração, BPM e como o corte responde à batida.
5. Banidos: brilho, partículas, crossfade, ícone com cara de stock.
6. Final: logo, URL ou uma linha de texto.
7. Formato: 9:16, 1080×1920.

Mandar o print do site para o Claude estudar a marca antes de desenhar.

---

## 34. Lista negra e lista verde

### Lista negra (nunca)
- Converter o vídeo do iPhone para 30 fps / SDR, ou recomprimir duas vezes.
- Filtro de ruído na voz; música alta por cima da fala.
- Crossfade, blur-in genérico, quique elástico, overshoot grande.
- Brilho/neon, partículas, lens flare, tremida de câmera, RGB split, gradiente genérico, sem motivo.
- Texto e molduras decorativas nos cantos, "rótulos técnicos" que não informam nada.
- Tempo morto: pausa sem propósito, quadro congelado (fora a pausa antes do clímax).
- Zoom em lugar errado em tutorial; círculos e molduras de clique (poluem a tela).
- Animação sem relação com o que está sendo dito; cartão cobrindo o rosto.
- Número, preço ou dado inventado; nome e logo de cliente sem autorização.
- `Math.random`, `Date.now`, animação fora da timeline (o render muda).
- Montar o vídeo inteiro antes de o usuário gravar ou confirmar o material.
- Dizer "comando" (o certo é **"código"**).

### Lista verde (sempre)
- Um conceito; um gancho em ≤ 2 s; CTA com a palavra igual à da automação.
- Cada corte carrega um elemento; durações variadas; pausa antes do clímax.
- Animação na palavra exata; legenda palavra a palavra com destaque nas palavras-chave.
- Molas com overshoot mínimo; pousos `power4.out`; reposicionamentos `power2.inOut`.
- Motion blur só nos golpes rápidos; profundidade com DoF e paralaxe.
- Qualidade de origem preservada (HDR 60 fps, HEVC 10-bit) e voz a −16 LUFS.
- Briefing curto antes; teste de 1 s do efeito difícil; folha de quadros rotulada; `check` sem erro.
- Entregar em Downloads, abrir e resumir o que conferir.

---

## 35. ⭐ Método "O vídeo faz o que eu falo": 3D integrado à fala

> O formato de melhor resultado até agora: corretor imobiliário (casa → planta → prédio de 20 andares →
> rooftop → preço) e médico veterinário (tigela, bichos, pata, osso, coração), com entrada na TV no gancho.
> **Estrutura do projeto:** `assets/model.js` (geometria e tempos), `assets/s3d/*.js` (cenas 3D), `scripts/*` (recorte, build, geo, compositor, áudio).

### 35.1 Por que funciona (e por que a v1 não funcionou)
| v1 (reprovada) | Método (aprovado) |
|---|---|
| Cartões 2D chapados (SVG/CSS) no topo, parecendo slide | **Objetos 3D reais** (Three.js/WebGL) com luz, sombra e câmera |
| Gráfico "colado" na frente da pessoa | **Recorte por IA**: o 3D passa **atrás da cabeça** |
| Parede original cinza | **Fundo reconstruído**: cenário 3D desfocado como lente (foco no rosto) |
| Pessoa ocupando a tela inteira | Pessoa **a 80% e mais baixa** durante o 3D (os objetos ganham espaço) |
| Entrada na TV aos 5 s, sala preta | **Gancho em 2 s** (controle remoto liga a TV) e sala **nunca preta** |

### 35.2 As camadas (ordem do compositor)
1. **back** (`assets/s3d/room.js`): sala 3D da TV; fora da sala, o mesmo cenário visto de onde a pessoa está (fundo reconstruído).
2. **vídeo HLG original** (posicionado por `assets/geo.json`; na sala vai na tela da TV, só a faixa 16:9 do rosto).
3. Fundo real **escurecido** pelo recorte + **fundo reconstruído** desfocado (σ ≈ 7 px a meia resolução) no lugar da parede.
4. **mid** (`assets/s3d/estate.js`, `vet.js`): o 3D e os títulos gigantes que ficam **atrás** da pessoa.
5. **A pessoa recortada** por cima, com **light wrap** (a luz do cenário vaza na borda e mata o halo da parede clara).
6. **front** (`remote.js`, legenda, selo, CTA, vidro da TV).

Acabamento de câmera no 3D (no compositor, em sRGB antes da LUT): maciez de lente (σ 0,65), **bloom só do que é luz**
(muito claro **e** saturado, ou quase branco puro; nunca as paredes brancas), **grão** σ 2,4 e **motion blur** de 3 quadros nos golpes rápidos.

### 35.3 O passo a passo (códigos)
```bash
python scripts/matte.py                               # recorte RVM (ONNX na Radeon via DirectML): ~8 min p/ 78 s
python scripts/build.py                               # gera index.html (prévia) + build/back|mid|front.html
node scripts/export-geo.mjs                           # onde o vídeo entra em cada quadro (mesmo model.js do navegador)
bash scripts/test-layer.sh back 2.4 PASTA             # 1 quadro de uma camada num instante (segundos)
bash scripts/render-all.sh SAIDA.mp4 back mid front   # só as camadas que mudaram + montagem HDR (~40 min)
PYTHONIOENCODING=utf-8 python scripts/audio.py        # voz + SFX (no Windows, sem UTF-8 o print com "→" quebra)
```
Prévia ao vivo (custa zero token): `npx hyperframes preview` e abrir o projeto no Studio, que atualiza sozinho a cada edição.

### 35.4 Receitas que entraram no vídeo
- **Entrada na TV com controle remoto (gancho ≤ 3 s):** o controle 3D sobe em "vai", clica no meio de "entrar"
  (botão afunda, LED infravermelho pisca, feixe vermelho, flash de "TV ligando" com scanlines) e a câmera recua até
  `k = 0,62` em 1,25 s (`p3o`). O Reels 9:16 fica na largura da TV e **só a faixa 16:9 do rosto** fica na tela; o resto some em 0,55 s.
- **Sala 3D da TV:** estante embutida com livros instanciados, ripado vermelho atrás da TV, móvel suspenso, sofá em
  primeiro plano, luminária em arco, planta. Luz: tela (RectAreaLight), LEDs das prateleiras (acendem em cascata em
  "estante"), abajur e spots (em "sala"). **Começa acesa fraca (30%)**: nunca tela preta. Câmera: a mesma conta no
  navegador e no compositor (`model.js → roomCam/project`), então o vídeo encaixa na TV com precisão de pixel.
- **Título gigante atrás da cabeça:** "CORRETOR *imobiliário*", "MÉDICO *veterinário*" (212 px + serif 176 px); entra com escala 1,18 → 1 e blur.
- **Casa → planta → prédio:** a casa se monta com queda e `backOut`; na "planta baixa" o telhado e o volume de cima sobem
  e as paredes descem para 38% (corte); os cômodos acendem em vermelho na palavra, com **etiquetas numeradas** (estilo da
  referência) e cotas 12 m × 10 m; a ilha da cozinha americana surge na palavra.
- **Swoosh do prédio:** a câmera gira 270° (`p3io`, 1,55 s) e se afasta logo no começo (`p2o`), enquanto os 20 andares
  sobem (`p2io`) com o contador; motion blur de 3 quadros; SFX "spin" + um tique por andar na mesma curva.
- **"2 por andar":** o 13º andar sai como gaveta, o vidro fica transparente e aparecem os dois apartamentos.
- **Rooftop:** deck, pérgola, academia de vidro (sobe), piscina (a água sobe; a borda é moldura, não caixa sólida).
- **Veterinário:** tigela de inox (Lathe) com 150 grãos caindo, ícones Font Awesome **extrudados** (cachorro, pássaro,
  gato) em arco, pata com anel de atividade que enche, osso que racha (planos de corte), coração que perde a cor.
- **Camadas de vidro no CTA:** fundo, pessoa recortada e legenda em planos separados, com moldura vermelha brilhando.

### 35.5 Regras que custaram caro (não repetir)
1. **Pisos na mesma altura do pedestal = z-fighting** (listras). Subir a casa 0,48 m; usar `logarithmicDepthBuffer`.
2. **Filho com `visibility: visible` escapa do pai oculto**: esconder o HUD com `display: none`.
3. **PNG 100% opaco sai do render sem canal alfa**: o compositor precisa aceitar 3 canais (senão a sala some).
4. **Nada de `fetch` assíncrono numa cena**: o render captura antes. Embutir os SVGs num módulo JS.
5. **Teste de quadro único precisa deslocar o tempo nos dois caminhos** (`onUpdate` e o evento `hf-seek`).
6. **Matar só o shell não para o render**: o node/Chrome continua escrevendo na pasta. Conferir os processos.
7. **Testar TODOS os trechos (TV, corretor, vet, CTA) quadro a quadro antes do render inteiro.** Render completo só uma vez.
8. **3 primeiros segundos com movimento**; **pessoa menor** quando o 3D é o assunto; **sala nunca preta**.

### 35.6 Para outro nicho (adaptar em 1 dia)
Trocar só o `mid`: copiar `estate.js` como molde (pedestal com anéis, câmera em órbita com `setViewOffset` para pôr o
objeto acima da cabeça, HUD com etiquetas e número grande) e desenhar o objeto do nicho (consultório, dente, produto,
carro…). Pedir ao usuário as **palavras que vão disparar cada estado** antes de modelar.

---

## 36. Os 20 princípios de fluidez (animação + UX) e o formato "um quadradinho é você"

> Referências (nov/2026): **@charles.unemployed** "20 Principles of UX & Animation" (https://www.instagram.com/p/DfphRvFBx54/),
> cada princípio mostrado em **antes × depois**; e **@gambetalucca** "O Claude está absurdo" (https://www.instagram.com/p/Dfpniz9pYUa/),
> motion 100% código de dados com um quadradinho que vira o planeta. A primeira virou a régua de fluidez deste manual.

### 36.1 Os 12 de animação (Disney), traduzidos para GSAP
| # | Princípio | O que é | Como aplicar aqui |
|---|---|---|---|
| 1 | Esmagar e esticar | O objeto achata no impacto e estica em movimento: dá **peso** | No pouso: `scaleY .86 / scaleX 1.1` por 0,08 s e volta em 0,25 s. Esticar no eixo do movimento. Volume constante |
| 2 | Antecipação | Um recuo pequeno antes do golpe grande | 0,10–0,18 s no sentido contrário (5–8% do percurso) antes de sair. Vale para câmera: recua 2% antes do mergulho |
| 3 | Encenação | **Um foco por vez** | Escurecer/desfocar o resto (opacidade .35, blur 3–6 px) quando um elemento é o assunto |
| 4 | Pose a pose | Definir as poses-chave e deixar o motor interpolar | Autorar os pousos como constantes (29.1 item 5); nunca improvisar quadro a quadro |
| 5 | Continuidade (follow through) | As partes continuam depois que o corpo para, e assentam | Filhos chegam 2–4 quadros depois do pai, com overshoot menor (`back.out(1.2)`); rótulo assenta depois do número |
| 6 | Entrada e saída lentas | Acelera e freia, nunca velocidade constante | `linear` só em contador/relógio. Resto: `power3/expo.out` na chegada, `power2.inOut` no reposicionamento |
| 7 | Arcos | Mover em curvas, não em retas | Animar x e y com eases diferentes (x `power1.in`, y `power2.out`) ou `motionPath` |
| 8 | Ação secundária | Um floreio pequeno que reforça a ação principal | Anel/faíscas curtas no "confirmado", poeira no pouso; sempre menor e mais curto que o principal |
| 9 | Tempo (timing) | A duração define a sensação | Resposta de interface < 300 ms; pouso de cena 0,6–0,9 s; câmera 1,0–1,6 s |
| 10 | Exagero | Passar um pouco do real para o momento "bater" | Erro: tremer 3× com ±10 px e borda vermelha; número-chave: escala 1,12 → 1 |
| 11 | Desenho sólido (3D) | Dar profundidade e volume ao que é chapado | `perspective` + `rotateX/Y`, sombra que acompanha, espessura lateral (cubinhos, não quadrados) |
| 12 | Apelo | A soma de cada detalhe feito com cuidado | Cursor que vira ícone, botão que vira círculo ao carregar; nada de detalhe genérico |

### 36.2 As 8 leis de UX (valem para qualquer tela que aparece no vídeo)
- **Fitts:** alvo maior e mais perto é mais rápido de acertar → botões grandes, perto de onde o olho já está.
- **Área de toque maior que o desenho:** ícone de 24 px com área de 44 px.
- **Hick:** mais opções = decisão mais lenta → mostrar 1–3 escolhas por vez.
- **Miller:** seguramos ~7 itens → agrupar números (`4532 0151 1283 0366`), blocos de legenda curtos.
- **Limiar de Doherty:** responder em até 400 ms ou parece lento → toda ação na tela tem reação visível em < 0,4 s (e o som junto).
- **Postel:** aceitar entrada bagunçada, devolver limpa.
- **Jakob:** as pessoas esperam que funcione como os outros → usar padrões conhecidos (balão de comentário, barra de progresso).
- **Frequência de uso:** quanto mais usado, menos deve animar → a legenda (aparece 100×) anima quase nada; o clímax (1×) anima muito.

### 36.3 Como a referência ensina (formato didático para copiar)
- **Antes × depois lado a lado**, mesmo elemento, só o princípio muda: o olho entende em 1 s.
- **Lista numerada que acende** o item atual (laranja) + **cronômetro** correndo: promessa clara ("20 em 30 s") e progresso visível.
- **Um princípio a cada ~1,3 s**, legenda de uma linha em cima do cartão. Paleta creme + um acento.

### 36.4 Formato "um quadradinho é você" (dados que viram mundo)
Estrutura do @gambetalucca (51 s): gancho com rosto (1,5 s) → chicote para a tela → **1 quadrado = você** → contador (+3.300.000 pessoas por quadrado)
→ a câmera recua e 1 vira 2.500 = **o planeta inteiro (8,3 bilhões)** → "presta atenção" → os quadrados mudam de cor por faixa
(71% cinza nunca usaram IA · 28% verde usam grátis · 1% amarelo pagam · < 0,5% vermelho constroem) → virada emocional
("você não tá ~~atrasado~~. Você chegou cedo.") → pergunta-CTA ("de que cor é o seu?").

**O que funciona:** um objeto só do começo ao fim (o quadradinho "você" nunca some, tem etiqueta); escala que cresce (1 → 2.500);
cor = categoria; número grande em cima, legenda pequena embaixo; final devolve a pergunta ao espectador.

**Onde dá para superar (o dele é simples):** grade plana quase sem câmera, sem voz, sem som, sem profundidade. Fazer:
1. **Câmera contínua** (um plano-sequência): mergulhos, órbita e recuo com `power2.inOut`, antecipação de 2% e motion blur só nos golpes.
2. **Cubinhos 3D** com espessura, sombra e luz (princípio 11); a onda de cor passa como **dominó** (atraso por distância ao centro).
3. **Narração com ênfase** (ElevenLabs) e tudo sincronizado **na palavra** (tempos por caractere da API).
4. **Som em 3 camadas:** trilha/drone que cresce, SFX de movimento (swoosh na câmera, tique por quadrado, impacto no número), silêncio de 0,4 s antes da virada.
5. **Esmagar/esticar e follow through** em toda chegada; o quadradinho "você" pulsa quando é citado.

### 36.5 Checklist de fluidez (rodar antes do render)
- [ ] Todo movimento tem antecipação **ou** follow through (os dois nos 3 momentos principais).
- [ ] Nenhum tween `linear` fora de contador. Nenhum movimento em linha reta com mais de 300 px.
- [ ] Um foco por plano; o resto apagado/desfocado.
- [ ] Toda mudança visual tem um som em até 1 quadro de distância, e todo som tem causa na tela.
- [ ] Elemento repetido anima pouco; clímax anima muito.
- [ ] Durações variadas (plano mais longo ≥ 4× o mais curto) e uma pausa antes da virada.

### 36.6 Pacote pronto do formato
O formato "um quadradinho é você" para qualquer nicho (imóveis, finanças, saúde, fitness…) tem uma skill própria,
**motion-3d-qualquer-nicho**, com historinhas prontas, dicionário de animações e o filtro "sem cara de IA".
A voz, os SFX e a trilha estão na seção 38.

---

## 37. Formato "tela em cima, fala embaixo" (tutorial e demonstração)

> Formato de nov/2026 para mostrar uma ferramenta enquanto a pessoa explica (ex.: cadastro no ChatGPT Business Hub).
> A tela e a pessoa aparecem **ao mesmo tempo**, sem ficar trocando de plano: quem assiste nunca perde o rosto nem o clique.

### 37.1 O layout (1080×1920)
| Faixa | O que vai | Regra |
|---|---|---|
| 0–1080 (quadrado de cima) | Gravação de tela, animação ou cartão | Zoom suave na região que importa (37.2) |
| Linha da divisória | **Legenda amarela de 1–2 palavras** logo acima | Palavra a palavra (seção 8), uma ou duas por vez |
| 1080–1920 (embaixo) | A pessoa falando | Recorte direto do original, **sem reamostrar** quando a resolução permite (escala 1:1) |

### 37.2 Zoom na tela sem perder o contexto
- Para cada trecho, defina a **região de interesse** (x, y, lado) da gravação: um quadrado que segue o que está sendo falado.
- Transição entre regiões com **smoothstep** (acelera e freia), 0,6–1,0 s. Nunca corte seco de zoom.
- **Lado mínimo:** nunca cortar a largura de um formulário ou de uma janela que a pessoa está preenchendo (na prática, ≥ ~1.150 px de uma gravação de 2.300 px de largura).
- **Privacidade:** desfocar antes do render tudo que for sensível (registros de DNS, tokens, chaves, senhas, códigos de verificação). E-mail e telefone do próprio criador podem aparecer se ele autorizar.

### 37.3 Quando pedem "não mexe no som nem na imagem"
- **Voz:** se chegou baixa (ex.: −33 LUFS), aplique **só ganho linear** até ~−17/−16 LUFS. Sem compressor, sem EQ, sem redução de ruído. Confira o pico (≤ −1 dBTP).
- **Imagem:** se o rosto está estourado, baixe a exposição **igual em todos os cortes** (ex.: ×0,80 em luz linear ≈ −1/3 de stop). Nunca um ajuste diferente por take.
- **SFX** baixinhos são aceitos: whoosh nas trocas de região, teclado no CTA.

### 37.4 Pipeline
```
edit.py      → cortes, região da tela por trecho, legenda corrigida (dicionário FIX) → edit.json
index.html   → camada de cima (tela + legenda) renderizada em PNG 60 fps
audio.py     → voz (só ganho) + SFX → mix.wav
compose.py   → junta tela + pessoa (HDR se a origem for iPhone) + mix.wav → MP4
               (--frames a,b gera só alguns quadros de prévia antes do render inteiro)
```

### 37.5 Armadilhas
- Arquivos **.MOV do iPhone** costumam ter o áudio ~0,27 s mais curto que o vídeo: corte pelo **fim do áudio**, senão sobra imagem muda no fim de cada take.
- Gravação de tela é SDR e a pessoa é HDR: converta a tela para o espaço da pessoa no compositor, com o branco da tela no branco de referência (203 nits, BT.2408), não no pico.

---

## 38. Voz, efeitos e trilha com IA (ElevenLabs)

> Para vídeos sem rosto (motion 100% código, seção 36.4) ou para gerar SFX sob medida em qualquer vídeo.
> Opcional: sem ElevenLabs, grave a narração com a sua voz (fica ainda mais humano) e use a trilha sintetizada da seção 6.

### 38.1 Configurar (uma vez)
1. Crie a conta em elevenlabs.io → **Perfil → API Keys** → gere a chave.
2. Na pasta do projeto, crie `.env.local` com `ELEVENLABS_API_KEY=sua_chave` e coloque `.env.local` no `.gitignore`. **A chave nunca vai para o código, para o chat nem para o Git.**
3. Instale o SDK na pasta do projeto: `npm i @elevenlabs/elevenlabs-js`.
4. A skill traz a ferramenta pronta `scripts/el.mjs`. Copie para o projeto e rode:
```bash
node --env-file=.env.local el.mjs info                                   # plano, créditos e vozes disponíveis
node --env-file=.env.local el.mjs tts --voice ID --text-file roteiro.txt --out audio/voz   # voz.mp3 + voz.json (tempo de cada caractere)
node --env-file=.env.local el.mjs sfx --text "short soft whoosh" --dur 1.2 --out sfx/whoosh.mp3
node --env-file=.env.local el.mjs batch --file sfx.json                  # vários SFX: [{text,out,dur,influence,loop}]
node --env-file=.env.local el.mjs music --prompt "dark ambient pulse" --ms 40000 --out trilha.mp3   # plano pago
```

### 38.2 O que o plano grátis libera
- **Libera:** vozes padrão ("premade") pela API, com tempos por caractere, e o gerador de SFX.
- **Não libera (erro 402):** vozes da biblioteca (inclusive as brasileiras) e a geração de música. Saída sem pagar: escolher uma voz padrão grave e calma, e fazer a trilha com **2–3 "beds"** do gerador de SFX em loop (intro, tensão, esperança), trocando nas viradas do roteiro.

### 38.3 Sincronizar a animação com a voz
- Gere a voz com **tempos por caractere** (`convertWithTimestamps`); um script (`timing.py`) junta os caracteres em palavras e escreve `timing.js` com o início e o fim de cada palavra.
- Cada evento da cena é ancorado numa palavra (`at("verde")`), nunca num segundo fixo: se a voz mudar, a animação acompanha sozinha.
- Frases curtas com respiro de 0,3–0,6 s; uma pausa de ~0,5 s antes da virada.

### 38.4 Mix
- Voz −16 LUFS · trilha −30 a −26 LUFS por baixo da voz (ducking) · SFX baixos · pico −1 dBTP.
- Todo SFX tem causa na tela e toda mudança visual tem som em até 1 quadro de distância (seção 36.5).

### 38.5 Armadilhas
- No Git Bash do Windows, caminho `/c/...` dentro de um JSON lido pelo Node vira `C:\c\...`: escreva `C:/...`.
- Mostre a **amostra da voz** antes de animar: trocar a voz depois muda todos os tempos.
- Não gere tudo de novo a cada ajuste: a ferramenta pula arquivos que já existem (use `--force` para refazer).

---

*Super Manual vivo: toda correção nova vira uma linha na seção 20 e, se for regra, um mandamento na seção 1. Toda referência nova vira uma análise (como as seções 25 e 30) e, se trouxer técnica nova, uma linha na seção 32.*
