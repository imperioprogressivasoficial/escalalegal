// Sons de escritório, gerados no aparelho (sem arquivo): clique de tecla, digitando enquanto carrega,
// "ding" de sininho de balcão quando algo é salvo e carimbo quando a escala fica pronta.
// Baixinhos. Desliga com Sons.desligar() (fica guardado no aparelho). Só tocam depois do primeiro toque na tela (regra dos navegadores).
(function () {
  var ctx = null, ligado = true;
  try { ligado = localStorage.getItem('sons') !== '0'; } catch (e) {}
  function ac() {
    if (!ligado) return null;
    var A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
    if (!ctx) { try { ctx = new A(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume().catch(function () {});
    return ctx.state === 'running' ? ctx : null;
  }
  // destrava o áudio no primeiro toque
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, function () { ac(); }, { once: true, passive: true, capture: true }); });

  function ruido(c, dur) {
    var n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    var s = c.createBufferSource(); s.buffer = b; return s;
  }
  function ganho(c, v, t0, dur) {
    var g = c.createGain(); g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); g.connect(c.destination); return g;
  }
  // tecla de teclado / clique de botão
  function clique(vol) {
    var c = ac(); if (!c) return; var t = c.currentTime;
    var s = ruido(c, 0.03), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400 + Math.random() * 1600; f.Q.value = 1.2;
    s.connect(f); f.connect(ganho(c, vol || 0.09, t, 0.04)); s.start(t);
  }
  // sininho de balcão (ding)
  function ding() {
    var c = ac(); if (!c) return; var t = c.currentTime;
    [[1568, 0.05], [3136, 0.018], [4704, 0.008]].forEach(function (p) {
      var o = c.createOscillator(); o.type = 'sine'; o.frequency.value = p[0]; o.connect(ganho(c, p[1], t, 0.9)); o.start(t); o.stop(t + 0.95);
    });
  }
  // aviso de erro: "tum" grave e curto
  function tum() {
    var c = ac(); if (!c) return; var t = c.currentTime;
    var o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.18);
    o.connect(ganho(c, 0.07, t, 0.22)); o.start(t); o.stop(t + 0.25);
  }
  // carimbo na mesa
  function carimbo() {
    var c = ac(); if (!c) return; var t = c.currentTime;
    var o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
    o.connect(ganho(c, 0.22, t, 0.16)); o.start(t); o.stop(t + 0.18);
    var s = ruido(c, 0.06), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    s.connect(f); f.connect(ganho(c, 0.12, t, 0.07)); s.start(t);
  }
  // digitando: teclas em ritmo de gente, enquanto dura a espera (no máximo 5 s)
  var digi = null, digiFim = 0;
  function digitar() {
    if (digi) return; digiFim = Date.now() + 5000;
    (function tecla() { if (Date.now() > digiFim) { digi = null; return; } clique(0.035 + Math.random() * 0.02); digi = setTimeout(tecla, 70 + Math.random() * 140 + (Math.random() < 0.12 ? 260 : 0)); })();
  }
  function pararDigitar() { clearTimeout(digi); digi = null; }

  var Sons = {
    clique: clique, ding: ding, tum: tum, carimbo: carimbo, digitar: digitar, pararDigitar: pararDigitar,
    get ligado() { return ligado; },
    ligar: function () { ligado = true; try { localStorage.setItem('sons', '1'); } catch (e) {} ding(); },
    desligar: function () { ligado = false; pararDigitar(); try { localStorage.setItem('sons', '0'); } catch (e) {} },
    alternar: function () { ligado ? Sons.desligar() : Sons.ligar(); return ligado; },
  };
  window.Sons = Sons;

  // clique nos botões do app
  addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button, .btn, a.btn, [role="button"]');
    if (b && !b.disabled) clique();
  }, true);

  // mensagens do app: salvo/atualizado = ding; erro = tum
  addEventListener('DOMContentLoaded', function () {
    var orig = window.toast; if (typeof orig !== 'function') return;
    window.toast = function (msg) {
      var m = String(msg || '');
      if (/erro|não foi|nao foi|não deu|inválid|falt|tente de novo|precisa|sem conex/i.test(m)) tum(); else ding();
      return orig.apply(this, arguments);
    };
  });

  // escala sendo gerada: digita enquanto monta; carimbo + ding quando fica pronta
  var gerando = false, pedido = 0;
  new MutationObserver(function () { if (!pedido) pedido = requestAnimationFrame(confere); }).observe(document.documentElement, { subtree: true, childList: true });
  function confere() {
    pedido = 0;
    var agora = !!document.querySelector('.quiz-oi.montando');
    if (agora && !gerando) { gerando = true; digitar(); }
    else if (!agora && gerando) { gerando = false; pararDigitar(); carimbo(); setTimeout(ding, 220); }
  }
})();
