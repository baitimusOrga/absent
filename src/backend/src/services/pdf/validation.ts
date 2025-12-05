import type { PdfFillData, MissedLesson, UserData } from '../../types/pdf.types';
import { ValidationError } from '../../utils/errors';
import { SCHOOLS, FORM_TYPES } from '../../constants';

const isNonEmptyString = (value: any): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

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

const MAX_LENGTHS = {
  SHORT_TEXT: 100,
  DATE_TEXT: 100,
  LONG_TEXT: 400,
  COMMENT: 500
};

const validateMissedLesson = (lesson: any, index: number): MissedLesson => {
  const errors: Record<string, string[]> = {};

  if (!isNonEmptyString(lesson.anzahlLektionen)) {
    errors[`missedLessons[${index}].anzahlLektionen`] = ['Number of lessons is required'];
  } else if (!hasMaxLength(lesson.anzahlLektionen, MAX_LENGTHS.SHORT_TEXT)) {
    errors[`missedLessons[${index}].anzahlLektionen`] = [`Length must not exceed ${MAX_LENGTHS.SHORT_TEXT} characters`];
  }

  if (!isNonEmptyString(lesson.wochentagUndDatum)) {
    errors[`missedLessons[${index}].wochentagUndDatum`] = ['Day and date are required'];
  } else if (!hasMaxLength(lesson.wochentagUndDatum, MAX_LENGTHS.DATE_TEXT)) {
    errors[`missedLessons[${index}].wochentagUndDatum`] = [`Length must not exceed ${MAX_LENGTHS.DATE_TEXT} characters`];
  }

  if (!isNonEmptyString(lesson.fach)) {
    errors[`missedLessons[${index}].fach`] = ['Subject is required'];
  } else if (!hasMaxLength(lesson.fach, MAX_LENGTHS.SHORT_TEXT)) {
    errors[`missedLessons[${index}].fach`] = [`Subject must not exceed ${MAX_LENGTHS.SHORT_TEXT} characters`];
  }

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

export const validatePdfFillData = (data: any, userData?: UserData): PdfFillData => {
  const errors: Record<string, string[]> = {};

  const school = data.school || userData?.school;
  if (!school) {
    errors.school = ['School is required'];
  } else if (!isValidEnum(school, SCHOOLS)) {
    errors.school = [`Invalid school. Must be one of: ${Object.values(SCHOOLS).join(', ')}`];
  }

  if (!data.formType) {
    errors.formType = ['Form type is required'];
  } else if (!isValidEnum(data.formType, FORM_TYPES)) {
    errors.formType = [
      `Invalid form type. Must be one of: ${Object.values(FORM_TYPES).join(', ')}`,
    ];
  }

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

  if (data.datumUnterschrift && !hasMaxLength(data.datumUnterschrift, MAX_LENGTHS.DATE_TEXT)) {
    errors.datumUnterschrift = [`Date must not exceed ${MAX_LENGTHS.DATE_TEXT} characters`];
  }

  if (data.bemerkung && !hasMaxLength(data.bemerkung, MAX_LENGTHS.COMMENT)) {
    errors.bemerkung = [`Comment must not exceed ${MAX_LENGTHS.COMMENT} characters`];
  }

  if (!Array.isArray(data.missedLessons)) {
    errors.missedLessons = ['Missed lessons must be an array'];
  } else if (data.missedLessons.length > 7) { 
    errors.missedLessons = ['Maximum 7 missed lessons allowed'];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Invalid PDF fill data', errors);
  }

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