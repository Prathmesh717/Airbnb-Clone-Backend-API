import Link from "next/link";
import { Icon } from "./Icon";

export function DashboardNav({ area = "guest" }: { area?: "guest" | "host" }) {
  const items = area === "host" ? [{ href: "/host/listings", label: "Listings", icon: "home" as const }, { href: "/host/reservations", label: "Reservations", icon: "calendar" as const }, { href: "/messages", label: "Inbox", icon: "inbox" as const }] : [{ href: "/trips", label: "Trips", icon: "calendar" as const }, { href: "/favorites", label: "Wishlists", icon: "heart" as const }, { href: "/messages", label: "Inbox", icon: "inbox" as const }];
  return <nav className="dashboard-nav" aria-label={`${area} navigation`}>{items.map((item) => <Link href={item.href} key={item.href}><Icon name={item.icon} size={17} />{item.label}</Link>)}</nav>;
}
