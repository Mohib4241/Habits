export interface IHabit {
    id: number;
    user_id: number;
    title: string;
    description?: string;
    frequency: 'daily' | 'weekly';
    reminder_time?: string;
    tags: string[];
    created_at: Date;
    updated_at: Date;
}

export interface ICreateHabitInput {
    title: string;
    description?: string;
    frequency?: 'daily' | 'weekly';
    reminder_time?: string;
    tags?: string[];
}

export interface IUpdateHabitInput {
    title?: string;
    description?: string;
    frequency?: 'daily' | 'weekly';
    reminder_time?: string;
    tags?: string[];
}

export interface IHabitQueryFilter {
    page?: number;
    limit?: number;
    tag?: string;
    search?: string;
}
