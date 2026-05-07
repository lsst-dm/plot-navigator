
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
      <div className="bg-nav-bar text-white px-6 py-3 flex flex-row items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-700 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="h-6 w-6" fill="currentColor">
              <path d="M80-120v-80h800v80H80Zm40-120v-280h120v280H120Zm200 0v-480h120v480H320Zm200 0v-360h120v360H520Zm200 0v-600h120v600H720Z"/>
            </svg>
          </div>
          <div className="text-rubin-blue text-2xl font-medium tracking-tight">Rubin Plot Navigator</div>
        </div>
        <ul className="flex flex-row gap-2">
          <li className="block px-3 py-1.5 rounded-md text-md bg-white/10 hover:bg-white/15 transition-colors"><a href="/plot-navigator">Plots</a></li>
          <li className="block px-3 py-1.5 rounded-md text-md bg-white/10 hover:bg-white/15 transition-colors"><a href="/plot-navigator/more">More Plots</a></li>
        </ul>
      </div>
      <Outlet />
    </div>
  );
}
