import Joi from 'joi';

export const trackHabitSchema = Joi.object({
    // Validation for route param habit_id if validated via object mapper, or body overrides
    completed_date: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .message('completed_date must be in YYYY-MM-DD format')
        .optional(),
});

export const habitIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        'number.base': 'Habit ID must be a valid numeric identifier',
        'number.positive': 'Habit ID must be positive integer',
        'any.required': 'Habit ID parameter is required',
    }),
});
