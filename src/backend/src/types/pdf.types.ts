/**
 * Enhanced PDF type definitions
 */

import { SCHOOLS, FORM_TYPES } from '../constants';

export type School = typeof SCHOOLS[keyof typeof SCHOOLS];
export type FormType = typeof FORM_TYPES[keyof typeof FORM_TYPES];

/**
 * Represents a single missed lesson
 */
export interface MissedLesson {
  /** Number of lessons missed */
  anzahlLektionen: string;
  /** Day and date (e.g., "Montag, 15.01.2024") */
  wochentagUndDatum: string;
  /** Subject name */
  fach: string;
  /** Teacher name */
  lehrperson: string;
  /** Class identifier (optional, extracted from calendar) */
  klasse?: string;
}

/**
 * Input data for filling the PDF form
 */
export interface PdfFillData {
  /** Date of absence (required) */
  datumDerAbsenz: string;
  /** Student's birth date */
  geburtsdatum?: string;
  /** Class identifier */
  klasse?: string;
  /** Reason for absence (required) */
  begruendung: string;
  /** Type of form (excuse or vacation request) */
  formType: FormType;
  /** List of missed lessons */
  missedLessons: MissedLesson[];
  /** Date of signature */
  datumUnterschrift?: string;
  /** Additional remarks (BBZG only) */
  bemerkung?: string;
  /** School type determines which PDF template to use */
  school: School;
  /** Use short names for teachers and subjects (default: false) */
  useShortNames?: boolean;
}

/**
 * Maps logical field names to actual PDF field names
 */
export interface PdfFieldMapping {
  studentName: string;
  geburtsdatum: string;
  klasse: string;
  datumDerAbsenz: string;
  begruendung: string;
  entschuldigungCheckbox?: string;
  urlaubsgesuchCheckbox?: string;
  berufsbildnerNameUndTelefon?: string;
  berufsbildnerEmail?: string;
  datumUnterschrift?: string;
  bemerkung?: string;
  /** Pattern for lesson rows - use {row} as placeholder */
  lessonRows: {
    anzahlLektionen: string;
    wochentagUndDatum: string;
    fach: string;
    lehrperson: string;
  };
}

/**
 * Configuration for a specific PDF template
 */
export interface PdfTemplate {
  /** School identifier */
  school: School;
  /** Path to the PDF file (relative to pdfs directory) */
  filePath: string;
  /** Field name mappings */
  fieldMapping: PdfFieldMapping;
  /** Maximum number of lesson rows supported */
  maxLessonRows: number;
}

/**
 * User data extracted from authentication
 */
export interface UserData {
  fullname?: string;
  school?: School;
  berufsbildner?: string;
  berufsbildnerEmail?: string;
  berufsbildnerPhoneNumber?: string;
  dateOfBirth?: Date | string;
  calendarUrl?: string;
}

/**
 * PDF service status
 */
export interface PdfStatus {
  available: boolean;
  message: string;
  templates?: School[];
}
