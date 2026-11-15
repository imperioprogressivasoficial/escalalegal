---
name: motion-3d-qualquer-nicho
description: Cria Reels/TikTok/Shorts de motion design 100% código (sem rosto) no estilo "soft 3D + linhas": cubos, grades, gráficos e cenas 3D suaves com câmera contínua, bloom, motion blur, narração e SFX gerados por IA, para QUALQUER nicho. Por @theouriks. Use quando o usuário pedir vídeo de motion, animação 3D, vídeo sem aparecer, explicativo com dados, "um quadradinho é você", ou adaptar esse formato para um nicho (imóveis, finanças, saúde, fitness, marketing, educação, advocacia etc.).
---

# Motion 3D para qualquer nicho (soft 3D + lines)

Formato: **uma ideia visual simples que cresce de escala**, narrada por voz grave, com câmera que nunca corta. Exemplo original: "1 quadradinho = você → 2.500 quadradinhos = o planeta → as cores mostram onde você está → de que cor é o seu?".

## Arquivos de referência (leia antes de cada etapa)
| Etapa | Arquivo |
|---|---|
| Criar a historinha | `references/historias.md` (5 estruturas + 10 cases por nicho) |
| Escolher/nomear animações | `references/animacoes.md` |
| **Sempre, antes de entregar roteiro, voz e vídeo** | `references/sem-cara-de-ia.md` |
| Gancho, ritmo, legenda, som, exportação, QA | `references/edicao.md` |
| Fluxo com o usuário | `references/prompts-prontos.md` |
| Detalhe técnico | `references/super-manual.md`: seções **36** (20 princípios de fluidez), **14/31/32** (motion 100% código), **6** (áudio), **21** (QA), **16** (CTA + isca) |

Sempre proponha **3 historinhas** com estruturas diferentes e espere a escolha antes de gerar voz ou animar.

---

## 1. Adaptar a ideia ao nicho (o mais importante)

Fórmula do roteiro, 25 a 40 s, 6 a 9 frases curtas:

1. **Unidade** – "Esse quadradinho é você." (1 objeto na tela, 0–3 s, já em movimento)
2. **Escala** – multiplica até virar um todo (cidade, mercado, país, planeta).
3. **Divisão** – o todo muda de cor em ondas: a maioria / poucos / pouquíssimos.
4. **Virada** – "Mas você chegou cedo." / "E isso muda agora."
5. **Pergunta** – "De que cor é o seu?" (comentário vira engajamento)
6. **CTA** – "Comenta PALAVRA que eu te mando…"

| Nicho | Unidade | Todo | Divisão em cores |
|---|---|---|---|
| Imóveis | 1 tijolo / apartamento | o prédio / a cidade | aluga · financia · quitado · investe |
| Finanças | 1 moeda | o salário do mês | gasto · dívida · reserva · investido |
| Fitness | 1 dia | o ano (365 cubos) | parado · começou · constante |
| Saúde/odonto | 1 paciente | 1.000 pacientes | não previne · trata tarde · previne |
| Marketing | 1 post | 1 ano de perfil | ninguém vê · alcance · vira venda |
| Educação | 1 hora | 10.000 horas | assistiu · praticou · dominou |
| Advocacia | 1 contrato | 100 empresas | sem cláusula · com risco · protegido |

**Regras de dado:** nenhum número inventado. Ou vem de fonte (cite na legenda do post) ou entra com selo discreto "ilustrativo". Arredonde para números que a voz fala fácil.

---

## 2. Linguagem visual "soft 3D + lines"

- **Fundo** quase preto `#050506` com névoa exponencial (`FogExp2`, densidade ~0.0016): profundidade sem cenário.
- **Objetos** `MeshStandardMaterial` branco, `roughness 0.4`, `metalness 0` – plástico fosco, bordas levemente arredondadas (RoundedBox). Nada cromado.
- **Chão** escuro com reflexo leve (`roughness 0.5`, `metalness 0.15`).
- **Lines:** grade fina, contornos (`EdgesGeometry` + `LineBasicMaterial`, opacidade 0.15–0.35), linhas-guia que se desenham (`setDrawRange` animado) ligando número → objeto. Linha conecta, nunca enfeita.
- **Cor = significado.** Base cinza/branca + **1 cor de destaque por ideia** (verde = bom, amarelo = raro, vermelho = alerta). No máx. 4 cores no vídeo.
- **Pós (nessa ordem):** motion blur por acúmulo de subquadros → bloom HDR suave (força ~0.16, só no que é emissivo) → tone mapping ACES + exposição ~1.05 → vinheta + grão leve.
- **Texto/HUD:** 1 fonte sans forte, números grandes com contador, legenda palavra a palavra na zona segura (entre 15% e 75% da altura, longe dos botões do app).

## 3. Movimento (resumo da seção 36)

- **Um plano só:** a câmera nunca corta; viaja por uma lista `MOVES` (posição, alvo, FOV, tempo) com easing `easeInOutCubic`/`expo`. Mudança de escala = zoom out contínuo, não troca de cena.
- **Ondas em dominó:** mudança de cor/altura propaga com atraso por distância (`delay = dist * k`), nunca tudo ao mesmo tempo.
- **Antecipação e assentamento:** o objeto recua 3–5% antes de ir e assenta sem quicar.
- **Cada evento na palavra exata da voz** (tempos por caractere do TTS). Se a fala diz "verde", o verde entra naquela sílaba.
- **Sempre algo se movendo**, mesmo em pausa (deriva lenta de câmera 1–2%).
- Proibido: crossfade, partículas aleatórias, quique, brilho sem motivo, texto decorativo nos cantos.

## 4. Áudio

- **Voz:** ElevenLabs TTS com *timestamps por caractere* (endpoint `with-timestamps`). Voz masculina grave e lenta; frases curtas com respiro de 0.3–0.6 s.
- **SFX:** gerador de efeitos (pop no 1º cubo, whoosh/dive na câmera, boom na escala, keys/counter nos números, impact na virada).
- **Trilha:** 2–3 "beds" (intro, tensão, esperança) trocando nas viradas do roteiro.
- **Mix:** voz −16 LUFS, trilha −30 a −26 LUFS por baixo da voz (ducking), SFX baixos. Pico −1 dBTP.

## 5. Pipeline (tudo é função do tempo)

```
roteiro.json  →  timing.py (gera voz + timing.js com o tempo de cada palavra)
              →  scene.js (Three.js; render(t) puro: mesma t = mesmo quadro)
              →  index.html (HUD, contadores, legenda)
              →  audio.py (voz + SFX + beds → mix.wav)
              →  render 1080x1920, 60 fps, qualidade máxima (HyperFrames/Remotion/Puppeteer)
              →  ffmpeg junta mix.wav → MP4 H.264 ~20–40 Mbps, AAC 320k
```

Regras de render: sem `Math.random` (use seed fixa), sem `Date.now`, sem `requestAnimationFrame` livre, sem `fetch` na hora. Fontes e bibliotecas locais.

## 6. Ordem de trabalho com o usuário

1. Pergunte **só**: nicho, a mensagem central (1 frase), dados com fonte (ou "ilustrativo"), palavra do CTA, voz (M/F).
2. Entregue o roteiro adaptado (fórmula da seção 1) + tabela unidade/todo/cores. **Espere aprovação.**
3. Gere a voz e mostre a amostra antes de animar.
4. Monte a cena; tire **quadros de teste** de cada frase (início/meio/fim) e confira enquadramento, zona segura e legibilidade.
5. Teste de 1 s do trecho com motion blur mais forte.
6. Render completo **uma vez só**, QA (seção 21: áudio sincronizado, nada cortado, sem quadro preto, 60 fps) e entrega em `Downloads`.

## Checklist final
- [ ] Movimento nos 3 primeiros segundos
- [ ] Uma ideia só, escala crescente, câmera sem corte
- [ ] Cor = significado, máx. 4 cores
- [ ] Cada animação cai na palavra
- [ ] Dados com fonte ou "ilustrativo"
- [ ] Pergunta + CTA "comenta PALAVRA" no fim
- [ ] Voz −16 LUFS, trilha por baixo
