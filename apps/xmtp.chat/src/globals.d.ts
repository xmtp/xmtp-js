/// <reference types="vite/client" />

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.png" {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_PROJECT_ID: string;
  readonly VITE_PINATA_GATEWAY: string;
  readonly VITE_API_SERVICE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
