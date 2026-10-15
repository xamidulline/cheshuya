import type { ImgHTMLAttributes } from "react";

const widths = [400, 600, 800, 1200, 2000] as const;
const supportedSource = /\.(avif|jpe?g|png|tiff?|webp)$/i;
const basePath = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true" ? "/cheshuya" : "";

function outputPath(source: string, width: number) {
  if (source.startsWith("/images/")) return basePath + source.replace(/-\d+\.webp$/, `-${width}.webp`);
  const relative = decodeURIComponent(source.replace(/^\/media\//, ""));
  const dot = relative.lastIndexOf(".");
  const basename = dot === -1 ? relative : relative.slice(0, dot);
  return `${basePath}/images/${basename.split("/").map(encodeURIComponent).join("/")}-${width}.webp`;
}
type ResponsiveImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes" | "loading"> & {
  src: string; sizes: string; priority?: boolean; fill?: boolean; deferred?: boolean;
};
/** Existing WebP variants, with no full-size PNG/JPEG request during startup. */
export function ResponsiveImage({ src, sizes, priority = false, fill = false, deferred = false, style, ...props }: ResponsiveImageProps) {
  const hasVariants = (src.startsWith("/media/") && supportedSource.test(src)) || /\/images\/.*-\d+\.webp$/.test(src);
  const srcSet = hasVariants ? widths.map(width => `${outputPath(src, width)} ${width}w`).join(", ") : undefined;
  const fallback = hasVariants ? outputPath(src, 600) : `${basePath}${src}`;
  return <img {...props}
    src={deferred ? undefined : fallback}
    srcSet={deferred ? undefined : srcSet}
    sizes={srcSet ? sizes : undefined}
    data-gallery-src={deferred ? fallback : undefined}
    data-gallery-srcset={deferred ? srcSet : undefined}
    loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "low"} decoding="async"
    style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style}
  />;
}
