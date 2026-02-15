/**
 * EFFECT PROCESSOR ENGINE
 * =======================
 * 
 * This module manages the WebGL/WebGPU rendering pipeline for applying
 * effects to images and video. It uses Three.js with the postprocessing
 * library to chain multiple effects together.
 * 
 * Architecture:
 * 1. Create a scene with an orthographic camera
 * 2. Load media (image/video) as a texture
 * 3. Apply a chain of post-processing effects
 * 4. Render to a canvas
 * 5. Export the result
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Import our custom shaders
import { bayerDitherShader, PALETTES } from '../shaders/dithering';
import { asciiShader } from '../shaders/ascii';
import { pixelateShader, crtShader, noiseShader } from '../shaders/retro';

/**
 * Effect type for selection
 */
export type EffectType = 'ascii' | 'dithering' | 'pixelate' | 'crt' | 'noise';

/**
 * Effect preset configuration
 */
export type CharacterSet = 'standard' | 'blocks' | 'binary' | 'detailed' | 'minimal' | 'alphabetic' | 'numeric' | 'math' | 'symbols';

export interface EffectPreset {
  name: string;
  dithering: {
    enabled: boolean;
    type: 'bayer' | 'color';
    colorLevels: number;
    scale: number;
    palette?: keyof typeof PALETTES;
  };
  ascii: {
    enabled: boolean;
    cellSize: number;
    color: [number, number, number];
    enableColor: boolean;
    scale: number;
    spacing: number;
    outputWidth: number;
    characterSet: CharacterSet;
    brightness: number;
    contrast: number;
    saturation: number;
    hueRotation: number;
    sharpness: number;
    gamma: number;
  };
  pixelate: {
    enabled: boolean;
    pixelSize: number;
  };
  crt: {
    enabled: boolean;
    scanlineIntensity: number;
    vignetteIntensity: number;
    enableCurvature: boolean;
  };
  noise: {
    enabled: boolean;
    amount: number;
    speed: number;
  };
}

/**
 * Default presets
 */
export const DEFAULT_PRESETS: EffectPreset[] = [
  {
    name: 'Matrix ASCII',
    dithering: { enabled: false, type: 'bayer', colorLevels: 4, scale: 1 },
    ascii: { enabled: true, cellSize: 8, color: [0, 1, 0], enableColor: false, scale: 1, spacing: 1, outputWidth: 100, characterSet: 'standard', brightness: 0, contrast: 0, saturation: 0, hueRotation: 0, sharpness: 0, gamma: 1.0 },
    pixelate: { enabled: false, pixelSize: 4 },
    crt: { enabled: true, scanlineIntensity: 0.3, vignetteIntensity: 1.2, enableCurvature: false },
    noise: { enabled: true, amount: 0.05, speed: 0.5 },
  },
  {
    name: 'Game Boy',
    dithering: { enabled: true, type: 'color', colorLevels: 4, scale: 1, palette: 'GAMEBOY' },
    ascii: { enabled: false, cellSize: 8, color: [0.61, 0.73, 0.35], enableColor: false, scale: 1, spacing: 1, outputWidth: 100, characterSet: 'standard', brightness: 0, contrast: 0, saturation: 0, hueRotation: 0, sharpness: 0, gamma: 1.0 },
    pixelate: { enabled: true, pixelSize: 4 },
    crt: { enabled: false, scanlineIntensity: 0.5, vignetteIntensity: 1.5, enableCurvature: false },
    noise: { enabled: false, amount: 0.1, speed: 0 },
  },
  {
    name: 'Retro CRT',
    dithering: { enabled: false, type: 'bayer', colorLevels: 8, scale: 1 },
    ascii: { enabled: false, cellSize: 8, color: [0, 1, 0], enableColor: false, scale: 1, spacing: 1, outputWidth: 100, characterSet: 'standard', brightness: 0, contrast: 0, saturation: 0, hueRotation: 0, sharpness: 0, gamma: 1.0 },
    pixelate: { enabled: false, pixelSize: 4 },
    crt: { enabled: true, scanlineIntensity: 0.6, vignetteIntensity: 2.0, enableCurvature: true },
    noise: { enabled: true, amount: 0.08, speed: 2.0 },
  },
  {
    name: 'Halftone',
    dithering: { enabled: false, type: 'bayer', colorLevels: 4, scale: 1 },
    ascii: { enabled: false, cellSize: 8, color: [0, 0, 0], enableColor: false, scale: 1, spacing: 1, outputWidth: 100, characterSet: 'standard', brightness: 0, contrast: 0, saturation: 0, hueRotation: 0, sharpness: 0, gamma: 1.0 },
    pixelate: { enabled: true, pixelSize: 6 },
    crt: { enabled: false, scanlineIntensity: 0.5, vignetteIntensity: 1.5, enableCurvature: false },
    noise: { enabled: false, amount: 0.1, speed: 0 },
  },
  {
    name: 'Clean',
    dithering: { enabled: false, type: 'bayer', colorLevels: 4, scale: 1 },
    ascii: { enabled: false, cellSize: 8, color: [1, 1, 1], enableColor: true, scale: 1, spacing: 1, outputWidth: 100, characterSet: 'standard', brightness: 0, contrast: 0, saturation: 0, hueRotation: 0, sharpness: 0, gamma: 1.0 },
    pixelate: { enabled: false, pixelSize: 4 },
    crt: { enabled: false, scanlineIntensity: 0.5, vignetteIntensity: 1.5, enableCurvature: false },
    noise: { enabled: false, amount: 0.1, speed: 0 },
  },
];

/**
 * Main effect processor class
 */
export class EffectProcessor {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private composer: EffectComposer;
  private texture: THREE.Texture | null = null;
  private material: THREE.MeshBasicMaterial;
  private mesh: THREE.Mesh;
  
  // Shader passes
  private pixelatePass: ShaderPass;
  private ditherPass: ShaderPass;
  private asciiPass: ShaderPass;
  private crtPass: ShaderPass;
  private noisePass: ShaderPass;
  
  private animationId: number | null = null;
  private time: number = 0;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    // Initialize Three.js renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      preserveDrawingBuffer: true, // Required for export
    });
    
    // Create scene with orthographic camera for 2D processing
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 1;
    
    // Create a full-screen quad for rendering the texture
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.MeshBasicMaterial();
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
    
    // Setup effect composer
    this.composer = new EffectComposer(this.renderer);
    
    // Add render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Initialize shader passes
    this.pixelatePass = new ShaderPass(pixelateShader);
    this.composer.addPass(this.pixelatePass);
    
    this.ditherPass = new ShaderPass(bayerDitherShader);
    this.composer.addPass(this.ditherPass);
    
    this.asciiPass = new ShaderPass(asciiShader);
    this.composer.addPass(this.asciiPass);
    
    this.crtPass = new ShaderPass(crtShader);
    this.composer.addPass(this.crtPass);
    
    this.noisePass = new ShaderPass(noiseShader);
    this.composer.addPass(this.noisePass);
    
    // Handle resize
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }
  
  /**
   * Handle canvas resize
   */
  private handleResize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
    
    // Update resolution uniforms
    const resolution: [number, number] = [width, height];
    this.pixelatePass.uniforms.resolution.value = resolution;
    this.ditherPass.uniforms.resolution.value = resolution;
    this.asciiPass.uniforms.resolution.value = resolution;
    this.crtPass.uniforms.resolution.value = resolution;
    this.noisePass.uniforms.resolution.value = resolution;
  }
  
  /**
   * Load an image from a file or URL
   */
  async loadImage(source: File | string): Promise<void> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      
      const url = typeof source === 'string' ? source : URL.createObjectURL(source);
      
      loader.load(
        url,
        (texture) => {
          if (this.texture) {
            this.texture.dispose();
          }
          
          this.texture = texture;
          this.material.map = texture;
          this.material.needsUpdate = true;
          
          // Adjust canvas size to match image aspect ratio
          const imgAspect = texture.image.width / texture.image.height;
          const containerAspect = this.canvas.clientWidth / this.canvas.clientHeight;
          
          if (imgAspect > containerAspect) {
            // Image is wider
            const scale = containerAspect / imgAspect;
            this.mesh.scale.set(1, scale, 1);
          } else {
            // Image is taller
            const scale = imgAspect / containerAspect;
            this.mesh.scale.set(scale, 1, 1);
          }
          
          resolve();
        },
        undefined,
        (error) => reject(error)
      );
    });
  }
  
  /**
   * Load a video file
   */
  async loadVideo(file: File): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.loop = true;
      video.muted = true;
      video.crossOrigin = 'anonymous';
      
      video.onloadeddata = () => {
        if (this.texture) {
          this.texture.dispose();
        }
        
        this.texture = new THREE.VideoTexture(video);
        this.material.map = this.texture;
        this.material.needsUpdate = true;
        
        video.play();
        resolve(video);
      };
      
      video.onerror = reject;
    });
  }
  
  /**
   * Apply a preset configuration
   */
  applyPreset(preset: EffectPreset) {
    // Dithering
    this.ditherPass.uniforms.enable.value = preset.dithering.enabled;
    this.ditherPass.uniforms.colorLevels.value = preset.dithering.colorLevels;
    this.ditherPass.uniforms.scale.value = preset.dithering.scale;
    
    if (preset.dithering.type === 'color' && preset.dithering.palette) {
      const palette = PALETTES[preset.dithering.palette];
      // Convert palette to uniform format
      const paletteUniform = palette.map(c => [c[0], c[1], c[2]]).flat();
      // Pad to 8 colors if needed
      while (paletteUniform.length < 24) {
        paletteUniform.push(0, 0, 0);
      }
      // Update shader (would need to switch to colorDitherShader)
    }
    
    // ASCII
    this.asciiPass.uniforms.enable.value = preset.ascii.enabled;
    this.asciiPass.uniforms.cellSize.value = preset.ascii.cellSize;
    this.asciiPass.uniforms.color.value = preset.ascii.color;
    this.asciiPass.uniforms.enableColor.value = preset.ascii.enableColor;
    
    // Pixelate
    this.pixelatePass.uniforms.enable.value = preset.pixelate.enabled;
    this.pixelatePass.uniforms.pixelSize.value = preset.pixelate.pixelSize;
    
    // CRT
    this.crtPass.uniforms.enable.value = preset.crt.enabled;
    this.crtPass.uniforms.scanlineIntensity.value = preset.crt.scanlineIntensity;
    this.crtPass.uniforms.vignetteIntensity.value = preset.crt.vignetteIntensity;
    this.crtPass.uniforms.enableCurvature.value = preset.crt.enableCurvature;
    
    // Noise
    this.noisePass.uniforms.enable.value = preset.noise.enabled;
    this.noisePass.uniforms.amount.value = preset.noise.amount;
    this.noisePass.uniforms.speed.value = preset.noise.speed;
  }
  
  /**
   * Update individual effect parameters
   */
  setDithering(params: Partial<EffectPreset['dithering']>) {
    if (params.enabled !== undefined) this.ditherPass.uniforms.enable.value = params.enabled;
    if (params.colorLevels !== undefined) this.ditherPass.uniforms.colorLevels.value = params.colorLevels;
    if (params.scale !== undefined) this.ditherPass.uniforms.scale.value = params.scale;
  }
  
  setAscii(params: Partial<EffectPreset['ascii']>) {
    if (params.enabled !== undefined) this.asciiPass.uniforms.enable.value = params.enabled;
    if (params.cellSize !== undefined) this.asciiPass.uniforms.cellSize.value = params.cellSize;
    if (params.color !== undefined) this.asciiPass.uniforms.color.value = params.color;
    if (params.enableColor !== undefined) this.asciiPass.uniforms.enableColor.value = params.enableColor;
  }
  
  setPixelate(params: Partial<EffectPreset['pixelate']>) {
    if (params.enabled !== undefined) this.pixelatePass.uniforms.enable.value = params.enabled;
    if (params.pixelSize !== undefined) this.pixelatePass.uniforms.pixelSize.value = params.pixelSize;
  }
  
  setCrt(params: Partial<EffectPreset['crt']>) {
    if (params.enabled !== undefined) this.crtPass.uniforms.enable.value = params.enabled;
    if (params.scanlineIntensity !== undefined) this.crtPass.uniforms.scanlineIntensity.value = params.scanlineIntensity;
    if (params.vignetteIntensity !== undefined) this.crtPass.uniforms.vignetteIntensity.value = params.vignetteIntensity;
    if (params.enableCurvature !== undefined) this.crtPass.uniforms.enableCurvature.value = params.enableCurvature;
  }
  
  setNoise(params: Partial<EffectPreset['noise']>) {
    if (params.enabled !== undefined) this.noisePass.uniforms.enable.value = params.enabled;
    if (params.amount !== undefined) this.noisePass.uniforms.amount.value = params.amount;
    if (params.speed !== undefined) this.noisePass.uniforms.speed.value = params.speed;
  }
  
  /**
   * Start the render loop
   */
  start() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      // Update time for animated effects
      this.time += 0.016;
      this.noisePass.uniforms.time.value = this.time;
      
      // Update video texture if playing
      if (this.texture && (this.texture as THREE.VideoTexture).update) {
        (this.texture as THREE.VideoTexture).update();
      }
      
      this.composer.render();
    };
    
    animate();
  }
  
  /**
   * Stop the render loop
   */
  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  /**
   * Export the current frame as an image
   */
  exportImage(type: string = 'image/png', quality?: number): string {
    this.composer.render();
    return this.canvas.toDataURL(type, quality);
  }
  
  /**
   * Dispose of resources
   */
  dispose() {
    this.stop();
    
    if (this.texture) {
      this.texture.dispose();
    }
    
    this.material.dispose();
    this.mesh.geometry.dispose();
    this.renderer.dispose();
    this.composer.dispose();
  }
}

export default EffectProcessor;
