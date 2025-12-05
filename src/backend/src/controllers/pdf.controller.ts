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

export const getPdfStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const status = await pdfService.getStatus();
  ApiResponse.success(res, status);
});

export const fillPdf = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const fillData = req.body;
  const user = req.user;
  
  if (!user) {
    throw new BadRequestError('User authentication required');
  }

  const userData: UserData = {
    fullname: (user as any).fullname,
    school: (user as any).school,
    berufsbildner: (user as any).berufsbildner,
    berufsbildnerEmail: (user as any).berufsbildnerEmail,
    berufsbildnerPhoneNumber: (user as any).berufsbildnerPhoneNumber,
    dateOfBirth: (user as any).dateOfBirth,
    calendarUrl: (user as any).schulnetzCalendarUrl,
  };

  const useShortNames = fillData.useShortNames ?? false;

  logger.debug('Processing PDF fill request', {
    userId: user.id,
    school: fillData.school || userData.school,
    formType: fillData.formType,
    hasCalendarUrl: !!userData.calendarUrl,
    useShortNames,
  });

  if (userData.calendarUrl && (!fillData.missedLessons || fillData.missedLessons.length === 0)) {
    try {
      const absenceDate = new Date(fillData.datumDerAbsenz);
      const calendarEvents = await fetchCalendarData(userData.calendarUrl);
      const processedEvents = processEvents(calendarEvents, absenceDate);
      
      const missedLessons: MissedLesson[] = processedEvents.map(event => ({
        anzahlLektionen: event.count.toString(),
        wochentagUndDatum: event.datum,
        fach: useShortNames ? event.fach.trim() : getSubjectName(event.fach.trim()),
        lehrperson: useShortNames ? event.lehrer.trim() : getTeacherName(event.lehrer.trim()),
        klasse: event.klasse,
      }));
      
      fillData.missedLessons = missedLessons;
      
      if (!fillData.klasse && missedLessons.length > 0 && missedLessons[0].klasse) {
        fillData.klasse = missedLessons[0].klasse;
      }
    } catch (error) {
      logger.warn('Failed to fetch calendar data', {
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  fillData.missedLessons = fillData.missedLessons || [];

  const pdfBuffer = await pdfService.fillPdf(fillData, userData);
  const filename = pdfService.generateFilename({
    ...fillData,
    school: fillData.school || userData.school,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  logger.info('PDF generated', {
    userId: user.id,
    filename,
    size: pdfBuffer.length,
    lessonCount: fillData.missedLessons.length,
  });

  res.send(pdfBuffer);
});

export const getTemplates = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const templates = pdfService.getAvailableTemplates();
  ApiResponse.success(res, { templates });
});