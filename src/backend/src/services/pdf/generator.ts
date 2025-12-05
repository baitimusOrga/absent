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
 * Security Helper: Safely truncate strings to prevent PDF rendering crashes
 * or massive memory consumption.
 */
const safeTruncate = (value: string | undefined | null, maxLength: number): string => {
  if (!value) return '';
  const str = String(value);
  return str.length > maxLength ? str.substring(0, maxLength) : str;
};

/**
 * Format date of birth from various formats to string
 */
const formatDateOfBirth = (dateOfBirth: Date | string | undefined): string => {
  if (!dateOfBirth) return '';

  if (dateOfBirth instanceof Date) {
    return dateOfBirth.toISOString().split('T')[0];
  }

  if (typeof dateOfBirth === 'string') {
    return safeTruncate(dateOfBirth, 50); // Auch Datum begrenzen
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

    // Auto-fill fields from user data with truncation
    // Wir nutzen hier 100 Zeichen als Sicherheitslimit für Namen
    const studentName = safeTruncate(userData?.fullname, 100);
    const dateOfBirth = formatDateOfBirth(userData?.dateOfBirth);
    const berufsbildnerName = safeTruncate(userData?.berufsbildner, 100);
    const berufsbildnerEmail = safeTruncate(userData?.berufsbildnerEmail, 150);

    // Fill basic fields with Hard Limits
    // Selbst wenn die Validation versagt, schneiden wir hier ab um Abstürze zu verhindern.
    form.getTextField(fieldMapping.studentName).setText(studentName);
    form.getTextField(fieldMapping.geburtsdatum).setText(safeTruncate(data.geburtsdatum || dateOfBirth, 50));
    form.getTextField(fieldMapping.klasse).setText(safeTruncate(data.klasse, 50));
    form.getTextField(fieldMapping.datumDerAbsenz).setText(safeTruncate(data.datumDerAbsenz, 50));
    
    // Begründung hart auf 800 Zeichen limitieren (sollte mit Validation übereinstimmen)
    form.getTextField(fieldMapping.begruendung).setText(safeTruncate(data.begruendung, 800));

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
      form.getTextField(fieldMapping.datumUnterschrift).setText(safeTruncate(data.datumUnterschrift, 50));
    }

    if (data.bemerkung && fieldMapping.bemerkung) {
      form.getTextField(fieldMapping.bemerkung).setText(safeTruncate(data.bemerkung, 500));
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
        // Auch hier Sicherheitslimits anwenden
        form.getTextField(anzahlField).setText(safeTruncate(lesson.anzahlLektionen, 50));
        form.getTextField(datumField).setText(safeTruncate(lesson.wochentagUndDatum, 50));
        form.getTextField(fachField).setText(safeTruncate(lesson.fach, 100));
        form.getTextField(lehrpersonField).setText(safeTruncate(lesson.lehrperson, 100));
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
  // Safe filename generation
  const sanitizedFormType = (data.formType || 'form').replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedSchool = (data.school || 'school').replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${sanitizedSchool}_${sanitizedFormType}_${timestamp}.pdf`;
};