import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://steamsparkgh.com"),
  title: {
    template: "%s | STEAM Spark",
    default: "STEAM Spark - Personalized STEAM Education",
  },
  description: "STEAM Spark connects curious minds with expert mentors. Personalized learning paths in Science, Technology, Engineering, Arts, and Math for kids ages 5-16.",
  keywords: ["STEAM education", "tutoring", "online learning", "kids education", "Ghana education", "coding for kids", "math tutoring", "science tutoring"],
  authors: [{ name: "STEAM Spark" }],
  creator: "STEAM Spark",
  publisher: "STEAM Spark",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lexend.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
