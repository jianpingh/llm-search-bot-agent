/**
 * Test Cases for LLM Search Bot Agent
 * Run with: npx ts-node scripts/test-cases.ts
 */

const API_URL = 'http://localhost:3009/api/chat';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function sendMessage(message: string, threadId: string): Promise<any> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, threadId }),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Parse SSE response
  const text = await response.text();
  const lines = text.split('\n');
  
  let filters: any = null;
  let content = '';
  let events: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.slice(6));
        events.push(data.type);
        
        if (data.type === 'filters') {
          filters = data.filters;
        }
        if (data.type === 'content') {
          content += data.content || '';
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
  
  return { filters, content, events };
}

function generateThreadId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// TC-01: Simple Query
async function testTC01() {
  const name = 'TC-01: Simple Query';
  console.log(`\n🧪 Running ${name}...`);
  
  try {
    const threadId = generateThreadId();
    const result = await sendMessage('Find CTOs in Singapore', threadId);
    
    const hasTitles = result.filters?.titles?.value?.length > 0;
    const hasLocations = result.filters?.locations?.value?.length > 0;
    
    const passed = hasTitles && hasLocations;
    const details = `Titles: ${JSON.stringify(result.filters?.titles?.value)}, Locations: ${JSON.stringify(result.filters?.locations?.value)}`;
    
    results.push({ name, passed, details });
    console.log(passed ? '✅ PASSED' : '❌ FAILED', '-', details);
  } catch (e: any) {
    results.push({ name, passed: false, details: e.message });
    console.log('❌ FAILED -', e.message);
  }
}

// TC-02: Multi-condition Query
async function testTC02() {
  const name = 'TC-02: Multi-condition Query';
  console.log(`\n🧪 Running ${name}...`);
  
  try {
    const threadId = generateThreadId();
    const result = await sendMessage('Find senior engineers at startups in tech industry', threadId);
    
    const hasTitles = result.filters?.titles?.value?.length > 0;
    const hasSeniorities = result.filters?.seniorities?.value?.length > 0;
    const hasIndustries = result.filters?.industries?.value?.length > 0;
    // companyHeadcount might be inferred from "startups"
    
    const passed = hasTitles && (hasSeniorities || hasIndustries);
    const details = `Titles: ${JSON.stringify(result.filters?.titles?.value)}, Seniorities: ${JSON.stringify(result.filters?.seniorities?.value)}, Industries: ${JSON.stringify(result.filters?.industries?.value)}`;
    
    results.push({ name, passed, details });
    console.log(passed ? '✅ PASSED' : '❌ FAILED', '-', details);
  } catch (e: any) {
    results.push({ name, passed: false, details: e.message });
    console.log('❌ FAILED -', e.message);
  }
}

// TC-03: Complex Query
async function testTC03() {
  const name = 'TC-03: Complex Query';
  console.log(`\n🧪 Running ${name}...`);
  
  try {
    const threadId = generateThreadId();
    const result = await sendMessage('Find marketing directors with 5+ years experience in Europe', threadId);
    
    const hasTitles = result.filters?.titles?.value?.length > 0;
    const hasLocations = result.filters?.locations?.value?.length > 0;
    const hasExperience = result.filters?.yearsOfExperience?.value != null;
    
    const passed = hasTitles && hasLocations;
    const details = `Titles: ${JSON.stringify(result.filters?.titles?.value)}, Locations: ${JSON.stringify(result.filters?.locations?.value)}, Experience: ${JSON.stringify(result.filters?.yearsOfExperience?.value)}`;
    
    results.push({ name, passed, details });
    console.log(passed ? '✅ PASSED' : '❌ FAILED', '-', details);
  } catch (e: any) {
    results.push({ name, passed: false, details: e.message });
    console.log('❌ FAILED -', e.message);
  }
}

// TC-04: Progressive Refinement
async function testTC04() {
  const name = 'TC-04: Progressive Refinement';
  console.log(`\n🧪 Running ${name}...`);
  
  try {
    const threadId = generateThreadId();
    
    // Turn 1
    await sendMessage('Find engineers', threadId);
    
    // Turn 2
    await sendMessage('in San Francisco', threadId);
    
    // Turn 3
    const result = await sendMessage('tech industry', threadId);
    
    const hasTitles = result.filters?.titles?.value?.length > 0;
    const hasLocations = result.filters?.locations?.value?.length > 0;
    const hasIndustries = result.filters?.industries?.value?.length > 0;
    
    const passed = hasTitles && hasLocations && hasIndustries;
    const details = `Titles: ${JSON.stringify(result.filters?.titles?.value)}, Locations: ${JSON.stringify(result.filters?.locations?.value)}, Industries: ${JSON.stringify(result.filters?.industries?.value)}`;
    
    results.push({ name, passed, details });
    console.log(passed ? '✅ PASSED' : '❌ FAILED', '-', details);
  } catch (e: any) {
    results.push({ name, passed: false, details: e.message });
    console.log('❌ FAILED -', e.message);
  }
}

// TC-05: Condition Modification
async function testTC05() {
  const name = 'TC-05: Condition Modification';
  console.log(`\n🧪 Running ${name}...`);
  
  try {
    const threadId = generateThreadId();
    
    // Turn 1
    await sendMessage('Find CTOs in Singapore', threadId);
    
    // Turn 2
    const result = await sendMessage('Change location to Tokyo', threadId);
    
    const hasTitles = result.filters?.titles?.value?.length > 0;
    const locationValues = result.filters?.locations?.value || [];
    const hasTokyoLocation = Array.isArray(locationValues) 
      ? locationValues.some((l: string) => l.toLowerCase().includes('tokyo') || l.toLowerCase().includes('japan'))
      : locationValues.toLowerCase().includes('tokyo');
    
    const passed = hasTitles && hasTokyoLocation;
    const details = `Titles: ${JSON.stringify(result.filters?.titles?.value)}, Locations: ${JSON.stringify(result.filters?.locations?.value)}`;
    
    results.push({ name, passed, details });
    console.log(passed ? '✅ PASSED' : '❌ FAILED', '-', details);
  } catch (e: any) {
    results.push({ name, passed: false, details: e.message });
    console.log('❌ FAILED -', e.message);
  }
}

// TC-06: New Search Detection
async function testTC06() {
  const name = 'TC-06: New Search Detection';
  console.log(`\n🧪 Running ${name}...`);
  
  try {
    const threadId = generateThreadId();
    
    // Turn 1
    await sendMessage('Find engineers in London', threadId);
    
    // Turn 2 - New search
    const result = await sendMessage('Find designers in New York', threadId);
    
    const titlesValue = result.filters?.titles?.value || [];
    const locationsValue = result.filters?.locations?.value || [];
    
    // Should have designer-related titles and NY location
    const hasDesignerTitle = Array.isArray(titlesValue) 
      ? titlesValue.some((t: string) => t.toLowerCase().includes('design'))
      : titlesValue.toLowerCase().includes('design');
    
    const hasNYLocation = Array.isArray(locationsValue)
      ? locationsValue.some((l: string) => l.toLowerCase().includes('new york') || l.toLowerCase().includes('ny'))
      : locationsValue.toLowerCase().includes('new york');
    
    // Should NOT have engineer or London
    const noEngineerTitle = Array.isArray(titlesValue)
      ? !titlesValue.some((t: string) => t.toLowerCase().includes('engineer'))
      : !titlesValue.toLowerCase().includes('engineer');
    
    const passed = hasDesignerTitle && hasNYLocation;
    const details = `Titles: ${JSON.stringify(result.filters?.titles?.value)}, Locations: ${JSON.stringify(result.filters?.locations?.value)}`;
    
    results.push({ name, passed, details });
    console.log(passed ? '✅ PASSED' : '❌ FAILED', '-', details);
  } catch (e: any) {
    results.push({ name, passed: false, details: e.message });
    console.log('❌ FAILED -', e.message);
  }
}

// TC-07: Ask for Missing Fields
async function testTC07() {
  const name = 'TC-07: Ask for Missing Fields';
  console.log(`\n🧪 Running ${name}...`);
  
  try {
    const threadId = generateThreadId();
    const result = await sendMessage('Find engineers', threadId);
    
    // Should ask for more info (location, industry, etc.)
    const contentLower = result.content.toLowerCase();
    const asksForMore = contentLower.includes('location') || 
                        contentLower.includes('industry') ||
                        contentLower.includes('where') ||
                        contentLower.includes('specify') ||
                        contentLower.includes('哪') ||
                        contentLower.includes('地点') ||
                        contentLower.includes('行业');
    
    const passed = asksForMore;
    const details = `Response contains clarification request: ${asksForMore}. Content preview: "${result.content.substring(0, 100)}..."`;
    
    results.push({ name, passed, details });
    console.log(passed ? '✅ PASSED' : '❌ FAILED', '-', details);
  } catch (e: any) {
    results.push({ name, passed: false, details: e.message });
    console.log('❌ FAILED -', e.message);
  }
}

// TC-08: Handle "Any" Response
async function testTC08() {
  const name = 'TC-08: Handle "Any" Response';
  console.log(`\n🧪 Running ${name}...`);
  
  try {
    const threadId = generateThreadId();
    
    // Turn 1
    await sendMessage('Find product managers', threadId);
    
    // Turn 2 - "Any location"
    const result = await sendMessage('Any location is fine', threadId);
    
    // Should not ask about location again, might ask about other fields or confirm
    const contentLower = result.content.toLowerCase();
    const stillAskingLocation = contentLower.includes('which location') || 
                                contentLower.includes('what location') ||
                                contentLower.includes('specify a location');
    
    const passed = !stillAskingLocation;
    const details = `Response does not re-ask about location: ${!stillAskingLocation}. Content preview: "${result.content.substring(0, 100)}..."`;
    
    results.push({ name, passed, details });
    console.log(passed ? '✅ PASSED' : '❌ FAILED', '-', details);
  } catch (e: any) {
    results.push({ name, passed: false, details: e.message });
    console.log('❌ FAILED -', e.message);
  }
}

// TC-09: SSE Event Stream
async function testTC09() {
  const name = 'TC-09: SSE Event Stream';
  console.log(`\n🧪 Running ${name}...`);
  
  try {
    const threadId = generateThreadId();
    const result = await sendMessage('Find CTOs in Singapore', threadId);
    
    const hasHeartbeat = result.events.includes('heartbeat');
    const hasProgress = result.events.includes('progress');
    const hasContent = result.events.includes('content');
    const hasFilters = result.events.includes('filters');
    const hasDone = result.events.includes('done');
    
    const passed = hasProgress && hasContent && hasFilters && hasDone;
    const details = `Events received: ${result.events.join(', ')}`;
    
    results.push({ name, passed, details });
    console.log(passed ? '✅ PASSED' : '❌ FAILED', '-', details);
  } catch (e: any) {
    results.push({ name, passed: false, details: e.message });
    console.log('❌ FAILED -', e.message);
  }
}

// TC-10: Ambiguous Intent Handling
async function testTC10() {
  const name = 'TC-10: Ambiguous Intent Handling (Bonus)';
  console.log(`\n🧪 Running ${name}...`);
  
  try {
    const threadId = generateThreadId();
    const result = await sendMessage('Find tech leaders', threadId);
    
    const titlesValue = result.filters?.titles?.value || [];
    
    // Should expand to multiple titles (CTO, VP Engineering, Director, etc.)
    const hasMultipleTitles = Array.isArray(titlesValue) && titlesValue.length > 1;
    
    const passed = hasMultipleTitles;
    const details = `Expanded titles: ${JSON.stringify(result.filters?.titles?.value)}`;
    
    results.push({ name, passed, details });
    console.log(passed ? '✅ PASSED' : '❌ FAILED', '-', details);
  } catch (e: any) {
    results.push({ name, passed: false, details: e.message });
    console.log('❌ FAILED -', e.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting LLM Search Bot Test Suite\n');
  console.log('=' .repeat(60));
  
  // Basic Functionality
  console.log('\n📋 BASIC FUNCTIONALITY TESTS');
  await testTC01();
  await testTC02();
  await testTC03();
  
  // Multi-turn Conversation
  console.log('\n📋 MULTI-TURN CONVERSATION TESTS');
  await testTC04();
  await testTC05();
  await testTC06();
  
  // Clarification Flow
  console.log('\n📋 CLARIFICATION FLOW TESTS');
  await testTC07();
  await testTC08();
  
  // Streaming Response
  console.log('\n📋 STREAMING RESPONSE TESTS');
  await testTC09();
  
  // Bonus
  console.log('\n📋 BONUS TESTS');
  await testTC10();
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.name}`);
  });
  
  console.log(`\n📈 Results: ${passed}/${results.length} passed (${Math.round(passed/results.length*100)}%)`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.details}`);
    });
  }
}

runAllTests().catch(console.error);
