/**
 * CONTROL PANEL COMPONENT
 * =======================
 * 
 * UI controls for adjusting all effect parameters.
 * Organized into collapsible sections for each effect type.
 */

import React from 'react';
import type { EffectPreset } from '../engine/EffectProcessor';
import { DEFAULT_PRESETS } from '../engine/EffectProcessor';

interface ControlPanelProps {
  preset: EffectPreset;
  onPresetChange: (preset: EffectPreset) => void;
  onExport: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  preset,
  onPresetChange,
  onExport,
}) => {
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

  // Toggle switch component
  const Toggle = ({ 
    label, 
    checked, 
    onChange 
  }: { 
    label: string; 
    checked: boolean; 
    onChange: (v: boolean) => void;
  }) => (
    <label className="flex items-center justify-between py-2 cursor-pointer group">
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
    <div className="py-2">
      <div className="flex justify-between mb-1">
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
      <div className="flex items-center justify-between py-2">
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

  // Section component
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-b border-gray-800 last:border-0">
      <div className="px-4 py-3 bg-gray-900/50">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="px-4 py-2">
        {children}
      </div>
    </div>
  );

  return (
    <div className="w-80 h-full bg-gray-900 border-l border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-green-400 font-mono tracking-tight">
          grain effects
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          WebGPU-powered image processing
        </p>
      </div>

      {/* Preset selector */}
      <div className="px-4 py-3 border-b border-gray-800">
        <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
          Preset
        </label>
        <select
          value={preset.name}
          onChange={(e) => {
            const selected = DEFAULT_PRESETS.find(p => p.name === e.target.value);
            if (selected) onPresetChange({ ...selected });
          }}
          className="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-700 focus:border-green-500 focus:outline-none"
        >
          {DEFAULT_PRESETS.map(p => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Scrollable controls */}
      <div className="flex-1 overflow-y-auto">
        {/* ASCII Effect */}
        <Section title="ASCII">
          <Toggle
            label="Enable ASCII"
            checked={preset.ascii.enabled}
            onChange={(v) => updatePreset('ascii.enabled', v)}
          />
          <Slider
            label="Cell Size"
            value={preset.ascii.cellSize}
            min={4}
            max={32}
            step={1}
            onChange={(v) => updatePreset('ascii.cellSize', v)}
            suffix="px"
          />
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
        </Section>

        {/* Dithering */}
        <Section title="Dithering">
          <Toggle
            label="Enable Dithering"
            checked={preset.dithering.enabled}
            onChange={(v) => updatePreset('dithering.enabled', v)}
          />
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
            step={0.5}
            onChange={(v) => updatePreset('dithering.scale', v)}
            suffix="x"
          />
        </Section>

        {/* Pixelation */}
        <Section title="Pixelate">
          <Toggle
            label="Enable Pixelation"
            checked={preset.pixelate.enabled}
            onChange={(v) => updatePreset('pixelate.enabled', v)}
          />
          <Slider
            label="Pixel Size"
            value={preset.pixelate.pixelSize}
            min={2}
            max={64}
            step={1}
            onChange={(v) => updatePreset('pixelate.pixelSize', v)}
            suffix="px"
          />
        </Section>

        {/* CRT Effect */}
        <Section title="CRT Monitor">
          <Toggle
            label="Enable CRT"
            checked={preset.crt.enabled}
            onChange={(v) => updatePreset('crt.enabled', v)}
          />
          <Slider
            label="Scanline Intensity"
            value={preset.crt.scanlineIntensity}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => updatePreset('crt.scanlineIntensity', v)}
          />
          <Slider
            label="Vignette"
            value={preset.crt.vignetteIntensity}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) => updatePreset('crt.vignetteIntensity', v)}
          />
          <Toggle
            label="Screen Curvature"
            checked={preset.crt.enableCurvature}
            onChange={(v) => updatePreset('crt.enableCurvature', v)}
          />
        </Section>

        {/* Noise */}
        <Section title="Noise">
          <Toggle
            label="Enable Noise"
            checked={preset.noise.enabled}
            onChange={(v) => updatePreset('noise.enabled', v)}
          />
          <Slider
            label="Amount"
            value={preset.noise.amount}
            min={0}
            max={0.5}
            step={0.01}
            onChange={(v) => updatePreset('noise.amount', v)}
          />
          <Slider
            label="Animation Speed"
            value={preset.noise.speed}
            min={0}
            max={5}
            step={0.1}
            onChange={(v) => updatePreset('noise.speed', v)}
          />
        </Section>
      </div>

      {/* Export button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={onExport}
          className="w-full bg-green-600 hover:bg-green-500 text-black font-medium py-2 px-4 rounded transition-colors"
        >
          Export Image
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
