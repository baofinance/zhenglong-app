import type { Metadata } from "next";
import "./globals.css";
import ContextProvider from "@/contexts";
import { headers } from "next/headers";
import Navigation from "@/components/Navigation";

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
        className={`antialiased bg-[#131313] text-[#F5F5F5] font-sans relative`}
      >
        <div className="relative z-10">
          <ContextProvider cookies={cookies}>
            <Navigation />
            {children}
          </ContextProvider>
        </div>
        <script
          src="https://appkit-api.gokgs.com/appkit.js"
          defer
          async
        ></script>
      </body>
    </html>
  );
}
