import Image from "next/image";
import { Geo } from "next/font/google";
import TokenList from "../components/TokenList";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A1A] to-black text-[#F5F5F5] font-sans relative">
      {/* Steam Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-1/3 h-1/2 bg-[#4A7C59]/[0.03]"></div>
        <div className="absolute top-0 right-0 w-1/2 h-2/3 bg-[#4A7C59]/[0.02]"></div>
        <div className="absolute bottom-0 left-0 w-2/3 h-1/2 bg-[#4A7C59]/[0.035]"></div>
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-[#4A7C59]/[0.045]"></div>
        <div className="absolute top-[20%] left-[15%] w-[300px] h-[400px] bg-[#4A7C59]/[0.04]"></div>
        <div className="absolute top-[40%] right-[25%] w-[250px] h-[350px] bg-[#4A7C59]/[0.03]"></div>
        <div className="absolute bottom-[35%] left-[35%] w-[400px] h-[300px] bg-[#4A7C59]/[0.035]"></div>
        <div className="absolute bottom-[25%] right-[20%] w-[350px] h-[250px] bg-[#4A7C59]/[0.045]"></div>
        <div className="absolute top-[60%] left-[45%] w-[200px] h-[150px] bg-[#4A7C59]/[0.05]"></div>
        <div className="absolute top-[75%] right-[40%] w-[180px] h-[220px] bg-[#4A7C59]/[0.04]"></div>
        <div className="absolute bottom-[50%] left-[25%] w-[160px] h-[180px] bg-[#4A7C59]/[0.06]"></div>
        <div className="absolute bottom-[15%] right-[15%] w-[140px] h-[200px] bg-[#4A7C59]/[0.05]"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A]/90 backdrop-blur-sm border-b border-[#4A7C59]/20">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="Zhenglong Protocol"
                  width={32}
                  height={32}
                  className="w-full h-full"
                />
              </div>
              <span
                className={`text-xl tracking-wider text-[#4A7C59] ${geo.className}`}
              >
                zhenglong
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#"
                className="text-[#F5F5F5]/80 hover:text-[#F5F5F5] tracking-wider transition-colors"
              >
                Docs
              </a>
              <a
                href="#"
                className="text-[#F5F5F5]/80 hover:text-[#F5F5F5] tracking-wider transition-colors"
              >
                Governance
              </a>
              <a
                href="#"
                className="text-[#F5F5F5]/80 hover:text-[#F5F5F5] tracking-wider transition-colors"
              >
                Discord
              </a>
              <a
                href="#"
                className="text-[#F5F5F5]/80 hover:text-[#F5F5F5] tracking-wider transition-colors"
              >
                Bug Bounty
              </a>
            </div>

            {/* Launch App Button */}
            <button
              className={`bg-[#4A7C59] hover:bg-[#3A6147] px-6 py-2 text-white text-lg tracking-wider transition-all uppercase ${geo.className}`}
            >
              Launch App
            </button>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-[#F5F5F5] hover:text-[#F5F5F5]/80 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Content Container */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative w-full min-h-[80vh] overflow-hidden pt-16 bg-black">
          {/* Background Pattern */}
          <div className="absolute inset-0 w-full h-full">
            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-[#1A1A1A]/90 to-black"></div>

            {/* Hero Steam Background */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Large base squares */}
              <div className="absolute top-[15%] left-[20%] w-[600px] h-[400px] bg-[#4A7C59]/[0.06]"></div>
              <div className="absolute top-[25%] right-[15%] w-[500px] h-[450px] bg-[#4A7C59]/[0.05]"></div>
              <div className="absolute top-[20%] left-[35%] w-[400px] h-[300px] bg-[#4A7C59]/[0.07]"></div>

              {/* Medium squares - Layer 1 */}
              <div className="absolute top-[22%] left-[10%] w-[300px] h-[250px] bg-[#4A7C59]/[0.04] animate-float-1"></div>
              <div className="absolute top-[28%] right-[25%] w-[280px] h-[320px] bg-[#4A7C59]/[0.045] animate-float-2"></div>
              <div className="absolute top-[35%] left-[40%] w-[350px] h-[280px] bg-[#4A7C59]/[0.055] animate-float-3"></div>

              {/* Medium squares - Layer 2 */}
              <div className="absolute top-[30%] left-[28%] w-[250px] h-[200px] bg-[#4A7C59]/[0.065] animate-float-4"></div>
              <div className="absolute top-[25%] right-[30%] w-[220px] h-[180px] bg-[#4A7C59]/[0.05] animate-float-1"></div>
              <div className="absolute top-[40%] left-[15%] w-[280px] h-[240px] bg-[#4A7C59]/[0.06] animate-float-2"></div>

              {/* Small pixel squares */}
              <div className="absolute top-[20%] left-[45%] w-[120px] h-[120px] bg-[#4A7C59]/[0.075] animate-steam-1"></div>
              <div className="absolute top-[35%] right-[40%] w-[150px] h-[150px] bg-[#4A7C59]/[0.07] animate-steam-2"></div>
              <div className="absolute top-[30%] left-[25%] w-[100px] h-[100px] bg-[#4A7C59]/[0.08] animate-steam-3"></div>
              <div className="absolute top-[25%] right-[20%] w-[80px] h-[80px] bg-[#4A7C59]/[0.065] animate-steam-1"></div>
              <div className="absolute top-[45%] left-[30%] w-[90px] h-[90px] bg-[#4A7C59]/[0.075] animate-steam-2"></div>
              <div className="absolute top-[38%] right-[35%] w-[110px] h-[110px] bg-[#4A7C59]/[0.07] animate-steam-3"></div>
            </div>
          </div>

          {/* Content */}
          <section className="container mx-auto px-6 py-32 relative z-10">
            <div className="text-center">
              <div className="mb-1 flex justify-center">
                <div className="w-48 h-48">
                  <Image
                    src="/logo.svg"
                    alt="Zhenglong Protocol"
                    width={192}
                    height={192}
                    className="w-full h-full"
                  />
                </div>
              </div>
              <h1
                className={`text-7xl md:text-8xl font-normal mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#4A7C59] to-[#6B9E76] tracking-[0.2em] uppercase ${geo.className}`}
              >
                Zhenglong Protocol
              </h1>
              <p className="text-xl md:text-2xl text-[#F5F5F5]/80 mb-12 tracking-wider font-light">
                Tokenize any market data. Earn yield and get protected leverage
                exposure.
              </p>
              <div className="flex justify-center gap-6">
                <button
                  className={`bg-[#4A7C59] hover:bg-[#3A6147] text-[#F5F5F5] px-8 py-3 tracking-wider transition-all uppercase text-lg ${geo.className}`}
                >
                  Get Started
                </button>
                <button
                  className={`border border-[#4A7C59] hover:bg-[#4A7C59]/10 text-[#F5F5F5] px-8 py-3 tracking-wider transition-all uppercase text-lg ${geo.className}`}
                >
                  Learn More
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-24 relative z-10">
          <h2
            className={`text-3xl md:text-4xl font-normal text-center mb-16 tracking-wider uppercase ${geo.className}`}
          >
            Fully Backed and Redeemable Tokens
          </h2>
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="text-center p-6 bg-black/80 hover:bg-black/90 transition-all shadow-[0_0_15px_rgba(74,124,89,0.1)] min-h-[280px]">
                  <div
                    className={`text-3xl md:text-4xl mb-6 text-[#4A7C59] ${geo.className}`}
                  >
                    LONG TOKENS
                  </div>
                  <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light mb-8">
                    Pegged tokens that track real-world assets with 1:1 price
                    matching
                  </p>
                  <TokenList
                    tokens={[
                      "longUSD",
                      "longBTC",
                      "longETH",
                      "longTSLA",
                      "longSP500",
                    ]}
                    duration={20}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/80 p-4 pt-8 shadow-[0_0_15px_rgba(74,124,89,0.1)] rounded-sm relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#4A7C59] flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v12m0 0l3.75-3.75M12 18l-3.75-3.75M12 6c-1.93 0-3.5-1.57-3.5-3.5S10.07 1 12 1s3.5 1.57 3.5 3.5S13.93 6 12 6z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-[#F5F5F5]/70 text-center">
                      Earn real yield for depositing into the rebalance pool
                    </p>
                  </div>
                  <div className="bg-black/80 p-4 pt-8 shadow-[0_0_15px_rgba(74,124,89,0.1)] rounded-sm relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#4A7C59] flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4-4m-4 4l4 4"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-[#F5F5F5]/70 text-center">
                      Earn STEAM for providing AMM liquidity
                    </p>
                  </div>
                  <div className="bg-black/80 p-4 pt-8 shadow-[0_0_15px_rgba(74,124,89,0.1)] rounded-sm relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#4A7C59] flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-[#F5F5F5]/70 text-center">
                      Use in Defi
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="text-center p-6 bg-black/80 hover:bg-black/90 transition-all shadow-[0_0_15px_rgba(74,124,89,0.1)] min-h-[280px]">
                  <div
                    className={`text-3xl md:text-4xl mb-6 text-[#4A7C59] ${geo.className}`}
                  >
                    STEAMED TOKENS
                  </div>
                  <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light mb-8">
                    Get supercharged market exposure through
                    liquidation-protected variable leverage tokens
                  </p>
                  <TokenList
                    tokens={[
                      "steamedETH",
                      "steamedETH-DOWN",
                      "steamedBTC",
                      "steamedBTC-DOWN",
                      "steamedTSLA",
                      "steamedTSLA-DOWN",
                      "steamedSP500",
                      "steamedSP500-DOWN",
                    ]}
                    duration={32}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/80 p-4 pt-8 shadow-[0_0_15px_rgba(74,124,89,0.1)] rounded-sm relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#4A7C59] flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 6l9 3l9-3M3 12l9 3l9-3M3 18l9 3l9-3"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-[#F5F5F5]/70 text-center">
                      Automatically rebalance during volatility
                    </p>
                  </div>
                  <div className="bg-black/80 p-4 pt-8 shadow-[0_0_15px_rgba(74,124,89,0.1)] rounded-sm relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#4A7C59] flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 9l6 6M15 9l-6 6"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-[#F5F5F5]/70 text-center">
                      No funding fees
                    </p>
                  </div>
                  <div className="bg-black/80 p-4 pt-8 shadow-[0_0_15px_rgba(74,124,89,0.1)] rounded-sm relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#4A7C59] flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-[#F5F5F5]/70 text-center">
                      Use in Defi
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STEAM Token Section */}
        <section className="container mx-auto px-6 py-24 relative z-10">
          <h2
            className={`text-3xl md:text-4xl font-normal text-center mb-16 tracking-wider uppercase ${geo.className}`}
          >
            STEAM Token
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <p className="text-xl text-[#F5F5F5]/80 leading-relaxed tracking-wide font-light mb-12">
                STEAM is the governance token that powers the Zhenglong Protocol
                ecosystem, offering holders multiple benefits and control over
                the protocol&apos;s future.
              </p>
              <div className="grid grid-cols-3 gap-8">
                <div className="bg-black/80 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
                  <h3 className="text-lg font-medium mb-4 tracking-wider uppercase text-[#4A7C59]">
                    Revenue Share
                  </h3>
                  <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                    Earn a share of protocol revenue from market operations and
                    fees
                  </p>
                </div>
                <div className="bg-black/80 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
                  <h3 className="text-lg font-medium mb-4 tracking-wider uppercase text-[#4A7C59]">
                    Boost Rewards
                  </h3>
                  <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                    Increase your earnings from rebalance pool and AMM liquidity
                    provision
                  </p>
                </div>
                <div className="bg-black/80 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
                  <h3 className="text-lg font-medium mb-4 tracking-wider uppercase text-[#4A7C59]">
                    Governance Rights
                  </h3>
                  <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                    Vote in protocol governance and direct STEAM rewards
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-black/80 p-8 h-[400px] shadow-[0_0_15px_rgba(74,124,89,0.1)] relative overflow-hidden">
              {/* Main Content */}
              <div className="h-full flex flex-col items-center justify-center">
                {/* Center STEAM Logo and Text */}
                <div className="flex flex-col items-center mb-12">
                  <div className="w-24 h-24 mb-3">
                    <Image
                      src="/logo.svg"
                      alt="STEAM Token"
                      width={96}
                      height={96}
                      className="w-full h-full"
                    />
                  </div>
                  <div className={`text-3xl text-[#4A7C59] ${geo.className}`}>
                    STEAM
                  </div>
                </div>

                {/* Call to Action Buttons */}
                <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                  <button
                    className={`bg-[#4A7C59] hover:bg-[#3A6147] text-[#F5F5F5] px-8 py-4 tracking-wider transition-all uppercase text-lg ${geo.className}`}
                  >
                    Get STEAM
                  </button>
                  <button
                    className={`border border-[#4A7C59] hover:bg-[#4A7C59]/10 text-[#F5F5F5] px-8 py-4 tracking-wider transition-all uppercase text-lg ${geo.className}`}
                  >
                    Earn STEAM
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Booster Program Section */}
        <section className="container mx-auto px-6 py-24 relative z-10">
          <h2
            className={`text-3xl md:text-4xl font-normal text-center mb-16 tracking-wider uppercase ${geo.className}`}
          >
            Community Booster Program
          </h2>
          <div className="space-y-16">
            {/* Main Content */}
            <div className="space-y-12">
              {/* Description Text */}
              <p className="text-xl text-[#F5F5F5]/80 leading-relaxed tracking-wide font-light text-center max-w-3xl mx-auto">
                Join our community of boosters and earn STEAM tokens for helping
                spread the word about Zhenglong Protocol. Any form of marketing
                contribution is welcome.
              </p>

              {/* Four Boxes Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-black/80 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
                  <div className="w-12 h-12 mb-4 bg-[#4A7C59]/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#4A7C59]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-3 tracking-wider uppercase text-[#4A7C59]">
                    Social Media
                  </h3>
                  <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                    Create X threads, engage in discussions, and share insights
                    about the protocol
                  </p>
                </div>
                <div className="bg-black/80 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
                  <div className="w-12 h-12 mb-4 bg-[#4A7C59]/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#4A7C59]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-3 tracking-wider uppercase text-[#4A7C59]">
                    Content Creation
                  </h3>
                  <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                    Produce videos, tutorials, and educational content about
                    Zhenglong
                  </p>
                </div>
                <div className="bg-black/80 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
                  <div className="w-12 h-12 mb-4 bg-[#4A7C59]/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#4A7C59]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-3 tracking-wider uppercase text-[#4A7C59]">
                    Articles & Blogs
                  </h3>
                  <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                    Write articles explaining the protocol&apos;s features and
                    benefits
                  </p>
                </div>
                <div className="bg-black/80 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
                  <div className="w-12 h-12 mb-4 bg-[#4A7C59]/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-[#4A7C59]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-3 tracking-wider uppercase text-[#4A7C59]">
                    Community Building
                  </h3>
                  <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                    Organize community events and foster discussions in your
                    local network
                  </p>
                </div>
              </div>

              {/* Token Supply Text */}
              <div className="text-center">
                <p className="text-lg md:text-xl text-[#F5F5F5] leading-relaxed tracking-wider font-light">
                  <span className="block mb-2">
                    <span className="text-xl md:text-2xl font-medium text-[#4A7C59] border-b border-[#4A7C59]/50 pb-1">
                      3%
                    </span>
                  </span>
                  <span className="block text-[#F5F5F5]/90">
                    of STEAM token supply is distributed to our community of
                    boosters
                  </span>
                </p>
              </div>

              {/* Become a Booster Box */}
              <div className="max-w-2xl mx-auto">
                <div className="bg-black/80 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)] relative">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="space-y-3">
                      <div
                        className={`text-3xl text-[#4A7C59] ${geo.className}`}
                      >
                        Become a Booster
                      </div>
                      <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                        Help grow the Zhenglong ecosystem and earn rewards for
                        your contributions
                      </p>
                      <div className="pt-3">
                        <button
                          className={`bg-[#4A7C59] hover:bg-[#3A6147] text-[#F5F5F5] px-8 py-3 tracking-wider transition-all uppercase text-lg ${geo.className}`}
                        >
                          Join Program
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="container mx-auto px-6 py-24 relative z-10">
          <h2
            className={`text-3xl md:text-4xl font-normal text-center mb-16 tracking-wider uppercase ${geo.className}`}
          >
            Use Cases
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#1A1A1A]/70 p-6 hover:bg-[#1A1A1A] transition-all shadow-[0_0_15px_rgba(74,124,89,0.1)]">
              <h3 className="text-xl font-medium mb-4 tracking-wider uppercase">
                Global Market Access
              </h3>
              <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                Trade synthetic versions of international stocks and commodities
                24/7, breaking down geographical barriers
              </p>
            </div>
            <div className="bg-[#1A1A1A]/70 p-6 hover:bg-[#1A1A1A] transition-all shadow-[0_0_15px_rgba(74,124,89,0.1)]">
              <h3 className="text-xl font-medium mb-4 tracking-wider uppercase">
                Weather Risk Management
              </h3>
              <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                Create derivatives based on weather data, allowing businesses to
                hedge against climate-related risks
              </p>
            </div>
            <div className="bg-[#1A1A1A]/70 p-6 hover:bg-[#1A1A1A] transition-all shadow-[0_0_15px_rgba(74,124,89,0.1)]">
              <h3 className="text-xl font-medium mb-4 tracking-wider uppercase">
                Sports & Entertainment
              </h3>
              <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                Tokenize athlete performance metrics and entertainment revenues
                for new forms of fan engagement
              </p>
            </div>
            <div className="bg-[#1A1A1A]/70 p-6 hover:bg-[#1A1A1A] transition-all shadow-[0_0_15px_rgba(74,124,89,0.1)]">
              <h3 className="text-xl font-medium mb-4 tracking-wider uppercase">
                AI & Machine Learning
              </h3>
              <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                Create tokens tracking AI model performance metrics, enabling
                investment in technological advancement
              </p>
            </div>
            <div className="bg-[#1A1A1A]/70 p-6 hover:bg-[#1A1A1A] transition-all shadow-[0_0_15px_rgba(74,124,89,0.1)]">
              <h3 className="text-xl font-medium mb-4 tracking-wider uppercase">
                Environmental Impact
              </h3>
              <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                Develop tokens tied to environmental metrics and sustainability
                goals, incentivizing green initiatives
              </p>
            </div>
            <div className="bg-[#1A1A1A]/70 p-6 hover:bg-[#1A1A1A] transition-all shadow-[0_0_15px_rgba(74,124,89,0.1)]">
              <h3 className="text-xl font-medium mb-4 tracking-wider uppercase">
                Economic Indicators
              </h3>
              <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                Track complex economic data through tokens, making it easier to
                respond to global economic trends
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light max-w-3xl mx-auto">
              If there&apos;s a data feed and demand, we can create any market
            </p>
          </div>
        </section>

        {/* Build a Market Section */}
        <section className="container mx-auto px-6 py-24">
          <h2
            className={`text-3xl md:text-4xl font-normal text-center mb-16 tracking-wider uppercase ${geo.className}`}
          >
            Collaborate on a New Market
          </h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <p className="text-xl text-[#F5F5F5]/80 leading-relaxed tracking-wide font-light">
              Launch your own market with minimal requirements. If you have a
              collateral token and a price feed, you&apos;re ready to go.
            </p>
            <div className="space-y-6">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 shrink-0 bg-[#4A7C59]/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#4A7C59]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 12V8H6a2 2 0 00-2 2v4m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0h-2m-4 0h-8"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2 tracking-wider uppercase text-[#4A7C59]">
                    Collateral Token
                  </h3>
                  <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                    Any ERC20 token can serve as collateral. Common choices
                    include stablecoins and major cryptocurrencies.
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 shrink-0 bg-[#4A7C59]/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-[#4A7C59]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2 tracking-wider uppercase text-[#4A7C59]">
                    Price Feed
                  </h3>
                  <p className="text-[#F5F5F5]/70 leading-relaxed tracking-wide font-light">
                    Connect any data source through Chainlink oracles. From
                    traditional markets to novel data streams.
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-8 text-center">
              <button
                className={`bg-[#4A7C59] hover:bg-[#3A6147] text-[#F5F5F5] px-8 py-3 tracking-wider transition-all uppercase text-lg ${geo.className}`}
              >
                Contact Us
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
