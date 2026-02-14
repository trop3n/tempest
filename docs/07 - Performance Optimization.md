# Performance Optimization

Techniques for maintaining 60fps with complex shader effects.

## Performance Targets

```
Target: 60 FPS
Budget: 16.67ms per frame

Typical Breakdown:
├── JavaScript:        ~2ms
├── GPU Setup:         ~1ms
├── Shader Execution:  ~10ms
│   ├── Pass 1:        ~2ms
│   ├── Pass 2:        ~2ms
│   └── ...
└── Browser Overhead:  ~4ms
```

## Profiling Tools

### Chrome DevTools

1. Open DevTools → Performance tab
2. Click Record
3. Use the app
4. Stop recording
5. Analyze results

### Key Metrics

| Metric | Good | Bad |
|--------|------|-----|
| Frame time | <16ms | >16ms |
| GPU time | <10ms | >12ms |
| Shader complexity | Low | High |
| Texture uploads | Few | Many |

### Three.js Stats

Add a stats panel for real-time monitoring:

```typescript
import Stats from 'three/examples/jsm/libs/stats.module.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  // ... render
  stats.end();
  requestAnimationFrame(animate);
}
```

## Optimization Strategies

### 1. Resolution Scaling

Render at lower resolution, upscale:

```typescript
// Set render target size
const scale = 0.5; // 50% resolution
composer.setSize(
  width * scale,
  height * scale
);

// CSS upscales it back
// Canvas appears full size but renders faster
```

**Trade-off:** Performance vs sharpness

### 2. Conditional Passes

Skip disabled effects entirely:

```typescript
// In render loop, rebuild composer based on enabled effects
rebuildComposer() {
  this.composer.passes = [];
  this.composer.addPass(this.renderPass);
  
  if (this.preset.pixelate.enabled) {
    this.composer.addPass(this.pixelatePass);
  }
  if (this.preset.ascii.enabled) {
    this.composer.addPass(this.asciiPass);
  }
  // ...
}
```

**Benefit:** No GPU cost for disabled effects

### 3. Texture Reuse

Don't recreate textures:

```typescript
// Good: Reuse texture object
updateVideoFrame(video) {
  if (!this.videoTexture) {
    this.videoTexture = new THREE.VideoTexture(video);
  }
  this.videoTexture.update();
}

// Bad: Create new texture every frame
updateVideoFrame(video) {
  this.videoTexture = new THREE.VideoTexture(video); // ❌
}
```

### 4. Shader Optimization

#### Minimize Texture Samples

```glsl
// Good: Single sample
vec4 color = texture2D(tDiffuse, vUv);
float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));

// Bad: Multiple samples
float r = texture2D(tDiffuse, vUv).r;  // ❌
float g = texture2D(tDiffuse, vUv).g;  // ❌
float b = texture2D(tDiffuse, vUv).b;  // ❌
```

#### Use Swizzling

```glsl
// Good: Swizzle
vec3 rgb = color.rgb;
float alpha = color.a;

// Bad: Constructor
vec3 rgb = vec3(color.r, color.g, color.b);  // ❌
```

#### Prefer Built-ins

```glsl
// Good: Built-in function
float len = length(v);

// Bad: Manual calculation
float len = sqrt(v.x * v.x + v.y * v.y);  // ❌
```

### 5. Early Exit

Skip expensive calculations:

```glsl
// Good: Early exit
if (!enable) {
  gl_FragColor = texture2D(tDiffuse, vUv);
  return;
}

// Good: Skip calculations for edge cases
if (luma < 0.01) {
  gl_FragColor = vec4(0.0);  // Fully dark
  return;
}
```

### 6. Avoid Dynamic Loops

GPUs prefer static loops:

```glsl
// Good: Static iteration count
for (int i = 0; i < 4; i++) {
  // ...
}

// Bad: Dynamic loop (may unroll poorly)
uniform int iterations;
for (int i = 0; i < iterations; i++) {  // ❌
  // ...
}
```

### 7. Use Appropriate Precision

```glsl
// Default is highp - use lower where possible
lowp vec3 color;      // Colors (0-1 range)
mediump vec2 uv;      // UVs (0-1 range)
highp float time;     // Time (can be large)
```

## Memory Optimization

### Texture Memory

Calculate texture memory usage:

```
Memory = width × height × channels × bytes_per_channel

Example (1920×1080 RGBA32):
1920 × 1080 × 4 × 4 bytes = ~33 MB per texture
```

### Disposal

Clean up resources:

```typescript
dispose() {
  // Stop rendering
  cancelAnimationFrame(this.animationId);
  
  // Dispose textures
  if (this.texture) {
    this.texture.dispose();
  }
  
  // Dispose passes
  this.composer.passes.forEach(pass => {
    if (pass.dispose) pass.dispose();
  });
  
  // Dispose renderer
  this.renderer.dispose();
}
```

## Specific Optimizations by Effect

### Dithering

- Use smaller Bayer matrix (2×2 vs 8×8)
- Skip dithering if color levels > 16

### ASCII

- Increase cell size (fewer characters to draw)
- Use simpler character set
- Disable for high-resolution video

### Pixelation

- Early pixelation reduces work for subsequent passes
- Move pixelation early in the chain

### CRT

- Curvature is expensive - disable on mobile
- Pre-calculate scanline pattern in texture

## Mobile Optimization

### Detect Mobile

```typescript
const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

if (isMobile) {
  // Reduce effects
  preset.crt.enableCurvature = false;
  preset.ascii.cellSize = 12; // Larger = faster
}
```

### Adaptive Quality

```typescript
// Measure FPS and adjust quality
let lastTime = performance.now();
let frameCount = 0;

function checkPerformance() {
  frameCount++;
  const now = performance.now();
  
  if (now - lastTime > 1000) {
    const fps = frameCount;
    frameCount = 0;
    lastTime = now;
    
    if (fps < 30) {
      reduceQuality();
    }
  }
}
```

## Benchmarking

### Synthetic Benchmark

```typescript
function benchmark(effect, iterations = 100) {
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    composer.render();
  }
  
  const duration = performance.now() - start;
  const msPerFrame = duration / iterations;
  
  console.log(`${effect}: ${msPerFrame.toFixed(2)}ms per frame`);
  return msPerFrame;
}

// Test each effect
benchmark('pixelate');
benchmark('dither');
benchmark('ascii');
benchmark('crt');
```

## Common Bottlenecks

### 1. Too Many Passes

```
Problem: 10+ shader passes
Solution: Merge related effects into one shader
```

### 2. High-Res Video

```
Problem: 4K video = 8 million pixels to process
Solution: Process at lower resolution
```

### 3. Complex Conditionals

```
Problem: Many if/else in shader
Solution: Use step/mix functions
```

### 4. Excessive Uniform Updates

```
Problem: Setting uniforms every frame
Solution: Only update when values change
```

## Performance Checklist

- [ ] Profile before optimizing
- [ ] Use resolution scaling if needed
- [ ] Skip disabled effects
- [ ] Minimize texture samples
- [ ] Use early exit in shaders
- [ ] Dispose unused resources
- [ ] Test on target devices
- [ ] Measure FPS in real-world usage

## Further Reading

- [WebGL Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [Three.js Performance](https://threejs.org/docs/#manual/en/introduction/How-to-create-VR-content)
- [GPU Performance Guide](https://developer.nvidia.com/content/understanding-geometry-rendering)
