/// <reference types="vite/client" />

import type { DesktopApi } from "@ifg1000/shared";

declare global {
  interface Window {
    ifg1000?: DesktopApi;
  }
}

export {};
