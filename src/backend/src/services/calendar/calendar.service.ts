import ical from 'ical';
import { logger } from '../../utils/logger';
import { InternalServerError } from '../../utils/errors';

export interface CalendarEvent {
  datum: string;
  fach: string;
  lehrer: string;
  klasse: string;
}

export interface ProcessedEvent extends CalendarEvent {
  count: number;
}

export const fetchCalendarData = async (calendarUrl: string): Promise<any> => {
  try {
    const urlToFetch = calendarUrl.includes('schulnetz.lu.ch')
      ? `https://api.absendo.app/proxy?url=${encodeURIComponent(calendarUrl)}`
      : calendarUrl;
    
    const response = await fetch(urlToFetch);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.status} ${response.statusText}`);
    }

    const icsData = await response.text();
    
    if (icsData.includes('UID NOT FOUND') || icsData.includes('ERROR') || icsData.length < 50) {
      logger.warn('Received invalid ICS data', { 
        response: icsData.substring(0, 200)
      });
      throw new Error('Invalid calendar data received. The calendar URL may be expired or incorrect.');
    }
    
    const events = ical.parseICS(icsData);
    const eventCount = Object.keys(events).length;
    
    if (eventCount === 0) {
      logger.warn('No events found in calendar data');
    }
    
    return events;
  } catch (error) {
    logger.error('Error fetching calendar data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      url: calendarUrl,
    });
    
    throw new InternalServerError(
      `Failed to fetch calendar data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'CALENDAR_FETCH_ERROR'
    );
  }
};

const extractClasse = (title: string): string => {
  const matches = title.match(/[SWER]-[A-Z]+\d{2}[a-zA-Z]+(?:-LO)?/g);
  return matches ? matches.join(',') : '';
};

const hasSpace = (str: string): boolean => {
  return str.includes(' ');
};

const getFormattedDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  };
  
  const formattedDate = date.toLocaleDateString('de-CH', options).replace(',', '');
  const [weekday, dayMonthYear] = formattedDate.split(' ');
  const [day, month, year] = dayMonthYear.split('.');
  const formattedWeekday = weekday.replace('.', '');
  
  return `${formattedWeekday} ${day}.${month}.${year}`;
};

export const filterEventsByDate = (events: any, filterDate: Date): CalendarEvent[] => {
  const array: CalendarEvent[] = [];
  
  for (const k in events) {
    if (events[k].type === 'VEVENT') {
      const eventStart = events[k].start;
      if (!eventStart) continue;
      
      const date = new Date(eventStart);
      
      if (
        date.getDate() === filterDate.getDate() &&
        date.getMonth() === filterDate.getMonth() &&
        date.getFullYear() === filterDate.getFullYear()
      ) {
        const title = events[k].summary || '';
        const classe = extractClasse(title);
        const parts = title.split('-');
        
        if (parts.length < 2) continue;
        
        const fach = parts[0]?.trim() || '';
        const teacher = parts[parts.length - 1]?.trim() || '';
        
        if (!hasSpace(teacher)) {
          const realTeacher = teacher.split(' ')[0];
          
          array.push({
            datum: getFormattedDate(filterDate),
            fach,
            lehrer: realTeacher,
            klasse: classe,
          });
        }
      }
    }
  }
  
  return array;
};

export const removeDuplicatesWithCount = (events: CalendarEvent[]): ProcessedEvent[] => {
  const countMap = new Map<string, ProcessedEvent>();
  
  for (const event of events) {
    const key = `${event.fach}|${event.lehrer}|${event.klasse}`;
    
    if (countMap.has(key)) {
      const existing = countMap.get(key)!;
      existing.count += 1;
    } else {
      countMap.set(key, {
        ...event,
        count: 1,
      });
    }
  }
  
  return Array.from(countMap.values());
};

export const processEvents = (events: any, filterDate: Date): ProcessedEvent[] => {
  const filteredEvents = filterEventsByDate(events, filterDate);
  return removeDuplicatesWithCount(filteredEvents);
};

export const getWeekday = (date: Date): string => {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return days[date.getDay()];
};