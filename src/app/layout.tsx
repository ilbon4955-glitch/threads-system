import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Threads Viral Lab ¬∑ JP 2030",
  description:
    "?ºÎ≥∏ 2030 ?¨ÏÑ± ?ÄÍπ?Threads Î∞îÏù¥??Î∂ÑÏÑù¬∑Ïπ¥Ìîº ?ùÏÑ± ?Ä?úÎ≥¥??,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${notoSansKr.variable} ${notoSansJp.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-boot" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('threads-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
