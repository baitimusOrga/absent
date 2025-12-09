import ical from 'ical';
import { logger } from '../../utils/logger';
import { InternalServerError } from '../../utils/errors';

// --- CONFIGURATION ---

// REPLACE THIS with your actual Cloudflare Worker URL
const PROXY_WORKER_URL = 'https://absent-proxy.breachmarket.workers.dev';

// Cache duration: 15 minutes (in milliseconds)
const CACHE_DURATION = 15 * 60 * 1000;

// Max simultaneous network connections allowed
const MAX_CONCURRENT_REQUESTS = 15;

// --- INTERFACES ---
export interface CalendarEvent {
  datum: string;
  fach: string;
  lehrer: string;
  klasse: string;
}

export interface ProcessedEvent extends CalendarEvent {
  count: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

// --- STATE MANAGEMENT ---

// Cache: URL -> { data, timestamp }
const calendarCache = new Map<string, CacheEntry>();

// In-flight: URL -> Promise (prevents duplicate requests for the same URL)
const inflightRequests = new Map<string, Promise<any>>();

// Queue: List of functions waiting to fetch
const requestQueue: Array<() => void> = [];
let activeRequestCount = 0;

// --- QUEUE LOGIC ---

/**
 * Tries to process the next item in the queue.
 */
const processQueue = () => {
  if (activeRequestCount >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
    return;
  }
  
  const nextTask = requestQueue.shift();
  if (nextTask) {
    activeRequestCount++;
    nextTask();
  }
};

/**
 * Wraps the native fetch in a queue system.
 * It will wait until a slot is free before executing the network call.
 */
const queuedFetch = (url: string): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const task = async () => {
      try {
        const response = await fetch(url);
        resolve(response);
      } catch (err) {
        reject(err);
      } finally {
        activeRequestCount--;
        processQueue(); // When done, let the next one in line proceed
      }
    };
    
    requestQueue.push(task);
    processQueue();
  });
};

// --- MAIN SERVICE FUNCTION ---

export const fetchCalendarData = async (calendarUrl: string): Promise<any> => {
  const now = Date.now();

  // 1. CACHE CHECK
  if (calendarCache.has(calendarUrl)) {
    const cached = calendarCache.get(calendarUrl)!;
    if ((now - cached.timestamp) < CACHE_DURATION) {
      // logger.debug('Serving calendar from cache', { url: calendarUrl });
      return cached.data;
    }
  }

  // 2. IN-FLIGHT CHECK (Deduplication)
  // If a request for this URL is already running, wait for it instead of starting a new one.
  if (inflightRequests.has(calendarUrl)) {
    return inflightRequests.get(calendarUrl);
  }

  // 3. EXECUTE FETCH
  const fetchPromise = (async () => {
    try {
      // Construct the Proxy URL
      // We encode the target URL to pass it safely as a query parameter
      const targetUrl = `${PROXY_WORKER_URL}?url=${encodeURIComponent(calendarUrl)}`;
      
      const response = await queuedFetch(targetUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch calendar: ${response.status} ${response.statusText}`);
      }

      const icsData = await response.text();
      
      // Validation checks
      if (icsData.includes('UID NOT FOUND') || icsData.includes('ERROR') || icsData.length < 50) {
        logger.warn('Received invalid ICS data', { responseSnippet: icsData.substring(0, 100) });
        throw new Error('Invalid calendar data received. The calendar URL may be expired or incorrect.');
      }
      
      const events = ical.parseICS(icsData);
      
      // Update Cache
      calendarCache.set(calendarUrl, {
        data: events,
        timestamp: Date.now()
      });
      
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
      
      // Fallback: If network fails but we have old cache, return that instead of crashing
      if (calendarCache.has(calendarUrl)) {
        logger.warn('Serving stale cache due to fetch error', { url: calendarUrl });
        return calendarCache.get(calendarUrl)!.data;
      }

      throw new InternalServerError(
        `Failed to fetch calendar data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CALENDAR_FETCH_ERROR'
      );
    } finally {
      // Remove from inflight map so new requests can happen later
      inflightRequests.delete(calendarUrl);
    }
  })();

  inflightRequests.set(calendarUrl, fetchPromise);
  return fetchPromise;
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