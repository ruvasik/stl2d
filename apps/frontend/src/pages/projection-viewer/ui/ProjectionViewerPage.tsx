import { useState } from 'react';
import { toast } from 'sonner';
import { VIEW_NAMES, VIEW_LABELS, type ProjectionView, type ViewName } from '@stl2d/contracts';
import { trpc } from '@shared/api';
import { Button } from '@shared/ui';
import { FileUploadArea } from '@features/upload-stl';
import { CanvasViewer } from '@widgets/canvas-viewer';

export function ProjectionViewerPage() {
  const [selectedView, setSelectedView] = useState<ViewName>('front');
  const [projections, setProjections] = useState<ProjectionView[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const uploadMutation = trpc.stl.uploadAndProcess.useMutation({
    onSuccess: (data) => {
      setProjections(data.views);
      setSelectedView('front');
      toast.success('STL processed successfully!');
      setIsProcessing(false);
    },
    onError: (error) => {
      toast.error(`Processing failed: ${error.message}`);
      setIsProcessing(false);
    },
  });

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
      const base64 = btoa(binary);

      uploadMutation.mutate({
        fileData: base64,
        fileName: file.name,
      });
    } catch {
      toast.error('Failed to read file');
      setIsProcessing(false);
    }
  };

  const currentView = projections?.find((v) => v.name === selectedView);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              STL to 2D Projections Viewer
            </h1>
            <p className="text-gray-600">
              Upload an STL file to generate orthogonal 2D drawing projections
            </p>
          </div>

          {!projections ? (
            // Upload Section
            <div className="bg-white rounded-lg shadow-md p-8">
              <FileUploadArea
                onFileSelected={handleFileSelected}
                isLoading={isProcessing}
                maxSizeMB={50}
              />

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">About this tool</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Generates 6 standard orthogonal views: front, back, left, right, top, and bottom</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Supports both ASCII and Binary STL formats</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Automatically removes hidden lines and shows only visible edges</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Maximum file size: 50 MB</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Ideal for visualization, documentation, and design review</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            // Viewer Section
            <div className="space-y-6">
              {/* View Selector */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select View</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {VIEW_NAMES.map((viewName) => (
                    <Button
                      key={viewName}
                      variant={selectedView === viewName ? 'default' : 'outline'}
                      onClick={() => setSelectedView(viewName)}
                      className="text-xs"
                    >
                      {VIEW_LABELS[viewName]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Canvas Viewer */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {VIEW_LABELS[selectedView]}
                </h2>
                {currentView && (
                  <div className="flex justify-center">
                    <CanvasViewer view={currentView} width={700} height={700} />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => {
                    setProjections(null);
                    setSelectedView('front');
                  }}
                  variant="outline"
                >
                  Upload Another File
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
