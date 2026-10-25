"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "../components/Icon";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="error-screen"><div className="error-screen__mark"><Icon name="home" size={28} /></div><p className="eyebrow">A little detour</p><h1>That page took a wrong turn.</h1><p>Try refreshing, or head back to the places that are ready when you are.</p><div className="error-screen__actions"><button type="button" className="button button--dark" onClick={() => reset()}>Try again</button><Link className="button button--outline" href="/">Go home</Link></div></main>;
}
