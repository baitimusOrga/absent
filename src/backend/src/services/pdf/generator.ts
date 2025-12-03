/**
 * PDF generation utilities
 */

import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import type { PdfFillData, PdfTemplate, UserData } from '../../types/pdf.types';
import { InternalServerError, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { FORM_TYPES } from '../../constants';

/**
 * Format date of birth from various formats to string
 */
const formatDateOfBirth = (dateOfBirth: Date | string | undefined): string => {
  if (!dateOfBirth) return '';

  if (dateOfBirth instanceof Date) {
    return dateOfBirth.toISOString().split('T')[0];
  }

  if (typeof dateOfBirth === 'string') {
    return dateOfBirth;
  }

  return '';
};

/**
 * Fill PDF form fields with data
 */
export const fillPdfForm = async (
  template: PdfTemplate,
  data: PdfFillData,
  userData?: UserData
): Promise<Buffer> => {
  const pdfPath = path.join(__dirname, '../../../pdfs', template.filePath);

  // Check if template file exists
  if (!fs.existsSync(pdfPath)) {
    logger.error('PDF template file not found', { path: pdfPath, school: template.school });
    throw new NotFoundError(
      `PDF template file not found for school ${template.school}`,
      'TEMPLATE_FILE_NOT_FOUND'
    );
  }

  try {
    // Load PDF document
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const form = pdfDoc.getForm();

    const { fieldMapping } = template;

    // Auto-fill fields from user data
    const studentName = userData?.fullname || '';
    const dateOfBirth = formatDateOfBirth(userData?.dateOfBirth);
    const berufsbildnerName = userData?.berufsbildner || '';
    const berufsbildnerEmail = userData?.berufsbildnerEmail || '';

    // Fill basic fields
    form.getTextField(fieldMapping.studentName).setText(studentName);
    form.getTextField(fieldMapping.geburtsdatum).setText(data.geburtsdatum || dateOfBirth);
    form.getTextField(fieldMapping.klasse).setText(data.klasse || '');
    form.getTextField(fieldMapping.datumDerAbsenz).setText(data.datumDerAbsenz);
    form.getTextField(fieldMapping.begruendung).setText(data.begruendung);

    // Check appropriate checkbox for form type
    if (data.formType === FORM_TYPES.ENTSCHULDIGUNG && fieldMapping.entschuldigungCheckbox) {
      form.getCheckBox(fieldMapping.entschuldigungCheckbox).check();
    } else if (data.formType === FORM_TYPES.URLAUBSGESUCH && fieldMapping.urlaubsgesuchCheckbox) {
      form.getCheckBox(fieldMapping.urlaubsgesuchCheckbox).check();
    }

    // Fill optional fields
    if (berufsbildnerName && fieldMapping.berufsbildnerNameUndTelefon) {
      form.getTextField(fieldMapping.berufsbildnerNameUndTelefon).setText(berufsbildnerName);
    }

    if (berufsbildnerEmail && fieldMapping.berufsbildnerEmail) {
      form.getTextField(fieldMapping.berufsbildnerEmail).setText(berufsbildnerEmail);
    }

    if (data.datumUnterschrift && fieldMapping.datumUnterschrift) {
      form.getTextField(fieldMapping.datumUnterschrift).setText(data.datumUnterschrift);
    }

    if (data.bemerkung && fieldMapping.bemerkung) {
      form.getTextField(fieldMapping.bemerkung).setText(data.bemerkung);
    }

    // Fill lesson rows
    const maxRows = Math.min(data.missedLessons.length, template.maxLessonRows);
    for (let i = 0; i < maxRows; i++) {
      const lesson = data.missedLessons[i];
      const rowNum = i + 1;

      const anzahlField = fieldMapping.lessonRows.anzahlLektionen.replace('{row}', rowNum.toString());
      const datumField = fieldMapping.lessonRows.wochentagUndDatum.replace('{row}', rowNum.toString());
      const fachField = fieldMapping.lessonRows.fach.replace('{row}', rowNum.toString());
      const lehrpersonField = fieldMapping.lessonRows.lehrperson.replace('{row}', rowNum.toString());

      try {
        form.getTextField(anzahlField).setText(lesson.anzahlLektionen);
        form.getTextField(datumField).setText(lesson.wochentagUndDatum);
        form.getTextField(fachField).setText(lesson.fach);
        form.getTextField(lehrpersonField).setText(lesson.lehrperson);
      } catch (err) {
        logger.warn(`Could not fill lesson row ${rowNum}`, {
          error: err instanceof Error ? err.message : 'Unknown error',
          school: template.school,
        });
      }
    }

    // Flatten form to prevent further editing
    form.flatten();

    // Save and return PDF bytes
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    logger.error('Error filling PDF form', {
      error: error instanceof Error ? error.message : 'Unknown error',
      school: template.school,
      formType: data.formType,
    });

    if (error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      `Failed to fill PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PDF_GENERATION_ERROR'
    );
  }
};

/**
 * Generate filename for PDF download
 */
export const generatePdfFilename = (data: PdfFillData): string => {
  const timestamp = Date.now();
  const sanitizedFormType = data.formType.replace(/\s+/g, '_');
  return `${data.school}_${sanitizedFormType}_${timestamp}.pdf`;
};
