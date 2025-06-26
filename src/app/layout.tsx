import type { Metadata } from "next";
import { Space_Grotesk, Geo } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "../components/Web3Provider";
import { AddressesProvider } from "../contexts/AddressesContext";
import { ContractWriteProvider } from "../contexts/ContractWriteContext";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
});

const geo = Geo({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "zhenglong",
  description: "Create tokens pegged to real-world data feeds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.className} antialiased bg-gradient-to-b from-[#0F0F0F] to-[#080808] text-[#F5F5F5] font-sans relative`}
      >
        {/* Steam Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {/* Simplified and more subtle steam background */}
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
          <Web3Provider>
            <AddressesProvider>
              <ContractWriteProvider>{children}</ContractWriteProvider>
            </AddressesProvider>
          </Web3Provider>
        </div>
      </body>
    </html>
  );
}
