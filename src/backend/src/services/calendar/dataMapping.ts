/**
 * Data mapping utilities for teachers and subjects
 */

import teachersData from '../../data/teachers24-25-bbzw.json';
import subjectsData from '../../data/subjects24-25-bbzw.json';

/**
 * Get full teacher name from shortcode
 */
export const getTeacherName = (shortname: string): string => {
  return (teachersData as Record<string, string>)[shortname] || shortname;
};

/**
 * Get full subject name from short subject code
 */
export const getSubjectName = (shortSubjectName: string): string => {
  return (subjectsData as Record<string, string>)[shortSubjectName] || shortSubjectName;
};
