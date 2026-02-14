/**
 * RETRO EFFECTS SHADERS
 * =====================
 * 
 * Collection of retro/computer graphics effects:
 * - Pixelation: Reduces resolution for retro look
 * - Scanlines: CRT monitor horizontal lines
 * - CRT curvature: Barrel distortion like old TVs
 * - Chromatic aberration: Color channel separation
 * - Vignette: Darkening at edges
 * - Noise: Analog signal noise
 */

/**
 * Pixelation Shader
 * 
 * Reduces effective resolution by snapping UV coordinates
 * to a coarser grid. The key is quantizing the UV coordinates.
 */
export const pixelateShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: [1, 1] },
    pixelSize: { value: 4.0 }, // Size of each "pixel" in screen pixels
    enable: { value: true },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float pixelSize;
    uniform bool enable;
    
    varying vec2 vUv;
    
    void main() {
      if (!enable) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }
      
      // Calculate pixel size in normalized UV coordinates
      vec2 pixelSizeUv = pixelSize / resolution;
      
      // Snap UV to pixel grid
      // 1. Divide UV by pixel size to get grid coordinates
      // 2. Floor to snap to grid cell
      // 3. Multiply back by pixel size to get UV
      vec2 uvPixel = pixelSizeUv * floor(vUv / pixelSizeUv);
      
      // Sample at the snapped coordinate
      gl_FragColor = texture2D(tDiffuse, uvPixel + pixelSizeUv * 0.5);
    }
  `
};

/**
 * CRT Monitor Effect Shader
 * 
 * Simulates old CRT television/monitor look with:
 * - Scanlines (horizontal lines)
 * - Phosphor glow (subtle blur)
 * - Vignette (edge darkening)
 * - Optional curvature (barrel distortion)
 */
export const crtShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: [1, 1] },
    scanlineIntensity: { value: 0.5 },
    scanlineCount: { value: 400.0 },
    vignetteIntensity: { value: 1.5 },
    curvature: { value: 0.1 }, // 0 = flat, higher = more curve
    enableScanlines: { value: true },
    enableVignette: { value: true },
    enableCurvature: { value: false },
    enable: { value: true },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float scanlineIntensity;
    uniform float scanlineCount;
    uniform float vignetteIntensity;
    uniform float curvature;
    uniform bool enableScanlines;
    uniform bool enableVignette;
    uniform bool enableCurvature;
    uniform bool enable;
    
    varying vec2 vUv;
    
    // Apply barrel distortion for CRT curve effect
    vec2 curveUV(vec2 uv, float amount) {
      vec2 centered = uv - 0.5;
      float dist = length(centered);
      float distortion = 1.0 + amount * dist * dist;
      return centered * distortion + 0.5;
    }
    
    void main() {
      if (!enable) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }
      
      vec2 uv = vUv;
      
      // Apply curvature if enabled
      if (enableCurvature) {
        uv = curveUV(uv, curvature);
        
        // Discard pixels outside the curved screen
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }
      }
      
      vec4 color = texture2D(tDiffuse, uv);
      
      // Scanlines
      if (enableScanlines) {
        float scanline = sin(uv.y * scanlineCount * 3.14159) * 0.5 + 0.5;
        scanline = 1.0 - (scanline * scanlineIntensity);
        color.rgb *= scanline;
      }
      
      // Vignette
      if (enableVignette) {
        vec2 centered = uv - 0.5;
        float dist = length(centered);
        float vignette = 1.0 - dist * vignetteIntensity;
        vignette = smoothstep(0.0, 1.0, vignette);
        color.rgb *= vignette;
      }
      
      gl_FragColor = color;
    }
  `
};

/**
 * Chromatic Aberration Shader
 * 
 * Simulates lens distortion by offsetting color channels.
 * Common in cheap lenses and used for stylistic effects.
 */
export const chromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: [1, 1] },
    amount: { value: 2.0 }, // Pixel offset amount
    angle: { value: 0.0 },  // Direction of aberration (radians)
    enable: { value: true },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float amount;
    uniform float angle;
    uniform bool enable;
    
    varying vec2 vUv;
    
    void main() {
      if (!enable) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }
      
      // Calculate offset direction
      vec2 offset = vec2(cos(angle), sin(angle)) * amount / resolution;
      
      // Sample each channel with different offsets
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `
};

/**
 * Film Grain / Noise Shader
 * 
 * Adds animated or static noise to simulate:
 * - Film grain
 * - Analog video noise
 * - VHS artifacts
 */
export const noiseShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: [1, 1] },
    amount: { value: 0.1 },     // Noise intensity
    speed: { value: 1.0 },      // Animation speed (0 = static)
    time: { value: 0.0 },       // Time uniform for animation
    enable: { value: true },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float amount;
    uniform float speed;
    uniform float time;
    uniform bool enable;
    
    varying vec2 vUv;
    
    // Pseudo-random function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    // 2D noise function
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      if (!enable) {
        gl_FragColor = color;
        return;
      }
      
      // Generate noise
      vec2 noiseCoord = vUv * resolution * 0.5;
      if (speed > 0.0) {
        noiseCoord += time * speed;
      }
      
      float n = noise(noiseCoord);
      n = n * 2.0 - 1.0; // Remap to [-1, 1]
      
      // Apply noise
      color.rgb += n * amount;
      
      gl_FragColor = color;
    }
  `
};

/**
 * Halftone Shader
 * 
 * Creates the classic newspaper/magazine printing look
 * using dots of varying sizes based on brightness.
 */
export const halftoneShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: [1, 1] },
    scale: { value: 8.0 },      // Size of halftone dots
    angle: { value: 0.0 },      // Rotation angle
    enable: { value: true },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float scale;
    uniform float angle;
    uniform bool enable;
    
    varying vec2 vUv;
    
    void main() {
      if (!enable) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }
      
      vec4 color = texture2D(tDiffuse, vUv);
      float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      
      // Create rotated grid
      float s = sin(angle);
      float c = cos(angle);
      mat2 rotation = mat2(c, -s, s, c);
      
      vec2 uv = vUv * resolution;
      vec2 rotatedUv = rotation * uv;
      
      // Calculate grid cell
      vec2 cell = floor(rotatedUv / scale);
      vec2 cellFract = fract(rotatedUv / scale);
      
      // Sample at cell center for consistent color per dot
      vec2 cellCenter = (cell + 0.5) * scale;
      vec2 sampleUv = inverse(rotation) * cellCenter / resolution;
      vec4 cellColor = texture2D(tDiffuse, sampleUv);
      float cellLuma = dot(cellColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      
      // Dot size based on brightness (darker = larger dot)
      float dotSize = 1.0 - cellLuma;
      float dist = distance(cellFract, vec2(0.5));
      
      // Draw dot
      float dotMask = 1.0 - smoothstep(dotSize * 0.5 - 0.1, dotSize * 0.5, dist);
      
      vec3 finalColor = cellColor.rgb * dotMask;
      
      gl_FragColor = vec4(finalColor, color.a);
    }
  `
};

export default {
  pixelateShader,
  crtShader,
  chromaticAberrationShader,
  noiseShader,
  halftoneShader,
};
