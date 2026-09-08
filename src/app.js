import express from 'express';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.router.js';
import notFoundHandler from './middlewares/notFoundHandler.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
