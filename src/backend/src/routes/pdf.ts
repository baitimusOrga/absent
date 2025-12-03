import { Router } from 'express';
import { pdfService } from '../services/pdf';
import { requireAuth } from '../middleware/auth';

export const pdfRouter = Router();

pdfRouter.get('/pdf', requireAuth, async (_req, res) => {
  const status = await pdfService.getStatus();
  res.json(status);
});
