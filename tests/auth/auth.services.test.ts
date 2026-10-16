import { describe, it, expect, beforeEach } from "vitest";
import { signupUser, loginUser, getUserFromToken, logoutUser, hashPassword } from "../../src/backend/auth/auth.services.js";

describe("Authentication Services", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "securePassword123";

  it("should hash passwords with salt correctly", () => {
    const hashed = hashPassword("secret");
    expect(hashed).toContain(":");
    const [salt, key] = hashed.split(":");
    expect(salt.length).toBeGreaterThan(0);
    expect(key.length).toBeGreaterThan(0);
  });

  it("should validate signup input requirements", async () => {
    const shortName = await signupUser({ name: "A", email: "test@example.com", password: "password123" });
    expect(shortName.success).toBe(false);
    expect(shortName.error).toContain("name");

    const badEmail = await signupUser({ name: "Test User", email: "not-an-email", password: "password123" });
    expect(badEmail.success).toBe(false);
    expect(badEmail.error).toContain("email");

    const shortPass = await signupUser({ name: "Test User", email: "valid@example.com", password: "123" });
    expect(shortPass.success).toBe(false);
    expect(shortPass.error).toContain("Password");
  });

  it("should successfully register a new user and return session token", async () => {
    const result = await signupUser({
      name: "Alex Mercer",
      email: testEmail,
      password: testPassword
    });

    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.user?.name).toBe("Alex Mercer");
    expect(result.user?.email).toBe(testEmail);
  });

  it("should prevent duplicate user registration", async () => {
    const duplicate = await signupUser({
      name: "Alex Mercer Duplicate",
      email: testEmail,
      password: testPassword
    });

    expect(duplicate.success).toBe(false);
    expect(duplicate.error).toContain("already exists");
  });

  it("should log in an existing user with correct credentials", async () => {
    const loginResult = await loginUser({
      email: testEmail,
      password: testPassword
    });

    expect(loginResult.success).toBe(true);
    expect(loginResult.token).toBeDefined();
    expect(loginResult.user?.email).toBe(testEmail);

    const user = getUserFromToken(loginResult.token);
    expect(user?.email).toBe(testEmail);
  });

  it("should reject login with incorrect password", async () => {
    const loginResult = await loginUser({
      email: testEmail,
      password: "wrongPassword"
    });

    expect(loginResult.success).toBe(false);
    expect(loginResult.error).toContain("Invalid email or password");
  });

  it("should invalidate token on logout", async () => {
    const loginResult = await loginUser({
      email: testEmail,
      password: testPassword
    });

    expect(loginResult.token).toBeDefined();
    const token = loginResult.token;

    logoutUser(token);
    expect(getUserFromToken(token)).toBeNull();
  });
});
