# Dicionário de animações (nome → quando usar → como fazer)

Use esses nomes nos prompts. O Claude entende todos.

## Curvas de movimento (easing)
| Nome | Sensação | Quando | Código |
|---|---|---|---|
| **ease-in-out cúbico** | natural, humano | 80% dos movimentos | `t<.5?4t³:1-(-2t+2)³/2` |
| **expo out** | chega rápido, assenta macio | entradas, zoom de câmera | `1-2^(-10t)` |
| **back out (overshoot leve)** | passa 3–5% e volta | pop de objeto, número aparecendo | `c1=1.2` (nunca >1.7) |
| **ease-in** | acelera e sai | só saídas | `t³` |
| **linear** | robótico | **só** em contador e rotação contínua | `t` |
| **spring amortecida** | elástico controlado | botões, cards | rigidez 170, amortecimento 26 |

## Animações de objeto
| Nome | O que é | Quando |
|---|---|---|
| **Stagger (cascata/dominó)** | mesma animação com atraso crescente | grades, listas, ondas de cor |
| **Ripple / onda radial** | atraso = distância de um ponto | "isso se espalha" |
| **Scale pop** | 0 → 105% → 100% | 1º objeto, ênfase |
| **Anticipation** | recua 3–5% antes de ir | qualquer salto grande |
| **Settle** | assenta sem quicar | fim de queda |
| **Extrude / grow** | cresce em altura a partir do chão | barras, gráficos 3D, torres |
| **Assemble / build-up** | peças voam e encaixam | montar casa, produto, contrato |
| **Explode view** | separa em camadas | mostrar "por dentro" |
| **Shatter / crack** | racha em linhas finas | erro, risco |
| **Color wave** | muda cor em onda | revelar porcentagem |
| **Morph** | uma forma vira outra | "isso vira aquilo" |
| **Float / idle drift** | deriva de 1–2% | nada fica 100% parado |

## Lines (linhas)
| Nome | O que é | Quando |
|---|---|---|
| **Line draw / stroke reveal** | linha se desenha do início ao fim | conectar dado ↔ objeto, caminhos |
| **Callout / leader line** | linha + rótulo apontando | explicar uma peça |
| **Grid fade-in** | grade aparece do centro para fora | abrir cena "técnica" |
| **Wireframe → sólido** | contorno vira objeto | "da ideia ao real" |
| **Trail** | rastro atrás do objeto | trajetória, velocidade |
| **Blueprint** | linhas azuladas finas sobre fundo escuro | engenharia, arquitetura, planejamento |

## Câmera (3D)
| Nome | O que é | Quando |
|---|---|---|
| **Dolly in / out** | câmera anda para frente/trás | aproximar do detalhe / revelar escala |
| **Orbit** | gira em volta do alvo | mostrar objeto 3D |
| **Crane / pedestal** | sobe ou desce | "visão de cima" da grade |
| **Push-in lento** | dolly de 3–8% ao longo da frase | dar tensão à fala |
| **Dive** | mergulho rápido com motion blur | entrar no detalhe escondido |
| **Dolly zoom (vertigo)** | anda para frente e abre o FOV | momento de choque (1x por vídeo) |
| **Rack focus** | foco muda de plano | trocar o assunto sem cortar |
| **One-shot (plano-sequência)** | nunca corta | padrão deste formato |

## Texto (kinetic typography)
| Nome | Quando |
|---|---|
| **Word-by-word** | legenda falada |
| **Mask reveal / slide-up** | título entra de baixo de uma máscara |
| **Counter roll / odometer** | números contando |
| **Highlight swipe** | barra de cor passa atrás da palavra-chave |
| **Track-in** | letras se aproximam (espaçamento diminui) |

## Pós-produção
**Motion blur** (acúmulo de subquadros, só no movimento rápido) · **Bloom** (só no que é luz) · **Vinheta** · **Grão de filme** 2–4% · **Aberração cromática** sutil só em impacto · **Tone mapping ACES**.

## Transições (sem crossfade)
**Match cut** (forma igual liga duas cenas) · **Whip pan** (giro rápido com blur) · **Zoom through** (atravessa um objeto) · **Mask wipe por forma** · **Continuidade de câmera** (preferida).
