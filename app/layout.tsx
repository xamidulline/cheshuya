import type { Metadata } from "next";
import "./globals.css";
import "../public/gallery-ui.css";
import { SitePreferencesProvider } from "@/components/site-preferences";
import { themeInitScript } from "@/lib/theme-init";
import { homeEntryInitScript } from "@/lib/home-entry-init";

const basePath = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true" ? "/cheshuya" : "";

export const metadata: Metadata = {
  title: "Чешуя — цифровой архив",
  description: "Улица, объекты, графика, выставки и издания художника Чешуя.",
  icons: { icon: `${basePath}/media/cheshuya-figma-logo.svg` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: homeEntryInitScript }} /><script dangerouslySetInnerHTML={{ __html: themeInitScript }} /><link rel="stylesheet" href={`${basePath}/site-theme.css?v=logo-hold-1`} /></head><body><SitePreferencesProvider>{children}</SitePreferencesProvider></body></html>;
}
