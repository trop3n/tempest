# grain effects

A browser-based image processing tool featuring ASCII art, dithering, and retro CRT effects. Built with WebGL, Three.js, and React.

![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Three.js](https://img.shields.io/badge/Three.js-r160-black.svg)

## Features

- **ASCII Art** - Convert images to text characters based on brightness
- **Dithering** - Multiple algorithms (Bayer ordered, color palette)
- **Pixelation** - Adjustable retro-style pixelation
- **CRT Effects** - Scanlines, vignette, and screen curvature
- **Film Grain** - Animated noise simulation
- **Real-time Processing** - 60fps GPU-accelerated effects
- **Video Support** - Process video files (MP4, WebM)
- **Export** - Download processed images as PNG

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open http://localhost:5173 in your browser.

## Usage

1. **Drop an image or video** onto the canvas
2. **Adjust effects** using the control panel on the right
3. **Try presets** from the dropdown (Matrix, Game Boy, Retro CRT, etc.)
4. **Export** your creation as a PNG

## Technology Stack

- **WebGL/Three.js** - GPU-accelerated rendering
- **React** - UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool

## Project Structure

```
src/
├── components/          # React UI components
│   ├── FileDropzone.tsx
│   └── ControlPanel.tsx
├── engine/             # Core processing
│   └── EffectProcessor.ts
├── shaders/            # GLSL effects
│   ├── dithering.ts
│   ├── ascii.ts
│   └── retro.ts
├── App.tsx            # Main application
└── main.tsx           # Entry point
```

## Documentation

Comprehensive documentation is available in the `docs/` folder (Obsidian-compatible):

- [Architecture Overview](docs/01%20-%20Architecture%20Overview.md)
- [Shader Effects Guide](docs/02%20-%20Shader%20Effects%20Guide.md)
- [Dithering Algorithms](docs/03%20-%20Dithering%20Algorithms.md)
- [ASCII Art Rendering](docs/04%20-%20ASCII%20Art%20Rendering.md)
- [Development Setup](docs/05%20-%20Development%20Setup.md)
- [Adding New Effects](docs/06%20-%20Adding%20New%20Effects.md)
- [Performance Optimization](docs/07%20-%20Performance%20Optimization.md)

## Browser Support

- Chrome 80+
- Firefox 80+
- Safari 15+
- Edge 80+

Requires WebGL 2.0 support.

## License

MIT License - feel free to use this code for learning or building your own projects!

## Acknowledgments

Inspired by [grainrad.com](https://grainrad.com/) - a WebGPU-powered image effects tool.

- Shaders based on techniques from [The Book of Shaders](https://thebookofshaders.com/)
- Three.js post-processing pipeline
- [Efecto tutorial](https://tympanus.net/codrops/2026/01/04/efecto-building-real-time-ascii-and-dithering-effects-with-webgl-shaders/) from Codrops
