import { executeSingleQuery } from "../utility/queryExecutor";
import { hashPassword, comparePassword } from "../utility/bcrypt";
import { generateTokenPair } from "../helper/generateToken.middleware";
import { isDisposableEmail } from "../helper/disposableEmail.helper";
import { IUser, IAuthResponse } from "../types/auth.types";

/**
 * Enterprise Service handling authentication logic, querying, and user mapping.
 */
export class AuthService {
  /**
   * Register a new user account.
   */
  public static async registerUser(
    email: string,
    passwordPlain: string,
    name?: string,
  ): Promise<IAuthResponse> {
    try {
      const userName = name?.trim() || email.split("@")[0] || "User";

      // Reject disposable email addresses before any database lookup
      if (isDisposableEmail(email)) {
        const error: any = new Error(
          "Disposable email addresses are not allowed",
        );
        error.statusCode = 400;
        throw error;
      }

      // Check if user already exists
      const existingUser = await executeSingleQuery<IUser>(
        "SELECT id FROM users WHERE email = $1",
        [email],
      );

      if (existingUser) {
        const error: any = new Error("User with this email already exists");
        error.statusCode = 409;
        throw error;
      }

      // Hash password
      const passwordHash = await hashPassword(passwordPlain);

      // Insert user into postgres using raw query execution helper
      const newUser = await executeSingleQuery<IUser>(
        "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name",
        [email, userName, passwordHash],
      );

      if (!newUser) {
        const error: any = new Error("Failed to create new user account");
        error.statusCode = 500;
        throw error;
      }

      // Generate tokens pair
      const tokens = generateTokenPair({
        id: newUser.id,
        email: newUser.email,
      });

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
        ...tokens,
      };
    } catch (err: any) {
      if (err && (err.statusCode || err.status)) {
        throw err;
      }

      const safeError: any = new Error("Registration failed");
      safeError.statusCode = 500;
      throw safeError;
    }
  }

  /**
   * Authenticate an existing user account.
   */
  public static async loginUser(
    email: string,
    passwordPlain: string,
  ): Promise<IAuthResponse> {
    try {
      // Reject disposable email addresses before any database lookup
      if (isDisposableEmail(email)) {
        const error: any = new Error(
          "Disposable email addresses are not allowed",
        );
        error.statusCode = 400;
        throw error;
      }

      // Retrieve user by email
      const user = await executeSingleQuery<IUser>(
        "SELECT id, email, name, password_hash FROM users WHERE email = $1",
        [email],
      );

      if (!user || !user.password_hash) {
        const error: any = new Error("Invalid authentication credentials");
        error.statusCode = 401;
        throw error;
      }

      // Verify password
      const isValid = await comparePassword(passwordPlain, user.password_hash);
      if (!isValid) {
        const error: any = new Error("Invalid authentication credentials");
        error.statusCode = 401;
        throw error;
      }

      // Generate tokens pair
      const tokens = generateTokenPair({ id: user.id, email: user.email });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        ...tokens,
      };
    } catch (err: any) {
      if (err && (err.statusCode || err.status)) {
        throw err;
      }

      const safeError: any = new Error("Authentication failed");
      safeError.statusCode = 500;
      throw safeError;
    }
  }
}
