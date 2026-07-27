declare module "gif.js" {
  interface GifOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    dither?: boolean | string;
    repeat?: number;
  }
  interface AddFrameOptions {
    delay?: number;
    copy?: boolean;
  }
  export default class GIF {
    constructor(options?: GifOptions);
    addFrame(image: CanvasImageSource | ImageData | CanvasRenderingContext2D, options?: AddFrameOptions): void;
    on(event: "finished", cb: (blob: Blob) => void): void;
    on(event: "progress", cb: (p: number) => void): void;
    on(event: string, cb: (...args: unknown[]) => void): void;
    render(): void;
  }
}
