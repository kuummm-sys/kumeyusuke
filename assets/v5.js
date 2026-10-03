/* くめゆうすけ 公式サイト 第5版（パーマン）：共通の動き */
(() => {
  const root = document.documentElement;
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => mq.matches || root.classList.contains('motion-paused');
  const fine = matchMedia('(pointer: fine)').matches;

  /* ---------- HERO スライドショー ---------- */
  const hero = document.querySelector('.hero[data-media="v5"]');
  if (hero) {
    const slides = [...hero.querySelectorAll('.hero-slide')];
    const DUR = 6000;
    let idx = 0, timer = null;
    const pad = n => String(n).padStart(2, '0');
    const counter = document.createElement('div');
    counter.className = 'v5-counter';
    counter.setAttribute('aria-hidden', 'true');
    counter.innerHTML = `<b><span>01</span></b><span class="v5-bar"><i></i></span><span>${pad(slides.length)}</span>`;
    hero.appendChild(counter);
    const side = document.createElement('div');
    side.className = 'v5-side';
    side.setAttribute('aria-hidden', 'true');
    side.innerHTML = 'GUITARIST ／ COMPOSER ／ ARRANGER　<span class="r">●</span>　HOKKAIDO';
    hero.appendChild(side);
    const num = counter.querySelector('b'), bar = counter.querySelector('.v5-bar i');
    bar.style.setProperty('--dur', DUR + 'ms');

    const load = s => new Promise(res => {
      const img = s.querySelector('img'), src = s.querySelector('source');
      if (src && src.dataset.srcset && !src.srcset) src.srcset = src.dataset.srcset;
      if (img.dataset.src && !img.getAttribute('src')) img.src = img.dataset.src;
      if (img.complete && img.naturalWidth) return res();
      img.addEventListener('load', () => res(), { once: true });
      img.addEventListener('error', () => res(), { once: true });
    });
    // スライドごとに寄る方向を少し変える
    slides.forEach((s, i) => {
      s.style.setProperty('--kb-x', (i % 2 ? -1.5 : 1.5) + '%');
      s.style.setProperty('--kb-o', ['50% 40%', '40% 50%', '60% 45%'][i % 3]);
    });
    const runBar = () => { bar.classList.remove('run'); void bar.offsetWidth; if (!still()) bar.classList.add('run'); };
    const show = async next => {
      await load(slides[next]);
      const cur = slides[idx], nx = slides[next];
      nx.classList.add('is-entering');
      num.innerHTML = `<span>${pad(next + 1)}</span>`;
      runBar();
      setTimeout(() => {
        nx.classList.remove('is-entering');
        nx.classList.add('is-active');
        if (cur !== nx) cur.classList.remove('is-active');
      }, 1350);
      idx = next;
      load(slides[(next + 1) % slides.length]);
    };
    const tick = () => { if (!document.hidden && !still()) show((idx + 1) % slides.length); };
    const start = () => { clearInterval(timer); runBar(); timer = setInterval(tick, DUR); load(slides[1]); };
    if (slides.length > 1) {
      if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
      addEventListener('site-motion-change', runBar);
    }
  }

  /* ---------- 見出しを1文字ずつ ---------- */
  const heads = document.querySelectorAll('main .sh h1, main .sh h2, main .page-head h1, .release-head h4, .band-stage-panel .act-head h3, .hero[data-media="v5"] h1');
  heads.forEach(h => {
    if (h.closest('dialog') || h.dataset.v5) return;
    h.dataset.v5 = '1';
    const label = h.textContent.replace(/\s+/g, ' ').trim();
    const wrap = document.createElement('span');
    wrap.className = 'v5-split';
    wrap.setAttribute('aria-hidden', 'true');
    let i = 0;
    [...h.childNodes].forEach(node => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { wrap.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          [...part].forEach(ch => {
            const c = document.createElement('span'); c.className = 'c';
            const inner = document.createElement('span'); inner.textContent = ch; inner.style.setProperty('--i', i++);
            c.appendChild(inner); w.appendChild(c);
          });
          wrap.appendChild(w);
        });
        node.remove();
      } else if (node.nodeName === 'BR') {
        wrap.appendChild(document.createElement('br')); node.remove();
      } else if (node.nodeType === 1 && node.tagName !== 'svg' && !node.matches('svg')) {
        // 「す」だけ赤などの装飾は、文字ごと残す
        const c = document.createElement('span'); c.className = 'c';
        const inner = document.createElement('span'); inner.style.setProperty('--i', i++);
        inner.appendChild(node);
        c.appendChild(inner); wrap.appendChild(c);
      }
    });
    h.setAttribute('aria-label', label);
    h.prepend(wrap);
  });

  /* ---------- 弦 ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const strings = [];
  document.querySelectorAll('main .sh, main .page-head').forEach(sh => {
    if (sh.closest('dialog') || sh.querySelector('.v5-string')) return;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'v5-string'); svg.setAttribute('viewBox', '0 0 520 26');
    svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    const ghost = document.createElementNS(NS, 'path'); ghost.setAttribute('class', 'ghost');
    const line = document.createElementNS(NS, 'path');
    svg.append(ghost, line);
    const h = sh.querySelector('h1, h2');
    (h || sh).after(svg);
    const st = { svg, line, ghost, t0: -1, amp: 0, pos: .3, hist: [] };
    strings.push(st);
    const draw = (amp, phase) => {
      const pts = [];
      for (let k = 0; k <= 40; k++) {
        const u = k / 40;
        const shape = u < st.pos ? u / st.pos : (1 - u) / (1 - st.pos);
        const y = 13 + amp * shape * Math.cos(phase) + amp * .25 * Math.sin(Math.PI * 2 * u) * Math.sin(phase * 2.1);
        pts.push(`${(u * 520).toFixed(1)},${y.toFixed(2)}`);
      }
      return 'M' + pts.join(' L');
    };
    st.render = now => {
      if (st.t0 < 0) { st.line.setAttribute('d', draw(0, 0)); st.ghost.setAttribute('d', draw(0, 0)); return false; }
      const dt = (now - st.t0) / 1000;
      const a = st.amp * Math.exp(-dt * 3.2);
      st.line.setAttribute('d', draw(a, dt * 2 * Math.PI * 7));
      // ディレイ：少し遅れた揺れを薄い青で重ねる
      const dt2 = Math.max(0, dt - .18), a2 = st.amp * .6 * Math.exp(-dt2 * 3.2);
      st.ghost.setAttribute('d', draw(dt > .18 ? a2 : 0, dt2 * 2 * Math.PI * 7));
      return a > .05 || a2 > .05;
    };
    st.pluck = (x = .3, amp = 9) => {
      if (still()) return;
      st.pos = Math.min(.85, Math.max(.15, x)); st.amp = amp; st.t0 = performance.now(); loop();
    };
    st.render(0);
    svg.addEventListener('pointerenter', e => {
      const r = svg.getBoundingClientRect(); st.pluck((e.clientX - r.left) / r.width, 10);
    });
    svg.addEventListener('pointermove', e => {
      if (performance.now() - st.t0 < 350) return;
      const r = svg.getBoundingClientRect(); st.pluck((e.clientX - r.left) / r.width, 6);
    });
  });
  let raf = 0;
  function loop() {
    if (raf) return;
    const step = now => {
      let alive = false;
      strings.forEach(s => { if (s.render(now)) alive = true; });
      raf = alive ? requestAnimationFrame(step) : 0;
    };
    raf = requestAnimationFrame(step);
  }

  /* ---------- 画面に入ったら ---------- */
  const targets = [...document.querySelectorAll('.v5-split, .v5-portrait')];
  const strMap = new Map(strings.map(s => [s.svg, s]));
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('v5-in');
      const s = strMap.get(e.target);
      if (s && !plucked.has(s)) { plucked.add(s); setTimeout(() => s.pluck(.3, 9), 250); }
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  if (io && !mq.matches) { targets.forEach(t => io.observe(t)); strings.forEach(s => io.observe(s.svg)); }
  else targets.forEach(t => t.classList.add('v5-in'));
  // 監視が動かない環境でも、画面内に入ったものは必ず表示する
  const plucked = new WeakSet();
  let pend = false;
  const sweep = () => {
    pend = false;
    const lim = innerHeight * 0.95;
    targets.forEach(t => { if (!t.classList.contains('v5-in') && t.getBoundingClientRect().top < lim) t.classList.add('v5-in'); });
    strings.forEach(s => { if (!plucked.has(s) && s.svg.getBoundingClientRect().top < lim) { plucked.add(s); setTimeout(() => s.pluck(.3, 9), 250); } });
  };
  const schedule = () => { if (!pend) { pend = true; requestAnimationFrame(sweep); } };
  addEventListener('scroll', schedule, { passive: true });
  setTimeout(sweep, 120);
  const hh = document.querySelector('.hero[data-media="v5"] .v5-split');
  if (hh) setTimeout(() => hh.classList.add('v5-in'), 300);

  /* ---------- EXPLORE：写真がカーソルに付いてくる ---------- */
  // 見比べ用：?explore=string（弦）／?explore=type（文字）／指定なし＝写真
  const exMode = (new URLSearchParams(location.search).get('explore') || '').toLowerCase();
  const exLinks = [...document.querySelectorAll('#explore .type-link')];
  if (exLinks.length && (exMode === 'string' || exMode === 'type')) {
    document.documentElement.classList.add('ex-' + exMode);
    exLinks.forEach(a => {
      const t = a.querySelector('.card-title');
      const word = t.textContent.trim();
      t.setAttribute('aria-label', word);
      t.innerHTML = [...word].map((ch, i) => `<span class="xl" aria-hidden="true" style="--i:${i}">${ch}</span>`).join('');
      const chars = [...t.querySelectorAll('.xl')];
      if (exMode === 'string') {
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'ex-string'); svg.setAttribute('viewBox', '0 0 1000 40'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
        const path = document.createElementNS(NS, 'path'); svg.appendChild(path); a.appendChild(svg);
        let t0 = -1, px = .3, rafX = 0;
        const flat = 'M0,20 L1000,20';
        path.setAttribute('d', flat);
        const frame = now => {
          const dt = (now - t0) / 1000, A = Math.exp(-dt * 2.6);
          chars.forEach((c, i) => {
            const y = 14 * A * Math.sin(dt * 2 * Math.PI * 5 - i * .75);
            const r = 4 * A * Math.cos(dt * 2 * Math.PI * 5 - i * .75);
            c.style.transform = `translateY(${y.toFixed(2)}px) rotate(${r.toFixed(2)}deg)`;
          });
          const pts = [];
          for (let k = 0; k <= 50; k++) {
            const u = k / 50, sh = u < px ? u / px : (1 - u) / (1 - px);
            pts.push(`${u * 1000},${(20 + 16 * A * sh * Math.cos(dt * 2 * Math.PI * 9)).toFixed(2)}`);
          }
          path.setAttribute('d', 'M' + pts.join(' L'));
          rafX = A > .02 ? requestAnimationFrame(frame) : 0;
          if (!rafX) { chars.forEach(c => c.style.transform = ''); path.setAttribute('d', flat); }
        };
        a.addEventListener('pointerenter', e => {
          if (still()) return;
          const r = a.getBoundingClientRect(); px = Math.min(.85, Math.max(.15, (e.clientX - r.left) / r.width));
          t0 = performance.now(); if (!rafX) rafX = requestAnimationFrame(frame);
        });
      } else {
        const marquee = document.createElement('span');
        marquee.className = 'ex-marquee'; marquee.setAttribute('aria-hidden', 'true');
        marquee.innerHTML = `<span>${(word + '　').repeat(8)}</span><span>${(word + '　').repeat(8)}</span>`;
        a.prepend(marquee);
        const G = 'アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEFGHIJKLMNOPQRSTUVWXYZ#/+*';
        let timer = 0;
        a.addEventListener('pointerenter', () => {
          if (still()) return;
          clearInterval(timer); let f = 0;
          timer = setInterval(() => {
            f++;
            chars.forEach((c, i) => { c.textContent = f > 3 + i * 1.6 ? word[i] : G[Math.floor(Math.random() * G.length)]; });
            if (f > 4 + word.length * 1.6) { clearInterval(timer); chars.forEach((c, i) => c.textContent = word[i]); }
          }, 40);
        });
      }
    });
  }
  const links = exMode ? [] : document.querySelectorAll('#explore .type-link[data-preview]');
  if (links.length && fine) {
    const pv = document.createElement('div'); pv.className = 'v5-preview'; pv.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img'); img.alt = ''; pv.appendChild(img); document.body.appendChild(pv);
    let x = 0, y = 0, tx = 0, ty = 0, on = false, rafP = 0;
    const follow = () => {
      x += (tx - x) * .14; y += (ty - y) * .14;
      const rot = Math.max(-8, Math.min(8, (tx - x) * .05));
      pv.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) rotate(${rot - 3}deg) scale(${on ? 1 : .85})`;
      rafP = on || Math.abs(tx - x) > .5 ? requestAnimationFrame(follow) : 0;
    };
    links.forEach(a => {
      a.addEventListener('pointerenter', e => {
        if (still()) return;
        img.src = a.dataset.preview; on = true; pv.classList.add('on');
        if (!rafP) { x = tx = e.clientX + 160; y = ty = e.clientY; rafP = requestAnimationFrame(follow); }
      });
      a.addEventListener('pointermove', e => { tx = e.clientX + 160; ty = e.clientY; });
      a.addEventListener('pointerleave', () => { on = false; pv.classList.remove('on'); });
    });
  }


  /* ---------- CONTACT のリンクは、そのページでパネルを開く ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href$="#contact"]');
    const btn = document.querySelector('[data-open-panel="contact"]');
    if (!a || !btn) return;
    e.preventDefault(); e.stopImmediatePropagation();
    btn.click();
  }, true);

  /* ---------- ページ移動の幕 ---------- */
  const curtain = document.createElement('div'); curtain.className = 'v5-curtain'; curtain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(curtain);
  try {
    if (sessionStorage.getItem('v5-curtain') === '1' && !still()) curtain.classList.add('reveal');
    sessionStorage.removeItem('v5-curtain');
  } catch (e) {}
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname) || (url.pathname === location.pathname && url.hash) || still()) return;
    e.preventDefault();
    try { sessionStorage.setItem('v5-curtain', '1'); } catch (err) {}
    curtain.classList.remove('reveal'); curtain.classList.add('cover');
    setTimeout(() => { location.href = url.href; }, 430);
  });
  addEventListener('pageshow', e => { if (e.persisted) curtain.classList.remove('cover'); });
})();
