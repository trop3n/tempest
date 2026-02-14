/**
 * MAIN APP COMPONENT
 * ==================
 * 
 * The root component that orchestrates the entire application:
 * - File loading and management
 * - Effect processing (mutually exclusive - only one effect at a time)
 * - UI layout (3-column: Left Panel | Image Viewer | Right Panel)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import FileDropzone from './components/FileDropzone';
import { EffectProcessor, type EffectPreset, DEFAULT_PRESETS, type EffectType } from './engine/EffectProcessor';

function App() {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processorRef = useRef<EffectProcessor | null>(null);
  
  // State
  const [hasFile, setHasFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<EffectPreset>(DEFAULT_PRESETS[0]);
  const [activeEffect, setActiveEffect] = useState<EffectType>('ascii');

  // Initialize effect processor
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const processor = new EffectProcessor(canvasRef.current);
    processorRef.current = processor;
    processor.start();
    
    return () => {
      processor.dispose();
      processorRef.current = null;
    };
  }, []);

  // Update effects when preset changes
  useEffect(() => {
    if (processorRef.current) {
      processorRef.current.applyPreset(preset);
    }
  }, [preset]);

  // Handle activating a single effect (disables all others)
  const handleActivateEffect = useCallback((effect: EffectType) => {
    setActiveEffect(effect);
    
    // Create new preset with only this effect enabled
    const newPreset: EffectPreset = {
      ...preset,
      ascii: { ...preset.ascii, enabled: effect === 'ascii' },
      dithering: { ...preset.dithering, enabled: effect === 'dithering' },
      pixelate: { ...preset.pixelate, enabled: effect === 'pixelate' },
      crt: { ...preset.crt, enabled: effect === 'crt' },
      noise: { ...preset.noise, enabled: effect === 'noise' },
    };
    
    setPreset(newPreset);
    
    if (processorRef.current) {
      processorRef.current.applyPreset(newPreset);
    }
  }, [preset]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const processor = processorRef.current;
      if (!processor) throw new Error('Processor not initialized');
      
      // Check if it's a video
      if (file.type.startsWith('video/')) {
        await processor.loadVideo(file);
      } else {
        await processor.loadImage(file);
      }
      
      setHasFile(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
      console.error('File load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    const processor = processorRef.current;
    if (!processor) return;
    
    const dataUrl = processor.exportImage('image/png');
    
    // Create download link
    const link = document.createElement('a');
    link.download = `grain-effects-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  // Handle load another file
  const handleLoadAnother = useCallback(() => {
    setHasFile(false);
    setError(null);
  }, []);

  return (
    <div className="flex h-screen bg-[#2d2d2d] text-gray-200 overflow-hidden">
      {/* Left Panel - Input, Presets, Effect Selection */}
      <LeftPanel
        preset={preset}
        onPresetChange={setPreset}
        onFileSelect={handleFileSelect}
        hasFile={hasFile}
        onLoadAnother={handleLoadAnother}
        activeEffect={activeEffect}
        onActivateEffect={handleActivateEffect}
      />

      {/* Center - Image/Video Viewer */}
      <div className="flex-1 flex flex-col relative">
        {/* Toolbar */}
        <div className="h-12 border-b border-gray-700 flex items-center justify-between px-4 bg-[#252525]">
          <div className="flex items-center gap-4">
            {/* Left side - can add breadcrumbs or file info here */}
          </div>
          
          {/* Center - info */}
          <div className="text-xs text-gray-500">
            {hasFile ? 'Drag to pan • Scroll to zoom' : 'Drop an image or video to start'}
          </div>

          {/* Right side - can add view options here */}
          <div className="flex items-center gap-2">
            {/* View options can go here */}
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 relative bg-[#1a1a1a]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-green-400">Processing...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 max-w-md">
                <p className="text-red-400 font-medium mb-1">Error</p>
                <p className="text-red-300 text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          
          {/* File dropzone overlay - shown when no file */}
          {!hasFile && (
            <div className="absolute inset-8 z-10">
              <FileDropzone onFileSelect={handleFileSelect} />
            </div>
          )}
          
          {/* Canvas - always rendered but hidden until file loaded */}
          <canvas
            ref={canvasRef}
            className={`w-full h-full block transition-opacity duration-300 ${hasFile ? 'opacity-100' : 'opacity-0'}`}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>

      {/* Right Panel - Effect Settings */}
      <RightPanel
        preset={preset}
        onPresetChange={setPreset}
        onExport={handleExport}
        activeEffect={activeEffect}
      />
    </div>
  );
}

export default App;
