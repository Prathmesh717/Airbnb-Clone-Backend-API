import { describe, expect, it } from "vitest";
import { assertOwnerOrAdmin, requireRole, type AuthContext } from "../src/lib/server/auth";

const guest: AuthContext = {
  userId: "guest-1",
  role: "GUEST",
  email: "guest@example.com",
};

describe("authorization invariants", () => {
  it("allows a context whose role is explicitly permitted", () => {
    expect(requireRole(guest, ["GUEST"])).toBe(guest);
  });

  it("rejects a context whose role is not permitted", () => {
    expect(() => requireRole(guest, ["HOST", "ADMIN"])).toThrowError(
      expect.objectContaining({ status: 403 }),
    );
  });

  it("allows the owner and administrators to mutate a resource", () => {
    expect(() => assertOwnerOrAdmin(guest, "guest-1")).not.toThrow();
    expect(() => assertOwnerOrAdmin({ ...guest, role: "ADMIN" }, "someone-else")).not.toThrow();
  });

  it("rejects a different non-admin user", () => {
    expect(() => assertOwnerOrAdmin(guest, "host-1")).toThrowError(
      expect.objectContaining({ status: 403 }),
    );
  });
});
