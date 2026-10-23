/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute API origin, e.g. https://api.example.com. Empty = same origin (/api). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
