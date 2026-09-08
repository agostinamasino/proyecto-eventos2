import { Router } from 'express';
import healthRouter from './health.router.js';
import eventsRouter from './events.router.js';
import sessionsRouter from './sessions.router.js';
import usersRouter from './users.router.js';
import ticketsRouter from './tickets.router.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/events', eventsRouter);
router.use('/sessions', sessionsRouter);
router.use('/users', usersRouter);
router.use('/tickets', ticketsRouter);

export default router;
