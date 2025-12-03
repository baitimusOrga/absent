/**
 * PDF service - main entry point for PDF operations
 */

import type { PdfFillData, PdfStatus, UserData } from '../../types/pdf.types';
import { PdfTemplateRegistry } from './templateRegistry';
import { validatePdfFillData } from './validation';
import { fillPdfForm, generatePdfFilename } from './generator';
import { logger } from '../../utils/logger';

/**
 * PDF Service class
 */
export class PdfService {
  /**
   * Get PDF service status
   */
  async getStatus(): Promise<PdfStatus> {
    try {
      const templates = PdfTemplateRegistry.getSupportedSchools();
      
      return {
        available: true,
        message: 'PDF generation service is ready',
        templates,
      };
    } catch (error) {
      logger.error('Error checking PDF service status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        available: false,
        message: 'PDF generation service is unavailable',
      };
    }
  }

  /**
   * Fill a PDF form with provided data
   */
  async fillPdf(data: any, userData?: UserData): Promise<Buffer> {
    // Validate input data
    const validatedData = validatePdfFillData(data, userData);

    // Get template for school
    const template = PdfTemplateRegistry.getTemplate(validatedData.school);

    logger.info('Generating PDF', {
      school: validatedData.school,
      formType: validatedData.formType,
      lessonCount: validatedData.missedLessons.length,
    });

    // Fill PDF form
    const pdfBuffer = await fillPdfForm(template, validatedData, userData);

    logger.info('PDF generated successfully', {
      school: validatedData.school,
      formType: validatedData.formType,
      size: `${(pdfBuffer.length / 1024).toFixed(2)} KB`,
    });

    return pdfBuffer;
  }

  /**
   * Get list of available templates
   */
  getAvailableTemplates() {
    return PdfTemplateRegistry.getSupportedSchools();
  }

  /**
   * Generate filename for PDF
   */
  generateFilename(data: PdfFillData): string {
    return generatePdfFilename(data);
  }
}

// Export singleton instance
export const pdfService = new PdfService();
