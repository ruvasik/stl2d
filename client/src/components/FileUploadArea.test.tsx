import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUploadArea } from './FileUploadArea';

describe('FileUploadArea', () => {
  it('should render upload area', () => {
    const mockCallback = vi.fn();
    render(<FileUploadArea onFileSelected={mockCallback} />);
    const uploadText = screen.queryByText(/Drag and drop your STL file/);
    expect(uploadText).toBeTruthy();
  });

  it('should display upload icon', () => {
    const mockCallback = vi.fn();
    render(<FileUploadArea onFileSelected={mockCallback} />);
    const browseText = screen.queryByText(/or click to browse/);
    expect(browseText).toBeTruthy();
  });

  it('should call callback when file is selected', () => {
    const mockCallback = vi.fn();
    render(<FileUploadArea onFileSelected={mockCallback} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDefined();

    const file = new File(['test'], 'test.stl', { type: 'application/octet-stream' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(mockCallback).toHaveBeenCalled();
  });

  it('should reject non-STL files', () => {
    const mockCallback = vi.fn();
    render(<FileUploadArea onFileSelected={mockCallback} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(mockCallback).not.toHaveBeenCalled();
    const errorText = screen.queryByText(/Please select a valid STL file/);
    expect(errorText).toBeTruthy();
  });

  it('should display file input element', () => {
    const mockCallback = vi.fn();
    render(<FileUploadArea onFileSelected={mockCallback} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.accept).toBe('.stl');
  });
});
