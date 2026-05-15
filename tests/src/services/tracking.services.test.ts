/**
 * ============================================================
 * SERVICES — TrackingService Unit Tests
 * ============================================================
 */

jest.mock("../../../src/utility/queryExecutor");
jest.mock("../../../src/services/habits.services");
jest.mock("../../../src/helper/date.helper");
jest.mock("../../../src/helper/streak.helper");

import { TrackingService } from "../../../src/services/tracking.services";
import {
  executeQuery,
  executeSingleQuery,
} from "../../../src/utility/queryExecutor";
import { HabitsService } from "../../../src/services/habits.services";
import { getCurrentDateYMD } from "../../../src/helper/date.helper";
import { calculateStreakStats } from "../../../src/helper/streak.helper";

const mockExecuteQuery = executeQuery as jest.Mock;
const mockExecuteSingleQuery = executeSingleQuery as jest.Mock;
const mockGetHabitById = HabitsService.getHabitById as jest.Mock;
const mockGetCurrentDate = getCurrentDateYMD as jest.Mock;
const mockCalculateStreak = calculateStreakStats as jest.Mock;

const MOCK_HABIT = { id: 1, user_id: 10, title: "Morning Run" };
const MOCK_LOG = {
  id: 1,
  habit_id: 1,
  user_id: 10,
  completed_date: "2024-05-15",
  completed_at: new Date(),
};
const MOCK_STATS = { currentStreak: 3, longestStreak: 5, totalCompletions: 10 };

// ── trackHabit ────────────────────────────────────────────────────────────────

describe("TrackingService.trackHabit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHabitById.mockResolvedValue(MOCK_HABIT);
    mockGetCurrentDate.mockReturnValue("2024-05-15");
  });

  it("throws 409 when tracking log already exists for the date", async () => {
    mockExecuteSingleQuery.mockResolvedValueOnce({ id: 99 }); // existing log

    await expect(
      TrackingService.trackHabit(10, 1, "2024-05-15"),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("inserts new tracking log and returns it", async () => {
    mockExecuteSingleQuery
      .mockResolvedValueOnce(null) // no existing log
      .mockResolvedValueOnce(MOCK_LOG); // INSERT result

    const result = await TrackingService.trackHabit(10, 1, "2024-05-15");

    expect(result.habit_id).toBe(1);
    expect(result.completed_date).toBe("2024-05-15");
  });

  it("uses current date when targetDate not provided", async () => {
    mockExecuteSingleQuery
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...MOCK_LOG, completed_date: "2024-05-15" });

    await TrackingService.trackHabit(10, 1);

    expect(mockGetCurrentDate).toHaveBeenCalled();
  });

  it("throws error when INSERT returns null", async () => {
    mockExecuteSingleQuery
      .mockResolvedValueOnce(null) // no existing
      .mockResolvedValueOnce(null); // INSERT fails

    await expect(
      TrackingService.trackHabit(10, 1, "2024-05-15"),
    ).rejects.toThrow("Failed to record habit completion tracking log");
  });

  it("verifies habit ownership by calling getHabitById", async () => {
    mockExecuteSingleQuery
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(MOCK_LOG);

    await TrackingService.trackHabit(10, 1, "2024-05-15");

    expect(mockGetHabitById).toHaveBeenCalledWith(10, 1);
  });

  it("throws 404 when habit does not belong to user (via getHabitById)", async () => {
    const notFoundError: any = new Error("Habit not found");
    notFoundError.statusCode = 404;
    mockGetHabitById.mockRejectedValueOnce(notFoundError);

    await expect(
      TrackingService.trackHabit(10, 999, "2024-05-15"),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("handles Date object completed_date from DB correctly", async () => {
    const logWithDate = {
      ...MOCK_LOG,
      completed_date: new Date("2024-05-15") as any,
    };
    mockExecuteSingleQuery
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(logWithDate);

    const result = await TrackingService.trackHabit(10, 1, "2024-05-15");

    expect(result.completed_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── getTrackingHistory ────────────────────────────────────────────────────────

describe("TrackingService.getTrackingHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHabitById.mockResolvedValue(MOCK_HABIT);
    mockCalculateStreak.mockReturnValue(MOCK_STATS);
  });

  it("returns history with streak stats", async () => {
    mockExecuteQuery
      .mockResolvedValueOnce([{ completed_date: "2024-05-15" }]) // all logs
      .mockResolvedValueOnce([MOCK_LOG]); // history logs

    const result = await TrackingService.getTrackingHistory(10, 1);

    expect(result.habitId).toBe(1);
    expect(result.stats).toEqual(MOCK_STATS);
    expect(Array.isArray(result.history)).toBe(true);
  });

  it("calls calculateStreakStats with extracted date strings", async () => {
    mockExecuteQuery
      .mockResolvedValueOnce([
        { completed_date: "2024-05-15" },
        { completed_date: "2024-05-14" },
      ])
      .mockResolvedValueOnce([]);

    await TrackingService.getTrackingHistory(10, 1);

    expect(mockCalculateStreak).toHaveBeenCalledWith([
      "2024-05-15",
      "2024-05-14",
    ]);
  });

  it("returns empty history and zero streak for new habit", async () => {
    mockExecuteQuery
      .mockResolvedValueOnce([]) // no all-time logs
      .mockResolvedValueOnce([]); // no history logs
    mockCalculateStreak.mockReturnValue({
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
    });

    const result = await TrackingService.getTrackingHistory(10, 1);

    expect(result.history).toHaveLength(0);
    expect(result.stats.currentStreak).toBe(0);
  });

  it("verifies habit ownership before fetching history", async () => {
    mockExecuteQuery.mockResolvedValue([]);

    await TrackingService.getTrackingHistory(10, 1);

    expect(mockGetHabitById).toHaveBeenCalledWith(10, 1);
  });

  it("formats Date objects in history to YYYY-MM-DD strings", async () => {
    const rawLog = {
      id: 1,
      habit_id: 1,
      user_id: 10,
      completed_date: new Date("2024-05-15") as any,
      completed_at: new Date(),
    };
    mockExecuteQuery
      .mockResolvedValueOnce([{ completed_date: "2024-05-15" }])
      .mockResolvedValueOnce([rawLog]);

    const result = await TrackingService.getTrackingHistory(10, 1);

    expect(result.history[0].completed_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
