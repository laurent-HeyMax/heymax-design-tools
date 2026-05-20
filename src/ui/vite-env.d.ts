/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Default Replicate CORS proxy URL injected at build time from .env.production. */
  readonly REPLICATE_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Plugin version, injected at build time from package.json. */
declare const __APP_VERSION__: string;

declare module '*.woff2' {
  const url: string;
  export default url;
}
