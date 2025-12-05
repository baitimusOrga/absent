/**
 * PDF field validation utilities
 */

import type { PdfFillData, MissedLesson, UserData } from '../../types/pdf.types';
import { ValidationError } from '../../utils/errors';
import { SCHOOLS, FORM_TYPES } from '../../constants';

// --- INLINE VALIDATORS (Moved here to ensure stability) ---

const isNonEmptyString = (value: any): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

// Check max length for STRINGS
const hasMaxLength = (value: string, max: number): boolean => {
  if (typeof value !== 'string') return false;
  return value.length <= max;
};

const isValidEnum = (value: any, enumObj: object): boolean => {
  return Object.values(enumObj).includes(value);
};

const sanitizeString = (str: string): string => {
  if (!str) return '';
  return str.trim();
};

// ----------------------------------------------------------------

// Security: Define max lengths to prevent DoS attacks
const MAX_LENGTHS = {
  SHORT_TEXT: 100,  // Names, subjects, etc.
  DATE_TEXT: 100,   // Dates
  LONG_TEXT: 400,   // Reasons
  COMMENT: 500      // Comments
};

/**
 * Validate missed lesson data
 */
const validateMissedLesson = (lesson: any, index: number): MissedLesson => {
  const errors: Record<string, string[]> = {};

  // Number of lessons
  if (!isNonEmptyString(lesson.anzahlLektionen)) {
    errors[`missedLessons[${index}].anzahlLektionen`] = ['Number of lessons is required'];
  } else if (!hasMaxLength(lesson.anzahlLektionen, MAX_LENGTHS.SHORT_TEXT)) {
    errors[`missedLessons[${index}].anzahlLektionen`] = [`Length must not exceed ${MAX_LENGTHS.SHORT_TEXT} characters`];
  }

  // Date
  if (!isNonEmptyString(lesson.wochentagUndDatum)) {
    errors[`missedLessons[${index}].wochentagUndDatum`] = ['Day and date are required'];
  } else if (!hasMaxLength(lesson.wochentagUndDatum, MAX_LENGTHS.DATE_TEXT)) {
    errors[`missedLessons[${index}].wochentagUndDatum`] = [`Length must not exceed ${MAX_LENGTHS.DATE_TEXT} characters`];
  }

  // Subject
  if (!isNonEmptyString(lesson.fach)) {
    errors[`missedLessons[${index}].fach`] = ['Subject is required'];
  } else if (!hasMaxLength(lesson.fach, MAX_LENGTHS.SHORT_TEXT)) {
    errors[`missedLessons[${index}].fach`] = [`Subject must not exceed ${MAX_LENGTHS.SHORT_TEXT} characters`];
  }

  // Teacher
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

  // Validate school
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
    errors.begruendung = [`Reason must not exceed ${MAX_LENGTHS.LONG_TEXT} characters`];
  }

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
  } else if (data.missedLessons.length > 7) { 
    // ^ FIX: Use .length directly here instead of hasMaxLength validator
    errors.missedLessons = ['Maximum 7 missed lessons allowed'];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Invalid PDF fill data', errors);
  }

  // Validate each missed lesson (only if array has items)
  const validatedLessons = data.missedLessons && data.missedLessons.length > 0
    ? data.missedLessons.map((lesson: any, index: number) => validateMissedLesson(lesson, index))
    : [];

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