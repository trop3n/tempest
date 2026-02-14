# WebCodecs Integration

A plan for implementing high-performance video processing using the WebCodecs API.

## Overview

The [[WebCodecs API]] provides low-level access to browser codecs for:
- **Decoding** video frames
- **Encoding** processed frames
- **Processing** raw pixel data

### Why WebCodecs?

| Approach | Pros | Cons |
|----------|------|------|
| `<video>` + Canvas | Simple | Slow, 30fps max |
| WebCodecs | 60fps, full control | Complex, Chrome only |
| WebAssembly | Portable | Slower than GPU |

## Architecture

```mermaid
graph LR
    A[Video File] -->|Decode| B[VideoDecoder]
    B -->|VideoFrame| C[WebGL Texture]
    C -->|Process| D[Effect Chain]
    D -->|Read pixels| E[VideoFrame]
    E -->|Encode| F[VideoEncoder]
    F -->|EncodedChunk| G[Output File]
```

## Implementation Plan

### Phase 1: Video Decoding

```typescript
// src/engine/VideoDecoder.ts

export class VideoDecoderWrapper {
  private decoder: VideoDecoder;
  private frames: VideoFrame[] = [];
  
  async initialize(config: VideoDecoderConfig) {
    this.decoder = new VideoDecoder({
      output: (frame) => this.frames.push(frame),
      error: (e) => console.error(e)
    });
    
    await this.decoder.configure(config);
  }
  
  decode(chunk: EncodedVideoChunk) {
    this.decoder.decode(chunk);
  }
  
  getNextFrame(): VideoFrame | undefined {
    return this.frames.shift();
  }
}
```

### Phase 2: Frame to Texture

```typescript
// Convert VideoFrame to WebGL texture

async uploadFrameToTexture(frame: VideoFrame): Promise<THREE.Texture> {
  // Option 1: Copy to canvas then texture
  const canvas = new OffscreenCanvas(frame.displayWidth, frame.displayHeight);
  const ctx = canvas.getContext('2d')!;
  
  ctx.drawImage(frame as unknown as CanvasImageSource, 0, 0);
  
  const texture = new THREE.CanvasTexture(canvas);
  frame.close(); // Release frame memory
  
  return texture;
}
```

### Phase 3: Texture to Frame

```typescript
// Read processed pixels back

async textureToVideoFrame(
  renderer: THREE.WebGLRenderer,
  width: number,
  height: number
): Promise<VideoFrame> {
  // Read pixels from WebGL
  const pixels = new Uint8Array(width * height * 4);
  renderer.readRenderTargetPixels(
    renderTarget,
    0, 0, width, height,
    pixels
  );
  
  // Create VideoFrame
  const data = new Uint8Array(pixels);
  const frame = new VideoFrame(data, {
    format: 'RGBA',
    codedWidth: width,
    codedHeight: height,
    timestamp: currentTime
  });
  
  return frame;
}
```

### Phase 4: Video Encoding

```typescript
// src/engine/VideoEncoder.ts

export class VideoEncoderWrapper {
  private encoder: VideoEncoder;
  private chunks: EncodedVideoChunk[] = [];
  
  async initialize(config: VideoEncoderConfig) {
    this.encoder = new VideoEncoder({
      output: (chunk, metadata) => this.chunks.push(chunk),
      error: (e) => console.error(e)
    });
    
    await this.encoder.configure({
      codec: 'vp9',
      width: 1920,
      height: 1080,
      bitrate: 5_000_000
    });
  }
  
  encode(frame: VideoFrame) {
    this.encoder.encode(frame);
    frame.close();
  }
  
  async flush(): Promise<EncodedVideoChunk[]> {
    await this.encoder.flush();
    return this.chunks;
  }
}
```

## Complete Pipeline

```typescript
// src/engine/VideoProcessor.ts

export class VideoProcessor {
  private decoder: VideoDecoderWrapper;
  private encoder: VideoEncoderWrapper;
  private effectProcessor: EffectProcessor;
  
  async processVideo(
    inputFile: File,
    onProgress: (progress: number) => void
  ): Promise<Blob> {
    // 1. Extract configuration from file
    const config = await this.getVideoConfig(inputFile);
    
    // 2. Initialize decoder
    await this.decoder.initialize(config);
    
    // 3. Initialize encoder
    await this.encoder.initialize({
      codec: 'vp9',
      width: config.displayWidth,
      height: config.displayHeight
    });
    
    // 4. Demux and decode
    await this.demuxAndDecode(inputFile);
    
    // 5. Process each frame
    const totalFrames = this.decoder.frameCount;
    let processedFrames = 0;
    
    while (true) {
      const frame = this.decoder.getNextFrame();
      if (!frame) break;
      
      // Upload to GPU
      const texture = await this.uploadFrameToTexture(frame);
      
      // Apply effects
      this.effectProcessor.setTexture(texture);
      this.effectProcessor.render();
      
      // Read back
      const processedFrame = await this.textureToVideoFrame(
        this.effectProcessor.renderer,
        config.displayWidth,
        config.displayHeight
      );
      
      // Encode
      this.encoder.encode(processedFrame);
      
      // Progress
      processedFrames++;
      onProgress(processedFrames / totalFrames);
    }
    
    // 6. Flush encoder
    const chunks = await this.encoder.flush();
    
    // 7. Mux to file
    return this.muxToFile(chunks);
  }
}
```

## MP4 Demuxing

WebCodecs doesn't handle containers. We need a demuxer:

```typescript
// Using mp4box.js for MP4 demuxing
import MP4Box from 'mp4box';

async function demuxMP4(file: File) {
  const mp4boxFile = MP4Box.createFile();
  
  return new Promise((resolve) => {
    mp4boxFile.onReady = (info) => {
      const track = info.videoTracks[0];
      
      mp4boxFile.onSamples = (id, user, samples) => {
        for (const sample of samples) {
          const chunk = new EncodedVideoChunk({
            type: sample.is_sync ? 'key' : 'delta',
            timestamp: sample.cts,
            duration: sample.duration,
            data: sample.data
          });
          
          decoder.decode(chunk);
        }
      };
      
      mp4boxFile.setExtractionOptions(track.id);
      mp4boxFile.start();
    };
    
    // Read file
    const reader = file.stream().getReader();
    // ... feed to mp4box
  });
}
```

## Browser Support

```typescript
function isWebCodecsSupported(): boolean {
  return 'VideoDecoder' in window && 
         'VideoEncoder' in window &&
         'VideoFrame' in window;
}

// Check codec support
const canDecode = await VideoDecoder.isConfigSupported({
  codec: 'vp09.00.10.08'
});
```

| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| VideoDecoder | 94+ | ❌ | 16.4+ |
| VideoEncoder | 94+ | ❌ | 16.4+ |
| WebGPU | 113+ | 141+ | 17+ |

## Memory Management

VideoFrames hold GPU memory. Always close them:

```typescript
// Good
const frame = decoder.getNextFrame();
processFrame(frame);
frame.close(); // Release immediately

// Bad - memory leak!
const frames = [];
while (true) {
  frames.push(decoder.getNextFrame()); // ❌ Never released
}
```

## Performance Targets

| Resolution | Target FPS | Processing Time |
|------------|-----------|-----------------|
| 720p | 60 | ~16ms |
| 1080p | 30 | ~33ms |
| 4K | 15 | ~66ms |

## Fallback Strategy

```typescript
if (isWebCodecsSupported()) {
  // Use WebCodecs for full processing
  return new WebCodecsProcessor();
} else if (supportsWebGL) {
  // Use <video> + canvas + WebGL
  return new CanvasProcessor();
} else {
  // CPU fallback
  return new CPUProcessor();
}
```

## API Reference

### VideoFrame

```typescript
interface VideoFrame {
  // Properties
  readonly format: PixelFormat;
  readonly codedWidth: number;
  readonly codedHeight: number;
  readonly displayWidth: number;
  readonly displayHeight: number;
  readonly timestamp: number;
  
  // Methods
  clone(): VideoFrame;
  close(): void;
  allocationSize(options?: VideoFrameCopyToOptions): number;
  copyTo(destination: BufferSource, options?: VideoFrameCopyToOptions): Promise<void;
}
```

### VideoDecoder

```typescript
interface VideoDecoder {
  readonly state: CodecState;
  readonly decodeQueueSize: number;
  
  configure(config: VideoDecoderConfig): void;
  decode(chunk: EncodedVideoChunk): void;
  flush(): Promise<void>;
  reset(): void;
  close(): void;
}
```

## Resources

- [WebCodecs Explainer](https://github.com/WICG/web-codecs/blob/main/explainer.md)
- [Video Processing Blog Post](https://web.dev/webcodecs/)
- [MP4Box.js Documentation](https://github.com/gpac/mp4box.js/)
- [WebGPU Video Processing](https://webgpu.github.io/webgpu-samples/samples/videoUploading)

## Implementation Status

- [x] Basic video loading via `<video>` element
- [ ] WebCodecs decoding
- [ ] Frame-to-texture upload
- [ ] Texture-to-frame download
- [ ] WebCodecs encoding
- [ ] MP4 muxing
- [ ] Audio passthrough
- [ ] Progress tracking
- [ ] Batch processing
