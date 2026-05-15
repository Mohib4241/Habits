import { executeQuery, executeSingleQuery } from "../utility/queryExecutor";
import {
  ITrackingLog,
  ITrackingHistoryResponse,
} from "../types/tracking.types";
import { HabitsService } from "./habits.services";
import { getCurrentDateYMD } from "../helper/date.helper";
import { calculateStreakStats } from "../helper/streak.helper";

// ── Shared error-handling helper ─────────────────────────────────────────────
// Re-throws known business errors (any error with a statusCode) as-is so the
// global error handler surfaces the correct HTTP status to the client.
// Wraps every other unexpected error as a clean 500 to avoid leaking internals.
function rethrowOrWrap(err: any, fallbackMessage: string): never {
  if (err && (err.statusCode || err.status)) {
    throw err;
  }
  const serverError: any = new Error(fallbackMessage);
  serverError.statusCode = 500;
  serverError.cause = err;
  throw serverError;
}

/**
 * Enterprise Service handling business logic for Habit tracking logs and Streak calculations.
 */
export class TrackingService {
  /**
   * Log habit completion for a target date. Prevents duplicate completions per day.
   */
  public static async trackHabit(
    userId: number,
    habitId: number,
    targetDate?: string,
  ): Promise<ITrackingLog> {
    try {
      // Authorize and verify habit existence
      await HabitsService.getHabitById(userId, habitId);

      const completedDate = targetDate || getCurrentDateYMD();

      // Check if completion log already exists to prevent duplicates gracefully
      const existingLog = await executeSingleQuery<ITrackingLog>(
        "SELECT id FROM tracking_logs WHERE habit_id = $1 AND completed_date = $2",
        [habitId, completedDate],
      );

      if (existingLog) {
        const error: any = new Error(
          `Habit tracking entry already logged for date: ${completedDate}`,
        );
        error.statusCode = 409;
        throw error;
      }

      // Insert new log using raw query execution abstraction
      const queryText = `
                INSERT INTO tracking_logs (habit_id, user_id, completed_date)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
      const newLog = await executeSingleQuery<ITrackingLog>(queryText, [
        habitId,
        userId,
        completedDate,
      ]);

      if (!newLog) {
        const error: any = new Error(
          "Failed to record habit completion tracking log",
        );
        error.statusCode = 500;
        throw error;
      }

      // Convert raw string/date format output cleanly
      if ((newLog.completed_date as any) instanceof Date) {
        const dObj = newLog.completed_date as any as Date;
        newLog.completed_date = `${dObj.getUTCFullYear()}-${String(dObj.getUTCMonth() + 1).padStart(2, "0")}-${String(dObj.getUTCDate()).padStart(2, "0")}`;
      }

      return newLog;
    } catch (err: any) {
      rethrowOrWrap(
        err,
        "An unexpected error occurred while logging habit completion. Please try again.",
      );
    }
  }

  /**
   * Retrieve all habit tracking history and streak calculation parameters.
   */
  public static async getTrackingHistory(
    userId: number,
    habitId: number,
  ): Promise<ITrackingHistoryResponse> {
    try {
      // Authorize and verify habit existence
      await HabitsService.getHabitById(userId, habitId);

      // Fetch all historical log dates for streak statistics calculation
      const allLogsQueryText =
        "SELECT completed_date FROM tracking_logs WHERE habit_id = $1 AND user_id = $2 ORDER BY completed_date DESC";
      const allLogsRows = await executeQuery<{ completed_date: any }>(
        allLogsQueryText,
        [habitId, userId],
      );

      // Map completed_date format safely to string array
      const completedDates: string[] = allLogsRows.map((row) => {
        if ((row.completed_date as any) instanceof Date) {
          const dObj = row.completed_date as any as Date;
          return `${dObj.getUTCFullYear()}-${String(dObj.getUTCMonth() + 1).padStart(2, "0")}-${String(dObj.getUTCDate()).padStart(2, "0")}`;
        }
        // If string or other format, extract leading YYYY-MM-DD cleanly
        return String(row.completed_date).substring(0, 10);
      });

      // Calculate comprehensive streak statistics helper abstraction
      const streakStats = calculateStreakStats(completedDates);

      // Fetch all history logs for this habit
      const historyQueryText = `
                SELECT * FROM tracking_logs
                WHERE habit_id = $1 AND user_id = $2
                ORDER BY completed_date DESC;
            `;
      const historyRows = await executeQuery<ITrackingLog>(historyQueryText, [
        habitId,
        userId,
      ]);

      // Standardize output formats safely
      const historyFormatted: ITrackingLog[] = historyRows.map((log) => {
        let dateStr = log.completed_date;
        if ((log.completed_date as any) instanceof Date) {
          const dObj = log.completed_date as any as unknown as Date;
          dateStr = `${dObj.getUTCFullYear()}-${String(dObj.getUTCMonth() + 1).padStart(2, "0")}-${String(dObj.getUTCDate()).padStart(2, "0")}`;
        } else {
          dateStr = String(log.completed_date).substring(0, 10);
        }
        return {
          ...log,
          completed_date: dateStr,
        };
      });

      return {
        habitId,
        history: historyFormatted,
        stats: streakStats,
      };
    } catch (err: any) {
      rethrowOrWrap(
        err,
        "An unexpected error occurred while retrieving tracking history. Please try again.",
      );
    }
  }
}
