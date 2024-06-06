import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Plot Navigator v3",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="bg-black text-rubin-blue text-2xl p-4 font-bold">Rubin Plot Navigator</div>
        {children}
      </body>
    </html>
  );
}
