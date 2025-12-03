import { Router } from 'express';
import { pdfService } from '../services/pdf';
import { requireAuth } from '../middleware/auth';
import type { PdfFillData } from '../types/pdf.types';

export const pdfRouter = Router();

// Get PDF service status
pdfRouter.get('/pdf/status', requireAuth, async (_req, res) => {
  const status = await pdfService.getStatus();
  res.json(status);
});


// Generate and fill PDF
pdfRouter.post('/pdf/fill', requireAuth, async (req, res) => {
  try {
    const fillData: PdfFillData = req.body;
    
    // Get authenticated user data
    const user = (req as any).user;
    
    // Validate required fields
    if (!fillData.formType) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['formType']
      });
      return;
    }
    
    // Auto-fill school from user profile if not provided
    if (!fillData.school && user?.school) {
      fillData.school = user.school;
    }
    
    if (!fillData.school) {
      res.status(400).json({
        error: 'School is required',
        message: 'Please set school in your user profile'
      });
      return;
    }
    
    // Generate filled PDF with user data
    const pdfBuffer = await pdfService.fillPdf(fillData, user);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fillData.school}_${fillData.formType}_${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error filling PDF:', error);
    res.status(500).json({
      error: 'Failed to generate PDF',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
