/**
 * Bible Study API Tests
 */
import express from 'express';
import http from 'http';
import { initializeBibleDB } from '../server/bible/init';
import { createBibleRoutes } from '../routes/bible';

let BASE_URL = 'http://localhost:3000/api/bible';
let serverInstance: http.Server | null = null;

async function ensureServer(): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/courses`, { signal: AbortSignal.timeout(1000) });
    const cType = res.headers.get('content-type') || '';
    if (res.ok && cType.includes('application/json')) return;
  } catch {}

  const app = express();
  app.use(express.json());
  const path = await import('path');
  const dbPath = path.default.join(process.cwd(), 'data', 'bible', 'bible_study.db');
  initializeBibleDB(dbPath);
  const { BibleStudyDB } = await import('../server/bible/models');
  const bibleDB = new BibleStudyDB(dbPath);
  const bibleRoutes = createBibleRoutes(bibleDB);
  app.use('/api/bible', bibleRoutes);

  await new Promise<void>((resolve) => {
    serverInstance = app.listen(0, '127.0.0.1', () => {
      const addr = serverInstance!.address() as any;
      BASE_URL = `http://127.0.0.1:${addr.port}/api/bible`;
      resolve();
    });
  });
}

async function testGetCourses() {
  console.log('\n=== Testing GET /api/bible/courses ===');
  try {
    const response = await fetch(`${BASE_URL}/courses`);
    const data = await response.json();
    console.log('Status:', response.status);
    
    if (Array.isArray(data) && data.length >= 3) {
      console.log('✓ PASS: Seeded courses found:', data.length);
      return true;
    } else {
      console.log('✗ FAIL: Expected at least 3 courses, got', Array.isArray(data) ? data.length : data);
      return false;
    }
  } catch (error) {
    console.error('✗ FAIL:', error);
    return false;
  }
}

async function testStudyBreakdown() {
  console.log('\n=== Testing GET /api/bible/study?book=James&chapter=2&verse=3 ===');
  try {
    const response = await fetch(`${BASE_URL}/study?book=James&chapter=2&verse=3`);
    const data = await response.json();
    console.log('Status:', response.status);
    
    if (data.passageText && data.bookSummary && data.historicalContext && data.dailyApplication) {
      console.log('✓ PASS: Full study breakdown structure returned');
      return true;
    } else {
      console.log('✗ FAIL: Missing expected fields in breakdown');
      return false;
    }
  } catch (error) {
    console.error('✗ FAIL:', error);
    return false;
  }
}

async function testOnboard() {
  console.log('\n=== Testing POST /api/bible/onboard ===');
  try {
    const response = await fetch(`${BASE_URL}/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userGoals: 'spiritual growth', userInterests: 'faith' })
    });
    const data = await response.json();
    console.log('Status:', response.status);
    
    if (data.welcome && Array.isArray(data.recommendedCourses) && data.recommendedCourses.length > 0) {
      console.log('✓ PASS: Onboarding response with course recommendations');
      return true;
    } else {
      console.log('✗ FAIL: Missing welcome or course recommendations');
      return false;
    }
  } catch (error) {
    console.error('✗ FAIL:', error);
    return false;
  }
}

async function runTests() {
  await ensureServer();
  console.log('Starting Bible Study API Tests against:', BASE_URL);
  
  const results = [];
  results.push(await testGetCourses());
  results.push(await testStudyBreakdown());
  results.push(await testOnboard());
  
  console.log('\n=== Test Summary ===');
  const passed = results.filter(r => r).length;
  console.log(`Passed: ${passed}/${results.length}`);
  
  if (serverInstance) {
    serverInstance.close();
  }

  if (passed === results.length) {
    console.log('✓ All Bible API tests passed!');
    process.exit(0);
  } else {
    console.log('✗ Some tests failed');
    process.exit(1);
  }
}

runTests();
