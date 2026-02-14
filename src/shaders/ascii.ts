/**
 * ASCII ART SHADER
 * ================
 * 
 * This shader converts an image to ASCII art by:
 * 1. Dividing the screen into a grid of cells
 * 2. Sampling the color at each cell center
 * 3. Mapping brightness to ASCII characters
 * 4. Drawing characters procedurally using math
 * 
 * Key insight: Shaders can't draw text, so each character is drawn
 * procedurally by calculating which pixels should be "on" for each
 * character pattern.
 */

/**
 * ASCII Shader with procedural character rendering
 * 
 * Characters are drawn on a 5x7 grid where each cell represents
 * a "pixel" of the ASCII character.
 */
export const asciiShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: [1, 1] },
    cellSize: { value: 8.0 },       // Size of each ASCII character in pixels
    characters: { value: 10.0 },    // Number of character brightness levels
    color: { value: [0.0, 1.0, 0.0] }, // ASCII character color (default: green)
    backgroundColor: { value: [0.0, 0.0, 0.0] },
    enableColor: { value: false },  // Use original colors vs monochrome
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
    uniform float characters;
    uniform vec3 color;
    uniform vec3 backgroundColor;
    uniform bool enableColor;
    uniform bool enable;
    
    varying vec2 vUv;
    
    // Character patterns (5x7 grid, stored as bitmasks)
    // Each float represents a row, bits represent columns
    // Used for procedural character rendering
    
    float getCharPattern(float charIndex, vec2 gridPos) {
      // gridPos is in range [0, 4] x [0, 6]
      float x = floor(gridPos.x);
      float y = floor(gridPos.y);
      float row = y;
      float col = 4.0 - x; // Flip X for correct orientation
      
      // Character definitions (5x7 dot patterns)
      // Each character is defined by which dots are "on"
      
      // Space (darkest)
      if (charIndex < 0.5) return 0.0;
      
      // Period '.'
      if (charIndex < 1.5) {
        return (row == 5.0 && col == 2.0) ? 1.0 : 0.0;
      }
      
      // Colon ':'
      if (charIndex < 2.5) {
        return ((row == 2.0 || row == 4.0) && col == 2.0) ? 1.0 : 0.0;
      }
      
      // Dash '-'
      if (charIndex < 3.5) {
        return (row == 3.0 && col >= 1.0 && col <= 3.0) ? 1.0 : 0.0;
      }
      
      // Plus '+'
      if (charIndex < 4.5) {
        return ((row == 3.0 && col >= 1.0 && col <= 3.0) ||
                (col == 2.0 && row >= 2.0 && row <= 4.0)) ? 1.0 : 0.0;
      }
      
      // Equals '='
      if (charIndex < 5.5) {
        return ((row == 2.0 || row == 4.0) && col >= 1.0 && col <= 3.0) ? 1.0 : 0.0;
      }
      
      // Asterisk '*'
      if (charIndex < 6.5) {
        return ((row == 3.0 && col >= 1.0 && col <= 3.0) ||
                (col == 2.0 && row >= 2.0 && row <= 4.0) ||
                (row == col && row >= 2.0 && row <= 4.0) ||
                (row + col == 4.0 && row >= 2.0 && row <= 4.0)) ? 1.0 : 0.0;
      }
      
      // Hash '#'
      if (charIndex < 7.5) {
        return (((row == 2.0 || row == 4.0) && col >= 0.0 && col <= 4.0) ||
                ((col == 1.0 || col == 3.0) && row >= 1.0 && row <= 5.0)) ? 1.0 : 0.0;
      }
      
      // Percent '%'
      if (charIndex < 8.5) {
        return ((row == 0.0 && (col == 0.0 || col == 4.0)) ||
                (row == 6.0 && (col == 0.0 || col == 4.0)) ||
                (row + col == 6.0)) ? 1.0 : 0.0;
      }
      
      // At '@'
      if (charIndex < 9.5) {
        return ((row == 0.0 && col >= 1.0 && col <= 3.0) ||
                (row == 5.0 && col >= 1.0 && col <= 3.0) ||
                (col == 0.0 && row >= 1.0 && row <= 4.0) ||
                (col == 4.0 && row >= 1.0 && row <= 2.0) ||
                (row == 3.0 && col == 3.0) ||
                (row == 2.0 && col >= 2.0 && col <= 3.0)) ? 1.0 : 0.0;
      }
      
      // Full block (brightest)
      return 1.0;
    }
    
    void main() {
      if (!enable) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }
      
      // Calculate cell position in the ASCII grid
      vec2 cellCount = resolution / cellSize;
      vec2 cellUv = floor(vUv * cellCount) / cellCount;
      vec2 cellFract = fract(vUv * cellCount);
      
      // Sample the color at the cell center
      vec4 cellColor = texture2D(tDiffuse, cellUv + 0.5 / cellCount);
      
      // Calculate luminance
      float luma = dot(cellColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      
      // Map luminance to character index
      float charIndex = floor(luma * (characters - 1.0) + 0.5);
      
      // Get character pattern at this position
      // Map cellFract from [0,1] to [0,4] x [0,6] for 5x7 grid
      vec2 gridPos = cellFract * vec2(5.0, 7.0);
      float pattern = getCharPattern(charIndex, gridPos);
      
      // Determine final color
      vec3 asciiColor = enableColor ? cellColor.rgb : color;
      vec3 finalColor = mix(backgroundColor, asciiColor, pattern);
      
      gl_FragColor = vec4(finalColor, cellColor.a);
    }
  `
};

/**
 * Simplified ASCII shader using luminance-based character selection
 * but with more readable character patterns
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
    
    // Simple dot pattern based on brightness
    float getDotPattern(float brightness, vec2 pos) {
      float pattern = 0.0;
      
      // Very dark: sparse dots
      if (brightness < 0.1) {
        pattern = (pos.x > 0.4 && pos.x < 0.6 && pos.y > 0.4 && pos.y < 0.6) ? 0.3 : 0.0;
      }
      // Dark: small dot
      else if (brightness < 0.2) {
        pattern = (pos.x > 0.3 && pos.x < 0.7 && pos.y > 0.3 && pos.y < 0.7) ? 0.5 : 0.0;
      }
      // Medium-dark: medium dot
      else if (brightness < 0.3) {
        float d = distance(pos, vec2(0.5));
        pattern = (d < 0.3) ? 0.6 : 0.0;
      }
      // Medium: large dot
      else if (brightness < 0.4) {
        float d = distance(pos, vec2(0.5));
        pattern = (d < 0.4) ? 0.7 : 0.0;
      }
      // Medium-light: larger dot
      else if (brightness < 0.5) {
        float d = distance(pos, vec2(0.5));
        pattern = (d < 0.5) ? 0.8 : 0.0;
      }
      // Light: almost filled
      else if (brightness < 0.6) {
        float d = distance(pos, vec2(0.5));
        pattern = (d < 0.6) ? 0.85 : 0.0;
      }
      // Very light: filled with slight gaps
      else if (brightness < 0.8) {
        pattern = 0.9;
      }
      // Brightest: solid
      else {
        pattern = 1.0;
      }
      
      return pattern;
    }
    
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
      
      float pattern = getDotPattern(luma, cellFract);
      
      vec3 finalColor = color * pattern;
      
      gl_FragColor = vec4(finalColor, cellColor.a);
    }
  `
};

/**
 * Character sets for ASCII art
 */
export const ASCII_CHAR_SETS = {
  // Standard 10-level ASCII ramp (dark to light)
  STANDARD: ' .:-=+*#%@',
  
  // 16-level detailed ramp
  DETAILED: ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
  
  // Blocks (good for smooth gradients)
  BLOCKS: ' ░▒▓█',
  
  // Minimal (high contrast)
  MINIMAL: ' .oO',
  
  // Matrix-style (just characters from the movie aesthetic)
  MATRIX: 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789',
};

export default {
  asciiShader,
  asciiSimpleShader,
  ASCII_CHAR_SETS,
};
