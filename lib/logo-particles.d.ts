export function createLogoParticles(image: HTMLImageElement, options?: { assetUrl?: string; canPlay?: () => boolean }): { play(): boolean; stop(): void; destroy(): void };
