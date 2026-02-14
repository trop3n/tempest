/**
 * LEFT PANEL COMPONENT
 * ====================
 * 
 * Contains file input, effect selection, and presets.
 * Located on the left side of the screen.
 * 
 * Effects are MUTUALLY EXCLUSIVE - only one can be active at a time.
 * Clicking an effect activates it and disables all others.
 */

import React from 'react';
import { useDropzone } from 'react-dropzone';
import type { EffectPreset, EffectType } from '../engine/EffectProcessor';
import { DEFAULT_PRESETS } from '../engine/EffectProcessor';

interface LeftPanelProps {
  preset: EffectPreset;
  onPresetChange: (preset: EffectPreset) => void;
  onFileSelect: (file: File) => void;
  hasFile: boolean;
  onLoadAnother: () => void;
  activeEffect: EffectType;
  onActivateEffect: (effect: EffectType) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  preset,
  onPresetChange,
  onFileSelect,
  hasFile,
  onLoadAnother,
  activeEffect,
  onActivateEffect,
}) => {
  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf'],
    },
    multiple: false,
    noClick: hasFile,
  });

  // Effect list items with icons
  const effects: { id: EffectType; label: string; icon: string }[] = [
    { id: 'ascii', label: 'ASCII', icon: 'Aa' },
    { id: 'dithering', label: 'Dithering', icon: '◫' },
    { id: 'pixelate', label: 'Pixelate', icon: '⊞' },
    { id: 'crt', label: 'CRT Monitor', icon: '◯' },
    { id: 'noise', label: 'Film Grain', icon: '✦' },
  ];

  // Handle preset selection
  const handlePresetClick = (selectedPreset: EffectPreset) => {
    // Find which effect is enabled in this preset
    const active: EffectType = 
      selectedPreset.ascii.enabled ? 'ascii' :
      selectedPreset.dithering.enabled ? 'dithering' :
      selectedPreset.pixelate.enabled ? 'pixelate' :
      selectedPreset.crt.enabled ? 'crt' :
      selectedPreset.noise.enabled ? 'noise' : 'ascii';
    
    onActivateEffect(active);
    onPresetChange({ ...selectedPreset });
  };

  // Subsection header
  const SubSectionHeader = ({ title }: { title: string }) => (
    <div className="px-3 py-2">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {title}
      </h4>
    </div>
  );

  return (
    <div className="w-72 h-full bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-green-400 font-mono tracking-tight">
          grain effects
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          WebGL-powered image processing
        </p>
      </div>

      {/* File Input Section */}
      <div className="px-4 py-3 border-b border-gray-800">
        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
          Input
        </label>
        
        {hasFile ? (
          <div className="space-y-2">
            <div className="text-sm text-green-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              File loaded
            </div>
            <button
              onClick={onLoadAnother}
              className="w-full text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-3 rounded border border-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Load New File
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg cursor-pointer
              transition-all duration-200 p-4 text-center
              ${isDragActive 
                ? 'border-green-500 bg-green-500/10' 
                : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <svg
              className="w-8 h-8 mx-auto mb-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-300 mb-1">
              {isDragActive ? 'Drop here' : 'Drop or click'}
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, MP4
            </p>
          </div>
        )}
      </div>

      {/* Effect Selection Section - Mutually Exclusive */}
      <div className="border-b border-gray-800">
        <div className="px-4 py-3 bg-gray-800/50">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Select Effect
          </h3>
        </div>
        <div className="px-4 py-2">
          <div className="space-y-1">
            {effects.map((effect) => {
              const isActive = activeEffect === effect.id;
              
              return (
                <button
                  key={effect.id}
                  onClick={() => onActivateEffect(effect.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left
                    transition-all duration-150
                    ${isActive 
                      ? 'bg-green-600 text-white shadow-lg shadow-green-900/30' 
                      : 'hover:bg-gray-800 text-gray-400'
                    }
                  `}
                >
                  {/* Effect Icon */}
                  <span className={`
                    w-8 h-8 rounded flex items-center justify-center text-sm font-mono font-bold
                    ${isActive ? 'bg-white/20' : 'bg-gray-800'}
                  `}>
                    {effect.icon}
                  </span>
                  
                  {/* Effect Name */}
                  <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {effect.label}
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Presets Section - Bulleted List with Built-In and Custom headers */}
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-gray-800">
          <div className="px-4 py-3 bg-gray-800/50">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Presets
            </h3>
          </div>
          <div className="px-4 py-2">
            {/* Built-In Presets */}
            <SubSectionHeader title="Built-In" />
            <ul className="space-y-1 mb-4">
              {DEFAULT_PRESETS.map((p) => {
                const isActive = preset.name === p.name;
                return (
                  <li key={p.name}>
                    <button
                      onClick={() => handlePresetClick(p)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 rounded text-left
                        transition-all duration-150 text-sm
                        ${isActive 
                          ? 'bg-gray-700 text-green-400' 
                          : 'hover:bg-gray-800 text-gray-300'
                        }
                      `}
                    >
                      <span className={`
                        w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${isActive ? 'bg-green-400' : 'bg-gray-500'}
                      `} />
                      {p.name}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Custom Presets */}
            <SubSectionHeader title="Custom" />
            <div className="px-3 py-2 text-sm text-gray-500 italic">
              No custom presets
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
