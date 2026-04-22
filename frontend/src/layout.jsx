
import { Outlet } from 'react-router-dom'
import "./globals.css";


export const metadata = {
  title: "Plot Navigator v3",
  description: "",
  icons: [{
      url: '/rubin-favicon.svg',
      type: 'image/svg+xml'
  }]
};

export default function RootLayout() {
  return (
    <div>
      <div className="bg-black text-white text-1xl p-2 flex flex-row">
        <div className="bg-black text-rubin-blue text-3xl p-2">Rubin Plot Navigator</div>
        <ul className="flex flex-row p-2">
          <li className="p-2 px-3 text-xl"><a href="/plot-navigator">Plots</a></li>
          <li className="p-2 px-3 text-xl"><a href="/plot-navigator/more">More Plots</a></li>
        </ul>
      </div>
      <Outlet />
    </div>
  );
}
