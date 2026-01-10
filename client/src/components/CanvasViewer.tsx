import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export interface ProjectionView {
  name: string;
  lines: Array<[[number, number], [number, number]]>;
  bbox: [number, number, number, number];
}

interface CanvasViewerProps {
  view: ProjectionView;
  width?: number;
  height?: number;
}

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
}

export const CanvasViewer: React.FC<CanvasViewerProps> = ({
  view,
  width = 600,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
  });

  // Calculate initial scale to fit bbox in canvas
  const fitToView = () => {
    const [xmin, ymin, xmax, ymax] = view.bbox;
    const bboxWidth = xmax - xmin;
    const bboxHeight = ymax - ymin;

    const scaleX = (width * 0.9) / bboxWidth;
    const scaleY = (height * 0.9) / bboxHeight;
    const scale = Math.min(scaleX, scaleY, 100); // Cap at 100x zoom

    const centerX = (xmin + xmax) / 2;
    const centerY = (ymin + ymax) / 2;

    const offsetX = width / 2 - centerX * scale;
    const offsetY = height / 2 - centerY * scale;

    setViewState({
      scale,
      offsetX,
      offsetY,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
    });
  };

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    const gridSize = 50;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(viewState.offsetX, 0);
    ctx.lineTo(viewState.offsetX, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, viewState.offsetY);
    ctx.lineTo(width, viewState.offsetY);
    ctx.stroke();

    // Draw lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;

    for (const line of view.lines) {
      const [p0, p1] = line;
      const x0 = p0[0] * viewState.scale + viewState.offsetX;
      const y0 = p0[1] * viewState.scale + viewState.offsetY;
      const x1 = p1[0] * viewState.scale + viewState.offsetX;
      const y1 = p1[1] * viewState.scale + viewState.offsetY;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }, [view, viewState, width, height]);

  // Fit to view on mount
  useEffect(() => {
    fitToView();
  }, [view]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(100, viewState.scale * zoomFactor));

    // Calculate new offset to zoom towards mouse position
    const worldX = (mouseX - viewState.offsetX) / viewState.scale;
    const worldY = (mouseY - viewState.offsetY) / viewState.scale;

    const newOffsetX = mouseX - worldX * newScale;
    const newOffsetY = mouseY - worldY * newScale;

    setViewState((prev) => ({
      ...prev,
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    }));
  };

  // Mouse drag pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setViewState((prev) => ({
      ...prev,
      isDragging: true,
      dragStartX: e.clientX,
      dragStartY: e.clientY,
    }));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!viewState.isDragging) return;

    const deltaX = e.clientX - viewState.dragStartX;
    const deltaY = e.clientY - viewState.dragStartY;

    setViewState((prev) => ({
      ...prev,
      offsetX: prev.offsetX + deltaX,
      offsetY: prev.offsetY + deltaY,
      dragStartX: e.clientX,
      dragStartY: e.clientY,
    }));
  };

  const handleMouseUp = () => {
    setViewState((prev) => ({
      ...prev,
      isDragging: false,
    }));
  };

  const handleZoomIn = () => {
    setViewState((prev) => ({
      ...prev,
      scale: Math.min(100, prev.scale * 1.2),
    }));
  };

  const handleZoomOut = () => {
    setViewState((prev) => ({
      ...prev,
      scale: Math.max(0.1, prev.scale / 1.2),
    }));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomIn}
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomOut}
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={fitToView}
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <div className="ml-auto text-sm text-gray-600">
          Scale: {viewState.scale.toFixed(2)}x
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="border border-gray-300 rounded cursor-grab active:cursor-grabbing bg-white"
      />
      <div className="text-xs text-gray-500">
        Scroll to zoom • Drag to pan • Click reset to fit view
      </div>
    </div>
  );
};
