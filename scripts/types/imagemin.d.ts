declare module 'imagemin' {
  interface Options {
    destination?: string;
    plugins: any[];
  }
  function imagemin(input: string[], options: Options): Promise<any[]>;
  export = imagemin;
}

declare module 'imagemin-webp' {
  interface Options {
    quality?: number;
    method?: number;
  }
  function imageminWebp(options?: Options): any;
  export = imageminWebp;
}

declare module 'imagemin-avif' {
  interface Options {
    quality?: number;
    speed?: number;
  }
  function imageminAvif(options?: Options): any;
  export = imageminAvif;
}

declare module 'imagemin-mozjpeg' {
  interface Options {
    quality?: number;
    progressive?: boolean;
  }
  function imageminMozjpeg(options?: Options): any;
  export = imageminMozjpeg;
}

declare module 'imagemin-pngquant' {
  interface Options {
    quality?: [number, number];
  }
  function imageminPngquant(options?: Options): any;
  export = imageminPngquant;
} 