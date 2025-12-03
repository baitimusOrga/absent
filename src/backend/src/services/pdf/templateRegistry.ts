/**
 * PDF template registry and configuration
 */

import type { School, PdfTemplate } from '../../types/pdf.types';
import { SCHOOLS } from '../../constants';
import { NotFoundError } from '../../utils/errors';

/**
 * Registry of PDF templates by school
 */
const PDF_TEMPLATES: Record<School, PdfTemplate> = {
  [SCHOOLS.BBZW]: {
    school: SCHOOLS.BBZW,
    filePath: 'Entschuldigung_Urlaubsgesuch_BBZW.pdf',
    maxLessonRows: 7,
    fieldMapping: {
      studentName: 'Name und Vorname Lernender',
      geburtsdatum: 'Geburtsdatum',
      klasse: 'Klasse',
      datumDerAbsenz: 'Datum der Absenz',
      begruendung: 'Begründung der Absenzen Beim Urlaubsgesuch Beweismittel zwingend beilegen',
      entschuldigungCheckbox: 'undefined',
      urlaubsgesuchCheckbox: 'undefined_2',
      berufsbildnerEmail: 'E-Mailadresse Berufsbildner/in',
      berufsbildnerNameUndTelefon: 'Name und Telefonnummer Berufsbildnerin',
      lessonRows: {
        anzahlLektionen: 'Anzahl LektionenRow{row}',
        wochentagUndDatum: 'Wochentag und Da tumRow{row}',
        fach: 'FachRow{row}',
        lehrperson: 'LehrpersonRow{row}',
      },
    },
  },
  [SCHOOLS.BBZG]: {
    school: SCHOOLS.BBZG,
    filePath: 'Entschuldigungs_Urlaubsgesuch_BBZG.pdf',
    maxLessonRows: 7,
    fieldMapping: {
      studentName: 'Name und Vorname Lernender',
      geburtsdatum: 'Geburtsdatum',
      klasse: 'Klasse',
      datumDerAbsenz: 'Datum der Absenz',
      begruendung: 'Begründung der Absenzen Beim Urlaubsgesuch Beweismittel beilegen',
      entschuldigungCheckbox: 'Entschuldigung',
      urlaubsgesuchCheckbox: 'Urlaubgsgesuch',
      berufsbildnerNameUndTelefon: 'Name und Telefonnummer Berufsbildnerin',
      datumUnterschrift: 'Datum Unterschrift Berufsbildnerin',
      bemerkung: 'Bemerkung',
      lessonRows: {
        anzahlLektionen: 'Anzahl LektionenRow{row}',
        wochentagUndDatum: 'Wochentag und DatumRow{row}',
        fach: 'FachRow{row}',
        lehrperson: 'LehrpersonRow{row}',
      },
    },
  },
};

/**
 * Template registry class for managing PDF templates
 */
export class PdfTemplateRegistry {
  /**
   * Get template configuration for a specific school
   */
  static getTemplate(school: School): PdfTemplate {
    const template = PDF_TEMPLATES[school];
    
    if (!template) {
      throw new NotFoundError(
        `No PDF template found for school: ${school}`,
        'TEMPLATE_NOT_FOUND'
      );
    }
    
    return template;
  }

  /**
   * Get all available templates
   */
  static getAllTemplates(): PdfTemplate[] {
    return Object.values(PDF_TEMPLATES);
  }

  /**
   * Get list of supported schools
   */
  static getSupportedSchools(): School[] {
    return Object.keys(PDF_TEMPLATES) as School[];
  }

  /**
   * Check if a school template exists
   */
  static hasTemplate(school: School): boolean {
    return school in PDF_TEMPLATES;
  }
}
