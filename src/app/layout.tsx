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
      <body className={`${spaceGrotesk.className} antialiased`}>
        <Web3Provider>
          <AddressesProvider>
            <ContractWriteProvider>{children}</ContractWriteProvider>
          </AddressesProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
