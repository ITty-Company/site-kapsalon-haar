/* Kapsalon Haar! — scroll film (video.currentTime scrub), D1 pan film, «goudglans» portal, «scheerlijn», gereedschapslade,
   stijlwijzer, panorama, «paal» page transition. No frameworks (Lenis only for inertia). */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = matchMedia('(max-width:760px)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var ease = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  var pad = function (n) { return ('0' + n).slice(-2); };
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var WA_CONFIRMED = false; // zodra Haar! WhatsApp bevestigt: true → label «nog te bevestigen» verdwijnt
  if (WA_CONFIRMED) $$('.wa-note').forEach(function (n) { n.remove(); });
  var root = document.documentElement;

  /* ---------- page transition «paal»: diagonal barber-pole stripes ---------- */
  var ORDER = ['index.html', 'diensten.html', 'afspraak.html', 'over-ons.html', 'contact.html'];
  var LBL = { 'index.html': 'home.', 'diensten.html': 'diensten.', 'afspraak.html': 'afspraak.', 'over-ons.html': 'over ons.', 'contact.html': 'contact.', '404.html': 'home.' };
  var paal = $('#paal');
  function fileOf(u) { var f = u.pathname.split('/').pop(); return f || 'index.html'; }
  if (paal) {
    var lblEl = $('.lbl', paal);
    if (window.__pl) lblEl.textContent = window.__pl;
    if (root.classList.contains('pl-closed')) {
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        root.classList.remove('pl-noanim'); root.classList.add('pl-exit'); root.classList.remove('pl-closed');
      }); });
    }
    addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('pl-closed', 'pl-noanim', 'pl-back'); });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || a.target || a.hasAttribute('download')) return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin || !/\.html$|\/$/.test(u.pathname)) return;
      var to = fileOf(u), from = fileOf(location);
      if (to === from && u.search === location.search) return;
      e.preventDefault();
      var back = ORDER.indexOf(to) < ORDER.indexOf(from);
      var lbl = LBL[to] || 'home.';
      lblEl.textContent = lbl;
      try { sessionStorage.setItem('paal', JSON.stringify({ l: lbl, b: back })); } catch (er) {}
      root.classList.add('pl-noanim'); root.classList.remove('pl-exit');
      root.classList.toggle('pl-back', back);
      requestAnimationFrame(function () {
        root.classList.remove('pl-noanim');
        requestAnimationFrame(function () { root.classList.add('pl-closed'); });
      });
      setTimeout(function () { location.href = u.href; }, reduce ? 220 : 760);
    });
  }

  /* ---------- header ---------- */
  var hd = $('.hd'), burger = $('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var o = document.body.classList.toggle('menu-open'); burger.setAttribute('aria-expanded', o);
    });
    $$('.nav a').forEach(function (a) { a.addEventListener('click', function () { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); } });
  }

  /* autoplay loops (afspraak / contact hero + finale): mobile poster, nothing with reduced motion */
  $$('video[data-auto]').forEach(function (v) {
    if (reduce) return;
    var go = function () {
      if (v.src) return;
      v.src = v.dataset.src; v.muted = true; v.loop = true;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    };
    var ob = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { go(); if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else if (v.src) v.pause();
      });
    }, { rootMargin: '200px' });
    ob.observe(v);
  });

  function loadBlob(url, onProgress) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      var total = +r.headers.get('content-length') || 0;
      if (!r.body || !total || !window.ReadableStream) return r.blob();
      var rd = r.body.getReader(), got = 0, parts = [];
      return (function pump() {
        return rd.read().then(function (x) {
          if (x.done) return new Blob(parts, { type: 'video/mp4' });
          parts.push(x.value); got += x.value.length; onProgress && onProgress(got / total);
          return pump();
        });
      })();
    }).then(function (b) { return URL.createObjectURL(b); });
  }

  /* ---------- scroll films (video scrub) + pan film (D1) ---------- */
  var scrubs = $$('.film,.pan').map(function (film) {
    if (reduce) { film.classList.add('still'); return null; }
    var isPan = film.classList.contains('pan');
    var CH = JSON.parse($('script[type="application/json"]', film).textContent);
    if (mobile) CH.forEach(function (c) { /* mobile film is re-framed per segment: use its own frame fractions */
      if (c.om) c.o = c.om; if (c.gm) c.g = c.gm; if (c.srcm) c.src = c.srcm; if (c.czm) c.cz = c.czm;
    });
    var N = CH.length, hero = $('.fhero,.phead', film);
    var rests = (hero ? [{ at: 0, ch: -1, c: .5, z: 1 }] : []).concat(CH.map(function (c, i) { return { at: c.at || 0, ch: i, c: c.c, z: mobile && c.zm ? c.zm : c.z }; }));
    var M = rests.length, HOLD = isPan ? .5 : .7;
    var stage = $('.stage', film), V = $('video', film), IMG = $('img.flat', film), cv = $('canvas.fx', film), ctx = cv.getContext('2d');
    var T = $('.ftitle', film), H2 = $('h2', T), S = $('p', T), cards = $$('.fcard', film);
    var hudT = $('.hud .hl', film), tcEl = $('.hud .tc', film), load = $('.hud .load s', film);
    var pole = $('.pole', film), poleI = pole && $('i', pole), hint = $('.fhint', film), fade = $('.fade', film), tag = $('.ftag', film), hud = $('.hud', film);
    var big = $('.bigword', film), bigS = big && $('span', big), scheer = $('.scheer', film);
    var wipe = film.dataset.wipe ? film.dataset.wipe.split(',').map(Number) : null;
    var VW = mobile ? 480 : 1280, VH = mobile ? 768 : 720, IW = 1344, IH = 752;
    var label = film.dataset.hud || '', total = +film.dataset.total || N, portalNext = film.hasAttribute('data-portal');
    var cur = -2, vt = 0, want = 0, pS = 0, words = [], ready = false, dur = +film.dataset.dur || 0;
    var FX = { mode: 'dust', k: 1, parts: [], t0: performance.now(), ch: 0 };

    if (V) {
      var src = mobile ? film.dataset.srcM : film.dataset.src;
      if (mobile && film.dataset.posterM) V.poster = film.dataset.posterM;
      V.muted = true;
      V.addEventListener('loadedmetadata', function () { V.pause(); ready = true; VW = V.videoWidth || VW; VH = V.videoHeight || VH; dur = V.duration || dur; V.currentTime = vt = want; });
    }
    var started = false;
    function start() {
      if (started || !V) return; started = true;
      loadBlob(src, function (k) { if (load) load.style.width = (k * 100) + '%'; })
        .then(function (u) { V.src = u; if (load) load.parentNode.style.opacity = 0; })
        .catch(function () { V.src = src; });
    }
    if (V && film.getBoundingClientRect().top < innerHeight * 2.5) start();

    cards.concat(hero ? $$('.low', hero) : []).forEach(function (cd) {
      var m = $('.more', cd);
      if (m) m.addEventListener('click', function () { var x = cd.classList.toggle('x'); m.textContent = x ? 'minder −' : 'lees verder +'; m.setAttribute('aria-expanded', x); });
    });

    function setTitle(i) {
      if (i < 0) { H2.innerHTML = ''; S.textContent = ''; words = []; }
      else {
        H2.innerHTML = CH[i].t.split(' ').map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
        H2.setAttribute('aria-label', CH[i].t.replace(/<[^>]+>/g, ''));
        S.textContent = CH[i].s || '';
        words = $$('.w', H2);
        T.classList.remove('tl', 'tr', 'tc'); T.classList.add(CH[i].pos || 'tl');
      }
      var j = Math.max(i, 0);
      if (hudT) hudT.textContent = label + ' · ' + pad(j + 1) + ' / ' + pad(total);
      if (bigS && CH[j].w && bigS.textContent !== CH[j].w) {
        bigS.classList.add('off');
        clearTimeout(setTitle.t);
        setTitle.t = setTimeout(function () { bigS.textContent = CH[j].w; bigS.classList.remove('off'); }, 320);
      }
    }
    var seg = function (f) { return ease((f - .18) / .64); };
    function size() { cv.width = stage.clientWidth * dpr; cv.height = stage.clientHeight * dpr; }
    size(); addEventListener('resize', size);

    /* camera (video): scale about (ox, oy); always ends at S=1.03 so the portal can continue from the exact frame */
    var cam = { S: 1, ox: 0, oy: 0, ty: 0 };
    function cover() {
      var W = stage.clientWidth, Hh = stage.clientHeight, s0 = Math.max(W / VW, Hh / VH);
      var dw = VW * s0, dh = VH * s0;
      return { W: W, H: Hh, dw: dw, dh: dh, ox: (W - dw) / 2, oy: (Hh - dh) / 2 };
    }
    /* frame fraction (desktop 16:9 coordinates) → screen px */
    function toScreen(fx, fy, cx) {
      if (isPan) return { x: fx, y: fy };
      var c = cover();
      var X = c.ox + fx * c.dw, Y = c.oy + fy * c.dh;
      return { x: cam.ox + (X - cam.ox) * cam.S, y: cam.oy + (Y - cam.oy) * cam.S + cam.ty };
    }
    function camera() {
      var c = cover();
      cam.S = 1.03 + .05 * Math.sin(Math.PI * pS); cam.ox = c.W / 2; cam.oy = c.H * (mobile ? .5 : .45); cam.ty = 0;
      V.style.transformOrigin = cam.ox.toFixed(1) + 'px ' + cam.oy.toFixed(1) + 'px';
      V.style.transform = 'scale(' + cam.S.toFixed(4) + ')';
    }
    /* pan camera over the flat-lay */
    var panS = { s: 1, tx: 0, ty: 0 };
    function panCam(i, e) {
      var W = stage.clientWidth, Hh = stage.clientHeight, s0 = Math.max(W / IW, Hh / IH);
      var a = rests[i], b = rests[Math.min(i + 1, M - 1)];
      var c = a.c + (b.c - a.c) * e, z = (a.z + (b.z - a.z) * e) * (1 - .07 * Math.sin(Math.PI * e));
      var s = s0 * z, DW = IW * s, DH = IH * s;
      var tx = clamp(W / 2 - c * DW, W - DW, 0), ty = clamp(Hh * (mobile ? .48 : .44) - .51 * DH, Hh - DH, 0);
      panS = { s: s, tx: tx, ty: ty, W: W, H: Hh, DW: DW, DH: DH };
      IMG.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0) scale(' + s.toFixed(4) + ')';
    }

    function render() {
      var r = film.getBoundingClientRect(), tot = film.offsetHeight - innerHeight;
      if (r.bottom < -200 || r.top > innerHeight + 200) { if (r.top < innerHeight * 2.5) start(); return false; }
      start();
      var raw = clamp(-r.top / tot, 0, 1);
      pS += (raw - pS) * .2; if (Math.abs(raw - pS) < .0002) pS = raw;
      var u = Math.min(pS * (M - 1 + HOLD), M - 1), i = Math.min(Math.floor(u), M - 2), f = u - i;
      var e = seg(f);
      want = rests[i].at + (rests[i + 1].at - rests[i].at) * e;
      var near = f < .5 ? f : f - 1, nr = f < .5 ? i : i + 1, ch = rests[nr].ch;
      var vis = 1 - ease((Math.abs(near) - .2) / .2);
      if (ch !== cur) { cur = ch; setTitle(ch); }
      var heroO = hero ? 1 - ease(u / .42) : 0;
      if (V) camera(); else panCam(i, e);
      if (hero) {
        hero.style.opacity = heroO; hero.style.translate = '0 ' + (-(1 - heroO) * 50) + 'px';
        hero.style.pointerEvents = heroO > .4 ? 'auto' : 'none'; hero.style.visibility = heroO < .01 ? 'hidden' : 'visible';
      }
      var endF = portalNext ? 1 - ease((pS - .94) / .055) : 1;
      var tv = (ch < 0 ? 0 : vis) * endF;
      [hud, pole, tag].forEach(function (el) { if (el) el.style.opacity = endF; });
      var nW = words.length;
      words.forEach(function (sp, k) {
        var d = clamp((tv - k / Math.max(1, nW - 1) * .3) / .62, 0, 1);
        sp.style.opacity = d; sp.style.transform = 'translateY(' + ((1 - d) * .4).toFixed(3) + 'em)'; sp.style.filter = d > .99 ? 'none' : 'blur(' + ((1 - d) * 10).toFixed(1) + 'px)';
      });
      S.style.opacity = tv; T.style.setProperty('--sh', tv);
      cards.forEach(function (el, k) {
        var o = k === ch ? ease((tv - .25) / .5) : 0;
        el.style.opacity = o; el.style.transform = 'translateY(' + ((1 - o) * 24) + 'px)'; el.classList.toggle('on', o > .6);
      });
      if (poleI) { if (mobile) poleI.style.width = (pS * 100) + '%'; else poleI.style.height = (pS * 100) + '%'; }
      if (pole) pole.style.backgroundPosition = '0 ' + (pS * (mobile ? 600 : 900)).toFixed(1) + 'px';
      if (tcEl && dur) tcEl.textContent = '00:' + pad(Math.round(vt)) + ' / 00:' + pad(Math.round(dur));
      if (hint) hint.style.opacity = pS < .015 ? 1 : 0;
      if (fade) fade.style.opacity = ease((pS - .9) / .1);
      /* scheerlijn: gold blade line rides the diagonal wipe */
      if (scheer && wipe) {
        var vtx = V ? vt : want, k2 = (vtx - wipe[0]) / (wipe[1] - wipe[0]);
        if (k2 > -.05 && k2 < 1.05) {
          var W = stage.clientWidth, Hh = stage.clientHeight, kk = ease(k2);
          var ang = -Math.atan2(Hh, W) * 180 / Math.PI;
          scheer.style.opacity = Math.sin(Math.PI * clamp(k2, 0, 1)) * 1.2;
          scheer.style.transform = 'translate3d(' + (kk * W).toFixed(1) + 'px,' + (kk * Hh).toFixed(1) + 'px,0) rotate(' + ang.toFixed(2) + 'deg)';
        } else scheer.style.opacity = 0;
      }
      var cc = CH[Math.max(ch, 0)];
      if (big && !mobile && cc.o) {
        var p0 = toScreen(cc.o[0], cc.o[2], cc.cx), p1 = toScreen(cc.o[1], cc.o[3], cc.cx), bw = cc.b || [.5, .5], pb = toScreen(bw[0], bw[1], cc.cx);
        big.style.setProperty('--hx', p0.x + 'px'); big.style.setProperty('--hy', p0.y + 'px');
        big.style.setProperty('--hw', (p1.x - p0.x) + 'px'); big.style.setProperty('--hh', (p1.y - p0.y) + 'px');
        big.style.setProperty('--bx', pb.x + 'px'); big.style.setProperty('--by', pb.y + 'px');
        big.style.opacity = (1 - heroO) * (.4 + .6 * vis) * endF;
      }
      FX.mode = cc.fx || 'dust'; FX.ch = Math.max(ch, 0); FX.k = .25 + .75 * (ch < 0 ? .6 : vis); FX.vis = vis;
      return true;
    }

    /* ---------- particles per chapter ---------- */
    function P(fx, fy) { var c = CH[FX.ch]; var p = toScreen(fx, fy, c.cx); return { x: p.x * dpr, y: p.y * dpr }; }
    function spawn() {
      var W = cv.width, Hh = cv.height, R = Math.random, m = FX.mode, c = CH[FX.ch], q;
      if (m === 'hair' && R() < .55) {
        return { x: W * (.05 + R() * .7), y: -20 * dpr, vx: .15 + R() * .35, vy: .5 + R() * .9, len: (5 + R() * 9) * dpr, rot: R() * 6.28, vr: (R() - .5) * .08, hair: 1, life: 1, dec: 0, floor: Hh * (mobile ? (c.floorm || .82) : .8) + R() * Hh * .05 };
      }
      if (m === 'steam' && c.src && R() < .5) {
        q = P(c.src[0] + (R() - .5) * .04, c.src[1]);
        return { x: q.x, y: q.y, vx: (R() - .3) * .25, vy: -(.35 + R() * .5), r: (14 + R() * 26) * dpr, grow: .25 * dpr, steam: 1, life: 0, up: 1, ph: R() * 6.28, a: .16 };
      }
      if (m === 'foam' && c.o && R() < .45) {
        q = P(c.o[0] + (c.o[1] - c.o[0]) * (.2 + R() * .6), c.o[2] + (c.o[3] - c.o[2]) * (.05 + R() * .3));
        return { x: q.x, y: q.y, vx: 0, vy: -.05, r: (1 + R() * 2.4) * dpr, ring: 1, c: '255,255,255', a: .9, life: 1, dec: .012 };
      }
      if (m === 'caustic' && c.cz && !mobile && R() < .2) {
        q = P(c.cz[0] + R() * (c.cz[1] - c.cz[0]), c.cz[2] + R() * (c.cz[3] - c.cz[2]));
        return { x: q.x, y: q.y, vx: (R() - .5) * .3, vy: (R() - .5) * .15, r: (6 + R() * 16) * dpr, cau: 1, life: 0, up: 1, ph: R() * 6.28 };
      }
      var warm = m === 'caustic' || c.warm;
      return { x: R() * W, y: R() * Hh * .85, vx: (R() - .3) * .22, vy: (R() - .5) * .18, r: (.7 + R() * 1.9) * dpr, c: warm ? (R() < .3 ? '235,180,90' : '255,226,160') : (R() < .1 ? '226,190,110' : (c.cool ? '236,244,255' : '255,252,240')), a: .85, life: 0, up: 1, soft: 1 };
    }
    function glint(seg, period, t) {
      var ph = ((t / 1000) % period) / period; if (ph > .22) return;
      var k = ph / .22, a = P(seg[0], seg[1]), b = P(seg[2], seg[3]);
      var x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k, s = (10 + 16 * Math.sin(Math.PI * k)) * dpr, al = Math.sin(Math.PI * k) * FX.vis;
      var g = ctx.createRadialGradient(x, y, 0, x, y, s * 2.2);
      g.addColorStop(0, 'rgba(255,250,230,' + .9 * al + ')'); g.addColorStop(1, 'rgba(255,230,170,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s * 2.2, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + al + ')'; ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath(); ctx.moveTo(x - s * 1.6, y); ctx.lineTo(x + s * 1.6, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
    }
    function tick() {
      var t = performance.now() - FX.t0;
      ctx.clearRect(0, 0, cv.width, cv.height);
      var m = FX.mode, nn = m === 'hair' ? 2 : m === 'steam' ? 2 : 1;
      for (var k = 0; k < nn; k++) if (Math.random() < FX.k * (m === 'dust' ? .7 : 1)) FX.parts.push(spawn());
      FX.parts = FX.parts.filter(function (q) {
        q.x += q.vx; q.y += q.vy;
        if (q.up) { q.life += q.steam ? .012 : .008; if (q.life >= 1) q.up = 0; }
        else q.life -= q.steam ? .005 : q.dec || .004;
        if (q.life <= 0 && !q.up || q.y > cv.height + 30 || q.y < -80 * dpr) return false;
        var al = clamp(q.life, 0, 1);
        if (q.hair) {
          if (q.y >= q.floor) { q.y = q.floor; q.vy = 0; q.vx = 0; q.vr = 0; q.dec = .006; q.landed = 1; }
          if (q.landed) q.life -= q.dec;
          q.rot += q.vr;
          ctx.strokeStyle = 'rgba(48,26,20,' + (.75 * al) + ')'; ctx.lineWidth = 1.1 * dpr; ctx.lineCap = 'round';
          var dx = Math.cos(q.rot) * q.len / 2, dy = Math.sin(q.rot) * q.len / 2;
          ctx.beginPath(); ctx.moveTo(q.x - dx, q.y - dy); ctx.quadraticCurveTo(q.x + dy * .3, q.y - dx * .3, q.x + dx, q.y + dy); ctx.stroke();
          return true;
        }
        if (q.steam) {
          q.r += q.grow; q.x += Math.sin(t / 900 + q.ph) * .35;
          var g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
          g.addColorStop(0, 'rgba(255,250,240,' + (q.a * al) + ')'); g.addColorStop(1, 'rgba(255,245,225,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.fill();
          return true;
        }
        if (q.cau) {
          var s = .5 + .5 * Math.sin(t / 260 + q.ph);
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = 'rgba(255,200,110,' + (.22 * al * s) + ')';
          ctx.beginPath(); ctx.ellipse(q.x, q.y, q.r * (1 + s * .4), q.r * .45, Math.sin(t / 900 + q.ph) * .6, 0, 6.283); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          return true;
        }
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283);
        if (q.ring) { ctx.strokeStyle = 'rgba(' + q.c + ',' + (al * q.a) + ')'; ctx.lineWidth = dpr; ctx.stroke(); }
        else { ctx.fillStyle = 'rgba(' + q.c + ',' + (al * q.a) + ')'; ctx.fill(); }
        return true;
      });
      if (FX.parts.length > 420) FX.parts.splice(0, FX.parts.length - 420);
      var c = CH[FX.ch];
      if (c.g && (m === 'glint' || m === 'blade')) glint(c.g, m === 'blade' ? 3.6 : 6, t);
    }
    function seek() {
      if (!V || !ready || !V.duration) { vt = want; return; }
      var tgt = Math.min(want, V.duration - .05);
      if (Math.abs(vt - tgt) > .002) { vt += (tgt - vt) * .3; if (Math.abs(vt - tgt) < .01) vt = tgt; if (!V.seeking) V.currentTime = vt; }
    }
    setTitle(hero ? -1 : 0);
    if (!V) panCam(0, 0);
    return { render: render, tick: tick, seek: seek };
  }).filter(Boolean);

  /* ---------- portal «goudglans»: the amber glint swells into gold light, K8 opens from the centre ---------- */
  var portals = $$('.portal').map(function (sec) {
    if (reduce) { sec.classList.add('still'); return null; }
    var stage = $('.pstage', sec), cv = $('canvas.gl', sec), txt = $('.ptext', sec), tag = $('.ptag', sec), dark = $('.pdark', sec), phud = $('.phud', sec);
    var A = mobile ? sec.dataset.aM : sec.dataset.a, B = mobile ? sec.dataset.bM : sec.dataset.b;
    var G = JSON.parse(mobile ? sec.dataset.gM : sec.dataset.g);
    var fbA = $('.pfb.a', sec), fbB = $('.pfb.b', sec);
    var gl = null, prog, U = {}, sizes = [[1, 1], [1, 1]], mx = 0, my = 0, smx = 0, smy = 0, t0 = performance.now();
    var more = $('.more', txt);
    if (more) more.addEventListener('click', function () { var x = txt.classList.toggle('x'); more.textContent = x ? 'minder −' : 'lees verder +'; more.setAttribute('aria-expanded', x); });
    try { gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false }); } catch (e) { gl = null; }
    if (fbA) fbA.src = A; if (fbB) fbB.src = B;
    if (gl) {
      var vs = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
      var fs = [
        'precision highp float;varying vec2 uv;uniform sampler2D A,B;uniform vec2 R,SA,SB,MO,G,O;uniform float P,T,KB,Z;',
        'vec2 cov(vec2 u,vec2 s,float z,vec2 o){float ra=R.x/R.y,ia=s.x/s.y;vec2 sc=ra>ia?vec2(1.,ia/ra):vec2(ra/ia,1.);vec2 q=o+(u-o)/z;return (q-.5)*sc+.5;}',
        'void main(){float asp=R.x/R.y;',
        'vec3 a=texture2D(A,cov(uv,SA,Z*(1.+.05*P),O)).rgb;',
        'vec2 g=vec2(G.x,1.-G.y);vec2 d=(uv-g)*vec2(asp,1.);float dist=length(d);float an=atan(d.y,d.x);',
        'float k=smoothstep(0.,.6,P);',
        'float rays=pow(abs(sin(an*6.+T*.22)),16.)*.7+pow(abs(sin(an*11.-T*.35)),34.)*.5;',
        'float glow=exp(-dist*dist/(.0015+k*k*.55));float halo=exp(-dist*dist/(.02+k*k*1.6));',
        'vec3 GOLD=vec3(.761,.337,.165),FOAM=vec3(.945,.949,.937),HOT=vec3(1.,.86,.72);',
        'vec3 col=a+HOT*glow*(.18+.4*k)+GOLD*halo*k*.22+HOT*rays*halo*k*.22;',
        'float fill=smoothstep(.3,.6,P);',
        'col=mix(col,col*.9+HOT*.1,fill*.5);',
        'vec2 dc=(uv-g)*vec2(asp,1.);float dd=length(dc)+.012*sin(atan(dc.y,dc.x)*9.+T*1.2)+.008*sin(atan(dc.y,dc.x)*15.-T);',
        'float Rr=mix(-.05,length(vec2(asp,1.))*1.05+.1,smoothstep(.3,.95,P));float mb=smoothstep(Rr,Rr-.04,dd);',
        'vec3 b=texture2D(B,cov(uv,SB,KB,vec2(.5))+MO*.008).rgb;',
        'float rim=smoothstep(Rr-.1,Rr-.01,dd)*mb*(1.-smoothstep(.95,1.,P));',
        'col=mix(col,b,mb);col=mix(col,GOLD*.9+HOT*.25,rim*.55);gl_FragColor=vec4(clamp(col,0.,1.),1.);}'
      ].join('\n');
      var sh = function (t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      try {
        prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog); gl.useProgram(prog);
        var bf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        var lp = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
        ['A', 'B', 'R', 'SA', 'SB', 'MO', 'G', 'O', 'P', 'T', 'KB', 'Z'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
        [A, B].forEach(function (url, i) {
          var tx = gl.createTexture();
          gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tx);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([232, 210, 170, 255]));
          ['TEXTURE_WRAP_S', 'TEXTURE_WRAP_T'].forEach(function (w) { gl.texParameteri(gl.TEXTURE_2D, gl[w], gl.CLAMP_TO_EDGE); });
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          var im = new Image(); im.onload = function () {
            gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tx); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); sizes[i] = [im.naturalWidth, im.naturalHeight];
          }; im.src = url;
        });
        gl.uniform1i(U.A, 0); gl.uniform1i(U.B, 1);
        sec.classList.add('gl');
      } catch (e) { gl = null; }
    }
    function size() { var k = Math.min(dpr, 1.5); cv.width = stage.clientWidth * k; cv.height = stage.clientHeight * k; if (gl) gl.viewport(0, 0, cv.width, cv.height); }
    size(); addEventListener('resize', size);
    if (fine) addEventListener('mousemove', function (e) { mx = e.clientX / innerWidth * 2 - 1; my = -(e.clientY / innerHeight * 2 - 1); });
    var sm = 0;
    return function () {
      var r = sec.getBoundingClientRect(), tot = sec.offsetHeight - innerHeight;
      sec.classList.toggle('live', r.top <= 1);
      if (r.bottom < 0 || r.top > 1) return;
      var raw = clamp(-r.top / tot, 0, 1); sm += (raw - sm) * .2;
      var Pp = clamp(sm / .34, 0, 1), q = sm;
      var kb = 1 + .06 * ease((q - .34) / .66);
      smx += (mx - smx) * .05; smy += (my - smy) * .05;
      if (gl) {
        gl.uniform2f(U.R, cv.width, cv.height); gl.uniform2f(U.SA, sizes[0][0], sizes[0][1]); gl.uniform2f(U.SB, sizes[1][0], sizes[1][1]);
        gl.uniform2f(U.MO, smx, smy); gl.uniform2f(U.G, G[0], G[1]); gl.uniform2f(U.O, .5, mobile ? .5 : .55);
        gl.uniform1f(U.P, Pp); gl.uniform1f(U.T, (performance.now() - t0) / 1000); gl.uniform1f(U.KB, kb); gl.uniform1f(U.Z, 1.03);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      } else if (fbB) {
        fbB.style.setProperty('--r', (ease((Pp - .3) / .7) * 75) + '%');
        fbB.style.transform = 'scale(' + kb + ')';
      }
      stage.style.setProperty('--dust', ease((Pp - .6) / .3));
      var o = ease((q - .3) / .1) * (1 - ease((q - .95) / .045));
      txt.style.opacity = o; txt.style.translate = '0 ' + ((1 - o) * 40) + 'px'; txt.style.pointerEvents = o > .5 ? 'auto' : 'none';
      if (tag) tag.style.opacity = ease((Pp - .9) / .1) * (1 - ease((q - .84) / .06));
      if (phud) phud.style.opacity = ease((Pp - .9) / .1) * (1 - ease((q - .84) / .06));
      if (dark) dark.style.opacity = ease((q - .93) / .07);
    };
  }).filter(Boolean);

  /* ---------- reveals ---------- */
  $$('.words').forEach(function (el) {
    var i = 0;
    el.innerHTML = el.innerHTML.trim().split(/\s+/).map(function (w) { return '<span class="wd" style="--i:' + (i++) + '">' + w + '</span>'; }).join(' ');
  });
  $$('.fill p').forEach(function (p) {
    p.innerHTML = p.textContent.trim().split(/\s+/).map(function (w) { return '<span class="wd">' + w + '</span>'; }).join(' ');
  });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12 });
  $$('.rv,.words').forEach(function (el) { io.observe(el); });

  if (fine) $$('.glow-follow').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- gereedschapslade (hotspots on K2) ---------- */
  $$('.lade').forEach(function (l) {
    var card = $('.tagcard', l), b = $('b', card), p = $('p', card), a = $('a', card), hots = $$('.hot', l);
    function pick(h) {
      hots.forEach(function (x) { x.setAttribute('aria-pressed', x === h); });
      card.classList.add('sw');
      setTimeout(function () { b.textContent = h.dataset.n; p.textContent = h.dataset.t; a.href = h.dataset.h; a.textContent = h.dataset.l; card.classList.remove('sw'); }, 200);
    }
    hots.forEach(function (h) { h.addEventListener('click', function () { pick(h); }); if (fine) h.addEventListener('mouseenter', function () { pick(h); }); });
  });

  /* ---------- stijlwijzer ---------- */
  $$('.wijzer').forEach(function (w) {
    var out = $('.wout', w), img = $('.crop img', out), nm = $('.body b', out), tx = $('.body p', out), link = $('.body a', out), sm = $('.body small', out);
    $$('.schip', w).forEach(function (c) {
      c.addEventListener('click', function () {
        $$('.schip', w).forEach(function (x) { x.setAttribute('aria-pressed', x === c); });
        out.classList.add('sw'); img.style.setProperty('--c', c.dataset.c);
        setTimeout(function () { nm.textContent = c.dataset.n; tx.textContent = c.dataset.t; link.href = 'afspraak.html?dienst=' + c.dataset.id; if (sm && c.dataset.tag) sm.textContent = c.dataset.tag; out.classList.remove('sw'); }, 240);
      });
    });
  });

  /* ---------- panorama: pinned, vertical scroll → horizontal track ---------- */
  var panos = $$('.pano').map(function (sec) {
    if (reduce) { sec.classList.add('still'); return null; }
    var track = $('.track', sec), bar = $('.pbar i', sec), over = 0;
    function size() { over = Math.max(0, track.scrollWidth - innerWidth); sec.style.setProperty('--pw', (over + innerHeight * 1.25) + 'px'); }
    size(); addEventListener('resize', size); addEventListener('load', size);
    var k = 0;
    return function () {
      var r = sec.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var raw = clamp((-r.top - innerHeight * .1) / (sec.offsetHeight - innerHeight * 1.2), 0, 1);
      k += (raw - k) * .18;
      track.style.transform = 'translate3d(' + (-k * over).toFixed(1) + 'px,0,0)';
      if (bar) bar.style.width = (k * 100) + '%';
    };
  }).filter(Boolean);

  /* ---------- ambient canvases: dust in light (warm/cool/gold), foam glints ---------- */
  var ambient = $$('canvas.dust,canvas.glints').map(function (cv) {
    var ctx = cv.getContext('2d'), parts = [], kind = cv.dataset.k || 'warm', gl = cv.classList.contains('glints');
    function size() { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; }
    size(); addEventListener('resize', size);
    var host = cv.closest('.pstage');
    return function () {
      var r = cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || !cv.width) return;
      var lvl = host ? +(getComputedStyle(host).getPropertyValue('--dust') || 0) : 1;
      var W = cv.width, H = cv.height, R = Math.random;
      if (R() < (gl ? .25 : .55) * Math.max(lvl, .05)) parts.push(gl
        ? { x: W * (.2 + R() * .6), y: H * (.35 + R() * .3), vx: 0, vy: 0, r: (2 + R() * 5) * dpr, life: 1, dec: .018, star: 1 }
        : { x: W * (.1 + R() * .9), y: R() * H, vx: -(.03 + R() * .18), vy: (R() - .6) * .22, r: (.7 + R() * 2.1) * dpr, life: 0, up: 1, gold: R() < (kind === 'gold' ? .6 : .25) });
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = host ? lvl : 1;
      parts = parts.filter(function (q) {
        q.x += q.vx; q.y += q.vy;
        if (q.up) { q.life += .006; if (q.life >= 1) q.up = 0; } else q.life -= q.dec || .004;
        if (q.life <= 0 && !q.up) return false;
        if (q.star) {
          var s = q.r * Math.sin(q.life * Math.PI);
          ctx.strokeStyle = 'rgba(255,255,255,' + q.life + ')'; ctx.lineWidth = dpr;
          ctx.beginPath(); ctx.moveTo(q.x - s, q.y); ctx.lineTo(q.x + s, q.y); ctx.moveTo(q.x, q.y - s); ctx.lineTo(q.x, q.y + s); ctx.stroke();
          return true;
        }
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283);
        var base = kind === 'cool' ? '240,246,255' : kind === 'gold' ? '232,200,130' : '255,236,190';
        ctx.fillStyle = 'rgba(' + (q.gold ? '226,178,90' : base) + ',' + (.85 * q.life) + ')'; ctx.fill();
        return true;
      });
      ctx.globalAlpha = 1;
      if (parts.length > 240) parts.splice(0, parts.length - 240);
    };
  });

  /* ---------- steps line (J4) draws with scroll ---------- */
  var paths = $$('.path').map(function (el) {
    var pth = $('path.draw', el), dot = $('circle.dot', el), steps = $$('.steps li', el), L = pth.getTotalLength();
    pth.style.strokeDasharray = L; pth.style.strokeDashoffset = L;
    return function () {
      var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var k = reduce ? 1 : clamp((innerHeight * .85 - r.top) / (innerHeight * .55), 0, 1);
      pth.style.strokeDashoffset = L * (1 - k);
      var pt = pth.getPointAtLength(L * k); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
      steps.forEach(function (s, i) { s.classList.toggle('on', k >= i / (steps.length - 1) - .02); });
      el.style.setProperty('--k', k.toFixed(3));
    };
  });

  /* ---------- scroll-linked extras ---------- */
  var par = $$('[data-par]'), marq = $$('.marq div'), fills = $$('.fill'), kb = $$('[data-kb]');
  var lmx = 0, lmy = 0;
  if (fine) addEventListener('mousemove', function (e) { lmx = e.clientX / innerWidth - .5; lmy = e.clientY / innerHeight - .5; });
  function extras() {
    var vh = innerHeight;
    if (hd) hd.classList.toggle('solid', scrollY > 40);
    if (reduce) return;
    par.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var k = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = 'translate3d(0,' + (k * -(+el.dataset.par || 50)) + 'px,0) scale(1.12)';
    });
    kb.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var k = clamp(1 - r.bottom / (vh + r.height), 0, 1);
      el.style.transform = 'translate3d(' + (lmx * -16) + 'px,' + (lmy * -10 + (k - .5) * -36) + 'px,0) scale(' + (1.04 + k * .05) + ')';
    });
    marq.forEach(function (el, i) { el.style.transform = 'translate3d(' + (-(scrollY * .25) % (el.scrollWidth / 2)) * (i % 2 ? -1 : 1) + 'px,0,0)'; });
    fills.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var sp = $$('.wd', el), k = clamp((vh * .92 - r.top) / (r.height * .8 + vh * .1), 0, 1) * sp.length;
      sp.forEach(function (s, i) { s.classList.toggle('lit', i < k); });
    });
  }
  if (reduce) $$('.fill .wd').forEach(function (s) { s.classList.add('lit'); });

  /* ---------- loop ---------- */
  var lenis = (window.Lenis && !reduce) ? new Lenis({ lerp: .1 }) : null;
  window.__lenis = lenis;
  (function raf(t) {
    if (lenis) lenis.raf(t);
    scrubs.forEach(function (f) { if (f.render()) { f.seek(); f.tick(); } });
    portals.forEach(function (p) { p(); });
    panos.forEach(function (p) { p(); });
    if (!reduce) ambient.forEach(function (a) { a(); });
    paths.forEach(function (p) { p(); });
    extras();
    requestAnimationFrame(raf);
  })(0);
})();
