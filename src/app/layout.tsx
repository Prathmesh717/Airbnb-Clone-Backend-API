import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "react-day-picker/style.css";
import "./globals.css";
import { AppShell } from "../components/AppShell";
import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "stayfolk — places that feel like yours",
  description: "Thoughtful stays hosted by people who care about the details.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Providers><AppShell>{children}</AppShell></Providers></body></html>;
}
