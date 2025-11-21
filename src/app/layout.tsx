import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
    title: "PalsPredict",
    description: "Social Prediction Market",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${outfit.variable} font-sans bg-background text-foreground min-h-screen flex flex-col`}>
                <Navbar />
                <main className="flex-1 container mx-auto px-4 py-8">
                    {children}
                </main>
            </body>
        </html>
    );
}
