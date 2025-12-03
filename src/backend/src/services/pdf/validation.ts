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

/**
 * Validate missed lesson data
 */
const validateMissedLesson = (lesson: any, index: number): MissedLesson => {
  const errors: Record<string, string[]> = {};

  if (!isNonEmptyString(lesson.anzahlLektionen)) {
    errors[`missedLessons[${index}].anzahlLektionen`] = ['Number of lessons is required'];
  }

  if (!isNonEmptyString(lesson.wochentagUndDatum)) {
    errors[`missedLessons[${index}].wochentagUndDatum`] = ['Day and date are required'];
  }

  if (!isNonEmptyString(lesson.fach)) {
    errors[`missedLessons[${index}].fach`] = ['Subject is required'];
  }

  if (!isNonEmptyString(lesson.lehrperson)) {
    errors[`missedLessons[${index}].lehrperson`] = ['Teacher name is required'];
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
  }

  if (!isNonEmptyString(data.begruendung)) {
    errors.begruendung = ['Reason for absence is required'];
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
