import { mockPeople, mockCompanies, Person, Company } from '@/data/mock-data';

// Simple search filters (flat structure for easy matching)
export interface SimpleSearchFilters {
  jobTitle?: string | string[];
  location?: string | string[];
  industry?: string | string[];
  seniority?: string | string[];
  companyHeadcount?: string | string[];
  yearsOfExperience?: string;
  companyName?: string;
}

export interface SearchResult {
  people: Person[];
  companies: Company[];
  totalPeople: number;
  totalCompanies: number;
}

function normalizeString(str: string): string {
  return str.toLowerCase().trim();
}

// Industry aliases for flexible matching
const INDUSTRY_ALIASES: Record<string, string[]> = {
  'technology': ['tech', 'software', 'it', 'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning', 'data science', 'cloud', 'saas', 'computer'],
  'finance': ['fintech', 'banking', 'financial', 'investment', 'trading', 'insurance'],
  'healthcare': ['health', 'medical', 'biotech', 'pharma', 'hospital', 'clinic'],
  'e-commerce': ['ecommerce', 'retail', 'shopping', 'marketplace'],
  'education': ['edtech', 'learning', 'school', 'university', 'training'],
  'retail': ['shopping', 'store', 'consumer', 'fashion'],
};

// Location aliases for flexible matching
const LOCATION_ALIASES: Record<string, string[]> = {
  'london': ['uk', 'united kingdom', 'britain', 'england', 'europe'],
  'berlin': ['germany', 'deutschland', 'europe'],
  'munich': ['germany', 'deutschland', 'europe'],
  'paris': ['france', 'europe'],
  'milan': ['italy', 'italia', 'europe'],
  'barcelona': ['spain', 'españa', 'europe'],
  'dublin': ['ireland', 'europe'],
  'helsinki': ['finland', 'europe', 'nordic'],
  'singapore': ['sg', 'asia'],
  'tokyo': ['japan', 'asia'],
  'new york': ['usa', 'united states', 'america', 'ny', 'nyc'],
  'san francisco': ['usa', 'united states', 'america', 'sf', 'bay area', 'silicon valley'],
  'seattle': ['usa', 'united states', 'america'],
  'boston': ['usa', 'united states', 'america'],
  'austin': ['usa', 'united states', 'america', 'texas'],
  'sydney': ['australia'],
  'hong kong': ['hk', 'asia'],
  'seoul': ['korea', 'south korea', 'asia'],
  'menlo park': ['usa', 'united states', 'america', 'silicon valley'],
  'mountain view': ['usa', 'united states', 'america', 'silicon valley'],
};

function matchesIndustry(value: string, filter: string | string[] | undefined): boolean {
  if (!filter || (Array.isArray(filter) && filter.length === 0)) {
    return true;
  }
  
  const normalizedValue = normalizeString(value);
  const filters = Array.isArray(filter) ? filter : [filter];
  
  return filters.some(f => {
    const normalizedFilter = normalizeString(f);
    
    // Direct match
    if (normalizedValue.includes(normalizedFilter) || normalizedFilter.includes(normalizedValue)) {
      return true;
    }
    
    // Check aliases - if filter matches any alias of the value's industry
    for (const [industry, aliases] of Object.entries(INDUSTRY_ALIASES)) {
      if (normalizedValue.includes(industry)) {
        // Value is this industry, check if filter matches any alias
        if (aliases.some(alias => normalizedFilter.includes(alias))) {
          return true;
        }
      }
      // Also check reverse: if filter is an industry name, check if value matches aliases
      if (normalizedFilter.includes(industry) && aliases.some(alias => normalizedValue.includes(alias))) {
        return true;
      }
    }
    
    return false;
  });
}

function matchesLocation(value: string, filter: string | string[] | undefined): boolean {
  if (!filter || (Array.isArray(filter) && filter.length === 0)) {
    return true;
  }
  
  const normalizedValue = normalizeString(value);
  const filters = Array.isArray(filter) ? filter : [filter];
  
  return filters.some(f => {
    const normalizedFilter = normalizeString(f);
    
    // Direct match
    if (normalizedValue.includes(normalizedFilter) || normalizedFilter.includes(normalizedValue)) {
      return true;
    }
    
    // Check aliases
    for (const [location, aliases] of Object.entries(LOCATION_ALIASES)) {
      if (normalizedValue.includes(location)) {
        // Value is this location, check if filter matches any alias
        if (aliases.some(alias => normalizedFilter.includes(alias))) {
          return true;
        }
      }
    }
    
    return false;
  });
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

function matchesHeadcount(personHeadcount: string, filterHeadcount: string | string[] | undefined): boolean {
  if (!filterHeadcount || (Array.isArray(filterHeadcount) && filterHeadcount.length === 0)) {
    return true;
  }
  
  const filters = Array.isArray(filterHeadcount) ? filterHeadcount : [filterHeadcount];
  
  return filters.some(filter => {
    const filterLower = normalizeString(filter);
    
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
  });
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

export function searchPeople(filters: SimpleSearchFilters): Person[] {
  return mockPeople.filter(person => {
    // Match job title
    if (!matchesFilter(person.title, filters.jobTitle)) {
      return false;
    }
    
    // Match location (use flexible location matching)
    if (!matchesLocation(person.location, filters.location)) {
      return false;
    }
    
    // Match industry (use flexible industry matching)
    if (!matchesIndustry(person.industry, filters.industry)) {
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

export function searchCompanies(filters: SimpleSearchFilters): Company[] {
  return mockCompanies.filter(company => {
    // Match industry (use flexible industry matching)
    if (!matchesIndustry(company.industry, filters.industry)) {
      return false;
    }
    
    // Match location (use flexible location matching)
    if (!matchesLocation(company.location, filters.location)) {
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

export function search(filters: SimpleSearchFilters): SearchResult {
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
