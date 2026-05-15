import Joi from 'joi';

export const createHabitSchema = Joi.object({
    title: Joi.string().min(3).max(255).required().messages({
        'string.min': 'Habit title must be at least 3 characters long',
        'any.required': 'Habit title is required',
    }),
    description: Joi.string().allow('', null).optional(),
    frequency: Joi.string().valid('daily', 'weekly').default('daily').optional(),
    reminder_time: Joi.string()
        .pattern(/^([01]\d|2[0-3]):?([0-5]\d)$/)
        .message('Reminder time must be in valid HH:MM format')
        .allow(null, '')
        .optional(),
    tags: Joi.array().items(Joi.string()).default([]).optional(),
});

export const updateHabitSchema = Joi.object({
    title: Joi.string().min(3).max(255).optional(),
    description: Joi.string().allow('', null).optional(),
    frequency: Joi.string().valid('daily', 'weekly').optional(),
    reminder_time: Joi.string()
        .pattern(/^([01]\d|2[0-3]):?([0-5]\d)$/)
        .message('Reminder time must be in valid HH:MM format')
        .allow(null, '')
        .optional(),
    tags: Joi.array().items(Joi.string()).optional(),
}).min(1); // Require at least one field to update

export const queryHabitSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    tag: Joi.string().trim().optional(),
    search: Joi.string().trim().optional(),
});
