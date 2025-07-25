import type { Metadata } from "next";
import "./globals.css";
import ContextProvider from "@/contexts";
import { headers } from "next/headers";

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
        className={`antialiased bg-[#0D0D0D] text-[#F5F5F5] font-sans relative`}
      >
        {/* Steam Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[15%] left-[20%] w-[600px] h-[400px] bg-[#4A7C59]/[0.03]"></div>
          <div className="absolute top-[25%] right-[15%] w-[500px] h-[450px] bg-[#4A7C59]/[0.025]"></div>
          <div className="absolute top-[22%] left-[10%] w-[300px] h-[250px] bg-[#4A7C59]/[0.03] animate-float-1"></div>
          <div className="absolute top-[28%] right-[25%] w-[280px] h-[320px] bg-[#4A7C59]/[0.035] animate-float-2"></div>
          <div className="absolute top-[35%] left-[40%] w-[350px] h-[280px] bg-[#4A7C59]/[0.04] animate-float-3"></div>
          <div className="absolute top-[20%] left-[45%] w-[120px] h-[120px] bg-[#4A7C59]/[0.045] animate-steam-1"></div>
          <div className="absolute top-[35%] right-[40%] w-[150px] h-[150px] bg-[#4A7C59]/[0.03] animate-steam-2"></div>
          <div className="absolute top-[30%] left-[25%] w-[100px] h-[100px] bg-[#4A7C59]/[0.04] animate-steam-3"></div>
        </div>
        <div className="relative z-10">
          <ContextProvider cookies={cookies}>{children}</ContextProvider>
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
