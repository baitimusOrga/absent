/**
 * Calendar service exports
 */

export * from './calendar.service';

// Re-export from dataMapping
import { getTeacherName, getSubjectName } from './dataMapping';
export { getTeacherName, getSubjectName };
