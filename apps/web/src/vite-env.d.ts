/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" liga os dados simulados (MSW). Só tem efeito em desenvolvimento. */
  readonly VITE_MOCK?: string
}
