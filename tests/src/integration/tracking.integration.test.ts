/**
 * ============================================================
 * INTEGRATION — Tracking API End-to-End Tests
 * ============================================================
 */

jest.mock("../../../src/utility/queryExecutor");
jest.mock("../../../src/utility/Redis");

import request from "supertest";
import { app } from "../../../src/bin/index";
import { signAccessToken } from "../../../src/utility/jwt";
import {
  executeQuery,
  executeSingleQuery,
} from "../../../src/utility/queryExecutor";

const mockExecuteQuery = executeQuery as jest.Mock;
const mockExecuteSingleQuery = executeSingleQuery as jest.Mock;

const makeToken = (userId: number = 10) =>
  signAccessToken({ id: userId, email: "integration@test.com" });

beforeEach(() => {
  jest.clearAllMocks();
});

const MOCK_HABIT = {
  id: 1,
  user_id: 10,
  title: "Morning Run",
  frequency: "daily",
  tags: [],
};
const MOCK_LOG = {
  id: 1,
  habit_id: 1,
  user_id: 10,
  completed_date: "2024-05-15",
  completed_at: new Date().toISOString(),
};

// ── POST /api/v1/habits/:id/track ─────────────────────────────────────────────

describe("POST /api/v1/habits/:id/track", () => {
  it("201 — logs habit completion for given date", async () => {
    mockExecuteSingleQuery
      .mockResolvedValueOnce(MOCK_HABIT) // getHabitById
      .mockResolvedValueOnce(null) // no existing log
      .mockResolvedValueOnce(MOCK_LOG); // INSERT

    const res = await request(app)
      .post("/api/v1/habits/1/track")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ completed_date: "2024-05-15" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.completed_date).toBe("2024-05-15");
  });

  it("201 — logs today when completed_date is omitted", async () => {
    mockExecuteSingleQuery
      .mockResolvedValueOnce(MOCK_HABIT)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(MOCK_LOG);

    const res = await request(app)
      .post("/api/v1/habits/1/track")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({});

    expect(res.status).toBe(201);
  });

  it("401 — blocked without auth token", async () => {
    const res = await request(app)
      .post("/api/v1/habits/1/track")
      .send({ completed_date: "2024-05-15" });

    expect(res.status).toBe(401);
  });

  it("422 — rejects invalid date format (DD-MM-YYYY)", async () => {
    const res = await request(app)
      .post("/api/v1/habits/1/track")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ completed_date: "15-05-2024" });

    expect(res.status).toBe(422);
  });

  it("409 — returns conflict when habit already tracked for date", async () => {
    mockExecuteSingleQuery
      .mockResolvedValueOnce(MOCK_HABIT) // getHabitById
      .mockResolvedValueOnce({ id: 99 }); // existing log found

    const res = await request(app)
      .post("/api/v1/habits/1/track")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ completed_date: "2024-05-15" });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("404 — returns 404 when habit does not exist", async () => {
    mockExecuteSingleQuery.mockResolvedValueOnce(null); // getHabitById: not found

    const res = await request(app)
      .post("/api/v1/habits/999/track")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({});

    expect(res.status).toBe(404);
  });

  it("422 — rejects invalid (non-numeric) habit id in params", async () => {
    const res = await request(app)
      .post("/api/v1/habits/abc/track")
      .set("Authorization", `Bearer ${makeToken()}`)
      .send({ completed_date: "2024-05-15" });

    expect(res.status).toBe(422);
  });

  it("403 — returns 403 for expired/invalid token", async () => {
    const res = await request(app)
      .post("/api/v1/habits/1/track")
      .set("Authorization", "Bearer expired.or.invalid.token")
      .send({ completed_date: "2024-05-15" });

    expect(res.status).toBe(403);
  });
});

// ── GET /api/v1/habits/:id/history ───────────────────────────────────────────

describe("GET /api/v1/habits/:id/history", () => {
  it("200 — returns history and streak stats", async () => {
    mockExecuteSingleQuery.mockResolvedValueOnce(MOCK_HABIT); // getHabitById
    mockExecuteQuery
      .mockResolvedValueOnce([{ completed_date: "2024-05-15" }]) // all logs
      .mockResolvedValueOnce([MOCK_LOG]); // history logs

    const res = await request(app)
      .get("/api/v1/habits/1/history")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("history");
    expect(res.body.data).toHaveProperty("stats");
    expect(res.body.data.stats).toHaveProperty("currentStreak");
    expect(res.body.data.stats).toHaveProperty("longestStreak");
    expect(res.body.data.stats).toHaveProperty("totalCompletions");
  });

  it("200 — returns empty history for new habit with zero streaks", async () => {
    mockExecuteSingleQuery.mockResolvedValueOnce(MOCK_HABIT);
    mockExecuteQuery
      .mockResolvedValueOnce([]) // no all-time logs
      .mockResolvedValueOnce([]); // no history logs

    const res = await request(app)
      .get("/api/v1/habits/1/history")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.history).toHaveLength(0);
    expect(res.body.data.stats.currentStreak).toBe(0);
    expect(res.body.data.stats.longestStreak).toBe(0);
  });

  it("401 — blocked without auth token", async () => {
    const res = await request(app).get("/api/v1/habits/1/history");
    expect(res.status).toBe(401);
  });

  it("404 — returns 404 when habit not found", async () => {
    mockExecuteSingleQuery.mockResolvedValueOnce(null);

    const res = await request(app)
      .get("/api/v1/habits/999/history")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });

  it("422 — rejects non-numeric habit id", async () => {
    const res = await request(app)
      .get("/api/v1/habits/xyz/history")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(res.status).toBe(422);
  });
});
