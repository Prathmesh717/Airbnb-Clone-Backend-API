import { getServerSession, type NextAuthOptions } from "next-auth";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import type { Role } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";
import { serverEnv } from "./env";
import { ApiError } from "./http";
import { verifyPassword } from "./password";

export type AuthContext = {
  userId: string;
  role: Role;
  email?: string | null;
  name?: string | null;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: serverEnv.authSecret,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
    ...(serverEnv.googleClientId && serverEnv.googleClientSecret
      ? [GoogleProvider({ clientId: serverEnv.googleClientId, clientSecret: serverEnv.googleClientSecret })]
      : []),
    ...(serverEnv.githubClientId && serverEnv.githubClientSecret
      ? [GitHubProvider({ clientId: serverEnv.githubClientId, clientSecret: serverEnv.githubClientSecret })]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      const role = (user as { role?: Role } | undefined)?.role;
      if (role) token.role = role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { id?: string; role?: Role }).id = token.sub;
        (session.user as typeof session.user & { id?: string; role?: Role }).role =
          (token.role as Role | undefined) ?? "GUEST";
      }
      return session;
    },
  },
};

function contextFromToken(token: Record<string, unknown> | null): AuthContext | null {
  const userId = typeof token?.sub === "string" ? token.sub : null;
  if (!userId) return null;
  const role = token?.role === "ADMIN" || token?.role === "HOST" ? token.role : "GUEST";
  return {
    userId,
    role,
    email: typeof token?.email === "string" ? token.email : null,
    name: typeof token?.name === "string" ? token.name : null,
  };
}

export async function getAuthContext(request?: Request): Promise<AuthContext | null> {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as
    | ({ id?: string; role?: Role; email?: string | null; name?: string | null } | undefined)
    | undefined;
  if (sessionUser?.id) {
    return {
      userId: sessionUser.id,
      role: sessionUser.role ?? "GUEST",
      email: sessionUser.email,
      name: sessionUser.name,
    };
  }

  if (request) {
    const token = await getToken({
      req: request as NextRequest,
      secret: serverEnv.authSecret,
    });
    const context = contextFromToken(token as Record<string, unknown> | null);
    if (context) return context;

    if (serverEnv.allowDevAuth) {
      const userId = request.headers.get("x-user-id");
      if (userId) {
        const rawRole = request.headers.get("x-user-role");
        const role: Role = rawRole === "ADMIN" || rawRole === "HOST" ? rawRole : "GUEST";
        return { userId, role, email: request.headers.get("x-user-email") };
      }
    }
  }

  return null;
}

export async function requireAuth(request?: Request) {
  const context = await getAuthContext(request);
  if (!context) throw new ApiError(401, "Authentication required");
  return context;
}

export function requireRole(context: AuthContext, roles: Role[]) {
  if (!roles.includes(context.role)) {
    throw new ApiError(403, "You do not have permission to perform this action");
  }
  return context;
}

export function assertOwnerOrAdmin(context: AuthContext, ownerId: string) {
  if (context.role !== "ADMIN" && context.userId !== ownerId) {
    throw new ApiError(403, "You do not own this resource");
  }
}

export async function ensureAuthUser(context: AuthContext) {
  return prisma.user.upsert({
    where: { id: context.userId },
    create: {
      id: context.userId,
      email: context.email ?? undefined,
      name: context.name ?? undefined,
      role: context.role,
    },
    update: {
      email: context.email ?? undefined,
      name: context.name ?? undefined,
    },
  });
}
