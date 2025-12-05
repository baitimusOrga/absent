/**
 * PDF field validation utilities
 */

import type { PdfFillData, MissedLesson, UserData } from '../../types/pdf.types';
import { ValidationError } from '../../utils/errors';
import {
  isNonEmptyString,
  isValidEnum,
  hasMinLength,
  hasMaxLength,
  sanitizeString,
} from '../../utils/validation/validators';
import { SCHOOLS, FORM_TYPES } from '../../constants';

// Security: Maximale Längen für Felder definieren, um DoS-Attacken zu verhindern
const MAX_LENGTHS = {
  SHORT_TEXT: 100,  // Für Namen, Fächer, Klassen, etc.
  DATE_TEXT: 100,    // Für Datumsangaben
  LONG_TEXT: 400,   // Für Begründungen
  COMMENT: 500      // Für Bemerkungen
};

/**
 * Validate missed lesson data
 */
const validateMissedLesson = (lesson: any, index: number): MissedLesson => {
  const errors: Record<string, string[]> = {};

  // Anzahl Lektionen
  if (!isNonEmptyString(lesson.anzahlLektionen)) {
    errors[`missedLessons[${index}].anzahlLektionen`] = ['Number of lessons is required'];
  } else if (!hasMaxLength(lesson.anzahlLektionen, MAX_LENGTHS.SHORT_TEXT)) {
    errors[`missedLessons[${index}].anzahlLektionen`] = [`Length must not exceed ${MAX_LENGTHS.SHORT_TEXT} characters`];
  }

  // Datum
  if (!isNonEmptyString(lesson.wochentagUndDatum)) {
    errors[`missedLessons[${index}].wochentagUndDatum`] = ['Day and date are required'];
  } else if (!hasMaxLength(lesson.wochentagUndDatum, MAX_LENGTHS.DATE_TEXT)) {
    errors[`missedLessons[${index}].wochentagUndDatum`] = [`Length must not exceed ${MAX_LENGTHS.DATE_TEXT} characters`];
  }

  // Fach
  if (!isNonEmptyString(lesson.fach)) {
    errors[`missedLessons[${index}].fach`] = ['Subject is required'];
  } else if (!hasMaxLength(lesson.fach, MAX_LENGTHS.SHORT_TEXT)) {
    errors[`missedLessons[${index}].fach`] = [`Subject must not exceed ${MAX_LENGTHS.SHORT_TEXT} characters`];
  }

  // Lehrperson
  if (!isNonEmptyString(lesson.lehrperson)) {
    errors[`missedLessons[${index}].lehrperson`] = ['Teacher name is required'];
  } else if (!hasMaxLength(lesson.lehrperson, MAX_LENGTHS.SHORT_TEXT)) {
    errors[`missedLessons[${index}].lehrperson`] = [`Teacher name must not exceed ${MAX_LENGTHS.SHORT_TEXT} characters`];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Invalid missed lesson data', errors);
  }

  return {
    anzahlLektionen: sanitizeString(lesson.anzahlLektionen),
    wochentagUndDatum: sanitizeString(lesson.wochentagUndDatum),
    fach: sanitizeString(lesson.fach),
    lehrperson: sanitizeString(lesson.lehrperson),
  };
};

/**
 * Validate PDF fill data
 */
export const validatePdfFillData = (data: any, userData?: UserData): PdfFillData => {
  const errors: Record<string, string[]> = {};

  // Validate school (can come from data or user profile)
  const school = data.school || userData?.school;
  if (!school) {
    errors.school = ['School is required'];
  } else if (!isValidEnum(school, SCHOOLS)) {
    errors.school = [`Invalid school. Must be one of: ${Object.values(SCHOOLS).join(', ')}`];
  }

  // Validate form type
  if (!data.formType) {
    errors.formType = ['Form type is required'];
  } else if (!isValidEnum(data.formType, FORM_TYPES)) {
    errors.formType = [
      `Invalid form type. Must be one of: ${Object.values(FORM_TYPES).join(', ')}`,
    ];
  }

  // Validate required fields
  if (!isNonEmptyString(data.datumDerAbsenz)) {
    errors.datumDerAbsenz = ['Date of absence is required'];
  } else if (!hasMaxLength(data.datumDerAbsenz, MAX_LENGTHS.DATE_TEXT)) {
    errors.datumDerAbsenz = [`Date must not exceed ${MAX_LENGTHS.DATE_TEXT} characters`];
  }

  if (!isNonEmptyString(data.begruendung)) {
    errors.begruendung = ['Reason for absence is required'];
  } else if (!hasMaxLength(data.begruendung, MAX_LENGTHS.LONG_TEXT)) {
    // Security Fix: Blockiert zu lange Texte hier
    errors.begruendung = [`Reason must not exceed ${MAX_LENGTHS.LONG_TEXT} characters`];
  }

  // Optional fields validation limits
  
  // --- KLASSE VALIDATION REMOVED ---
  // if (data.klasse && !hasMaxLength(data.klasse, MAX_LENGTHS.SHORT_TEXT)) {
  //   errors.klasse = [`Class must not exceed ${MAX_LENGTHS.SHORT_TEXT} characters`];
  // }
  // ---------------------------------

  if (data.datumUnterschrift && !hasMaxLength(data.datumUnterschrift, MAX_LENGTHS.DATE_TEXT)) {
    errors.datumUnterschrift = [`Date must not exceed ${MAX_LENGTHS.DATE_TEXT} characters`];
  }

  if (data.bemerkung && !hasMaxLength(data.bemerkung, MAX_LENGTHS.COMMENT)) {
    errors.bemerkung = [`Comment must not exceed ${MAX_LENGTHS.COMMENT} characters`];
  }

  // Validate missed lessons array
  if (!Array.isArray(data.missedLessons)) {
    errors.missedLessons = ['Missed lessons must be an array'];
  } else if (!hasMaxLength(data.missedLessons, 7)) {
    errors.missedLessons = ['Maximum 7 missed lessons allowed'];
  }

  // Throw validation error if any errors found
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Invalid PDF fill data', errors);
  }

  // Validate each missed lesson (only if array has items)
  const validatedLessons = data.missedLessons && data.missedLessons.length > 0
    ? data.missedLessons.map((lesson: any, index: number) => validateMissedLesson(lesson, index))
    : [];

  // Return validated and sanitized data
  return {
    school: school as any,
    formType: data.formType,
    datumDerAbsenz: sanitizeString(data.datumDerAbsenz),
    begruendung: sanitizeString(data.begruendung),
    missedLessons: validatedLessons,
    geburtsdatum: data.geburtsdatum ? sanitizeString(data.geburtsdatum) : undefined,
    klasse: data.klasse ? sanitizeString(data.klasse) : undefined,
    datumUnterschrift: data.datumUnterschrift ? sanitizeString(data.datumUnterschrift) : undefined,
    bemerkung: data.bemerkung ? sanitizeString(data.bemerkung) : undefined,
  };
};