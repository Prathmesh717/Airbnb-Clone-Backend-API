"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandMark } from "./BrandMark";

const authSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").max(128),
});

type AuthValues = z.infer<typeof authSchema>;

export function AuthCard({ mode = "signin" }: { mode?: "signin" | "signup" }) {
  const [busyProvider, setBusyProvider] = useState<string>();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function submit(values: AuthValues) {
    setServerError("");
    if (mode === "signup" && (!values.name || values.name.length < 2)) {
      setServerError("Tell us your name");
      return;
    }
    if (mode === "signup") {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, email: values.email, password: values.password }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setServerError(payload?.error ?? "We couldn’t create your account");
        return;
      }
    }

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl: "/",
    });
    if (!result?.ok) setServerError("That email and password combination didn’t work.");
    else window.location.assign(result.url ?? "/");
  }

  async function social(provider: "google" | "github") {
    setBusyProvider(provider);
    setServerError("");
    try {
      await signIn(provider, { callbackUrl: "/" });
    } catch {
      setServerError(`${provider === "google" ? "Google" : "GitHub"} sign-in is not configured yet.`);
    } finally {
      setBusyProvider(undefined);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <BrandMark />
        <div className="auth-card__intro">
          <p className="eyebrow">{mode === "signup" ? "Welcome in" : "Welcome back"}</p>
          <h1>{mode === "signup" ? "Make room for more." : "Good to see you again."}</h1>
          <p>{mode === "signup" ? "Create an account and keep your favorite places close." : "Sign in to see your trips, messages, and saved stays."}</p>
        </div>
        <div className="auth-socials">
          <button type="button" className="social-button" onClick={() => social("google")} disabled={Boolean(busyProvider)}>
            <span className="google-mark">G</span> {busyProvider === "google" ? "Connecting…" : "Continue with Google"}
          </button>
          <button type="button" className="social-button" onClick={() => social("github")} disabled={Boolean(busyProvider)}>
            <span className="github-mark">GH</span> {busyProvider === "github" ? "Connecting…" : "Continue with GitHub"}
          </button>
        </div>
        <div className="auth-divider"><span>or continue with email</span></div>
        <form onSubmit={handleSubmit(submit)} noValidate>
          {mode === "signup" ? <label className="form-field"><span>Your name</span><input {...register("name")} placeholder="Alex Morgan" autoComplete="name" />{errors.name ? <small className="form-error">{errors.name.message}</small> : null}</label> : null}
          <label className="form-field"><span>Email address</span><input {...register("email")} type="email" placeholder="you@example.com" autoComplete="email" />{errors.email ? <small className="form-error">{errors.email.message}</small> : null}</label>
          <label className="form-field"><span>Password</span><input {...register("password")} type="password" placeholder="At least 8 characters" autoComplete={mode === "signup" ? "new-password" : "current-password"} />{errors.password ? <small className="form-error">{errors.password.message}</small> : null}</label>
          {serverError ? <p className="form-error">{serverError}</p> : null}
          <button type="submit" className="button button--accent button--full" disabled={isSubmitting}>{isSubmitting ? <><span className="spinner spinner--light" /> {mode === "signup" ? "Creating account…" : "Signing in…"}</> : mode === "signup" ? "Create account" : "Sign in"}</button>
        </form>
        <p className="auth-switch">{mode === "signup" ? "Already have an account?" : "New to Stayfolk?"} <Link href={mode === "signup" ? "/auth/signin" : "/auth/signup"}>{mode === "signup" ? "Log in" : "Sign up"}</Link></p>
        <p className="auth-card__legal">By continuing, you agree to Stayfolk’s <Link href="/">Terms</Link> and <Link href="/">Privacy Policy</Link>.</p>
      </div>
    </main>
  );
}
