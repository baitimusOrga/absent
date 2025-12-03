/**
 * PDF controller
 */

import type { Request, Response } from 'express';
import { pdfService } from '../services/pdf';
import type { UserData, MissedLesson } from '../types/pdf.types';
import { ApiResponse } from '../utils/response/ApiResponse';
import { asyncHandler, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { 
  fetchCalendarData, 
  processEvents, 
  getTeacherName, 
  getSubjectName 
} from '../services/calendar';

/**
 * Get PDF service status
 * GET /pdf/status
 */
export const getPdfStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const status = await pdfService.getStatus();
  ApiResponse.success(res, status);
});

/**
 * Fill and generate PDF
 * POST /pdf/fill
 */
export const fillPdf = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const fillData = req.body;
  
  // Extract user data from authenticated request
  const user = req.user;
  
  if (!user) {
    throw new BadRequestError('User authentication required');
  }

  // Build user data object from authenticated user
  const userData: UserData = {
    fullname: (user as any).fullname,
    school: (user as any).school,
    berufsbildner: (user as any).berufsbildner,
    berufsbildnerEmail: (user as any).berufsbildnerEmail,
    berufsbildnerPhoneNumber: (user as any).berufsbildnerPhoneNumber,
    dateOfBirth: (user as any).dateOfBirth,
    calendarUrl: (user as any).schulnetzCalendarUrl,
  };

  // Determine whether to use short names (default to false if not specified)
  const useShortNames = fillData.useShortNames ?? false;

  logger.debug('Processing PDF fill request', {
    userId: user.id,
    school: fillData.school || userData.school,
    formType: fillData.formType,
    hasCalendarUrl: !!userData.calendarUrl,
    useShortNames,
  });

  // If calendar URL is provided and no missed lessons are specified, fetch from calendar
  if (userData.calendarUrl && (!fillData.missedLessons || fillData.missedLessons.length === 0)) {
    try {
      logger.debug('Fetching lessons from calendar', { userId: user.id });
      
      // Parse the absence date
      const absenceDate = new Date(fillData.datumDerAbsenz);
      
      // Fetch and process calendar events
      const calendarEvents = await fetchCalendarData(userData.calendarUrl);
      const processedEvents = processEvents(calendarEvents, absenceDate);
      
      logger.debug('Calendar events processed', { 
        userId: user.id, 
        eventCount: processedEvents.length 
      });
      
      // Convert processed events to MissedLesson format
      const missedLessons: MissedLesson[] = processedEvents.map(event => ({
        anzahlLektionen: event.count.toString(),
        wochentagUndDatum: event.datum,
        fach: useShortNames ? event.fach.trim() : getSubjectName(event.fach.trim()),
        lehrperson: useShortNames ? event.lehrer.trim() : getTeacherName(event.lehrer.trim()),
        klasse: event.klasse,
      }));
      
      // Update fillData with calendar-derived lessons
      fillData.missedLessons = missedLessons;
      
      // Extract class from first lesson if not provided
      if (!fillData.klasse && missedLessons.length > 0 && missedLessons[0].klasse) {
        fillData.klasse = missedLessons[0].klasse;
      }
      
      logger.info('Calendar lessons populated', {
        userId: user.id,
        lessonCount: missedLessons.length,
      });
    } catch (error) {
      logger.warn('Failed to fetch calendar data, continuing without lessons', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Continue with empty lessons if calendar fetch fails
      fillData.missedLessons = fillData.missedLessons || [];
    }
  }

  // Ensure missedLessons array exists
  fillData.missedLessons = fillData.missedLessons || [];

  // Generate filled PDF
  const pdfBuffer = await pdfService.fillPdf(fillData, userData);
  
  // Generate filename
  const filename = pdfService.generateFilename({
    ...fillData,
    school: fillData.school || userData.school,
  });

  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  logger.info('PDF generated and sent successfully', {
    userId: user.id,
    filename,
    size: `${(pdfBuffer.length / 1024).toFixed(2)} KB`,
    lessonCount: fillData.missedLessons.length,
  });

  res.send(pdfBuffer);
});

/**
 * Get available PDF templates
 * GET /pdf/templates
 */
export const getTemplates = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const templates = pdfService.getAvailableTemplates();
  ApiResponse.success(res, { templates });
});
