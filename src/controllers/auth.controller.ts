import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.services";
import { sendSuccessResponse } from "../helper/responseHandler";

/**
 * Enterprise Controller handling authentication routing interactions.
 * Delegates pure business validation and SQL querying to Service layer.
 */
export class AuthController {
  /**
   * Handle user account registration requests.
   */
  public static async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const authData = name
        ? await AuthService.registerUser(email, password, name)
        : await AuthService.registerUser(email, password);
      sendSuccessResponse(
        res,
        201,
        "User account registered successfully",
        authData,
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handle user account login authentication requests.
   */
  public static async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      const authData = await AuthService.loginUser(email, password);
      sendSuccessResponse(
        res,
        200,
        "User successfully authenticated",
        authData,
      );
    } catch (err) {
      next(err);
    }
  }
}
