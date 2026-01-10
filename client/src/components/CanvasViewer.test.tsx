import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CanvasViewer } from './CanvasViewer';
import type { ProjectionView } from '@shared/types';

const mockProjection: ProjectionView = {
  name: 'front',
  lines: [
    [[0, 0], [1, 0]],
    [[1, 0], [1, 1]],
    [[1, 1], [0, 1]],
    [[0, 1], [0, 0]],
  ],
  bbox: [-0.5, -0.5, 1.5, 1.5],
};

describe('CanvasViewer', () => {
  it('should render canvas element', () => {
    render(<CanvasViewer view={mockProjection} width={600} height={600} />);
    const canvases = document.querySelectorAll('canvas');
    expect(canvases.length).toBeGreaterThan(0);
  });

  it('should render control buttons', () => {
    render(<CanvasViewer view={mockProjection} width={600} height={600} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('should display scale information', () => {
    render(<CanvasViewer view={mockProjection} width={600} height={600} />);
    const scaleText = screen.queryByText(/Scale:/);
    expect(scaleText).toBeTruthy();
  });

  it('should display help text', () => {
    render(<CanvasViewer view={mockProjection} width={600} height={600} />);
    const helpText = screen.queryByText(/Scroll to zoom/);
    expect(helpText).toBeTruthy();
  });

  it('should accept custom dimensions', () => {
    const { container } = render(
      <CanvasViewer view={mockProjection} width={800} height={600} />
    );
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).toBeDefined();
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });
});
