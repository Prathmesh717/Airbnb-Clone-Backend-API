import { Role } from "@prisma/client";
import { prisma } from "../lib/server/db";
import { ApiError } from "../lib/server/http";
import { hashPassword } from "../lib/server/password";
import type { RegisterInput } from "../lib/server/validation";

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new ApiError(409, "An account with that email already exists");
  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: Role.GUEST,
    },
    select: { id: true, name: true, email: true, role: true },
  });
}
