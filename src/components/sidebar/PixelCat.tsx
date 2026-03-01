'use client';

import { useEffect, useRef, useCallback } from 'react';

// ─── Pixel art config ─────────────────────────────────────────────────────────
const SCALE = 3;   // each "pixel" = 3×3 real pixels
const W = 16;
const H = 16;

// Color palette
const P: Record<number, string> = {
  0: '', // transparent
  1: '#f97316', // orange body
  2: '#1a0800', // dark outline
  3: '#fff4ec', // belly / eye whites
  4: '#ff8fab', // nose / inner ear
  5: '#fbbf72', // highlight / tail tip
  6: '#c2510a', // shadow
};

// ─── Sprite frames (16×16) ────────────────────────────────────────────────────
type Frame = number[][];

const SIT: Frame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0],
  [0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0],
  [0,0,1,2,1,1,1,1,1,1,1,1,2,1,0,0],
  [0,0,1,2,3,1,1,1,1,1,1,3,2,1,0,0],
  [0,0,1,1,1,1,4,1,1,4,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0],
  [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
  [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,6,0,0,0,0,0,0,0,0,6,1,0,0],
  [0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0],
  [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const BLINK1: Frame = SIT.map((row, r) =>
  r === 4 ? row.map((v, c) => (c >= 2 && c <= 4) || (c >= 11 && c <= 13) ? 2 : v) : row
);

const BLINK2: Frame = SIT.map((row, r) =>
  r === 4 ? row.map((v, c) => (c >= 2 && c <= 4) || (c >= 11 && c <= 13) ? 2 : v) :
  r === 3 ? row.map((v, c) => (c >= 2 && c <= 4) || (c >= 11 && c <= 13) ? 2 : v) : row
);

const WALK1: Frame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0],
  [0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0],
  [0,0,1,2,1,1,1,1,1,1,1,1,2,1,0,0],
  [0,0,1,2,3,1,1,1,1,1,1,3,2,1,0,0],
  [0,0,1,1,1,1,4,1,1,4,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0],
  [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,6,1,0,0,0,0,0,0,0,1,1,0,0],
  [0,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0],
  [0,1,6,0,0,0,0,0,0,0,0,0,6,1,0,0],
  [0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const WALK2: Frame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0],
  [0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0],
  [0,0,1,2,1,1,1,1,1,1,1,1,2,1,0,0],
  [0,0,1,2,3,1,1,1,1,1,1,3,2,1,0,0],
  [0,0,1,1,1,1,4,1,1,4,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0],
  [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,6,0,0,0,0,0,0,1,6,0,0,0],
  [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0],
  [0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0],
  [0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const HAPPY: Frame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1],
  [0,1,1,1,1,1,0,0,0,0,1,1,1,1,1,0],
  [0,0,1,2,1,1,1,1,1,1,1,1,2,1,0,0],
  [0,0,1,2,3,1,1,1,1,1,1,3,2,1,0,0],
  [0,0,1,1,1,1,4,1,1,4,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0],
  [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
  [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,6,0,0,0,0,0,0,0,0,6,1,0,0],
  [0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0],
  [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const SLEEP: Frame = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0],
  [0,0,1,1,1,1,0,0,0,0,1,1,1,1,0,0],
  [0,0,1,2,1,1,1,1,1,1,1,1,2,1,0,0],
  [0,0,1,2,2,1,1,1,1,1,1,2,2,1,0,0],
  [0,0,1,1,1,1,4,1,1,4,1,1,1,1,0,0],
  [0,1,1,3,3,3,3,3,3,3,3,3,3,1,1,0],
  [0,1,3,1,1,1,1,1,1,1,1,1,1,3,1,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

function drawFrame(ctx: CanvasRenderingContext2D, frame: Frame, ox: number, oy: number, flipX = false) {
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const v = frame[r][c];
      if (!v || !P[v]) continue;
      ctx.fillStyle = P[v];
      const dc = flipX ? W - 1 - c : c;
      ctx.fillRect(ox + dc * SCALE, oy + r * SCALE, SCALE, SCALE);
    }
  }
}

function drawTail(ctx: CanvasRenderingContext2D, ox: number, oy: number, swing: number, flipX: boolean) {
  const segments = [
    { c: flipX ? -1 : 16, r: 9 },
    { c: flipX ? -2 : 17, r: 10 },
    { c: flipX ? -3 : 17, r: 11 },
    { c: flipX ? -3 : 16, r: 12 },
    { c: flipX ? -2 : 15, r: 13 },
    { c: flipX ? -1 : 14, r: 14 },
  ];
  segments.forEach(({ c, r }, i) => {
    const s = Math.round(swing * (i / segments.length));
    ctx.fillStyle = i >= segments.length - 1 ? P[5] : P[1];
    ctx.fillRect(ox + c * SCALE, oy + (r + s) * SCALE, SCALE, SCALE);
  });
}

function drawZs(ctx: CanvasRenderingContext2D, ox: number, oy: number, tick: number) {
  const alpha1 = 0.4 + 0.4 * Math.sin(tick * 0.04);
  const alpha2 = 0.4 + 0.4 * Math.sin(tick * 0.04 + 1.5);
  ctx.font = 'bold 7px monospace';
  ctx.fillStyle = `rgba(147,197,253,${alpha1})`;
  ctx.fillText('z', ox + 13 * SCALE, oy + 2 * SCALE);
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = `rgba(147,197,253,${alpha2})`;
  ctx.fillText('Z', ox + 14 * SCALE, oy - 2);
}

type CatState = 'idle' | 'walking' | 'happy' | 'sleeping' | 'blinking';

export default function PixelCat() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<CatState>('idle');
  const posXRef = useRef(20);
  const dirRef = useRef<1 | -1>(1);
  const tickRef = useRef(0);
  const walkTickRef = useRef(0);
  const idleTimerRef = useRef(0);
  const blinkTimerRef = useRef(150);
  const blinkPhaseRef = useRef(0);
  const happyTimerRef = useRef(0);
  const sleepTimerRef = useRef(0);
  const targetXRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current === 'sleeping') {
      stateRef.current = 'idle';
      sleepTimerRef.current = 0;
      idleTimerRef.current = 0;
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left;
    const max = rect.width - W * SCALE - 8;
    targetXRef.current = Math.max(8, Math.min(cx - (W * SCALE) / 2, max));
    stateRef.current = 'walking';
    happyTimerRef.current = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
      ctx.clearRect(0, 0, cw, ch);
      ctx.imageSmoothingEnabled = false;

      const tick = ++tickRef.current;
      const catPxW = W * SCALE;
      const catPxH = H * SCALE;
      const groundY = ch - catPxH - 12;
      const maxX = cw - catPxW - 8;

      // ── State machine ──────────────────────────────────────────────────────
      const state = stateRef.current;

      if (state === 'happy') {
        if (++happyTimerRef.current > 70) { stateRef.current = 'idle'; happyTimerRef.current = 0; }

      } else if (state === 'walking') {
        const tx = targetXRef.current;
        if (tx !== null) {
          const dx = tx - posXRef.current;
          if (Math.abs(dx) < 2) {
            posXRef.current = tx;
            targetXRef.current = null;
            stateRef.current = 'happy';
            happyTimerRef.current = 0;
          } else {
            dirRef.current = dx > 0 ? 1 : -1;
            posXRef.current = Math.max(8, Math.min(posXRef.current + dirRef.current * 1.5, maxX));
            walkTickRef.current++;
          }
        } else {
          stateRef.current = 'idle';
        }

      } else if (state === 'idle') {
        idleTimerRef.current++;
        blinkTimerRef.current++;

        // Blink every ~3–5 s
        if (blinkTimerRef.current > 180 + Math.floor(Math.random() * 120)) {
          stateRef.current = 'blinking';
          blinkPhaseRef.current = 0;
          blinkTimerRef.current = 0;
        }

        // Fall asleep after ~9 s idle
        if (idleTimerRef.current > 540) {
          stateRef.current = 'sleeping';
          sleepTimerRef.current = 0;
          idleTimerRef.current = 0;
        }

        // Wander occasionally
        if (idleTimerRef.current > 0 && idleTimerRef.current % 300 === 0 && Math.random() > 0.4) {
          targetXRef.current = 16 + Math.floor(Math.random() * (maxX - 16));
          stateRef.current = 'walking';
        }

      } else if (state === 'blinking') {
        if (++blinkPhaseRef.current > 14) { stateRef.current = 'idle'; idleTimerRef.current = 0; }

      } else if (state === 'sleeping') {
        if (++sleepTimerRef.current > 600) {
          stateRef.current = 'idle';
          sleepTimerRef.current = 0;
          idleTimerRef.current = 0;
        }
      }

      // ── Draw ──────────────────────────────────────────────────────────────
      const ox = Math.round(posXRef.current);
      const oy = Math.round(groundY);
      const flip = dirRef.current === -1;
      const tailSwing = Math.round(Math.sin(tick * 0.07) * 2.5);
      const curState = stateRef.current;

      if (curState === 'sleeping') {
        const sleepOy = oy + 8; // curled lower
        drawFrame(ctx, SLEEP, ox, sleepOy, flip);
        drawZs(ctx, ox, sleepOy, tick);
      } else {
        drawTail(ctx, ox, oy, tailSwing, flip);
        if (curState === 'happy') {
          // Bounce slightly
          const bounce = Math.abs(Math.sin(tick * 0.3)) * 4;
          drawFrame(ctx, HAPPY, ox, oy - Math.round(bounce), flip);
        } else if (curState === 'walking') {
          const wf = Math.floor(walkTickRef.current / 7) % 2 === 0 ? WALK1 : WALK2;
          drawFrame(ctx, wf, ox, oy, flip);
        } else if (curState === 'blinking') {
          const bp = blinkPhaseRef.current;
          const bf = bp < 3 ? SIT : bp < 6 ? BLINK1 : bp < 9 ? BLINK2 : bp < 12 ? BLINK1 : SIT;
          drawFrame(ctx, bf, ox, oy, flip);
        } else {
          // idle — tiny tail wag already drawn, draw body
          drawFrame(ctx, SIT, ox, oy, flip);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full flex-1" style={{ minHeight: 160 }}>
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
        title="Click me!"
      />
      <span
        className="absolute bottom-2 left-0 right-0 text-center text-xs select-none pointer-events-none"
        style={{ color: 'hsl(var(--kpdf-muted-fg))', opacity: 0.45, fontSize: '10px' }}
      >
        click to interact ✦
      </span>
    </div>
  );
}
