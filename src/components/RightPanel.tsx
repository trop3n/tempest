/**
 * RIGHT PANEL COMPONENT
 * =====================
 * 
 * Contains effect settings for the currently active effect only.
 * Located on the right side of the screen.
 * 
 * Effects are mutually exclusive - only settings for the active effect are shown.
 * All sections are collapsible dropdown menus.
 */

import React, { useState } from 'react';
import type { EffectPreset, EffectType, CharacterSet } from '../engine/EffectProcessor';

interface RightPanelProps {
  preset: EffectPreset;
  onPresetChange: (preset: EffectPreset) => void;
  onExport: () => void;
  activeEffect: EffectType;
}

const RightPanel: React.FC<RightPanelProps> = ({
  preset,
  onPresetChange,
  onExport,
  activeEffect,
}) => {
  // State for collapsible sections
  const [openSections, setOpenSections] = useState({
    settings: true,
    processing: false,
    postProcessing: false,
    export: false,
  });

  // Toggle section visibility
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Helper to update nested preset values
  const updatePreset = (path: string, value: any) => {
    const keys = path.split('.');
    const newPreset = { ...preset };
    let current: any = newPreset;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    onPresetChange(newPreset);
  };

  // Slider component
  const Slider = ({
    label,
    value,
    min,
    max,
    step,
    onChange,
    suffix = '',
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
    suffix?: string;
  }) => (
    <div className="py-3">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm text-green-400 font-mono">
          {value.toFixed(step < 1 ? 2 : 0)}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );

  // Toggle component
  const Toggle = ({ 
    label, 
    checked, 
    onChange 
  }: { 
    label: string; 
    checked: boolean; 
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-center justify-between py-3 cursor-pointer group">
      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
        {label}
      </span>
      <button
        onClick={() => onChange(!checked)}
        className={`
          relative w-11 h-6 rounded-full transition-colors
          ${checked ? 'bg-green-600' : 'bg-gray-700'}
        `}
      >
        <span
          className={`
            absolute top-1 left-1 w-4 h-4 bg-white rounded-full
            transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </label>
  );

  // Color picker component
  const ColorPicker = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: [number, number, number];
    onChange: (v: [number, number, number]) => void;
  }) => {
    const rgbToHex = (rgb: [number, number, number]) => {
      return '#' + rgb.map(v => 
        Math.round(v * 255).toString(16).padStart(2, '0')
      ).join('');
    };

    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ] : [0, 0, 0];
    };

    return (
      <div className="flex items-center justify-between py-3">
        <span className="text-sm text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={rgbToHex(value)}
            onChange={(e) => onChange(hexToRgb(e.target.value))}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
          <span className="text-xs text-gray-500 font-mono">
            {rgbToHex(value).toUpperCase()}
          </span>
        </div>
      </div>
    );
  };

  // Dropdown section header component
  const DropdownSection = ({
    title,
    isOpen,
    onToggle,
    children,
  }: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-800">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
      >
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="px-4 py-4">{children}</div>}
    </div>
  );

  // Flat subheader (non-dropdown) with green left border
  const SubHeader = ({ title }: { title: string }) => (
    <div className="px-4 py-2 bg-gray-800/30 border-l-2 border-green-600 my-3 -mx-4">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {title}
      </h4>
    </div>
  );

  // Character set options
  const characterSets: { value: CharacterSet; label: string }[] = [
    { value: 'standard', label: 'Standard' },
    { value: 'blocks', label: 'Blocks' },
    { value: 'binary', label: 'Binary' },
    { value: 'detailed', label: 'Detailed' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'alphabetic', label: 'Alphabetic' },
    { value: 'numeric', label: 'Numeric' },
    { value: 'math', label: 'Math' },
    { value: 'symbols', label: 'Symbols' },
  ];

  // Render ASCII-specific settings (Scale, Spacing, Output Width, Character Set)
  const renderAsciiSettings = () => {
    if (activeEffect !== 'ascii') return null;
    
    return (
      <>
        <Slider
          label="Scale"
          value={preset.ascii.scale}
          min={0.1}
          max={2}
          step={0.01}
          onChange={(v) => updatePreset('ascii.scale', v)}
          suffix="x"
        />
        <Slider
          label="Spacing"
          value={preset.ascii.spacing}
          min={0}
          max={2}
          step={0.01}
          onChange={(v) => updatePreset('ascii.spacing', v)}
          suffix="x"
        />
        <Slider
          label="Output Width"
          value={preset.ascii.outputWidth}
          min={10}
          max={200}
          step={1}
          onChange={(v) => updatePreset('ascii.outputWidth', v)}
        />
        <div className="py-3">
          <label className="block text-sm text-gray-300 mb-2">Character Set</label>
          <select
            value={preset.ascii.characterSet}
            onChange={(e) => updatePreset('ascii.characterSet', e.target.value as CharacterSet)}
            className="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-700 focus:border-green-500 focus:outline-none"
          >
            {characterSets.map((set) => (
              <option key={set.value} value={set.value}>{set.label}</option>
            ))}
          </select>
        </div>
      </>
    );
  };

  // Render adjustments section for the active effect
  const renderAdjustments = () => {
    switch (activeEffect) {
      case 'ascii':
        return (
          <>
            <Slider
              label="Brightness"
              value={preset.ascii.brightness}
              min={-100}
              max={100}
              step={1}
              onChange={(v) => updatePreset('ascii.brightness', v)}
            />
            <Slider
              label="Contrast"
              value={preset.ascii.contrast}
              min={-100}
              max={100}
              step={1}
              onChange={(v) => updatePreset('ascii.contrast', v)}
            />
            <Slider
              label="Saturation"
              value={preset.ascii.saturation}
              min={-100}
              max={100}
              step={1}
              onChange={(v) => updatePreset('ascii.saturation', v)}
            />
            <Slider
              label="Hue Rotation"
              value={preset.ascii.hueRotation}
              min={0}
              max={360}
              step={1}
              onChange={(v) => updatePreset('ascii.hueRotation', v)}
              suffix="°"
            />
            <Slider
              label="Sharpness"
              value={preset.ascii.sharpness}
              min={0}
              max={10}
              step={1}
              onChange={(v) => updatePreset('ascii.sharpness', v)}
            />
            <Slider
              label="Gamma"
              value={preset.ascii.gamma}
              min={0.1}
              max={3}
              step={0.01}
              onChange={(v) => updatePreset('ascii.gamma', v)}
            />
          </>
        );

      case 'dithering':
        return (
          <>
            <Slider
              label="Color Levels"
              value={preset.dithering.colorLevels}
              min={2}
              max={16}
              step={1}
              onChange={(v) => updatePreset('dithering.colorLevels', v)}
            />
            <Slider
              label="Pattern Scale"
              value={preset.dithering.scale}
              min={0.5}
              max={4}
              step={0.1}
              onChange={(v) => updatePreset('dithering.scale', v)}
              suffix="x"
            />
          </>
        );

      case 'pixelate':
        return (
          <>
            <Slider
              label="Pixel Size"
              value={preset.pixelate.pixelSize}
              min={2}
              max={64}
              step={1}
              onChange={(v) => updatePreset('pixelate.pixelSize', v)}
              suffix="px"
            />
          </>
        );

      case 'crt':
        return (
          <>
            <Slider
              label="Scanline Intensity"
              value={preset.crt.scanlineIntensity}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => updatePreset('crt.scanlineIntensity', v)}
            />
            <Slider
              label="Vignette"
              value={preset.crt.vignetteIntensity}
              min={0}
              max={3}
              step={0.01}
              onChange={(v) => updatePreset('crt.vignetteIntensity', v)}
            />
            <Toggle
              label="Screen Curvature"
              checked={preset.crt.enableCurvature}
              onChange={(v) => updatePreset('crt.enableCurvature', v)}
            />
          </>
        );

      case 'noise':
        return (
          <>
            <Slider
              label="Amount"
              value={preset.noise.amount}
              min={0}
              max={0.5}
              step={0.001}
              onChange={(v) => updatePreset('noise.amount', v)}
            />
            <Slider
              label="Animation Speed"
              value={preset.noise.speed}
              min={0}
              max={5}
              step={0.01}
              onChange={(v) => updatePreset('noise.speed', v)}
            />
          </>
        );

      default:
        return (
          <p className="text-sm text-gray-500 italic">
            No adjustments for this effect
          </p>
        );
    }
  };

  // Render color section for the active effect
  const renderColorSettings = () => {
    switch (activeEffect) {
      case 'ascii':
        return (
          <>
            <ColorPicker
              label="Character Color"
              value={preset.ascii.color}
              onChange={(v) => updatePreset('ascii.color', v)}
            />
            <Toggle
              label="Use Original Colors"
              checked={preset.ascii.enableColor}
              onChange={(v) => updatePreset('ascii.enableColor', v)}
            />
          </>
        );

      default:
        return (
          <p className="text-sm text-gray-500 italic">
            No color settings for this effect
          </p>
        );
    }
  };

  return (
    <div className="w-80 h-full bg-gray-900 border-l border-gray-800 flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Settings Dropdown */}
        <DropdownSection
          title="Settings"
          isOpen={openSections.settings}
          onToggle={() => toggleSection('settings')}
        >
          {/* ASCII Subheader (flat) - only shown when ASCII is active */}
          {activeEffect === 'ascii' && (
            <>
              <SubHeader title="ASCII" />
              {renderAsciiSettings()}
            </>
          )}

          {/* Adjustments Subheader (flat) */}
          <SubHeader title="Adjustments" />
          {renderAdjustments()}

          {/* Color Subheader (flat) */}
          <SubHeader title="Color" />
          {renderColorSettings()}
        </DropdownSection>

        {/* Processing Dropdown */}
        <DropdownSection
          title="Processing"
          isOpen={openSections.processing}
          onToggle={() => toggleSection('processing')}
        >
          {/* Placeholder for processing options */}
          <p className="text-sm text-gray-500 italic">
            Processing options coming soon
          </p>
        </DropdownSection>

        {/* Post-Processing Dropdown */}
        <DropdownSection
          title="Post-Processing"
          isOpen={openSections.postProcessing}
          onToggle={() => toggleSection('postProcessing')}
        >
          {/* Placeholder for post-processing options */}
          <p className="text-sm text-gray-500 italic">
            Post-processing options coming soon
          </p>
        </DropdownSection>

        {/* Export Dropdown */}
        <DropdownSection
          title="Export"
          isOpen={openSections.export}
          onToggle={() => toggleSection('export')}
        >
          <button
            onClick={onExport}
            className="w-full bg-green-600 hover:bg-green-500 text-black font-medium py-2 px-4 rounded transition-colors"
          >
            Export Image
          </button>
        </DropdownSection>
      </div>
    </div>
  );
};

export default RightPanel;
