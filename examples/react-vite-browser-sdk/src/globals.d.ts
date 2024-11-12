interface ImportMeta {
  env: {
    VITE_PROJECT_ID?: string;
    VITE_ENCRYPTION_KEY?: string;
  };
}

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.png" {
  const src: string;
  export default src;
}
