# ASCII Art Rendering

A comprehensive guide to procedurally generating ASCII art on the GPU.

## The Challenge

**Problem:** Fragment shaders cannot render text.

**Solution:** Draw each ASCII character procedurally using mathematical shapes.

## The Grid System

### Character Cell Structure

Each character is defined on a 5×7 dot matrix:

```
  0 1 2 3 4  (X coordinate)
0 . . . . .
1 . . . . .
2 . . . . .
3 . . # . .  ← Center dot at (2, 3)
4 . . . . .
5 . . . . .
6 . . . . .

(Y coordinate)
```

### Character Density

Characters ordered by visual density (darkest to lightest):

```
Index: 0   1   2   3   4   5   6   7   8   9
Char:  ' '  .   :   -   =   +   *   #   %   @

Visual representation:
      █   ▓   ▒   ░
Index: 9   7   5   1
```

## Procedural Character Generation

### The Core Function

```glsl
float getCharPattern(float charIndex, vec2 gridPos) {
  // gridPos: position within 5×7 cell (0-4, 0-6)
  float x = floor(gridPos.x);  // Column 0-4
  float y = floor(gridPos.y);  // Row 0-6
  
  // Return 1.0 for "on" pixels, 0.0 for "off"
}
```

### Character Definitions

#### Space (Index 0)
```glsl
if (charIndex < 0.5) return 0.0;  // All off
```

```
.....
.....
.....
.....
.....
.....
.....
```

#### Period `.` (Index 1)
```glsl
if (charIndex < 1.5) {
  return (y == 5.0 && x == 2.0) ? 1.0 : 0.0;
}
```

```
.....
.....
.....
.....
.....
..#..  ← Row 5, Column 2
.....
```

#### Colon `:` (Index 2)
```glsl
if (charIndex < 2.5) {
  return ((y == 2.0 || y == 4.0) && x == 2.0) ? 1.0 : 0.0;
}
```

```
.....
.....
..#..  ← Top dot
.....
..#..  ← Bottom dot
.....
.....
```

#### Plus `+` (Index 5)
```glsl
if (charIndex < 5.5) {
  return ((y == 3.0 && x >= 1.0 && x <= 3.0) ||  // Horizontal bar
          (x == 2.0 && y >= 2.0 && y <= 4.0))    // Vertical bar
         ? 1.0 : 0.0;
}
```

```
.....
.....
..#..  │
.###. ─┼─  Horizontal at y=3, columns 1-3
..#..  │   Vertical at x=2, rows 2-4
.....
.....
```

#### Asterisk `*` (Index 6)
```glsl
if (charIndex < 6.5) {
  bool center = (x == 2.0 && y == 3.0);
  bool vert = (x == 2.0 && y >= 2.0 && y <= 4.0);
  bool horiz = (y == 3.0 && x >= 1.0 && x <= 3.0);
  bool diag1 = ((x == 1.0 && y == 2.0) || (x == 3.0 && y == 4.0));
  bool diag2 = ((x == 1.0 && y == 4.0) || (x == 3.0 && y == 2.0));
  
  return (center || vert || horiz || diag1 || diag2) ? 1.0 : 0.0;
}
```

```
.....
.....
.#.#.  Diagonal arms
..#..  Center + vertical
.###.  Horizontal
..#..
.....
```

## The Rendering Pipeline

### Step 1: Divide into Grid

```glsl
// Screen resolution: 800x600
// Cell size: 8 pixels
// Grid: 100x75 cells

vec2 cellCount = resolution / cellSize;  // (100, 75)
```

### Step 2: Calculate Cell UVs

```glsl
// Convert pixel UV to cell coordinates
vec2 cellUv = floor(vUv * cellCount) / cellCount;  // Top-left of cell
vec2 cellFract = fract(vUv * cellCount);           // Position within cell (0-1)
```

Visual:
```
UV space (0-1):
┌─────────────────┐
│ A B C D E       │  vUv: continuous
│ F G H I J       │
│ K L M N O       │
└─────────────────┘

Cell space:
┌─────────────────┐
│ AAAA BBBB CCCC  │  cellUv: snapped to grid
│ AAAA BBBB CCCC  │
│ FFFF GGGG HHHH  │
│ FFFF GGGG HHHH  │
└─────────────────┘

Within a cell (cellFract):
┌──────────┐
│(0,0)   (1,0)│
│     ●      │  Center = (0.5, 0.5)
│(0,1)   (1,1)│
└──────────┘
```

### Step 3: Sample Cell Color

```glsl
// Sample at center of cell for consistent color
vec2 sampleUv = cellUv + 0.5 / cellCount;
vec4 cellColor = texture2D(tDiffuse, sampleUv);
```

### Step 4: Calculate Brightness

```glsl
float luma = dot(cellColor.rgb, vec3(0.2126, 0.7152, 0.0722));
```

### Step 5: Map to Character

```glsl
// Map 0-1 brightness to character index
float numChars = 10.0;  // Space through @
float charIndex = floor(luma * (numChars - 1.0) + 0.5);
```

Example mapping:
```
Luma:    0.0   0.1   0.2   0.3   0.4   0.5   0.6   0.7   0.8   0.9   1.0
         │     │     │     │     │     │     │     │     │     │     │
Index:   0     1     2     3     4     5     6     7     8     9     9
         │     │     │     │     │     │     │     │     │     │     │
Char:    ' '   '.'   ':'   '-'   '='   '+'   '*'   '#'   '%'   '@'   '@'
```

### Step 6: Draw Character

```glsl
// Map cellFract to 5×7 grid
vec2 gridPos = cellFract * vec2(5.0, 7.0);

// Get pattern for this character at this position
float pattern = getCharPattern(charIndex, gridPos);

// Mix between background and character color
vec3 finalColor = mix(backgroundColor, asciiColor, pattern);
```

## Complete Shader

```glsl
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float cellSize;
uniform float characters;
uniform vec3 color;
uniform vec3 backgroundColor;
uniform bool enableColor;

varying vec2 vUv;

float getCharPattern(float charIndex, vec2 gridPos) {
  // Character definitions...
}

void main() {
  // Calculate cell coordinates
  vec2 cellCount = resolution / cellSize;
  vec2 cellUv = floor(vUv * cellCount) / cellCount;
  vec2 cellFract = fract(vUv * cellCount);
  
  // Sample cell color
  vec4 cellColor = texture2D(tDiffuse, cellUv + 0.5 / cellCount);
  
  // Calculate luminance
  float luma = dot(cellColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  
  // Map to character
  float charIndex = floor(luma * (characters - 1.0) + 0.5);
  
  // Get character pattern
  vec2 gridPos = cellFract * vec2(5.0, 7.0);
  float pattern = getCharPattern(charIndex, gridPos);
  
  // Determine final color
  vec3 asciiColor = enableColor ? cellColor.rgb : color;
  vec3 finalColor = mix(backgroundColor, asciiColor, pattern);
  
  gl_FragColor = vec4(finalColor, cellColor.a);
}
```

## Advanced Techniques

### Colored ASCII

Instead of monochrome, use the original pixel color:

```glsl
vec3 asciiColor = enableColor ? cellColor.rgb : color;
```

Result:
```
Normal:        Colored:
####@@@@       ####@@@@
#@@####@  →    #@@####@  (each char takes cell's color)
@@%%####       @@%%####
```

### Variable Cell Sizes

Larger cells = more abstract:

```
cellSize = 4:   cellSize = 8:   cellSize = 16:
@#*+=.:        @@@@####        @@@@@@@@
#*+=.:-        ****====        ########
*+=.:-=        ++++....        ********
+=.:-==        ::::----        ========
```

### Character Ramps

Different character sets create different aesthetics:

```
Blocks:    ░▒▓█    (smooth gradients)
Minimal:   .oO     (high contrast)
Detailed:  .:-=+*#%@  (standard)
Matrix:    ｦｧｨｩｪｫｬｭｮｯ  (Japanese half-width)
```

## Optimization

### Texture Atlas Approach

For more complex characters, pre-render to a texture:

```
Texture Atlas:
┌────┬────┬────┬────┐
│ @  │ #  │ %  │ &  │
├────┼────┼────┼────┤
│ A  │ B  │ C  │ D  │
├────┼────┼────┼────┤
│ ...              │
└───────────────────┘
```

Then sample from atlas instead of procedural generation.

### Early Exit

```glsl
// Skip processing for fully dark cells
if (luma < 0.05) {
  gl_FragColor = vec4(backgroundColor, cellColor.a);
  return;
}

// Skip for fully bright cells
if (luma > 0.95) {
  gl_FragColor = vec4(asciiColor, cellColor.a);
  return;
}
```

## Common Issues

### Moiré Patterns

At certain zoom levels, the character grid can interfere with image patterns:

```
Problem:            Solution:
┌─┬─┬─┬─┐           ┌─┬─┬─┬─┐
│ │ │ │ │           │ │ │ │ │
├─┼─┼─┼─┤  moiré    ├─┼─┼─┼─┤
│ │ │ │ │           │ │ │ │ │
└─┴─┴─┴─┘           └─┴─┴─┴─┘
 (visible beats)    (anti-aliased)
```

**Fix:** Use fractional cell sizes or add slight blur.

### Aspect Ratio

Characters are taller than wide (7:5 ratio):

```glsl
// Compensate for character aspect ratio
vec2 adjustedCellSize = vec2(cellSize, cellSize * (7.0/5.0));
vec2 cellCount = resolution / adjustedCellSize;
```

### Edge Cases

```glsl
// Handle non-integer cell counts
vec2 cellCount = ceil(resolution / cellSize);
```

## Creative Variations

### Dot Patterns Instead of Characters

```glsl
// Circular dots instead of ASCII
float dist = distance(cellFract, vec2(0.5));
float pattern = 1.0 - smoothstep(0.0, luma * 0.5, dist);
```

### Line Patterns

```glsl
// Horizontal lines of varying width
float lineWidth = luma;
float pattern = (cellFract.y > 0.5 - lineWidth/2.0 && 
                 cellFract.y < 0.5 + lineWidth/2.0) ? 1.0 : 0.0;
```

### Custom Shapes

```glsl
// Chevron pattern
float chevron = abs(cellFract.x - 0.5) + abs(cellFract.y - 0.5) * 0.5;
float pattern = chevron < luma ? 1.0 : 0.0;
```

## Resources

- [ASCII Art Wikipedia](https://en.wikipedia.org/wiki/ASCII_art)
- [Character Density Reference](https://paulbourke.net/dataformats/asciiart/)
- [Real-time ASCII Rendering](https://www.youtube.com/watch?v=NxeRcnLr0ko)

## Code Reference

See `src/shaders/ascii.ts` for the full implementation including:
- Character definitions
- Alternative shader variants
- Character set constants
