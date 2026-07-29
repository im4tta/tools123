"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export type DrawingPoint = { x: number; y: number };
export type DrawingStroke = { points: DrawingPoint[]; color: string; width: number };

export type DrawingCanvasHandle = {
  undo: () => void;
  clear: () => void;
  exportPng: (filename?: string) => void;
};

export type DrawingCanvasProps = {
  color?: string;
  strokeWidth?: number;
  background?: string;
  emptyLabel?: ReactNode;
  ariaLabel: string;
  className?: string;
  canvasClassName?: string;
  onChange?: (hasStrokes: boolean) => void;
};

function paintStroke(
  context: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  width: number,
  height: number,
) {
  if (!stroke.points.length) return;
  context.strokeStyle = stroke.color;
  context.fillStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.lineCap = "round";
  context.lineJoin = "round";
  const first = stroke.points[0];
  if (stroke.points.length === 1) {
    context.beginPath();
    context.arc(first.x * width, first.y * height, stroke.width / 2, 0, Math.PI * 2);
    context.fill();
    return;
  }

  context.beginPath();
  context.moveTo(first.x * width, first.y * height);
  for (const point of stroke.points.slice(1)) {
    context.lineTo(point.x * width, point.y * height);
  }
  context.stroke();
}

function redraw(
  canvas: HTMLCanvasElement,
  strokes: DrawingStroke[],
  background: string,
  activeStroke?: DrawingStroke | null,
) {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  const pixelWidth = Math.max(1, Math.round(rect.width * ratio));
  const pixelHeight = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;

  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (background !== "transparent") {
    context.fillStyle = background;
    context.fillRect(0, 0, rect.width, rect.height);
  }
  strokes.forEach((stroke) => paintStroke(context, stroke, rect.width, rect.height));
  if (activeStroke) paintStroke(context, activeStroke, rect.width, rect.height);
}

function normalizedPoint(canvas: HTMLCanvasElement, pointer: PointerEvent): DrawingPoint {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (pointer.clientX - rect.left) / (rect.width || 1))),
    y: Math.min(1, Math.max(0, (pointer.clientY - rect.top) / (rect.height || 1))),
  };
}

function releaseCapture(canvas: HTMLCanvasElement, pointerId: number) {
  try {
    if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
  } catch {
    // Capture can already be gone when the pointer is cancelled or the canvas unmounts.
  }
}
export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(function DrawingCanvas(
  {
    color = "#111827",
    strokeWidth = 3,
    background = "transparent",
    emptyLabel,
    ariaLabel,
    className,
    canvasClassName,
    onChange,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<DrawingStroke[]>([]);
  const activeStrokeRef = useRef<DrawingStroke | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  function setStrokes(strokes: DrawingStroke[]) {
    strokesRef.current = strokes;
    const nextHasStrokes = strokes.length > 0;
    setHasStrokes(nextHasStrokes);
    onChange?.(nextHasStrokes);
    if (canvasRef.current) redraw(canvasRef.current, strokes, background);
  }

  function stopActiveStroke() {
    const canvas = canvasRef.current;
    const pointerId = activePointerRef.current;
    activeStrokeRef.current = null;
    activePointerRef.current = null;
    setIsDrawing(false);
    if (canvas && pointerId !== null) releaseCapture(canvas, pointerId);
  }

  function undo() {
    stopActiveStroke();
    setStrokes(strokesRef.current.slice(0, -1));
  }

  function clear() {
    stopActiveStroke();
    setStrokes([]);
  }

  function exportPng(filename = "drawing.png") {
    const canvas = canvasRef.current;
    if (!canvas || !strokesRef.current.length) return;
    redraw(canvas, strokesRef.current, background);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }, "image/png");
  }

  useImperativeHandle(ref, () => ({ undo, clear, exportPng }));
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => redraw(canvas, strokesRef.current, background, activeStrokeRef.current);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [background]);

  useEffect(() => () => {
    const canvas = canvasRef.current;
    const pointerId = activePointerRef.current;
    if (canvas && pointerId !== null) releaseCapture(canvas, pointerId);
  }, []);

  function start(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (activePointerRef.current !== null || !event.isPrimary) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    const canvas = event.currentTarget;
    activePointerRef.current = event.pointerId;
    activeStrokeRef.current = {
      points: [normalizedPoint(canvas, event.nativeEvent)],
      color,
      width: strokeWidth,
    };
    setIsDrawing(true);
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Drawing can still finish while the pointer remains over the canvas.
    }
    redraw(canvas, strokesRef.current, background, activeStrokeRef.current);
  }

  function move(event: ReactPointerEvent<HTMLCanvasElement>) {
    const stroke = activeStrokeRef.current;
    if (!stroke || activePointerRef.current !== event.pointerId) return;
    event.preventDefault();
    const samples = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
    for (const sample of samples) stroke.points.push(normalizedPoint(event.currentTarget, sample));
    redraw(event.currentTarget, strokesRef.current, background, stroke);
  }

  function finish(event: ReactPointerEvent<HTMLCanvasElement>) {
    const stroke = activeStrokeRef.current;
    if (!stroke || activePointerRef.current !== event.pointerId) return;
    if (event.type === "pointerup") {
      stroke.points.push(normalizedPoint(event.currentTarget, event.nativeEvent));
    }
    activeStrokeRef.current = null;
    activePointerRef.current = null;
    setIsDrawing(false);
    releaseCapture(event.currentTarget, event.pointerId);
    setStrokes([...strokesRef.current, stroke]);
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        className={`block w-full cursor-crosshair touch-none ${canvasClassName ?? "h-64"}`}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
        aria-label={ariaLabel}
      />
      {emptyLabel && !hasStrokes && !isDrawing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-medium text-slate-300" aria-hidden="true">
          {emptyLabel}
        </div>
      )}
    </div>
  );
});

DrawingCanvas.displayName = "DrawingCanvas";
export default DrawingCanvas;
