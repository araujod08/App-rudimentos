import type { Metadata, Viewport } from "next";
import RegisterSW from "./components/RegisterSW";

export const metadata: Metadata = {
  title: "40 Rudimentos",
  description: "Treino de rudimentos e viradas de bateria",
  appleWebApp: { capable: true, title: "Rudimentos", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};
export const viewport: Viewport = { themeColor: "#d9480f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
