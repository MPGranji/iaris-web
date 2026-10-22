import { useEffect, useRef } from 'react';

/**
 * Animated "network shield" behind the hero:
 *  - a jittered grid of nodes joined to their neighbours,
 *  - ~25% of nodes are padlocks with a pulsing ring (signal colour),
 *  - glowing packets (brand / copper) travel along the links.
 * Colours are read from the CSS tokens, so the canvas follows light/dark theme.
 */

// The original page started two rAF chains, so packets moved two steps per frame.
const STEPS_PER_FRAME = 2;

interface Node {
  x: number;
  y: number;
  lock: boolean;
  ph: number;
}
type Link = [number, number, number];
interface Packet {
  l: Link;
  t: number;
  v: number;
  c: 'b' | 'c';
}

export function NetworkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;
    let nodes: Node[] = [];
    let links: Link[] = [];
    let packets: Packet[] = [];
    let raf = 0;
    let C = { b: '', c: '', s: '', l: '' };

    const col = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const readColors = () => {
      C = { b: col('--brand'), c: col('--copper'), s: col('--signal'), l: col('--line2') };
    };

    const newPacket = (): Packet => {
      const l = links[Math.floor(Math.random() * links.length)];
      return { l, t: Math.random(), v: 0.004 + Math.random() * 0.008, c: Math.random() < 0.25 ? 'c' : 'b' };
    };

    const build = () => {
      const r = cv.getBoundingClientRect();
      W = r.width;
      H = r.height;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = [];
      links = [];
      packets = [];
      const cols = Math.max(6, Math.round(W / 110));
      const rows = Math.max(5, Math.round(H / 95));
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          // deterministic pseudo-random jitter (same layout on every load)
          const jx = (Math.sin(x * 12.9 + y * 78.2) * 43758.5) % 1;
          const jy = (Math.sin(x * 39.3 + y * 11.1) * 24634.6) % 1;
          nodes.push({
            x: ((x + 0.5 + jx * 0.5) * W) / cols,
            y: ((y + 0.5 + jy * 0.5) * H) / rows,
            lock: Math.abs(jx) > 0.82,
            ph: Math.abs(jy) * 6,
          });
        }
      const maxD = Math.max(W / cols, H / rows) * 1.35;
      nodes.forEach((a, i) =>
        nodes.forEach((b, j) => {
          if (j > i) {
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < maxD) links.push([i, j, d]);
          }
        }),
      );
      for (let k = 0; k < Math.min(40, links.length / 3); k++) packets.push(newPacket());
    };

    const draw = (ts: number) => {
      ctx.clearRect(0, 0, W, H);
      // links
      ctx.lineWidth = 1;
      ctx.strokeStyle = C.l;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      links.forEach(([i, j]) => {
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
      // nodes
      const t = ts / 1000;
      nodes.forEach((n) => {
        if (n.lock) {
          const p = (Math.sin(t * 1.4 + n.ph) + 1) / 2;
          ctx.strokeStyle = C.s;
          ctx.globalAlpha = 0.25 + p * 0.5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 7 + p * 5, 0, 7);
          ctx.stroke();
          ctx.globalAlpha = 1;
          // padlock: body + shackle
          ctx.fillStyle = C.s;
          ctx.fillRect(n.x - 3.5, n.y - 1.5, 7, 6);
          ctx.beginPath();
          ctx.arc(n.x, n.y - 2, 2.6, Math.PI, 0);
          ctx.strokeStyle = C.s;
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.lineWidth = 1;
        } else {
          ctx.fillStyle = C.b;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 2, 0, 7);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });
      // packets
      packets.forEach((p) => {
        const a = nodes[p.l[0]];
        const b = nodes[p.l[1]];
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        ctx.fillStyle = p.c === 'c' ? C.c : C.b;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, 7);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };

    const step = () => {
      packets.forEach((p, k) => {
        p.t += p.v;
        if (p.t > 1) packets[k] = newPacket();
      });
    };

    const loop = (ts: number) => {
      draw(ts);
      for (let s = 0; s < STEPS_PER_FRAME; s++) step();
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (reduce) draw(0);
      else if (!document.hidden) raf = requestAnimationFrame(loop);
    };

    readColors();
    build();
    draw(0);
    start();

    const onVisibility = () => (document.hidden ? cancelAnimationFrame(raf) : start());
    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        build();
        if (reduce) draw(0);
      }, 150);
    };
    const onTheme = () => {
      readColors();
      if (reduce) draw(0);
    };
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const mo = new MutationObserver(onTheme);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', onResize);
    mq.addEventListener('change', onTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(rt);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      mq.removeEventListener('change', onTheme);
      mo.disconnect();
    };
  }, []);

  return <canvas id="net" ref={ref} aria-hidden="true" />;
}
