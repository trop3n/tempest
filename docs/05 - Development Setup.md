# Development Setup

How to get the grain effects project running locally.

## Prerequisites

- **Node.js** 18+ (check with `node --version`)
- **npm** 9+ or **yarn**
- A modern browser with WebGL support
- Code editor (VS Code recommended)

## Installation

### 1. Clone/Download the Project

```bash
cd /projects/grain-effects
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- **Vite** - Build tool and dev server
- **React** - UI framework
- **Three.js** - 3D/graphics library
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
grain-effects/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── FileDropzone.tsx    # File upload UI
│   │   └── ControlPanel.tsx    # Effect controls
│   ├── engine/          # Core processing
│   │   └── EffectProcessor.ts  # Rendering engine
│   ├── shaders/         # GLSL shaders
│   │   ├── dithering.ts        # Dithering effects
│   │   ├── ascii.ts            # ASCII art
│   │   └── retro.ts            # CRT, pixelate, noise
│   ├── App.tsx          # Main application
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── docs/                # Documentation (Obsidian format)
├── index.html           # HTML template
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind configuration
└── vite.config.ts       # Vite configuration
```

## Development Workflow

### Making Changes

1. **Edit code** - Changes are hot-reloaded automatically
2. **See changes** - Browser updates instantly
3. **Check console** - Errors appear in browser DevTools

### Debugging Shaders

Shaders fail silently. Check the console for compilation errors:

```
THREE.WebGLProgram: Shader Error 0 - VALIDATE_STATUS false
Program Info Log: Fragment shader is not compiled
```

Common issues:
- Missing semicolons
- Type mismatches (`float` vs `int`)
- Undefined variables

### Testing Effects

1. Drop a test image
2. Adjust parameters in the control panel
3. Export to verify output

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Browser Support

### Required Features

- **WebGL 2.0** - For advanced shaders
- **File API** - For drag-and-drop
- **ES6 Modules** - For code organization

### Testing Browser Support

```javascript
// Check WebGL
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2');
if (!gl) {
  alert('WebGL 2 not supported');
}
```

### Supported Browsers

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 80+ | Full support |
| Firefox | 80+ | Full support |
| Safari | 15+ | WebGL 2 support |
| Edge | 80+ | Full support |

## Development Tips

### Hot Reload Limitations

Shader changes sometimes require a manual refresh. If your changes don't appear:

1. Save the file
2. Refresh browser (F5)

### Performance Monitoring

Open Chrome DevTools → Performance tab to profile:

1. Click Record
2. Use the app
3. Stop recording
4. Look for long frames (>16ms)

### Shader Editing

For rapid shader iteration, use [Shadertoy](https://www.shadertoy.com/):

1. Write shader in Shadertoy
2. Test parameters live
3. Copy working code to project

### Common File Locations

| Task | File |
|------|------|
| Add UI control | `ControlPanel.tsx` |
| Add effect parameter | `EffectProcessor.ts` |
| Write new effect | `src/shaders/*.ts` |
| Change styling | `index.css` or Tailwind classes |

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5173
lsof -i :5173

# Kill it
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

### Node Modules Issues

```bash
# Clear and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check types
npx tsc --noEmit
```

### Build Failures

```bash
# Clean build
rm -rf dist
npm run build
```

## VS Code Extensions

Recommended extensions for development:

- **ES7+ React/Redux/React-Native snippets** - Code snippets
- **Tailwind CSS IntelliSense** - Autocomplete classes
- **GLSL Lint** - Shader syntax highlighting
- **Prettier** - Code formatting
- **ESLint** - Linting

## Environment Variables

Create `.env.local` for local overrides:

```bash
# Example
VITE_APP_TITLE="My Grain Effects"
```

Access in code:

```typescript
const title = import.meta.env.VITE_APP_TITLE;
```

## Next Steps

- [[02 - Shader Effects Guide]] - Understand the effects
- [[06 - Adding New Effects]] - Extend the system
- [[07 - Performance Optimization]] - Make it faster
