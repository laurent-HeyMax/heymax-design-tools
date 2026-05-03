import { useRef, type PointerEvent } from 'react';
import { sendToMain } from '../../lib/messaging';

const MIN_W = 360;
const MIN_H = 480;
const MAX_W = 1600;
const MAX_H = 1400;

/**
 * Bottom-right drag handle that resizes the plugin iframe via figma.ui.resize().
 * Sized 14×14 — matches Figma's own resize handle convention.
 */
export function ResizeHandle() {
  const dragging = useRef(false);
  const startW = useRef(0);
  const startH = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    startW.current = window.innerWidth;
    startH.current = window.innerHeight;
    startX.current = e.clientX;
    startY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    e.preventDefault();
    const w = Math.max(MIN_W, Math.min(MAX_W, startW.current + e.clientX - startX.current));
    const h = Math.max(MIN_H, Math.min(MAX_H, startH.current + e.clientY - startY.current));
    sendToMain({ type: 'resize', width: w, height: h });
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      title="Drag to resize"
      className="fixed right-0 bottom-0 size-3.5 cursor-nwse-resize z-50 select-none"
      style={{ touchAction: 'none' }}
    >
      <svg
        viewBox="0 0 14 14"
        className="size-full text-text-faint"
        fill="currentColor"
        aria-hidden
      >
        <path d="M13 6 L6 13 L13 13 Z" />
      </svg>
    </div>
  );
}
