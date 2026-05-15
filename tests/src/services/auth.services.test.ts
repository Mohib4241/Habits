/**
 * ============================================================
 * SERVICES — AuthService Unit Tests
 * ============================================================
 */

import { AuthService } from "../../../src/services/auth.services";

// ── Mock all external dependencies ───────────────────────────────────────────

jest.mock("../../../src/utility/queryExecutor");
jest.mock("../../../src/utility/bcrypt");
jest.mock("../../../src/helper/generateToken.middleware");

import { executeSingleQuery } from "../../../src/utility/queryExecutor";
import { hashPassword, comparePassword } from "../../../src/utility/bcrypt";
import { generateTokenPair } from "../../../src/helper/generateToken.middleware";

const mockExecuteSingleQuery = executeSingleQuery as jest.Mock;
const mockHashPassword = hashPassword as jest.Mock;
const mockComparePassword = comparePassword as jest.Mock;
const mockGenerateTokenPair = generateTokenPair as jest.Mock;

const MOCK_TOKENS = {
  accessToken: "mock_access_token",
  refreshToken: "mock_refresh_token",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGenerateTokenPair.mockReturnValue(MOCK_TOKENS);
});

// ── registerUser ──────────────────────────────────────────────────────────────

describe("AuthService.registerUser", () => {
  it("throws 409 when user with email already exists", async () => {
    mockExecuteSingleQuery.mockResolvedValueOnce({ id: 1 }); // existing user check

    await expect(
      AuthService.registerUser("exists@test.com", "pass123"),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("throws error when INSERT fails to return a user", async () => {
    mockExecuteSingleQuery
      .mockResolvedValueOnce(null) // no existing user
      .mockResolvedValueOnce(null); // INSERT returns null

    mockHashPassword.mockResolvedValue("hashed_pass");

    await expect(
      AuthService.registerUser("new@test.com", "pass123"),
    ).rejects.toThrow("Failed to create new user account");
  });

  it("rejects disposable email addresses before checking the database", async () => {
    await expect(
      AuthService.registerUser("user@mailinator.com", "pass123"),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockExecuteSingleQuery).not.toHaveBeenCalled();
  });

  it("successfully registers a new user and returns tokens", async () => {
    mockExecuteSingleQuery
      .mockResolvedValueOnce(null) // no existing user
      .mockResolvedValueOnce({ id: 5, email: "new@test.com" }); // INSERT result

    mockHashPassword.mockResolvedValue("hashed_password");

    const result = await AuthService.registerUser("new@test.com", "pass123");

    expect(result.user.id).toBe(5);
    expect(result.user.email).toBe("new@test.com");
    expect(result.accessToken).toBe(MOCK_TOKENS.accessToken);
    expect(result.refreshToken).toBe(MOCK_TOKENS.refreshToken);
  });

  it("hashes the password before inserting", async () => {
    mockExecuteSingleQuery
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1, email: "a@b.com" });
    mockHashPassword.mockResolvedValue("$2b$hashed");

    await AuthService.registerUser("a@b.com", "plaintext");

    expect(mockHashPassword).toHaveBeenCalledWith("plaintext");
  });

  it("calls executeSingleQuery twice (check + insert)", async () => {
    mockExecuteSingleQuery
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1, email: "a@b.com" });
    mockHashPassword.mockResolvedValue("$2b$hashed");

    await AuthService.registerUser("a@b.com", "plaintext");

    expect(mockExecuteSingleQuery).toHaveBeenCalledTimes(2);
  });
});

// ── loginUser ─────────────────────────────────────────────────────────────────

describe("AuthService.loginUser", () => {
  it("throws 401 when user is not found by email", async () => {
    mockExecuteSingleQuery.mockResolvedValueOnce(null);

    await expect(
      AuthService.loginUser("ghost@test.com", "pass"),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects disposable email addresses before checking the database", async () => {
    await expect(
      AuthService.loginUser("user@mailinator.com", "pass"),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockExecuteSingleQuery).not.toHaveBeenCalled();
  });

  it("throws 401 when user has no password_hash (OAuth account)", async () => {
    mockExecuteSingleQuery.mockResolvedValueOnce({
      id: 1,
      email: "oauth@test.com",
      password_hash: undefined,
    });

    await expect(
      AuthService.loginUser("oauth@test.com", "pass"),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 401 when password is incorrect", async () => {
    mockExecuteSingleQuery.mockResolvedValueOnce({
      id: 1,
      email: "user@test.com",
      password_hash: "$2b$hashed",
    });
    mockComparePassword.mockResolvedValueOnce(false);

    await expect(
      AuthService.loginUser("user@test.com", "wrongpass"),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("successfully authenticates user with correct credentials", async () => {
    mockExecuteSingleQuery.mockResolvedValueOnce({
      id: 7,
      email: "user@test.com",
      password_hash: "$2b$hashed",
    });
    mockComparePassword.mockResolvedValueOnce(true);

    const result = await AuthService.loginUser("user@test.com", "correctpass");

    expect(result.user.id).toBe(7);
    expect(result.user.email).toBe("user@test.com");
    expect(result.accessToken).toBe(MOCK_TOKENS.accessToken);
  });

  it("calls comparePassword with plain and hashed passwords", async () => {
    const hash = "$2b$10$hashedpassword";
    mockExecuteSingleQuery.mockResolvedValueOnce({
      id: 1,
      email: "user@test.com",
      password_hash: hash,
    });
    mockComparePassword.mockResolvedValueOnce(true);

    await AuthService.loginUser("user@test.com", "myplainpass");

    expect(mockComparePassword).toHaveBeenCalledWith("myplainpass", hash);
  });
});
