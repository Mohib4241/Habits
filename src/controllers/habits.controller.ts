import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth.types";
import { HabitsService } from "../services/habits.services";
import { sendSuccessResponse } from "../helper/responseHandler";

/**
 * Enterprise Controller for Habit resource management.
 */
export class HabitsController {
  /**
   * Create a new habit entry.
   */
  public static async createHabit(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const habitData = await HabitsService.createHabit(userId, req.body);
      sendSuccessResponse(res, 201, "Habit created successfully", habitData);
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all habits with pagination and tags filtering.
   */
  public static async getAllHabits(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { page, limit, tag, search } = req.query;
      const data = await HabitsService.getHabits(userId, {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        tag: tag as string,
        search: search as string,
      });
      sendSuccessResponse(res, 200, "Habits retrieved successfully", data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve single habit details by ID.
   */
  public static async getHabitDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const habitId = parseInt(req.params.id, 10);
      const data = await HabitsService.getHabitById(userId, habitId);
      sendSuccessResponse(
        res,
        200,
        "Habit details retrieved successfully",
        data,
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update habit configuration by ID.
   */
  public static async updateHabit(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const habitId = parseInt(req.params.id, 10);
      const data = await HabitsService.updateHabit(userId, habitId, req.body);
      sendSuccessResponse(res, 200, "Habit updated successfully", data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete habit resource.
   */
  public static async deleteHabit(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const habitId = parseInt(req.params.id, 10);
      await HabitsService.deleteHabit(userId, habitId);
      sendSuccessResponse(res, 200, "Habit deleted successfully");
    } catch (err) {
      next(err);
    }
  }
}
