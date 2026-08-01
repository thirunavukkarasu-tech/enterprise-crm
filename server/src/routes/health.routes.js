import { Router } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

router.get('/', (req, res) => {
  new ApiResponse(200, { uptime: process.uptime(), timestamp: Date.now() }, 'CRM API is healthy').send(res);
});

export default router;
