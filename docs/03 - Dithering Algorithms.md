# Dithering Algorithms

A deep dive into the mathematics and implementation of digital dithering.

## What is Dithering?

Dithering creates the illusion of color depth by strategically placing pixels of available colors.

### The Problem

```
Goal: Display 50% gray
Available: Only black and white

Without Dithering:        With Dithering:
████████████████          ░░██░░██░░██░░
██░░░░░░░░░░░░██          ██░░██░░██░░██
██░░░░░░░░░░░░██    →     ░░██░░██░░██░░
██░░░░░░░░░░░░██          ██░░██░░██░░██
████████████████          ░░██░░██░░██░░
(Average looks gray)      (Checkerboard pattern)
```

## Luminance

Before dithering, we need to calculate brightness. The human eye is more sensitive to green than red or blue.

### Luminance Formula

```glsl
// ITU-R BT.709 coefficients
float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
```

**Why these numbers?**
- **Red (0.2126)**: 21% of perceived brightness
- **Green (0.7152)**: 72% of perceived brightness
- **Blue (0.0722)**: 7% of perceived brightness

Our eyes have more green-sensitive cones!

### Visual Luminance Test

```
These should all appear equally bright:

Red:    ████████████  (luma = 0.2126)
Green:  ████████████  (luma = 0.7152)  ← Same brightness with less intensity
Blue:   ████████████  (luma = 0.0722)
Gray:   ████████████  (luma = 0.5)
```

## Ordered Dithering (Bayer)

### The Bayer Matrix

A pre-computed threshold map that determines when to place pixels:

```
4×4 Bayer Matrix:
┌────┬────┬────┬────┐
│ 0  │ 8  │ 2  │ 10 │
├────┼────┼────┼────┤
│ 12 │ 4  │ 14 │ 6  │
├────┼────┼────┼────┤
│ 3  │ 11 │ 1  │ 9  │
├────┼────┼────┼────┤
│ 15 │ 7  │ 13 │ 5  │
└────┴────┴────┴────┘

Normalized (0-1):
0.000  0.500  0.125  0.625
0.750  0.250  0.875  0.375
0.188  0.688  0.063  0.563
0.938  0.438  0.813  0.313
```

### The Algorithm

```glsl
void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  
  // 1. Get luminance
  float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  
  // 2. Get pixel position in matrix
  vec2 pixelCoord = vUv * resolution;
  float threshold = bayerMatrix4x4(pixelCoord);
  
  // 3. Apply threshold
  // If luma > threshold: white, else: black
  float output = luma > threshold ? 1.0 : 0.0;
  
  gl_FragColor = vec4(vec3(output), 1.0);
}
```

### Multi-Level Quantization

For more than 2 colors:

```glsl
float colorLevels = 4.0;  // 4 output levels

// Add dither threshold before quantization
float dithered = luma + (threshold - 0.5) / colorLevels;

// Quantize to levels
float quantized = floor(dithered * colorLevels) / (colorLevels - 1.0);
```

**Mathematical Breakdown:**
```
Input luma: 0.45
Threshold:  0.313
Color levels: 4

Step 1: Normalize threshold to range [-0.5/colorLevels, 0.5/colorLevels]
  (0.313 - 0.5) / 4 = -0.046875

Step 2: Add to luma
  0.45 + (-0.046875) = 0.403125

Step 3: Quantize
  floor(0.403125 * 4) / 3 = floor(1.6125) / 3 = 1/3 = 0.333

Output: 33% gray (second darkest of 4 levels)
```

### Why It Works

The Bayer matrix distributes thresholds evenly across space:

```
For 50% gray input:

Checkerboard result:
██░░██░░
░░██░░██
██░░██░░
░░██░░██

From a distance, this appears as 50% gray!
```

### Matrix Sizes

Larger matrices = smoother gradients but more visible pattern:

| Matrix | Cells | Best For |
|--------|-------|----------|
| 2×2 | 4 | High contrast images |
| 4×4 | 16 | General purpose |
| 8×8 | 64 | Smooth gradients |

## Error Diffusion Dithering

More advanced algorithms that spread quantization error to neighboring pixels.

### Floyd-Steinberg (1976)

The classic error diffusion algorithm:

```
Current pixel: X
Error distribution:

    X   7/16
3/16 5/16 1/16

(distributed to unprocessed pixels)
```

### Algorithm Steps

```
For each pixel (left to right, top to bottom):
  1. old_pixel = pixel[x][y]
  2. new_pixel = find_closest_color(old_pixel)
  3. pixel[x][y] = new_pixel
  4. error = old_pixel - new_pixel
  5. pixel[x+1][y]   += error * 7/16
  6. pixel[x-1][y+1] += error * 3/16
  7. pixel[x][y+1]   += error * 5/16
  8. pixel[x+1][y+1] += error * 1/16
```

### Why Error Diffusion is Hard on GPU

```
Problem: Each pixel depends on previous pixel's result

Pixel 1 ──→ Pixel 2 ──→ Pixel 3 ──→ ...
     ↓         ↓           ↓
   Error     Error       Error
   propagates sequentially

GPU wants: Parallel processing
           Pixel 1  Pixel 2  Pixel 3
              ↓        ↓        ↓
           Process all simultaneously
```

**Solution:** We use ordered dithering (Bayer) for GPU because it requires no neighboring pixel information.

## Atkinson Dithering

Created by Bill Atkinson for the original Macintosh.

### Pattern

```
    X   1/8   1/8
1/8 1/8 1/8
    1/8

(Only distributes 6/8 = 75% of error)
```

### Characteristics

- **Higher contrast** than Floyd-Steinberg
- **Crunchy** look (25% error is lost)
- **Perfect for 1-bit** (black & white) images

### Visual Comparison

```
Original:              Floyd-Steinberg:       Atkinson:
███████████████        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓        ███████████████
██░░░░░░░░░░░██        ▓▓▒▒▒▒▒▒▒▒▒▒▒▓▓        ██░░░░░░░░░░░██
██░░░░░░░░░░░██   →    ▓▓▒▒░▒░▒░▒░▒▒▓▓   →    ██░░░██░░░██░██
██░░░░░░░░░░░██        ▓▓▒▒▒▒▒▒▒▒▒▒▒▓▓        ██░░░░░░░░░░░██
███████████████        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓        ███████████████
                      (smoother)              (sharper)
```

## Color Dithering

Dithering to a specific color palette instead of just black/white.

### Palette Mapping

```glsl
// Given palette: [black, dark_gray, light_gray, white]
vec3 palette[4] = vec3[](
  vec3(0.0, 0.0, 0.0),
  vec3(0.33, 0.33, 0.33),
  vec3(0.66, 0.66, 0.66),
  vec3(1.0, 1.0, 1.0)
);

// Map luminance to palette index
float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
int index = int(luma * 3.0);  // 0 to 3
vec3 outputColor = palette[index];
```

### Finding Nearest Color

For arbitrary palettes, we need to find the closest match:

```glsl
float minDistance = 999.0;
int nearestIndex = 0;

for (int i = 0; i < paletteSize; i++) {
  vec3 diff = color.rgb - palette[i];
  float dist = dot(diff, diff);  // Euclidean distance squared
  
  if (dist < minDistance) {
    minDistance = dist;
    nearestIndex = i;
  }
}

vec3 outputColor = palette[nearestIndex];
```

## Mathematical Properties

### Spatial Frequency

Dithering adds high-frequency noise to mask low-frequency banding:

```
Before quantization:
┌─────────────────────────────────────┐
│ Smooth gradient                     │
│ ████████████████████████████████    │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
└─────────────────────────────────────┘
Low frequency (visible bands)

After dithering:
┌─────────────────────────────────────┐
│ █░█▓░▓▒░▒▓░▓█░██▓██▒██▓██▒██▓██    │
│ ░█░▓░▒░▓░█░▓▒░▒▓░██▓██▒██▓██░██    │
│ █░▓░▒░▓░█░▓░▒░▓█░██▓██▒██▓██▒██    │
│ ░█░▒░▓░█░▓░▒░▓█░██▓██▒██▓██▒██    │
└─────────────────────────────────────┘
High frequency (appears smooth from distance)
```

### Blue Noise vs White Noise

- **White noise**: Random, uniform distribution
- **Blue noise**: Random but evenly spaced (better for dithering)

Bayer matrix approximates blue noise properties.

## Practical Considerations

### When to Use Which Algorithm

| Algorithm | Use When | Avoid When |
|-----------|----------|------------|
| Bayer | Real-time GPU | Smooth gradients at low res |
| Floyd-Steinberg | Quality matters | Real-time processing |
| Atkinson | 1-bit output | Need smooth gradients |
| Sierra | Better than FS | Need simple implementation |

### Color Depth

More output levels = less need for dithering:

| Output Levels | Dithering Benefit |
|---------------|-------------------|
| 2 (1-bit) | Essential |
| 4 | Very helpful |
| 16 | Noticeable improvement |
| 256 | Minimal benefit |
| True color | Not needed |

## Code Reference

See `src/shaders/dithering.ts` for the implementation:

```typescript
// Key exports
export const bayerDitherShader = { ... }
export const colorDitherShader = { ... }
export const PALETTES = {
  GAMEBOY: [...],
  CGA: [...],
  // ...
}
```

## Further Reading

- [Original Floyd-Steinberg Paper (1976)](https://doi.org/10.1145/360018.360092)
- [Atkinson Dithering](https://en.wikipedia.org/wiki/Bill_Atkinson)
- [Ordered Dithering](https://en.wikipedia.org/wiki/Ordered_dithering)
- [Blue Noise Dithering](http://momentsingraphics.de/BlueNoise.html)
