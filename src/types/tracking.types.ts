export interface ITrackingLog {
    id: number;
    habit_id: number;
    user_id: number;
    completed_date: string; // YYYY-MM-DD format
    completed_at: Date;
}

export interface IStreakStats {
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
}

export interface ITrackingHistoryResponse {
    habitId: number;
    history: ITrackingLog[];
    stats: IStreakStats;
}
