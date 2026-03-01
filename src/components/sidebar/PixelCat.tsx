'use client';

import { useEffect, useRef, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const S = 3; // pixel scale (each art pixel = 3×3 screen pixels)

// Palette
const _ = 'transparent';
const K = '#1a1a1a';   // black outline
const O = '#f4913d';   // orange fur
const D = '#c96e1e';   // dark orange / shadow
const W = '#fff8f0';   // white / belly
const P = '#ff8fab';   // pink nose + inner ear
const B = '#5bb8f5';   // blue iris
const E = '#1a5fa8';   // dark pupil
const H = '#ffffff';   // eye highlight dot
const T = '#d4a853';   // tail stripe / tip

// ─── 16×16 Sprite frames ─────────────────────────────────────────────────────
// Row by row, each entry is a color string or transparent

type R = string; // color value

// Helper: build a 16×16 grid from a compact string map
// (we just use 2D arrays for clarity)

//  Sitting, facing right — proper cat side profile
const SIT: R[][] = [
  [_,_,_,K,K,_,_,_,_,K,K,_,_,_,_,_], // ears tips
  [_,_,K,O,O,K,_,_,K,O,O,K,_,_,_,_], // ears outer
  [_,_,K,P,O,O,K,K,O,P,O,K,_,_,_,_], // inner ear + head
  [_,K,O,O,O,O,O,O,O,O,O,O,K,_,_,_], // head wide
  [K,O,O,B,E,O,O,O,O,B,E,O,O,K,_,_], // eyes row 1
  [K,O,O,E,B,O,W,W,O,E,B,O,O,K,_,_], // eyes row 2 + muzzle
  [K,O,O,O,O,K,P,K,O,O,O,O,O,K,_,_], // nose
  [_,K,O,W,W,K,_,K,W,W,O,O,K,_,_,_], // muzzle lower
  [_,_,K,O,O,K,_,K,O,O,O,K,_,_,_,_], // chin / neck
  [_,_,K,O,D,O,O,O,D,O,O,K,_,_,_,_], // body top with shading
  [_,_,K,O,O,W,W,W,W,O,O,K,_,_,_,_], // belly
  [_,_,K,O,O,W,W,W,W,O,O,K,_,_,_,_], // belly 2
  [_,_,K,D,O,O,O,O,O,O,D,K,_,_,_,_], // lower body
  [_,_,K,O,K,K,_,_,K,K,O,K,_,_,_,_], // legs start
  [_,_,K,O,K,_,_,_,_,K,O,K,_,_,_,_], // legs
  [_,_,K,K,_,_,_,_,_,_,K,K,_,_,_,_], // paw bottom
];

// Walk frame 1 — front leg fwd, back leg back
const W1: R[][] = [
  [_,_,_,K,K,_,_,_,_,K,K,_,_,_,_,_],
  [_,_,K,O,O,K,_,_,K,O,O,K,_,_,_,_],
  [_,_,K,P,O,O,K,K,O,P,O,K,_,_,_,_],
  [_,K,O,O,O,O,O,O,O,O,O,O,K,_,_,_],
  [K,O,O,B,E,O,O,O,O,B,E,O,O,K,_,_],
  [K,O,O,E,B,O,W,W,O,E,B,O,O,K,_,_],
  [K,O,O,O,O,K,P,K,O,O,O,O,O,K,_,_],
  [_,K,O,W,W,K,_,K,W,W,O,O,K,_,_,_],
  [_,_,K,O,O,K,_,K,O,O,O,K,_,_,_,_],
  [_,_,K,O,D,O,O,O,D,O,O,K,_,_,_,_],
  [_,_,K,O,O,W,W,W,W,O,O,K,_,_,_,_],
  [_,_,K,O,O,W,W,W,W,O,O,K,_,_,_,_],
  [_,_,K,D,O,O,O,O,O,O,D,K,_,_,_,_],
  [_,K,O,K,_,_,_,K,K,O,O,K,_,_,_,_], // front leg fwd, back leg back
  [K,O,K,_,_,_,_,_,K,O,O,K,_,_,_,_],
  [K,K,_,_,_,_,_,_,_,K,K,_,_,_,_,_],
];

// Walk frame 2 — legs swapped
const W2: R[][] = [
  [_,_,_,K,K,_,_,_,_,K,K,_,_,_,_,_],
  [_,_,K,O,O,K,_,_,K,O,O,K,_,_,_,_],
  [_,_,K,P,O,O,K,K,O,P,O,K,_,_,_,_],
  [_,K,O,O,O,O,O,O,O,O,O,O,K,_,_,_],
  [K,O,O,B,E,O,O,O,O,B,E,O,O,K,_,_],
  [K,O,O,E,B,O,W,W,O,E,B,O,O,K,_,_],
  [K,O,O,O,O,K,P,K,O,O,O,O,O,K,_,_],
  [_,K,O,W,W,K,_,K,W,W,O,O,K,_,_,_],
  [_,_,K,O,O,K,_,K,O,O,O,K,_,_,_,_],
  [_,_,K,O,D,O,O,O,D,O,O,K,_,_,_,_],
  [_,_,K,O,O,W,W,W,W,O,O,K,_,_,_,_],
  [_,_,K,O,O,W,W,W,W,O,O,K,_,_,_,_],
  [_,_,K,D,O,O,O,O,O,O,D,K,_,_,_,_],
  [_,_,K,O,K,K,_,K,O,K,_,_,_,_,_,_], // legs other way
  [_,_,_,K,O,K,_,K,O,K,_,_,_,_,_,_],
  [_,_,_,_,K,K,_,_,K,K,_,_,_,_,_,_],
];

// Blink — eyes become horizontal lines
const BLINK: R[][] = SIT.map((row, r) =>
  r === 4
    ? row.map((v, c) => (c >= 3 && c <= 4) ? K : (c >= 9 && c <= 10) ? K : v)
    : r === 5
    ? row.map((v, c) => (c === 3 || c === 4 || c === 9 || c === 10) ? O : v)
    : row
);

// Sleep — curled, eyes shut, flatter
const SLEEP: R[][] = [
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,K,K,_,_,K,K,_,_,_,_,_,_,_],
  [_,_,K,O,O,K,K,O,O,K,_,_,_,_,_,_],
  [_,K,O,P,O,O,O,O,P,O,K,_,_,_,_,_],
  [_,K,O,O,K,K,P,K,K,O,O,K,_,_,_,_], // closed eyes, nose
  [_,K,O,W,W,O,O,O,W,W,O,O,K,_,_,_],
  [K,O,O,O,O,O,O,O,O,O,O,O,O,K,_,_], // body curled
  [K,O,D,O,W,W,W,W,W,O,D,O,O,K,_,_],
  [K,O,O,O,W,W,W,W,W,O,O,O,O,K,_,_],
  [_,K,O,O,O,O,O,O,O,O,O,O,K,_,_,_],
  [_,_,K,K,O,O,K,K,K,K,K,K,_,_,_,_], // tail wrapping around
  [_,_,_,K,O,K,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,K,T,K,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,K,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
];

// Happy — eyes curved ^^ style
const HAPPY: R[][] = SIT.map((row, r) =>
  r === 4
    ? row.map((v, c) =>
        c === 3 ? K : c === 4 ? O :
        c === 9 ? O : c === 10 ? K : v)
    : r === 5
    ? row.map((v, c) =>
        c === 3 ? O : c === 4 ? K :
        c === 9 ? K : c === 10 ? O : v)
    : row
);

function drawCat(
  ctx: CanvasRenderingContext2D,
  frame: R[][],
  ox: number,
  oy: number,
  flipX: boolean,
) {
  const rows = frame.length;
  const cols = frame[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const col = frame[r][c];
      if (!col || col === 'transparent') continue;
      const dc = flipX ? cols - 1 - c : c;
      ctx.fillStyle = col;
      ctx.fillRect(ox + dc * S, oy + r * S, S, S);
    }
  }
}

function drawTail(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  flipX: boolean,
  swing: number,
) {
  // Tail exits from the back of the cat (row ~8–12), curls upward
  const bx = flipX ? -1 : 12; // column index just outside sprite
  const sign = flipX ? -1 : 1;

  const segs: Array<{ dc: number; dr: number; color: string }> = [
    { dc: sign * 1, dr: 10, color: K },
    { dc: sign * 1, dr: 9,  color: O },
    { dc: sign * 2, dr: 8,  color: O },
    { dc: sign * 2, dr: 7 + swing, color: O },
    { dc: sign * 3, dr: 6 + swing, color: D },
    { dc: sign * 3, dr: 5 + swing, color: T },
    { dc: sign * 2, dr: 4 + swing, color: T },
    { dc: sign * 2, dr: 3 + swing, color: K },
  ];

  segs.forEach(({ dc, dr, color }) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + (bx + dc) * S, oy + dr * S, S, S);
  });
}

function drawZs(ctx: CanvasRenderingContext2D, ox: number, oy: number, tick: number) {
  [
    { size: 9,  xo: 14, yo: -4,  phase: 0 },
    { size: 12, xo: 17, yo: -12, phase: 1.2 },
    { size: 15, xo: 20, yo: -22, phase: 2.4 },
  ].forEach(({ size, xo, yo, phase }) => {
    const a = Math.max(0, 0.3 + 0.7 * Math.sin(tick * 0.035 + phase));
    const yb = Math.sin(tick * 0.035 + phase) * 2;
    ctx.font = `bold ${size}px sans-serif`;
    ctx.fillStyle = `rgba(173,216,255,${a})`;
    ctx.fillText('z', ox + xo * S / 2, oy + yo + yb);
  });
}

type State = 'idle' | 'walking' | 'happy' | 'sleeping' | 'blinking';

export default function PixelCat() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const posRef   = useRef({ x: 20, y: 60 });
  const tgtRef   = useRef<{ x: number; y: number } | null>(null);
  const dirRef   = useRef<1 | -1>(1);
  const stateRef = useRef<State>('idle');

  const tickRef       = useRef(0);
  const walkTRef      = useRef(0);
  const idleTRef      = useRef(0);
  const blinkTRef     = useRef(120);
  const blinkPhRef    = useRef(0);
  const happyTRef     = useRef(0);
  const sleepTRef     = useRef(0);
  const rafRef        = useRef(0);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (stateRef.current === 'sleeping') {
      stateRef.current = 'idle';
      sleepTRef.current = 0;
      idleTRef.current  = 0;
      return;
    }

    const cw = rect.width;
    const ch = rect.height;
    const catW = 16 * S;
    const catH = 16 * S;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    tgtRef.current = {
      x: Math.max(4, Math.min(cx - catW / 2, cw - catW - 12)),
      y: Math.max(4, Math.min(cy - catH / 2, ch - catH - 4)),
    };
    stateRef.current = 'walking';
    happyTRef.current = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SPEED = 2;
    const catW  = 16 * S;
    const catH  = 16 * S;

    const loop = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;

      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width  = cw;
        canvas.height = ch;
        posRef.current.x = Math.min(posRef.current.x, cw - catW - 12);
        posRef.current.y = Math.min(posRef.current.y, ch - catH - 4);
      }

      ctx.clearRect(0, 0, cw, ch);
      ctx.imageSmoothingEnabled = false;

      const tick = ++tickRef.current;
      const maxX = cw - catW - 12; // extra right margin for tail
      const maxY = ch - catH - 4;
      const { x, y } = posRef.current;
      const st = stateRef.current;

      // ── State machine ────────────────────────────────────────────────────
      if (st === 'walking') {
        const tgt = tgtRef.current;
        if (tgt) {
          const dx = tgt.x - x;
          const dy = tgt.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 3) {
            posRef.current = { x: tgt.x, y: tgt.y };
            tgtRef.current = null;
            stateRef.current = 'happy';
            happyTRef.current = 0;
          } else {
            const nx = x + (dx / dist) * SPEED;
            const ny = y + (dy / dist) * SPEED;
            posRef.current = {
              x: Math.max(4, Math.min(nx, maxX)),
              y: Math.max(4, Math.min(ny, maxY)),
            };
            if (Math.abs(dx) > 0.5) dirRef.current = dx > 0 ? 1 : -1;
            walkTRef.current++;
          }
        } else {
          stateRef.current = 'idle';
        }

      } else if (st === 'happy') {
        if (++happyTRef.current > 55) {
          stateRef.current = 'idle';
          happyTRef.current = 0;
          idleTRef.current  = 0;
        }

      } else if (st === 'idle') {
        idleTRef.current++;
        blinkTRef.current++;

        if (blinkTRef.current > 180 + Math.floor(Math.random() * 120)) {
          stateRef.current = 'blinking';
          blinkPhRef.current = 0;
          blinkTRef.current  = 0;
        }

        if (idleTRef.current > 500) {
          stateRef.current = 'sleeping';
          sleepTRef.current = 0;
          idleTRef.current  = 0;
        }

        // wander every ~5 s
        if (idleTRef.current > 0 && idleTRef.current % 300 === 0 && Math.random() > 0.3) {
          tgtRef.current = {
            x: 8 + Math.random() * (maxX - 8),
            y: 8 + Math.random() * (maxY - 8),
          };
          stateRef.current = 'walking';
        }

      } else if (st === 'blinking') {
        if (++blinkPhRef.current > 10) {
          stateRef.current = 'idle';
          idleTRef.current  = 0;
        }

      } else if (st === 'sleeping') {
        if (++sleepTRef.current > 580) {
          stateRef.current = 'idle';
          sleepTRef.current = 0;
          idleTRef.current  = 0;
        }
      }

      // ── Render ───────────────────────────────────────────────────────────
      const ox   = Math.round(posRef.current.x);
      const oy   = Math.round(posRef.current.y);
      const flip = dirRef.current === -1;
      const swing = Math.round(Math.sin(tick * 0.09) * 2);
      const cur  = stateRef.current;

      if (cur === 'sleeping') {
        drawCat(ctx, SLEEP, ox, oy, flip);
        drawZs(ctx, ox, oy, tick);
      } else {
        drawTail(ctx, ox, oy, flip, swing);
        if (cur === 'happy') {
          const bounce = Math.round(Math.abs(Math.sin(tick * 0.22)) * 5);
          drawCat(ctx, HAPPY, ox, oy - bounce, flip);
        } else if (cur === 'walking') {
          const frame = Math.floor(walkTRef.current / 7) % 2 === 0 ? W1 : W2;
          drawCat(ctx, frame, ox, oy, flip);
        } else if (cur === 'blinking') {
          drawCat(ctx, blinkPhRef.current < 5 ? BLINK : SIT, ox, oy, flip);
        } else {
          drawCat(ctx, SIT, ox, oy, flip);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full flex-1"
      style={{ minHeight: 200 }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'pointer',
          imageRendering: 'pixelated',
        }}
        title="Click anywhere to call the cat!"
      />
      <span
        className="absolute bottom-2 left-0 right-0 text-center select-none pointer-events-none"
        style={{ color: 'hsl(var(--kpdf-muted-fg))', opacity: 0.35, fontSize: '9px', letterSpacing: '0.05em' }}
      >
        click to interact
      </span>
    </div>
  );
}
