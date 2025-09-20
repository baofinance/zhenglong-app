import type { Metadata } from "next";
import "./globals.css";
import ContextProvider from "@/contexts";
import { headers } from "next/headers";
import Navigation from "@/components/Navigation";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import FadeContent from "@/components/FadeContent";

export const metadata: Metadata = {
  title: "zhenglong",
  description: "Create tokens pegged to real-world data feeds",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");

  return (
    <html lang="en">
      <body
        className={`antialiased font-sans bg-[#111213] text-zinc-100 ${GeistSans.variable} ${GeistMono.variable} relative`}
      >
        <div className="relative z-10">
          <ContextProvider cookies={cookies}>
            <Navigation />
            <FadeContent
              blur={false}
              duration={500}
              easing="ease-out"
              initialOpacity={0}
            >
              {children}
            </FadeContent>
          </ContextProvider>
        </div>
      </body>
    </html>
  );
}
