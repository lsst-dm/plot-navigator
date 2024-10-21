import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Plot Navigator v3",
  description: "",
  icons: [{
      url: '/rubin-favicon.svg',
      type: 'image/svg+xml'
  }]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="bg-black text-white text-1xl p-2 flex flex-row">
          <div className="bg-black text-rubin-blue text-3xl p-2">Rubin Plot Navigator</div>
          <ul className="flex flex-row p-2">
            <li className="p-2 px-3 text-xl"><a href="/plot-navigator">Plots</a></li>
            {(process.env.PAGE_LINKS ?? "").split(',').map((page) =>
                <li className="p-2 px-3 text-xl" key={page}><a href={`/plot-navigator/${page.toLowerCase()}`}>{page}</a></li>
            )}
          </ul>
        </div>
        {children}
      </body>
    </html>
  );
}
