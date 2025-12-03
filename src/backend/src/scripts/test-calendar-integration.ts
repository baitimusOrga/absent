/**
 * Test script for calendar integration
 * Tests ICS parsing and lesson extraction
 */

import { 
  fetchCalendarData, 
  processEvents, 
  getTeacherName, 
  getSubjectName 
} from '../services/calendar';
import * as fs from 'fs';
import * as path from 'path';
import ical from 'ical';

const TEST_CALENDAR_URL = 'https://schulnetz.lu.ch/bbzw/cindex.php?longurl=Jh5vvNitgRj8xxga8Y78kJ7F46iNw3o3NpszJz0qSQhCrqhWhJFbf8mtPQbVksv';
const TEST_ICS_FILE = path.join(__dirname, 'test-calendar.ics');

async function testCalendarIntegration() {
  console.log('🧪 Testing Calendar Integration\n');
  
  let calendarEvents: any;
  
  try {
    // Test 1: Try to fetch calendar data from URL first
    console.log('1️⃣  Fetching calendar data from URL...');
    try {
      calendarEvents = await fetchCalendarData(TEST_CALENDAR_URL);
      console.log(`✅ Successfully fetched ${Object.keys(calendarEvents).length} events from URL\n`);
    } catch (error) {
      console.log(`⚠️  Could not fetch from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('   Falling back to local test ICS file...\n');
      
      // Fall back to local test file
      const icsData = fs.readFileSync(TEST_ICS_FILE, 'utf-8');
      calendarEvents = ical.parseICS(icsData);
      console.log(`✅ Successfully loaded ${Object.keys(calendarEvents).length} events from test file\n`);
    }
    
    // Test 2: Process events for a specific date
    console.log('2️⃣  Processing events for test date...');
    const testDate = new Date('2025-12-01'); // December 1, 2025 based on your example
    const processedEvents = processEvents(calendarEvents, testDate);
    
    console.log(`✅ Processed ${processedEvents.length} unique lessons\n`);
    
    if (processedEvents.length === 0) {
      console.log('⚠️  No events found for this date. Try a different date.');
      
      // Show some available dates
      console.log('\n📅 Available event dates (first 10):');
      const dates = new Set<string>();
      for (const k in calendarEvents) {
        if (calendarEvents[k].type === 'VEVENT' && calendarEvents[k].start) {
          const date = new Date(calendarEvents[k].start);
          dates.add(date.toISOString().split('T')[0]);
        }
      }
      Array.from(dates).sort().slice(0, 10).forEach(date => {
        console.log(`   - ${date}`);
      });
      
      // Also show sample events
      console.log('\n📋 Sample events:');
      let count = 0;
      for (const k in calendarEvents) {
        if (calendarEvents[k].type === 'VEVENT' && count < 3) {
          console.log(`   - ${calendarEvents[k].summary} (${new Date(calendarEvents[k].start).toISOString().split('T')[0]})`);
          count++;
        }
      }
    } else {
      // Test 3: Display processed events
      console.log('3️⃣  Processed lessons for the date:\n');
      processedEvents.forEach((event, index) => {
        console.log(`   Lesson ${index + 1}:`);
        console.log(`   - Count: ${event.count}`);
        console.log(`   - Date: ${event.datum}`);
        console.log(`   - Subject (raw): ${event.fach}`);
        console.log(`   - Subject (mapped): ${getSubjectName(event.fach.trim())}`);
        console.log(`   - Teacher (raw): ${event.lehrer}`);
        console.log(`   - Teacher (mapped): ${getTeacherName(event.lehrer.trim())}`);
        console.log(`   - Class: ${event.klasse}`);
        console.log('');
      });
      
      // Test 4: Test data mapping
      console.log('4️⃣  Testing data mapping functions:\n');
      
      const testTeachers = ['MEI', 'SCH', 'UNKNOWN'];
      testTeachers.forEach(teacher => {
        const mapped = getTeacherName(teacher);
        console.log(`   Teacher: ${teacher} → ${mapped}`);
      });
      
      console.log('');
      
      const testSubjects = ['M', 'INF', 'ABU', 'UNKNOWN'];
      testSubjects.forEach(subject => {
        const mapped = getSubjectName(subject);
        console.log(`   Subject: ${subject} → ${mapped}`);
      });
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : error);
    console.error('\nStack trace:', error);
    process.exit(1);
  }
}

// Run tests
testCalendarIntegration()
  .then(() => {
    console.log('\n🎉 Calendar integration test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
