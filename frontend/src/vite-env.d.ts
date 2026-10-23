/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute API origin, e.g. https://api.example.com. Empty = same origin (/api). */
  readonly VITE_API_URL?: string;
  /** Public admin URL for the demo link beneath the consultation form. */
  readonly VITE_ADMIN_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
