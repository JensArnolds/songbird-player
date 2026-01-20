// File: src/global.d.ts

declare module "*.css";
declare module "eslint-plugin-drizzle";

declare global {
  namespace NodeJS {
    interface Process {
      resourcesPath?: string;
    }
  }
}

interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  onMediaKey: (callback: (key: string) => void) => void;
  removeMediaKeyListener: () => void;
  isElectron: boolean;
  platform: string;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
