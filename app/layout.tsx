import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:{default:"Global Summit on Emerging Technology and Peace",template:"%s | Global Summit"},description:"A graduate Peace Studies classroom activity for evaluating a global framework on emerging technology and peace.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
