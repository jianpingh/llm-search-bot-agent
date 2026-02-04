import { mockPeople, mockCompanies, Person, Company } from '@/data/mock-data';
import type { SearchFilters } from '@/types';

export interface SearchResult {
  people: Person[];
  companies: Company[];
  totalPeople: number;
  totalCompanies: number;
}

function normalizeString(str: string): string {
  return str.toLowerCase().trim();
}

function matchesFilter(value: string, filter: string | string[] | undefined): boolean {
  if (!filter || (Array.isArray(filter) && filter.length === 0)) {
    return true;
  }
  
  const normalizedValue = normalizeString(value);
  
  if (Array.isArray(filter)) {
    return filter.some(f => normalizedValue.includes(normalizeString(f)));
  }
  
  return normalizedValue.includes(normalizeString(filter));
}

function matchesHeadcount(personHeadcount: string, filterHeadcount: string | undefined): boolean {
  if (!filterHeadcount) return true;
  
  // Map filter values to ranges
  const headcountRanges: Record<string, number[]> = {
    '1-10': [1, 10],
    '11-50': [11, 50],
    '51-200': [51, 200],
    '201-500': [201, 500],
    '501-1000': [501, 1000],
    '1001-5000': [1001, 5000],
    '5001+': [5001, Infinity],
  };
  
  const filterLower = normalizeString(filterHeadcount);
  
  // Check for "startup" or "small company" keywords
  if (filterLower.includes('startup') || filterLower.includes('small')) {
    return ['1-10', '11-50', '51-200'].includes(personHeadcount);
  }
  
  // Check for "large" or "enterprise" keywords
  if (filterLower.includes('large') || filterLower.includes('enterprise')) {
    return ['501-1000', '1001-5000', '5001+'].includes(personHeadcount);
  }
  
  // Direct match
  return normalizeString(personHeadcount).includes(filterLower);
}

function matchesExperience(years: number, filter: string | undefined): boolean {
  if (!filter) return true;
  
  const filterLower = normalizeString(filter);
  
  // Parse experience requirements
  if (filterLower.includes('5+') || filterLower.includes('5 years') || filterLower.includes('五年')) {
    return years >= 5;
  }
  if (filterLower.includes('10+') || filterLower.includes('10 years') || filterLower.includes('十年')) {
    return years >= 10;
  }
  if (filterLower.includes('3+') || filterLower.includes('3 years') || filterLower.includes('三年')) {
    return years >= 3;
  }
  if (filterLower.includes('senior')) {
    return years >= 5;
  }
  if (filterLower.includes('junior') || filterLower.includes('entry')) {
    return years <= 3;
  }
  
  return true;
}

export function searchPeople(filters: SearchFilters): Person[] {
  return mockPeople.filter(person => {
    // Match job title
    if (!matchesFilter(person.title, filters.jobTitle)) {
      return false;
    }
    
    // Match location
    if (!matchesFilter(person.location, filters.location)) {
      return false;
    }
    
    // Match industry
    if (!matchesFilter(person.industry, filters.industry)) {
      return false;
    }
    
    // Match seniority
    if (!matchesFilter(person.seniority, filters.seniority)) {
      return false;
    }
    
    // Match company headcount
    if (!matchesHeadcount(person.companyHeadcount, filters.companyHeadcount)) {
      return false;
    }
    
    // Match years of experience
    if (!matchesExperience(person.yearsOfExperience, filters.yearsOfExperience)) {
      return false;
    }
    
    // Match company name
    if (!matchesFilter(person.company, filters.companyName)) {
      return false;
    }
    
    return true;
  });
}

export function searchCompanies(filters: SearchFilters): Company[] {
  return mockCompanies.filter(company => {
    // Match industry
    if (!matchesFilter(company.industry, filters.industry)) {
      return false;
    }
    
    // Match location
    if (!matchesFilter(company.location, filters.location)) {
      return false;
    }
    
    // Match headcount
    if (!matchesHeadcount(company.headcount, filters.companyHeadcount)) {
      return false;
    }
    
    // Match company name
    if (!matchesFilter(company.name, filters.companyName)) {
      return false;
    }
    
    return true;
  });
}

export function search(filters: SearchFilters): SearchResult {
  const people = searchPeople(filters);
  const companies = searchCompanies(filters);
  
  return {
    people,
    companies,
    totalPeople: people.length,
    totalCompanies: companies.length,
  };
}

export function formatSearchResults(result: SearchResult): string {
  const parts: string[] = [];
  
  if (result.totalPeople > 0) {
    parts.push(`找到 ${result.totalPeople} 位符合条件的人选：\n`);
    result.people.slice(0, 10).forEach((person, index) => {
      parts.push(`${index + 1}. **${person.name}** - ${person.title} @ ${person.company}`);
      parts.push(`   📍 ${person.location} | 🏢 ${person.industry} | 👔 ${person.seniority}`);
      parts.push(`   📊 公司规模: ${person.companyHeadcount} | ⏱️ ${person.yearsOfExperience}年经验`);
      parts.push(`   🔧 技能: ${person.skills.join(', ')}\n`);
    });
    
    if (result.totalPeople > 10) {
      parts.push(`... 还有 ${result.totalPeople - 10} 位更多人选`);
    }
  } else {
    parts.push('未找到符合条件的人选。');
  }
  
  return parts.join('\n');
}
