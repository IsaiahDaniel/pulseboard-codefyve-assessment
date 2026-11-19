import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'dev', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(4200),
  MONGO_URI: Joi.string().optional().allow(''),
  MONGODB_URI: Joi.string().optional().allow(''),
  JWT_SECRET: Joi.string().default('dev-fixa-secret-change-me'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  CORS_ORIGINS: Joi.string().optional().allow(''),
});
