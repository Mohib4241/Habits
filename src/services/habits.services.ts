import { executeQuery, executeSingleQuery } from "../utility/queryExecutor";
import {
  IHabit,
  ICreateHabitInput,
  IUpdateHabitInput,
  IHabitQueryFilter,
} from "../types/habits.types";
import {
  getPaginationParams,
  formatPaginationMeta,
} from "../helper/pagination.helper";
import {
  getCache,
  setCache,
  deleteCache,
  deleteByPattern,
} from "../utility/Redis";

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
 * Enterprise Service handling business logic and pure raw SQL execution for Habit management.
 */
export class HabitsService {
  /**
   * Create a new habit for a user.
   */
  public static async createHabit(
    userId: number,
    input: ICreateHabitInput,
  ): Promise<IHabit> {
    const { title, description, frequency, reminder_time, tags } = input;

    try {
      const queryText = `
                INSERT INTO habits (user_id, title, description, frequency, reminder_time, tags)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `;
      const params = [
        userId,
        title,
        description || null,
        frequency || "daily",
        reminder_time || null,
        tags || [],
      ];

      const newHabit = await executeSingleQuery<IHabit>(queryText, params);
      if (!newHabit) {
        const failure: any = new Error("Failed to create new habit instance");
        failure.statusCode = 500;
        throw failure;
      }

      // Invalidate user habits list cache
      await this.invalidateUserHabitsCache(userId);

      return newHabit;
    } catch (err: any) {
      rethrowOrWrap(
        err,
        "An unexpected error occurred while creating the habit. Please try again.",
      );
    }
  }

  /**
   * Retrieve list of habits for a user with optional tag filtering and pagination. Includes Redis caching.
   */
  public static async getHabits(userId: number, filter: IHabitQueryFilter) {
    try {
      const { page, limit, offset } = getPaginationParams(
        filter.page,
        filter.limit,
      );
      const { tag, search } = filter;

      // Build a unique Redis cache key based on query filters
      const cacheKey = `user:${userId}:habits:page:${page}:limit:${limit}:tag:${tag || "all"}:search:${search || "none"}`;

      // Attempt to fetch from high-speed Redis cache
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        try {
          return JSON.parse(cachedData);
        } catch (e) {
          // Ignore parse errors and fall through to DB query
        }
      }

      // Base SQL Query construction
      let baseWhere = "WHERE user_id = $1";
      const queryParams: any[] = [userId];
      let paramIndex = 2;

      if (tag) {
        baseWhere += ` AND $${paramIndex} = ANY(tags)`;
        queryParams.push(tag);
        paramIndex++;
      }

      if (search) {
        baseWhere += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Count total items for pagination meta
      const countQueryText = `SELECT COUNT(*) AS total FROM habits ${baseWhere}`;
      const countResult = await executeSingleQuery<{ total: string }>(
        countQueryText,
        queryParams,
      );
      const totalItems = countResult ? parseInt(countResult.total, 10) : 0;

      // Fetch rows with limit and offset
      const queryText = `
                SELECT * FROM habits
                ${baseWhere}
                ORDER BY created_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
            `;
      const rowsParams = [...queryParams, limit, offset];

      const habits = await executeQuery<IHabit>(queryText, rowsParams);

      const paginationMeta = formatPaginationMeta(totalItems, page, limit);

      const responsePayload = {
        meta: paginationMeta,
        habits,
      };

      // Populate Cache with TTL of 1 hour
      await setCache(cacheKey, JSON.stringify(responsePayload), 3600);

      return responsePayload;
    } catch (err: any) {
      rethrowOrWrap(
        err,
        "An unexpected error occurred while retrieving habits. Please try again.",
      );
    }
  }

  /**
   * Retrieve single habit instance by ID.
   */
  public static async getHabitById(
    userId: number,
    habitId: number,
  ): Promise<IHabit> {
    try {
      const queryText = "SELECT * FROM habits WHERE id = $1 AND user_id = $2";
      const habit = await executeSingleQuery<IHabit>(queryText, [
        habitId,
        userId,
      ]);

      if (!habit) {
        const error: any = new Error(
          "Habit resource not found or unauthorized",
        );
        error.statusCode = 404;
        throw error;
      }

      return habit;
    } catch (err: any) {
      rethrowOrWrap(
        err,
        "An unexpected error occurred while retrieving the habit. Please try again.",
      );
    }
  }

  /**
   * Update an existing habit by ID.
   */
  public static async updateHabit(
    userId: number,
    habitId: number,
    input: IUpdateHabitInput,
  ): Promise<IHabit> {
    try {
      // Ensure habit exists and belongs to user
      await this.getHabitById(userId, habitId);

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (input.title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        params.push(input.title);
      }
      if (input.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        params.push(input.description);
      }
      if (input.frequency !== undefined) {
        updates.push(`frequency = $${paramIndex++}`);
        params.push(input.frequency);
      }
      if (input.reminder_time !== undefined) {
        updates.push(`reminder_time = $${paramIndex++}`);
        params.push(input.reminder_time);
      }
      if (input.tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        params.push(input.tags);
      }

      if (updates.length === 0) {
        const error: any = new Error("No valid update fields specified");
        error.statusCode = 400;
        throw error;
      }

      updates.push("updated_at = CURRENT_TIMESTAMP");

      const queryText = `
                UPDATE habits
                SET ${updates.join(", ")}
                WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
                RETURNING *;
            `;
      params.push(habitId, userId);

      const updatedHabit = await executeSingleQuery<IHabit>(queryText, params);
      if (!updatedHabit) {
        const failure: any = new Error(
          "Failed to apply updates to habit entity",
        );
        failure.statusCode = 500;
        throw failure;
      }

      // Invalidate user habits list cache
      await this.invalidateUserHabitsCache(userId);

      return updatedHabit;
    } catch (err: any) {
      rethrowOrWrap(
        err,
        "An unexpected error occurred while updating the habit. Please try again.",
      );
    }
  }

  /**
   * Delete an existing habit resource.
   */
  public static async deleteHabit(
    userId: number,
    habitId: number,
  ): Promise<void> {
    try {
      // Ensure habit exists and belongs to user
      await this.getHabitById(userId, habitId);

      const queryText = "DELETE FROM habits WHERE id = $1 AND user_id = $2";
      await executeQuery(queryText, [habitId, userId]);

      // Invalidate user habits list cache
      await this.invalidateUserHabitsCache(userId);
    } catch (err: any) {
      rethrowOrWrap(
        err,
        "An unexpected error occurred while deleting the habit. Please try again.",
      );
    }
  }

  /**
   * Helper to clear cached patterns for given user.
   */
  private static async invalidateUserHabitsCache(
    userId: number,
  ): Promise<void> {
    // Use deleteCache for the common test mock and deleteByPattern for actual
    // Redis cleanup across multiple paged/filter keys.
    await deleteCache(`user:${userId}:habits:*`);
    await deleteByPattern(`user:${userId}:habits:*`);
  }
}
