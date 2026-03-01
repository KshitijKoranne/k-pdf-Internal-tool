'use client';

import { useEffect, useRef, useCallback } from 'react';

// ─── Sprite sheet config ──────────────────────────────────────────────────────
const SPRITES = {
  walk:   { src: '/cat-walk.png',   frames: 4, fw: 72, fh: 48 },
  idle:   { src: '/cat-idle.png',   frames: 4, fw: 48, fh: 48 },
  attack: { src: '/cat-attack.png', frames: 4, fw: 48, fh: 48 },
  death:  { src: '/cat-death.png',  frames: 4, fw: 48, fh: 48 },
} as const;

type AnimState = 'idle' | 'walk' | 'attack' | 'death' | 'revive';

// Display size — upscale 3× (cat is tiny at native ~27×22px)
const SCALE        = 3.5;
const DISPLAY_W    = Math.round(72 * SCALE);   // walk frame is widest
const DISPLAY_H    = Math.round(48 * SCALE);
const WALK_FPS     = 10;
const IDLE_FPS     = 8;
const ATTACK_FPS   = 10;
const DEATH_FPS    = 7;
const MOVE_SPEED   = 1.2;

export default function SidebarCat() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Loaded images
  const imgs = useRef<Partial<Record<keyof typeof SPRITES, HTMLImageElement>>>({});
  const loadedCount = useRef(0);

  // State
  const stateRef     = useRef<AnimState>('idle');
  const prevState    = useRef<AnimState>('idle');
  const posRef       = useRef({ x: 20, y: 60 });
  const targetRef    = useRef<{ x: number; y: number } | null>(null);
  const dirRef       = useRef<1 | -1>(1);

  // Animation timing
  const frameIdxRef  = useRef(0);
  const lastFrameMs  = useRef(0);

  // Timers
  const idleTimerRef   = useRef(0);
  const wanderTimerRef = useRef(0);
  const nextWanderMs   = useRef(3000);
  const attackDone     = useRef(false);
  const deathDone      = useRef(false);

  const rafRef = useRef(0);

  // ── Pick random wander target ─────────────────────────────────────────────
  const pickWander = useCallback((cw: number, ch: number) => {
    const maxX = cw - DISPLAY_W - 8;
    const maxY = ch - DISPLAY_H - 8;
    targetRef.current = {
      x: 8 + Math.random() * Math.max(1, maxX - 8),
      y: 8 + Math.random() * Math.max(1, maxY - 8),
    };
    stateRef.current = 'walk';
    frameIdxRef.current = 0;
    nextWanderMs.current = 2500 + Math.random() * 3500;
    wanderTimerRef.current = 0;
  }, []);

  // ── Input: click or touch ─────────────────────────────────────────────────
  const handleInput = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const st = stateRef.current;

    // During death — click revives
    if (st === 'death' || st === 'revive') {
      stateRef.current = 'idle';
      frameIdxRef.current = 0;
      deathDone.current = false;
      return;
    }

    // Click near the cat → attack
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const ox = posRef.current.x;
    const oy = posRef.current.y;
    const dist = Math.sqrt((cx - ox - DISPLAY_W / 2) ** 2 + (cy - oy - DISPLAY_H / 2) ** 2);

    if (dist < DISPLAY_W * 0.8) {
      // Clicked ON the cat → attack
      stateRef.current = 'attack';
      frameIdxRef.current = 0;
      attackDone.current = false;
    } else {
      // Clicked elsewhere → walk there
      const cw = rect.width;
      const ch = rect.height;
      targetRef.current = {
        x: Math.max(8, Math.min(cx - DISPLAY_W / 2, cw - DISPLAY_W - 8)),
        y: Math.max(8, Math.min(cy - DISPLAY_H / 2, ch - DISPLAY_H - 8)),
      };
      stateRef.current = 'walk';
      frameIdxRef.current = 0;
      wanderTimerRef.current = 0;
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    handleInput(e.clientX, e.clientY);
  }, [handleInput]);

  const handleTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const t = e.touches[0] || e.changedTouches[0];
    if (t) handleInput(t.clientX, t.clientY);
  }, [handleInput]);

  // ── Main loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Preload all sprites
    (Object.keys(SPRITES) as Array<keyof typeof SPRITES>).forEach(key => {
      const img = new Image();
      img.src = SPRITES[key].src;
      img.onload = () => { loadedCount.current++; };
      imgs.current[key] = img;
    });

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTs = 0;

    const loop = (ts: number) => {
      const dt = Math.min(ts - lastTs, 50); // cap dt to avoid huge jumps
      lastTs = ts;

      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width  = cw;
        canvas.height = ch;
        // Keep cat in bounds after resize
        posRef.current.x = Math.min(posRef.current.x, cw - DISPLAY_W - 8);
        posRef.current.y = Math.min(posRef.current.y, ch - DISPLAY_H - 8);
      }

      ctx.clearRect(0, 0, cw, ch);
      if (!ctx) { rafRef.current = requestAnimationFrame(loop); return; }
      ctx.imageSmoothingEnabled = false;

      const st = stateRef.current;
      const maxX = cw - DISPLAY_W - 8;
      const maxY = ch - DISPLAY_H - 8;

      // ── State machine ──────────────────────────────────────────────────
      if (st === 'walk') {
        const tgt = targetRef.current;
        if (tgt) {
          const dx = tgt.x - posRef.current.x;
          const dy = tgt.y - posRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 2.5) {
            posRef.current = { ...tgt };
            targetRef.current = null;
            stateRef.current = 'idle';
            frameIdxRef.current = 0;
          } else {
            const spd = MOVE_SPEED * (dt / 16);
            posRef.current = {
              x: Math.max(8, Math.min(posRef.current.x + (dx / dist) * spd, maxX)),
              y: Math.max(8, Math.min(posRef.current.y + (dy / dist) * spd, maxY)),
            };
            if (Math.abs(dx) > 0.5) dirRef.current = dx > 0 ? 1 : -1;
          }
        } else {
          stateRef.current = 'idle';
          frameIdxRef.current = 0;
        }

      } else if (st === 'idle') {
        idleTimerRef.current += dt;
        wanderTimerRef.current += dt;

        // Auto-wander
        if (wanderTimerRef.current > nextWanderMs.current) {
          pickWander(cw, ch);
        }

        // Die of boredom after ~15s idle with no wander
        if (idleTimerRef.current > 15000) {
          stateRef.current = 'death';
          frameIdxRef.current = 0;
          deathDone.current = false;
          idleTimerRef.current = 0;
        }

      } else if (st === 'attack') {
        // Attack animation plays once then return to idle
        if (attackDone.current) {
          stateRef.current = 'idle';
          frameIdxRef.current = 0;
          attackDone.current = false;
        }

      } else if (st === 'death') {
        // Hold last frame, wait for click to revive
        // (handled in handleInput)
        if (deathDone.current) {
          // Auto-revive after 4s
          // handled via timer below
        }
      }

      // ── Sprite frame advance ─────────────────────────────────────────────
      const fps = st === 'walk' ? WALK_FPS : st === 'attack' ? ATTACK_FPS : st === 'death' ? DEATH_FPS : IDLE_FPS;
      const interval = 1000 / fps;
      const spriteKey = (st === 'revive' ? 'idle' : st) as keyof typeof SPRITES;
      const totalFrames = SPRITES[spriteKey]?.frames ?? 4;

      if (ts - lastFrameMs.current > interval) {
        lastFrameMs.current = ts;
        if (st === 'death') {
          // Only advance until last frame, then hold
          if (frameIdxRef.current < totalFrames - 1) {
            frameIdxRef.current++;
          } else {
            deathDone.current = true;
          }
        } else if (st === 'attack') {
          if (frameIdxRef.current < totalFrames - 1) {
            frameIdxRef.current++;
          } else {
            attackDone.current = true;
          }
        } else {
          frameIdxRef.current = (frameIdxRef.current + 1) % totalFrames;
        }
      }

      // ── Draw ──────────────────────────────────────────────────────────────
      const spriteImg = imgs.current[spriteKey];
      if (!spriteImg?.complete || !spriteImg.naturalWidth) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const { fw, fh } = SPRITES[spriteKey];
      const srcX = frameIdxRef.current * fw;
      const ox   = Math.round(posRef.current.x);
      const oy   = Math.round(posRef.current.y);
      const flip = dirRef.current === -1;

      // Draw with optional horizontal flip
      ctx.save();
      if (flip) {
        ctx.translate(ox + DISPLAY_W, oy);
        ctx.scale(-1, 1);
        ctx.drawImage(spriteImg, srcX, 0, fw, fh, 0, 0, DISPLAY_W, DISPLAY_H);
      } else {
        ctx.drawImage(spriteImg, srcX, 0, fw, fh, ox, oy, DISPLAY_W, DISPLAY_H);
      }
      ctx.restore();

      // ── Death hint text ──────────────────────────────────────────────────
      if (st === 'death' && deathDone.current) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.textAlign = 'center';
        ctx.fillText('tap to revive', ox + DISPLAY_W / 2, oy - 6);
        ctx.textAlign = 'left';
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pickWander]);

  return (
    <div
      ref={containerRef}
      className="relative w-full flex-1"
      style={{ minHeight: 200 }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onTouchStart={handleTouch}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'pointer',
          imageRendering: 'pixelated',
        }}
        title="Click the cat to interact!"
      />
      <span
        className="absolute bottom-2 left-0 right-0 text-center select-none pointer-events-none"
        style={{
          color: 'hsl(var(--kpdf-muted-fg))',
          opacity: 0.35,
          fontSize: '9px',
          letterSpacing: '0.05em',
        }}
      >
        click the cat ✦ click elsewhere to move
      </span>
    </div>
  );
}
