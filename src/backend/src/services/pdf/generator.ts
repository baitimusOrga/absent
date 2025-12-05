import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import type { PdfFillData, PdfTemplate, UserData } from '../../types/pdf.types';
import { InternalServerError, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { FORM_TYPES } from '../../constants';

const templateCache = new Map<string, Buffer>();

const safeTruncate = (value: string | undefined | null, maxLength: number): string => {
  if (!value) return '';
  const str = String(value);
  return str.length > maxLength ? str.substring(0, maxLength) : str;
};

const formatDateOfBirth = (dateOfBirth: Date | string | undefined): string => {
  if (!dateOfBirth) return '';
  if (dateOfBirth instanceof Date) {
    return dateOfBirth.toISOString().split('T')[0];
  }
  if (typeof dateOfBirth === 'string') {
    return safeTruncate(dateOfBirth, 50);
  }
  return '';
};

export const fillPdfForm = async (
  template: PdfTemplate,
  data: PdfFillData,
  userData?: UserData
): Promise<Buffer> => {
  const pdfPath = path.join(__dirname, '../../../pdfs', template.filePath);
  
  let pdfBuffer: Buffer;

  if (templateCache.has(pdfPath)) {
    pdfBuffer = templateCache.get(pdfPath)!;
  } else {
    if (!fs.existsSync(pdfPath)) {
      throw new NotFoundError(
        `PDF template file not found for school ${template.school}`,
        'TEMPLATE_FILE_NOT_FOUND'
      );
    }

    try {
      pdfBuffer = fs.readFileSync(pdfPath);
      templateCache.set(pdfPath, pdfBuffer);
    } catch (error) {
       logger.error('Error reading PDF file', { error });
       throw new InternalServerError('Failed to read PDF template', 'FILE_READ_ERROR');
    }
  }

  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const form = pdfDoc.getForm();
    const { fieldMapping } = template;

    const studentName = safeTruncate(userData?.fullname, 100);
    const dateOfBirth = formatDateOfBirth(userData?.dateOfBirth);
    const berufsbildnerName = safeTruncate(userData?.berufsbildner, 100);
    const berufsbildnerEmail = safeTruncate(userData?.berufsbildnerEmail, 150);

    form.getTextField(fieldMapping.studentName).setText(studentName);
    form.getTextField(fieldMapping.geburtsdatum).setText(safeTruncate(data.geburtsdatum || dateOfBirth, 50));
    form.getTextField(fieldMapping.klasse).setText(safeTruncate(data.klasse, 50));
    form.getTextField(fieldMapping.datumDerAbsenz).setText(safeTruncate(data.datumDerAbsenz, 50));
    form.getTextField(fieldMapping.begruendung).setText(safeTruncate(data.begruendung, 800));

    if (data.formType === FORM_TYPES.ENTSCHULDIGUNG && fieldMapping.entschuldigungCheckbox) {
      form.getCheckBox(fieldMapping.entschuldigungCheckbox).check();
    } else if (data.formType === FORM_TYPES.URLAUBSGESUCH && fieldMapping.urlaubsgesuchCheckbox) {
      form.getCheckBox(fieldMapping.urlaubsgesuchCheckbox).check();
    }

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

    const maxRows = Math.min(data.missedLessons.length, template.maxLessonRows);
    for (let i = 0; i < maxRows; i++) {
      const lesson = data.missedLessons[i];
      const rowNum = i + 1;

      const anzahlField = fieldMapping.lessonRows.anzahlLektionen.replace('{row}', rowNum.toString());
      const datumField = fieldMapping.lessonRows.wochentagUndDatum.replace('{row}', rowNum.toString());
      const fachField = fieldMapping.lessonRows.fach.replace('{row}', rowNum.toString());
      const lehrpersonField = fieldMapping.lessonRows.lehrperson.replace('{row}', rowNum.toString());

      try {
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

    form.flatten();
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      `Failed to fill PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PDF_GENERATION_ERROR'
    );
  }
};

export const generatePdfFilename = (data: PdfFillData): string => {
  const timestamp = Date.now();
  const sanitizedFormType = (data.formType || 'form').replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedSchool = (data.school || 'school').replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${sanitizedSchool}_${sanitizedFormType}_${timestamp}.pdf`;
};