# Glossary

Technical terms used throughout this documentation.

## A

### ASCII Art
Art made from text characters. In this project, images are converted to ASCII by mapping brightness levels to characters of varying density.

## B

### Bayer Matrix
A pre-computed threshold map used for ordered dithering. Spreads quantization error across space rather than time.

### Bilinear Filtering
A texture sampling method that interpolates between 4 nearest pixels. Produces smoother results than nearest-neighbor.

## C

### Chromatic Aberration
A lens effect where color channels are slightly offset. Creates a rainbow fringe around high-contrast edges.

### CRT
Cathode Ray Tube. Old-style monitors/TVs that used electron beams. Simulated through scanlines, curvature, and glow effects.

## D

### Dithering
A technique to create the illusion of more colors than available by diffusing quantization error.

## E

### EffectComposer
A Three.js class that chains multiple post-processing effects together.

### Error Diffusion
A dithering technique that spreads quantization error to neighboring pixels.

## F

### Fragment Shader
A GPU program that runs once per pixel (fragment) and determines its final color.

### Framebuffer
GPU memory that stores rendered pixels before display.

## G

### GLSL
OpenGL Shading Language. The C-like language used to write shaders.

### GPU
Graphics Processing Unit. Specialized hardware for parallel calculations, ideal for image processing.

## H

### Halftone
A printing technique using dots of varying size/density to create tones. Common in newspapers and magazines.

## L

### Luminance
Perceived brightness of a color. Calculated as weighted sum of RGB channels (human eyes are most sensitive to green).

## M

### Mipmap
Pre-calculated, optimized sequences of images at different resolutions. Used for texture minification.

## P

### Pixelation
Reducing image resolution by displaying groups of pixels as single color blocks.

### Post-Processing
Applying effects to an already-rendered image. Common in games and photo editing.

## Q

### Quantization
Reducing the number of distinct values in a signal. In images, reducing color depth.

## R

### Render Target
A framebuffer that can be rendered to (instead of the screen).

### RGB
Red, Green, Blue - the three primary colors used in digital displays.

## S

### Shader
A program that runs on the GPU. Types include vertex shaders (geometry) and fragment shaders (pixels).

### ShaderPass
A Three.js wrapper for applying a shader as a post-processing effect.

### Swizzling
Accessing and rearranging vector components in GLSL: `color.rgb`, `pos.xy`, etc.

## T

### Texture
GPU memory containing image data. Can be sampled in shaders.

### Three.js
A JavaScript library for 3D graphics built on WebGL.

## U

### Uniform
A shader variable that has the same value for all pixels in a draw call. Used to pass parameters from JavaScript.

### UV Coordinates
2D texture coordinates ranging from (0,0) to (1,1). Used to sample textures.

## V

### Vignette
Darkening at the edges of an image. Common in photography and old CRT displays.

### Voxel
A 3D pixel (volume pixel).

## W

### WebGL
Web Graphics Library. A JavaScript API for rendering 2D and 3D graphics in the browser using the GPU.

### WebGPU
The next-generation web graphics API. Successor to WebGL with modern GPU features.

### WGSL
WebGPU Shading Language. The shader language for WebGPU.

## Formula Reference

### Luminance
```
L = 0.2126 * R + 0.7152 * G + 0.0722 * B
```

### Distance
```
2D: d = sqrt((x2-x1)² + (y2-y1)²)
```

### Linear Interpolation (mix/lerp)
```
mix(a, b, t) = a * (1-t) + b * t
```

### Smoothstep
```
smoothstep(edge0, edge1, x):
  t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
```

## Acronyms

| Acronym | Meaning |
|---------|---------|
| API | Application Programming Interface |
| CRT | Cathode Ray Tube |
| FPS | Frames Per Second |
| GLSL | OpenGL Shading Language |
| GPU | Graphics Processing Unit |
| RGB | Red, Green, Blue |
| UI | User Interface |
| UV | Texture coordinates (U, V axes) |
| WGSL | WebGPU Shading Language |
