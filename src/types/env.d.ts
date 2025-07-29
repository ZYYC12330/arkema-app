/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_PUBLIC_UPLOAD_ENDPOINT: string;
  readonly VITE_API_AUTH_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 