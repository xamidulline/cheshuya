import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true" ? "/cheshuya" : "";

export const metadata: Metadata = {
  title: "Чешуя — цифровой архив",
  description: "Улица, объекты, графика, выставки и издания художника Чешуя.",
  icons: { icon: `${basePath}/media/cheshuya-figma-logo.svg` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
