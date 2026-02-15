/**
 * ASCII ART SHADER
 * ================
 * 
 * This shader converts an image to ASCII art with full image processing controls:
 * - Brightness, Contrast, Saturation, Hue Rotation, Sharpness, Gamma
 * - Scale, Spacing, Output Width
 * - Multiple Character Sets
 */

/**
 * Character set definitions for different ASCII styles
 */
export const ASCII_CHAR_SETS: Record<string, string> = {
  // Standard 10-level ASCII ramp (dark to light)
  standard: ' .:-=+*#%@',
  
  // Block characters for smooth gradients
  blocks: ' ░▒▓█',
  
  // Binary (just two characters)
  binary: ' 01',
  
  // Detailed 16-level ramp
  detailed: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  
  // Minimal high contrast
  minimal: ' .oO',
  
  // Alphabetic characters
  alphabetic: ' abcdefghijklmnopqrstuvwxyz',
  
  // Numeric characters
  numeric: ' 0123456789',
  
  // Math symbols
  math: ' .+-*/=<>^~',
  
  // Various symbols
  symbols: ' .!@#$%&*()_+-=[]{}|;:,.<>?',
};

/**
 * Main ASCII Shader with full image processing pipeline
 */
export const asciiShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: [1, 1] },
    
    // ASCII parameters
    cellSize: { value: 8.0 },
    color: { value: [0.0, 1.0, 0.0] },
    enableColor: { value: false },
    enable: { value: true },
    
    // Scale, Spacing, Output Width
    scale: { value: 1.0 },
    spacing: { value: 1.0 },
    outputWidth: { value: 100.0 },
    
    // Character set (0-8 mapped to different sets)
    characterSet: { value: 0 },
    
    // Image processing
    brightness: { value: 0.0 },
    contrast: { value: 0.0 },
    saturation: { value: 0.0 },
    hueRotation: { value: 0.0 },
    sharpness: { value: 0.0 },
    gamma: { value: 1.0 },
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
    uniform float cellSize;
    uniform vec3 color;
    uniform bool enableColor;
    uniform bool enable;
    
    uniform float scale;
    uniform float spacing;
    uniform float outputWidth;
    uniform float characterSet;
    
    uniform float brightness;
    uniform float contrast;
    uniform float saturation;
    uniform float hueRotation;
    uniform float sharpness;
    uniform float gamma;
    
    varying vec2 vUv;
    
    // RGB to HSV conversion
    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
    
    // HSV to RGB conversion
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    // Apply image processing pipeline
    vec3 processImage(vec3 col) {
      // Brightness (-100 to 100, mapped to -1 to 1)
      col += brightness / 100.0;
      
      // Contrast (-100 to 100)
      // Normalize to -1 to 1 range for calculation
      float contrastFactor = (contrast + 100.0) / 100.0;
      col = (col - 0.5) * contrastFactor + 0.5;
      
      // Saturation (-100 to 100)
      float satFactor = (saturation + 100.0) / 100.0;
      vec3 gray = vec3(dot(col, vec3(0.2126, 0.7152, 0.0722)));
      col = mix(gray, col, satFactor);
      
      // Hue Rotation (0 to 360 degrees)
      if (hueRotation > 0.0) {
        vec3 hsv = rgb2hsv(col);
        hsv.x += hueRotation / 360.0;
        hsv.x = fract(hsv.x);
        col = hsv2rgb(hsv);
      }
      
      // Gamma (0.1 to 3.0, 1.0 is neutral)
      col = pow(max(col, 0.0), vec3(1.0 / gamma));
      
      // Clamp to valid range
      col = clamp(col, 0.0, 1.0);
      
      return col;
    }
    
    // Sharpness kernel
    vec3 applySharpness(sampler2D tex, vec2 uv, vec2 texelSize, float amount) {
      if (amount <= 0.0) return texture2D(tex, uv).rgb;
      
      vec3 center = texture2D(tex, uv).rgb;
      vec3 left = texture2D(tex, uv - vec2(texelSize.x, 0.0)).rgb;
      vec3 right = texture2D(tex, uv + vec2(texelSize.x, 0.0)).rgb;
      vec3 up = texture2D(tex, uv - vec2(0.0, texelSize.y)).rgb;
      vec3 down = texture2D(tex, uv + vec2(0.0, texelSize.y)).rgb;
      
      // Laplacian sharpening
      float sharp = amount / 10.0;
      vec3 sharpened = center * (1.0 + 4.0 * sharp) - (left + right + up + down) * sharp;
      
      return clamp(sharpened, 0.0, 1.0);
    }
    
    // Get character pattern based on character set and index
    float getCharPattern(float charIndex, vec2 gridPos, float setIndex) {
      float x = floor(gridPos.x);
      float y = floor(gridPos.y);
      float row = y;
      float col = 4.0 - x;
      
      // Select character set
      int setIdx = int(setIndex);
      
      // Standard set (10 characters)
      if (setIdx == 0) {
        // Space (darkest)
        if (charIndex < 0.5) return 0.0;
        // Period '.'
        if (charIndex < 1.5) return (row == 5.0 && col == 2.0) ? 1.0 : 0.0;
        // Colon ':'
        if (charIndex < 2.5) return ((row == 2.0 || row == 4.0) && col == 2.0) ? 1.0 : 0.0;
        // Dash '-'
        if (charIndex < 3.5) return (row == 3.0 && col >= 1.0 && col <= 3.0) ? 1.0 : 0.0;
        // Equals '='
        if (charIndex < 4.5) return ((row == 2.0 || row == 4.0) && col >= 1.0 && col <= 3.0) ? 1.0 : 0.0;
        // Plus '+'
        if (charIndex < 5.5) return ((row == 3.0 && col >= 1.0 && col <= 3.0) ||
                (col == 2.0 && row >= 2.0 && row <= 4.0)) ? 1.0 : 0.0;
        // Asterisk '*'
        if (charIndex < 6.5) return ((row == 3.0 && col >= 1.0 && col <= 3.0) ||
                (col == 2.0 && row >= 2.0 && row <= 4.0) ||
                (row == col && row >= 2.0 && row <= 4.0) ||
                (row + col == 4.0 && row >= 2.0 && row <= 4.0)) ? 1.0 : 0.0;
        // Hash '#'
        if (charIndex < 7.5) return (((row == 2.0 || row == 4.0) && col >= 0.0 && col <= 4.0) ||
                ((col == 1.0 || col == 3.0) && row >= 1.0 && row <= 5.0)) ? 1.0 : 0.0;
        // Percent '%'
        if (charIndex < 8.5) return ((row == 0.0 && (col == 0.0 || col == 4.0)) ||
                (row == 6.0 && (col == 0.0 || col == 4.0)) ||
                (row + col == 6.0)) ? 1.0 : 0.0;
        // At '@'
        if (charIndex < 9.5) return ((row == 0.0 && col >= 1.0 && col <= 3.0) ||
                (row == 5.0 && col >= 1.0 && col <= 3.0) ||
                (col == 0.0 && row >= 1.0 && row <= 4.0) ||
                (col == 4.0 && row >= 1.0 && row <= 2.0) ||
                (row == 3.0 && col == 3.0) ||
                (row == 2.0 && col >= 2.0 && col <= 3.0)) ? 1.0 : 0.0;
        // Full block
        return 1.0;
      }
      
      // Blocks set (4 characters)
      else if (setIdx == 1) {
        float blockIndex = floor(charIndex / 2.5);
        if (blockIndex < 0.5) return 0.0;
        if (blockIndex < 1.5) return 0.25;
        if (blockIndex < 2.5) return 0.5;
        if (blockIndex < 3.5) return 0.75;
        return 1.0;
      }
      
      // Binary set (2 characters)
      else if (setIdx == 2) {
        if (charIndex < 5.0) {
          // Zero '0'
          return ((row == 0.0 || row == 6.0) && col >= 1.0 && col <= 3.0) ||
                 ((col == 0.0 || col == 4.0) && row >= 1.0 && row <= 5.0) ? 1.0 : 0.0;
        } else {
          // One '1'
          return (col == 2.0) || (row == 6.0 && col >= 1.0 && col <= 3.0) ||
                 (row == 1.0 && col == 1.0) ? 1.0 : 0.0;
        }
      }
      
      // Detailed set - use density based on index
      else if (setIdx == 3) {
        float density = charIndex / 10.0;
        float d = distance(vec2(col, row), vec2(2.0, 3.0));
        return d < (2.0 * density) ? 1.0 : 0.0;
      }
      
      // Minimal set (3 characters)
      else if (setIdx == 4) {
        float minIndex = floor(charIndex / 3.33);
        if (minIndex < 0.5) return 0.0;
        if (minIndex < 1.5) {
          float d = distance(vec2(col, row), vec2(2.0, 3.0));
          return d < 1.0 ? 1.0 : 0.0;
        }
        if (minIndex < 2.5) {
          float d = distance(vec2(col, row), vec2(2.0, 3.0));
          return d < 2.0 ? 1.0 : 0.0;
        }
        return 1.0;
      }
      
      // Alphabetic set - use letter shapes based on brightness
      else if (setIdx == 5) {
        float letterIndex = floor(charIndex);
        // Simple circle pattern that varies with index
        float d = distance(vec2(col, row), vec2(2.0, 3.0));
        float threshold = 1.0 + letterIndex * 0.2;
        return d < threshold ? 1.0 : 0.0;
      }
      
      // Numeric set
      else if (setIdx == 6) {
        float numIndex = floor(charIndex);
        // Different patterns for different numbers
        if (numIndex < 1.0) return (row > 5.0) ? 1.0 : 0.0; // 0-like
        if (numIndex < 3.0) return (col == 2.0) ? 1.0 : 0.0; // 1-like
        if (numIndex < 5.0) return ((row == 0.0 || row == 3.0 || row == 6.0) && col >= 1.0 && col <= 3.0) ||
                                   (row < 3.0 && col == 4.0) || (row > 3.0 && col == 0.0) ? 1.0 : 0.0;
        return 1.0;
      }
      
      // Math set
      else if (setIdx == 7) {
        float mathIndex = floor(charIndex / 1.25);
        if (mathIndex < 1.0) return 0.0;
        if (mathIndex < 2.0) return (row == 3.0 && col >= 1.0 && col <= 3.0) ? 1.0 : 0.0; // minus
        if (mathIndex < 3.0) return (col == 2.0 || row == 3.0) ? 1.0 : 0.0; // plus
        if (mathIndex < 4.0) return (row == 2.0 || row == 4.0) ? 1.0 : 0.0; // equals
        if (mathIndex < 5.0) return (row == col || row + col == 4.0) ? 1.0 : 0.0; // times
        if (mathIndex < 6.0) return (col == 2.0) ? 1.0 : 0.0; // divide
        if (mathIndex < 7.0) return ((row == 2.0 || row == 4.0) && col >= 1.0 && col <= 3.0) ||
                                   (col == 0.0 && row >= 2.0 && row <= 4.0) ||
                                   (col == 4.0 && row >= 2.0 && row <= 4.0) ? 1.0 : 0.0;
        return 1.0;
      }
      
      // Symbols set
      else {
        float symIndex = floor(charIndex);
        if (symIndex < 1.0) return 0.0;
        // Various symbol patterns
        float d = distance(vec2(col, row), vec2(2.0, 3.0));
        return d < (symIndex * 0.4) ? 1.0 : 0.0;
      }
    }
    
    void main() {
      if (!enable) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }
      
      // Calculate effective cell size based on scale and output width
      float effectiveCellSize = cellSize * scale;
      
      // Adjust for output width (scale cells to fit desired width)
      float widthScale = resolution.x / outputWidth;
      effectiveCellSize = max(effectiveCellSize / widthScale, 2.0);
      
      // Apply spacing
      float effectiveSpacing = spacing;
      
      // Calculate cell position in the ASCII grid
      vec2 cellCount = resolution / effectiveCellSize;
      vec2 cellUv = floor(vUv * cellCount) / cellCount;
      vec2 cellFract = fract(vUv * cellCount);
      
      // Apply spacing - shrink the visible area within each cell
      vec2 spacedFract = (cellFract - 0.5) / effectiveSpacing + 0.5;
      
      // Check if we're in the visible part of the cell
      if (spacedFract.x < 0.0 || spacedFract.x > 1.0 || 
          spacedFract.y < 0.0 || spacedFract.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }
      
      // Calculate texel size for sharpness
      vec2 texelSize = 1.0 / resolution;
      
      // Sample the color at the cell center
      vec4 cellColor = texture2D(tDiffuse, cellUv + 0.5 / cellCount);
      
      // Apply sharpness
      vec3 processedColor = applySharpness(tDiffuse, cellUv + 0.5 / cellCount, texelSize, sharpness);
      
      // Apply image processing pipeline
      processedColor = processImage(processedColor);
      
      // Calculate luminance from processed color
      float luma = dot(processedColor, vec3(0.2126, 0.7152, 0.0722));
      
      // Map luminance to character index
      float charIndex = floor(luma * 9.0 + 0.5);
      
      // Get character pattern at this position
      vec2 gridPos = spacedFract * vec2(5.0, 7.0);
      float pattern = getCharPattern(charIndex, gridPos, characterSet);
      
      // Determine final color
      vec3 asciiColor = enableColor ? processedColor : color;
      vec3 finalColor = mix(vec3(0.0), asciiColor, pattern);
      
      gl_FragColor = vec4(finalColor, cellColor.a);
    }
  `
};

/**
 * Simplified ASCII shader for fallback
 */
export const asciiSimpleShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: [1, 1] },
    cellSize: { value: 8.0 },
    color: { value: [0.0, 1.0, 0.0] },
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
    uniform float cellSize;
    uniform vec3 color;
    uniform bool enable;
    varying vec2 vUv;
    
    void main() {
      if (!enable) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }
      
      vec2 cellCount = resolution / cellSize;
      vec2 cellUv = floor(vUv * cellCount) / cellCount;
      vec2 cellFract = fract(vUv * cellCount);
      
      vec4 cellColor = texture2D(tDiffuse, cellUv + 0.5 / cellCount);
      float luma = dot(cellColor.rgb, vec3(0.299, 0.587, 0.114));
      
      float d = distance(cellFract, vec2(0.5));
      float pattern = (d < luma * 0.5) ? 1.0 : 0.0;
      
      vec3 finalColor = color * pattern;
      gl_FragColor = vec4(finalColor, cellColor.a);
    }
  `
};

export default {
  asciiShader,
  asciiSimpleShader,
  ASCII_CHAR_SETS,
};
