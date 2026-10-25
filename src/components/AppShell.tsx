"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "./BrandMark";
import { Icon } from "./Icon";

const navItems = [
  { href: "/trips", label: "Trips" },
  { href: "/favorites", label: "Wishlists" },
  { href: "/messages", label: "Inbox" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";

  return (
    <div className="app-shell">
      <header className={`site-header${isHome ? " site-header--home" : ""}`}>
        <div className="shell-container site-header__inner">
          <BrandMark />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link className={pathname.startsWith(item.href) ? "nav-link nav-link--active" : "nav-link"} href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/host/listings" className="nav-link">Switch to hosting</Link>
          </nav>
          <div className="site-header__actions">
            <Link className="host-link" href="/host/listings">List your place</Link>
            <button type="button" className="profile-menu" aria-label="Open account menu" onClick={() => setMenuOpen((open) => !open)}>
              <Icon name="menu" size={17} />
              <span className="profile-menu__avatar"><Icon name="user" size={17} /></span>
            </button>
            {menuOpen ? (
              <div className="account-popover">
                <Link href="/auth/signin" onClick={() => setMenuOpen(false)}>Log in</Link>
                <Link href="/auth/signup" onClick={() => setMenuOpen(false)}>Sign up</Link>
                <Link href="/trips" onClick={() => setMenuOpen(false)}>Trips</Link>
                <Link href="/host/listings" onClick={() => setMenuOpen(false)}>Host your home</Link>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <Link href="/" className={pathname === "/" ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"}><Icon name="search" size={21} /><span>Explore</span></Link>
        <Link href="/favorites" className={pathname.startsWith("/favorites") ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"}><Icon name="heart" size={21} /><span>Wishlists</span></Link>
        <Link href="/trips" className={pathname.startsWith("/trips") ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"}><Icon name="calendar" size={21} /><span>Trips</span></Link>
        <Link href="/messages" className={pathname.startsWith("/messages") ? "mobile-nav__item mobile-nav__item--active" : "mobile-nav__item"}><Icon name="inbox" size={21} /><span>Inbox</span></Link>
      </nav>
    </div>
  );
}
