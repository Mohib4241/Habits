import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional().messages({
    "string.min": "Name must be at least 2 characters long",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email address is required",
  }),
  password: Joi.string().min(6).max(50).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email address is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});
