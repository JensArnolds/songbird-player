// File: src/app/layout.tsx

import "@/styles/globals.css";

import { type Metadata } from "next";
import { Manrope } from "next/font/google";
import { Suspense, type ReactNode } from "react";

import { DynamicTitle } from "@/components/DynamicTitle";
import { DesktopShell } from "@/components/DesktopShell";
import { ElectronChromeSync } from "@/components/ElectronChromeSync";
import { ElectronStorageInit } from "@/components/ElectronStorageInit";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import HamburgerMenu from "@/components/HamburgerMenu";
import Header from "@/components/Header";
import MobileContentWrapper from "@/components/MobileContentWrapper";
import { MobileFooterWrapper } from "@/components/MobileFooterWrapper";
import MobileHeader from "@/components/MobileHeader";
import PersistentPlayer from "@/components/PersistentPlayer";
import { PlaylistContextMenu } from "@/components/PlaylistContextMenu";
import { SessionProvider } from "@/components/SessionProvider";
import SuppressExtensionErrors from "@/components/SuppressExtensionErrors";
import { TrackContextMenu } from "@/components/TrackContextMenu";
import { UIWrapper } from "@/components/UIWrapper";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { MenuProvider } from "@/contexts/MenuContext";
import { PlaylistContextMenuProvider } from "@/contexts/PlaylistContextMenuContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { TrackContextMenuProvider } from "@/contexts/TrackContextMenuContext";
import { env } from "@/env";
import { TRPCReactProvider } from "@/trpc/react";
import { getBaseUrl } from "@/utils/getBaseUrl";
import { RegisterServiceWorker } from "./register-sw";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-spotify-sans",
});

const baseUrl = getBaseUrl();

// Get default OG image URL from environment
const getDefaultOgImageUrl = (): string => {
  const songbirdApiUrl = env.API_V2_URL;
  if (songbirdApiUrl) {
    const normalizedSongbirdUrl = songbirdApiUrl.replace(/\/+$/, "");
    return `${normalizedSongbirdUrl}/api/preview/default`;
  }
  // Fallback to static OG image served by this app if env not configured
  return "/og-image.png";
};

const defaultOgImageUrl = getDefaultOgImageUrl();

export const metadata: Metadata = {
  title: "Starchild Music",
  description:
    "Modern music streaming and discovery platform with advanced audio features and visual patterns",
  applicationName: "Starchild Music",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "Starchild Music",
    description:
      "Modern music streaming and discovery platform with advanced audio features and visual patterns",
    type: "website",
    url: baseUrl,
    siteName: "Starchild Music",
    images: [
      {
        url: defaultOgImageUrl,
        width: 1200,
        height: 630,
        alt: "Starchild Music - Modern music streaming platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Starchild Music",
    description:
      "Modern music streaming and discovery platform with advanced audio features and visual patterns",
    images: [defaultOgImageUrl],
  },
  other: {
    "format-detection": "telephone=no",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Starchild Music",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <head>
        {}
        <link rel="preconnect" href="https://cdn-images.dzcdn.net" />
        <link rel="dns-prefetch" href="https://api.deezer.com" />
      </head>
      <body>
        <SuppressExtensionErrors />
        <ElectronStorageInit />
        <RegisterServiceWorker />
        <ErrorBoundary>
          <SessionProvider>
            <TRPCReactProvider>
              <ThemeProvider>
                <AuthModalProvider>
                  <ElectronChromeSync />
                  <ToastProvider>
                    <AudioPlayerProvider>
                      {}
                      <DynamicTitle />
                      <MenuProvider>
                        <TrackContextMenuProvider>
                          <PlaylistContextMenuProvider>
                            {}
                            <UIWrapper>
                              {}
                              <DesktopShell>
                                <div suppressHydrationWarning>
                                  <Suspense fallback={null}>
                                    <Header />
                                  </Suspense>
                                </div>
                                {}
                                <Suspense fallback={null}>
                                  <MobileHeader />
                                </Suspense>
                                {}
                                <HamburgerMenu />
                                {}
                                <MobileContentWrapper>
                                  {}
                                  <div className="pt-16 pb-36 md:pt-0 md:pb-24">
                                    {children}
                                  </div>
                                </MobileContentWrapper>
                              </DesktopShell>
                            </UIWrapper>
                            {}
                            <PersistentPlayer />
                            {}
                            <Suspense fallback={null}>
                              <MobileFooterWrapper />
                            </Suspense>
                            {}
                            <TrackContextMenu />
                            {}
                            <PlaylistContextMenu />
                          </PlaylistContextMenuProvider>
                        </TrackContextMenuProvider>
                      </MenuProvider>
                    </AudioPlayerProvider>
                  </ToastProvider>
                </AuthModalProvider>
              </ThemeProvider>
            </TRPCReactProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
