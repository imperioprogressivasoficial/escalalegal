# Prompts prontos (copie e cole no Claude Code)

## 1. Briefing → 3 historinhas
```
Use a skill motion-3d-qualquer-nicho. Nicho: [X]. Público: [quem]. Mensagem central: [1 frase].
Me dê 3 historinhas usando estruturas diferentes de references/historias.md, cada uma com tabela de tempo (voz | tela),
máx. 9 palavras por frase, terminando em pergunta + CTA "comenta [PALAVRA]". Passe tudo pelo sem-cara-de-ia.md.
```

## 2. Ajustar o roteiro
```
Gostei da opção [N]. Deixe mais [direta / emocional / técnica]. Troque a frase [N] por algo que eu falaria num áudio.
```

## 3. Voz
```
Gere a narração com a voz [nome/ID ou "grave masculina calma"], com timestamps por caractere.
Pausas de 0,5 s antes da virada. Me mande a amostra antes de animar.
```
(Com a sua voz: `Usei meu áudio em voz.m4a. Limpe, nivele a −16 LUFS e gere o timing de cada palavra.`)

## 4. Direção de arte
```
Visual soft 3D + lines: fundo #050506 com névoa, objetos brancos foscos com bordas arredondadas,
linhas finas de contorno, cor de destaque [#HEX] = [significado]. Máx. 4 cores. Grão 3%, bloom suave, motion blur só no movimento rápido.
```

## 5. Animar
```
Monte a cena em Three.js como função pura do tempo, câmera em plano-sequência (lista MOVES).
Cada evento ancorado na palavra exata do timing. Use: [stagger / color wave / extrude / line draw / dive / dolly out] (references/animacoes.md).
Antes do render, me mostre quadros de teste do início, meio e fim de cada frase.
```

## 6. Corrigir
```
No quadro [tempo], [o que está errado]. Corrija só isso e me mostre o mesmo quadro de novo.
```
Exemplos: "a legenda está atrás dos botões", "a câmera está rápida demais no zoom out", "o verde entra antes da palavra verde".

## 7. Som
```
Gere SFX para cada evento (pop no 1º objeto, whoosh nos movimentos de câmera, boom na escala, ticks no contador)
e 2–3 beds de trilha que mudam na virada. Mix: voz −16 LUFS, trilha −28 LUFS com ducking.
```

## 8. Render e entrega
```
Rode um teste de 1 s do trecho mais pesado. Se passar, renderize 1080x1920 60 fps, junte o áudio,
faça o QA de references/edicao.md e salve em Downloads. Me diga o que conferir.
```

## 9. Revisão anti-IA
```
Assista aos quadros de teste e leia o roteiro com references/sem-cara-de-ia.md. Liste tudo que parece IA e corrija.
```

## 10. Versão para outro nicho (reaproveitar)
```
Pegue este projeto e crie a versão para o nicho [Y]: troque a unidade, o todo, as cores e o CTA.
Mantenha a câmera e o pipeline. Me mostre o roteiro novo antes.
```
