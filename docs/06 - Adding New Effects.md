# Adding New Effects

A step-by-step guide to adding custom effects to the grain effects system.

## Overview

Adding a new effect involves:
1. Writing the shader
2. Integrating into the processor
3. Adding UI controls
4. Updating types

## Step 1: Create the Shader

Create a new file `src/shaders/myEffect.ts`:

```typescript
/**
 * My Custom Effect
 * 
 * Description of what this effect does
 */

export const myEffectShader = {
  uniforms: {
    tDiffuse: { value: null },           // Input texture (required)
    resolution: { value: [1, 1] },       // Screen resolution
    enable: { value: true },             // Toggle
    myParam: { value: 1.0 },             // Your custom parameter
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
    uniform bool enable;
    uniform float myParam;
    
    varying vec2 vUv;
    
    void main() {
      // Sample input
      vec4 color = texture2D(tDiffuse, vUv);
      
      // Early exit if disabled
      if (!enable) {
        gl_FragColor = color;
        return;
      }
      
      // Your effect logic here
      vec3 modified = color.rgb * myParam;
      
      gl_FragColor = vec4(modified, color.a);
    }
  `
};
```

### Shader Structure

Every effect shader needs:

1. **Uniforms** - Parameters passed from JavaScript
2. **Vertex Shader** - Usually just passes UVs through
3. **Fragment Shader** - Where the magic happens

### Common Uniforms

| Uniform | Type | Purpose |
|---------|------|---------|
| `tDiffuse` | sampler2D | Input texture from previous pass |
| `resolution` | vec2 | Canvas width/height in pixels |
| `enable` | bool | Toggle effect on/off |
| `time` | float | Animation time (if animated) |

## Step 2: Add to EffectProcessor

Edit `src/engine/EffectProcessor.ts`:

### Import the shader

```typescript
import { myEffectShader } from '../shaders/myEffect';
```

### Add pass

In the constructor:

```typescript
// After other passes
this.myEffectPass = new ShaderPass(myEffectShader);
this.composer.addPass(this.myEffectPass);
```

### Add type definition

```typescript
export interface EffectPreset {
  // ... existing properties
  myEffect: {
    enabled: boolean;
    myParam: number;
  };
}
```

### Add to presets

```typescript
export const DEFAULT_PRESETS: EffectPreset[] = [
  {
    name: 'Default',
    // ... other effects
    myEffect: { enabled: false, myParam: 1.0 },
  }
];
```

### Add update method

```typescript
setMyEffect(params: Partial<EffectPreset['myEffect']>) {
  if (params.enabled !== undefined) {
    this.myEffectPass.uniforms.enable.value = params.enabled;
  }
  if (params.myParam !== undefined) {
    this.myEffectPass.uniforms.myParam.value = params.myParam;
  }
}
```

### Update applyPreset

```typescript
applyPreset(preset: EffectPreset) {
  // ... existing code
  
  // My Effect
  this.myEffectPass.uniforms.enable.value = preset.myEffect.enabled;
  this.myEffectPass.uniforms.myParam.value = preset.myEffect.myParam;
}
```

## Step 3: Add UI Controls

Edit `src/components/ControlPanel.tsx`:

### Add section

```tsx
<Section title="My Effect">
  <Toggle
    label="Enable My Effect"
    checked={preset.myEffect.enabled}
    onChange={(v) => updatePreset('myEffect.enabled', v)}
  />
  <Slider
    label="My Parameter"
    value={preset.myEffect.myParam}
    min={0}
    max={2}
    step={0.1}
    onChange={(v) => updatePreset('myEffect.myParam', v)}
  />
</Section>
```

## Step 4: Update App.tsx

Ensure the preset state includes your new effect:

```typescript
const [preset, setPreset] = useState<EffectPreset>(DEFAULT_PRESETS[0]);
```

The update will flow automatically through the existing effect chain.

## Example: Invert Effect

Here's a complete example of adding an invert effect:

### 1. Create Shader

```typescript
// src/shaders/invert.ts
export const invertShader = {
  uniforms: {
    tDiffuse: { value: null },
    enable: { value: false },
    strength: { value: 1.0 },
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
    uniform bool enable;
    uniform float strength;
    
    varying vec2 vUv;
    
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      if (!enable) {
        gl_FragColor = color;
        return;
      }
      
      vec3 inverted = 1.0 - color.rgb;
      vec3 final = mix(color.rgb, inverted, strength);
      
      gl_FragColor = vec4(final, color.a);
    }
  `
};
```

### 2. Add to Processor

```typescript
// In EffectProcessor.ts
import { invertShader } from '../shaders/invert';

// Add interface
export interface EffectPreset {
  // ...
  invert: {
    enabled: boolean;
    strength: number;
  };
}

// In constructor
this.invertPass = new ShaderPass(invertShader);
this.composer.addPass(this.invertPass);

// Add to presets
invert: { enabled: false, strength: 1.0 }

// Update method
setInvert(params: Partial<EffectPreset['invert']>) {
  if (params.enabled !== undefined) this.invertPass.uniforms.enable.value = params.enabled;
  if (params.strength !== undefined) this.invertPass.uniforms.strength.value = params.strength;
}
```

### 3. Add Controls

```tsx
<Section title="Invert">
  <Toggle
    label="Enable Invert"
    checked={preset.invert.enabled}
    onChange={(v) => updatePreset('invert.enabled', v)}
  />
  <Slider
    label="Strength"
    value={preset.invert.strength}
    min={0}
    max={1}
    step={0.01}
    onChange={(v) => updatePreset('invert.strength', v)}
  />
</Section>
```

## Effect Ideas

### Sepia Tone

```glsl
vec3 sepia = vec3(
  dot(color.rgb, vec3(0.393, 0.769, 0.189)),
  dot(color.rgb, vec3(0.349, 0.686, 0.168)),
  dot(color.rgb, vec3(0.272, 0.534, 0.131))
);
```

### Edge Detection

```glsl
vec3 sample[9];
// Sample 3x3 neighborhood
// Apply Sobel operator
// Output edges
```

### Kaleidoscope

```glsl
// Mirror and repeat UVs
vec2 centered = vUv - 0.5;
float angle = atan(centered.y, centered.x);
float radius = length(centered);

// Repeat angle
angle = mod(angle, 3.14159 / segments);

// Convert back to UV
vec2 newUv = vec2(cos(angle), sin(angle)) * radius + 0.5;
```

### VHS Effect

```glsl
// Chromatic separation
// Scanlines
// Tracking distortion
// Noise
```

## Testing Your Effect

1. Start dev server: `npm run dev`
2. Load an image
3. Toggle your effect on/off
4. Adjust parameters
5. Check different image types (photos, graphics, video)

## Debugging Tips

### Shader Won't Compile

Check console for errors. Common issues:
- Missing semicolons
- Wrong variable types
- Undefined uniforms

### Effect Not Visible

- Check `enable` uniform is true
- Verify pass was added to composer
- Ensure uniforms are updated in `applyPreset`

### Parameter Changes Don't Apply

- Check the `updatePreset` path matches your interface
- Verify uniform name matches shader definition

## Performance Considerations

### Minimize Texture Samples

Each `texture2D` call is expensive:

```glsl
// Good: One sample
vec4 color = texture2D(tDiffuse, vUv);

// Bad: Multiple samples
float r = texture2D(tDiffuse, vUv).r;
float g = texture2D(tDiffuse, vUv).g;
float b = texture2D(tDiffuse, vUv).b;
```

### Early Exit

Skip processing when effect is disabled:

```glsl
if (!enable) {
  gl_FragColor = texture2D(tDiffuse, vUv);
  return;
}
```

### Avoid Branches

GPUs are bad at `if` statements:

```glsl
// Better: Use mix/step
float mask = step(threshold, value);
vec3 result = mix(colorA, colorB, mask);

// Worse: Branch
vec3 result;
if (value > threshold) {
  result = colorB;
} else {
  result = colorA;
}
```

## Sharing Your Effect

Once working, you can:
1. Submit a PR to the main repo
2. Publish as a standalone shader
3. Share on Shadertoy

## Further Reading

- [[02 - Shader Effects Guide]] - How existing effects work
- [[03 - Dithering Algorithms]] - Mathematical techniques
- [[07 - Performance Optimization]] - Making effects fast
