'use client';

import { useEffect, useRef, useCallback } from 'react';

// ─── Sprite sheet config ──────────────────────────────────────────────────────
const SHEET_W     = 1280;
const SHEET_H     = 128;
const FRAME_W     = 128;   // 10 frames × 128px
const FRAME_H     = 128;
const N_FRAMES    = 10;
const DISPLAY_W   = 80;    // rendered size
const DISPLAY_H   = 80;
const WALK_FPS    = 12;    // animation speed in frames per second
const MOVE_SPEED  = 0.8;   // px per tick

// How long (ms) between direction/target changes when wandering
const WANDER_INTERVAL_MIN = 2000;
const WANDER_INTERVAL_MAX = 5000;

export default function ZombieWalker() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement | null>(null);
  const imgLoadedRef = useRef(false);

  // Position & movement
  const posRef    = useRef({ x: 40, y: 80 });
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const dirRef    = useRef<1 | -1>(1); // 1 = right, -1 = left (for sprite flip)

  // Animation
  const tickRef        = useRef(0);
  const frameIdxRef    = useRef(0);
  const lastFrameTime  = useRef(0);
  const wanderTimerRef = useRef(0);
  const nextWanderRef  = useRef(2000);
  const rafRef         = useRef(0);
  const isMovingRef    = useRef(false);

  // Pick a new random wander target within sidebar bounds
  const pickTarget = useCallback((cw: number, ch: number) => {
    const maxX = cw - DISPLAY_W - 4;
    const maxY = ch - DISPLAY_H - 4;
    targetRef.current = {
      x: 8 + Math.random() * Math.max(0, maxX - 8),
      y: 8 + Math.random() * Math.max(0, maxY - 8),
    };
    isMovingRef.current = true;
    nextWanderRef.current = WANDER_INTERVAL_MIN +
      Math.random() * (WANDER_INTERVAL_MAX - WANDER_INTERVAL_MIN);
  }, []);

  // Click: send zombie to click position
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cw = rect.width;
    const ch = rect.height;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    targetRef.current = {
      x: Math.max(4, Math.min(cx - DISPLAY_W / 2, cw - DISPLAY_W - 4)),
      y: Math.max(4, Math.min(cy - DISPLAY_H / 2, ch - DISPLAY_H - 4)),
    };
    isMovingRef.current = true;
    wanderTimerRef.current = 0;
  }, []);

  useEffect(() => {
    // Load sprite sheet once
    const img = new Image();
    img.src = '/zombie_walk.png';
    img.onload = () => { imgLoadedRef.current = true; };
    imgRef.current = img;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTimestamp = 0;

    const loop = (timestamp: number) => {
      const dt = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      const cw = container.clientWidth;
      const ch = container.clientHeight;

      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width  = cw;
        canvas.height = ch;
      }

      ctx.clearRect(0, 0, cw, ch);

      const maxX = cw - DISPLAY_W - 4;
      const maxY = ch - DISPLAY_H - 4;

      // ── Wander AI ────────────────────────────────────────────────────────
      wanderTimerRef.current += dt;
      if (!isMovingRef.current && wanderTimerRef.current > nextWanderRef.current) {
        wanderTimerRef.current = 0;
        pickTarget(cw, ch);
      }

      // ── Movement ─────────────────────────────────────────────────────────
      const tgt = targetRef.current;
      if (tgt && isMovingRef.current) {
        const dx = tgt.x - posRef.current.x;
        const dy = tgt.y - posRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 2) {
          posRef.current = { x: tgt.x, y: tgt.y };
          targetRef.current = null;
          isMovingRef.current = false;
          wanderTimerRef.current = 0;
        } else {
          const speed = MOVE_SPEED * (dt / 16); // normalize to ~60fps
          posRef.current = {
            x: Math.max(4, Math.min(posRef.current.x + (dx / dist) * speed, maxX)),
            y: Math.max(4, Math.min(posRef.current.y + (dy / dist) * speed, maxY)),
          };
          // Face direction of horizontal travel
          if (Math.abs(dx) > 0.3) dirRef.current = dx > 0 ? 1 : -1;
        }
      }

      // ── Frame animation ──────────────────────────────────────────────────
      if (isMovingRef.current) {
        // Advance sprite frame at WALK_FPS
        if (timestamp - lastFrameTime.current > 1000 / WALK_FPS) {
          frameIdxRef.current = (frameIdxRef.current + 1) % N_FRAMES;
          lastFrameTime.current = timestamp;
        }
      } else {
        // Idle — hold frame 0 (or slowly sway between 0-1)
        frameIdxRef.current = 0;
      }

      // ── Draw ─────────────────────────────────────────────────────────────
      if (imgLoadedRef.current && imgRef.current) {
        const ox = Math.round(posRef.current.x);
        const oy = Math.round(posRef.current.y);
        const srcX = frameIdxRef.current * FRAME_W;
        const flip  = dirRef.current === -1;

        ctx.save();
        if (flip) {
          // Mirror horizontally around the sprite center
          ctx.translate(ox + DISPLAY_W, oy);
          ctx.scale(-1, 1);
          ctx.drawImage(
            imgRef.current!,
            srcX, 0, FRAME_W, FRAME_H,
            0, 0, DISPLAY_W, DISPLAY_H,
          );
        } else {
          ctx.drawImage(
            imgRef.current!,
            srcX, 0, FRAME_W, FRAME_H,
            ox, oy, DISPLAY_W, DISPLAY_H,
          );
        }
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pickTarget]);

  return (
    <div
      ref={containerRef}
      className="relative w-full flex-1"
      style={{ minHeight: 200 }}
      title="Click to direct the zombie"
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'pointer',
        }}
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
        click to direct
      </span>
    </div>
  );
}
