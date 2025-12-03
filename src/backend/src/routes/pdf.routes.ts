/**
 * PDF routes
 */

import { Router } from 'express';
import { requireAuth } from '../middleware';
import { getPdfStatus, fillPdf, getTemplates } from '../controllers/pdf.controller';

export const pdfRouter = Router();

/**
 * GET /pdf/status
 * Get PDF service status
 */
pdfRouter.get('/pdf/status', requireAuth, getPdfStatus);

/**
 * POST /pdf/fill
 * Generate and fill PDF form
 */
pdfRouter.post('/pdf/fill', requireAuth, fillPdf);

/**
 * GET /pdf/templates
 * Get list of available PDF templates
 */
pdfRouter.get('/pdf/templates', requireAuth, getTemplates);
