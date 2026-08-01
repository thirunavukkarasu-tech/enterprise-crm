import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import { env } from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// --- Security & parsing middleware ---------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' })); // small limit — mitigates payload DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ / . operators from user input (NoSQL injection)

// --- Logging ----------------------------------------------------------------
if (!env.isProd) {
  app.use(morgan('dev'));
}

// --- Rate limiting (applies to all /api routes) -----------------------------
app.use(`/api/${env.apiVersion}`, apiLimiter);

// --- Routes -------------------------------------------------------------------
app.use(`/api/${env.apiVersion}`, routes);

// --- 404 + centralized error handling ----------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
