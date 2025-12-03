/**
 * PDF controller
 */

import type { Request, Response } from 'express';
import { pdfService } from '../services/pdf';
import type { UserData } from '../types/pdf.types';
import { ApiResponse } from '../utils/response/ApiResponse';
import { asyncHandler, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Get PDF service status
 * GET /pdf/status
 */
export const getPdfStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const status = await pdfService.getStatus();
  ApiResponse.success(res, status);
});

/**
 * Fill and generate PDF
 * POST /pdf/fill
 */
export const fillPdf = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const fillData = req.body;
  
  // Extract user data from authenticated request
  const user = req.user;
  
  if (!user) {
    throw new BadRequestError('User authentication required');
  }

  // Build user data object from authenticated user
  const userData: UserData = {
    fullname: (user as any).fullname,
    school: (user as any).school,
    berufsbildner: (user as any).berufsbildner,
    berufsbildnerEmail: (user as any).berufsbildnerEmail,
    berufsbildnerPhoneNumber: (user as any).berufsbildnerPhoneNumber,
    dateOfBirth: (user as any).dateOfBirth,
  };

  logger.debug('Processing PDF fill request', {
    userId: user.id,
    school: fillData.school || userData.school,
    formType: fillData.formType,
  });

  // Generate filled PDF
  const pdfBuffer = await pdfService.fillPdf(fillData, userData);
  
  // Generate filename
  const filename = pdfService.generateFilename({
    ...fillData,
    school: fillData.school || userData.school,
  });

  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  logger.info('PDF generated and sent successfully', {
    userId: user.id,
    filename,
    size: `${(pdfBuffer.length / 1024).toFixed(2)} KB`,
  });

  res.send(pdfBuffer);
});

/**
 * Get available PDF templates
 * GET /pdf/templates
 */
export const getTemplates = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const templates = pdfService.getAvailableTemplates();
  ApiResponse.success(res, { templates });
});
