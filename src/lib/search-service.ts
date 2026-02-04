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
  'technology': ['tech', 'software', 'it', 'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning', 'data science', 'cloud', 'saas', 'computer', '科技', '技术', '互联网'],
  'finance': ['fintech', 'banking', 'financial', 'investment', 'trading', 'insurance', '金融', '银行', '投资'],
  'healthcare': ['health', 'medical', 'biotech', 'pharma', 'hospital', 'clinic', '医疗', '健康', '生物'],
  'e-commerce': ['ecommerce', 'retail', 'shopping', 'marketplace', '电商', '零售'],
  'education': ['edtech', 'learning', 'school', 'university', 'training', '教育', '培训'],
  'retail': ['shopping', 'store', 'consumer', 'fashion', '零售', '消费'],
};

// Location aliases for flexible matching (city -> country/region names)
const LOCATION_ALIASES: Record<string, string[]> = {
  'london': ['uk', 'united kingdom', 'britain', 'england', 'europe', '英国', '伦敦', '欧洲'],
  'berlin': ['germany', 'deutschland', 'europe', '德国', '柏林', '欧洲'],
  'munich': ['germany', 'deutschland', 'europe', '德国', '慕尼黑', '欧洲'],
  'paris': ['france', 'europe', '法国', '巴黎', '欧洲'],
  'milan': ['italy', 'italia', 'europe', '意大利', '米兰', '欧洲'],
  'barcelona': ['spain', 'españa', 'europe', '西班牙', '巴塞罗那', '欧洲'],
  'dublin': ['ireland', 'europe', '爱尔兰', '都柏林', '欧洲'],
  'helsinki': ['finland', 'europe', 'nordic', '芬兰', '赫尔辛基', '欧洲', '北欧'],
  'amsterdam': ['netherlands', 'holland', 'europe', '荷兰', '阿姆斯特丹', '欧洲'],
  'stockholm': ['sweden', 'europe', 'nordic', '瑞典', '斯德哥尔摩', '欧洲', '北欧'],
  'zurich': ['switzerland', 'swiss', 'europe', '瑞士', '苏黎世', '欧洲'],
  'singapore': ['sg', 'asia', '新加坡', '亚洲'],
  'tokyo': ['japan', 'asia', '日本', '东京', '亚洲'],
  'new york': ['usa', 'united states', 'america', 'ny', 'nyc', '美国', '纽约'],
  'san francisco': ['usa', 'united states', 'america', 'sf', 'bay area', 'silicon valley', '美国', '旧金山', '硅谷'],
  'seattle': ['usa', 'united states', 'america', '美国', '西雅图'],
  'boston': ['usa', 'united states', 'america', '美国', '波士顿'],
  'austin': ['usa', 'united states', 'america', 'texas', '美国', '奥斯汀'],
  'sydney': ['australia', '澳大利亚', '悉尼'],
  'hong kong': ['hk', 'asia', '香港', '亚洲'],
  'seoul': ['korea', 'south korea', 'asia', '韩国', '首尔', '亚洲'],
  'menlo park': ['usa', 'united states', 'america', 'silicon valley', '美国', '硅谷'],
  'mountain view': ['usa', 'united states', 'america', 'silicon valley', '美国', '硅谷'],
};

// Job title aliases for flexible matching (English title -> Chinese/alternative names)
const JOB_TITLE_ALIASES: Record<string, string[]> = {
  'product manager': ['pm', '产品经理', '产品管理', 'product management'],
  'senior product manager': ['senior pm', '高级产品经理', '资深产品经理'],
  'software engineer': ['swe', 'developer', 'programmer', '软件工程师', '开发工程师', '程序员'],
  'senior software engineer': ['senior swe', 'senior developer', '高级软件工程师', '高级开发'],
  'cto': ['chief technology officer', '首席技术官', '技术总监'],
  'ceo': ['chief executive officer', '首席执行官', '总裁'],
  'cfo': ['chief financial officer', '首席财务官', '财务总监'],
  'vp of engineering': ['vp engineering', 'engineering vp', '工程副总裁', '技术副总裁'],
  'data scientist': ['data science', '数据科学家', '数据分析师'],
  'ml engineer': ['machine learning engineer', '机器学习工程师', 'ai engineer', 'ai工程师'],
  'designer': ['ui designer', 'ux designer', '设计师', '产品设计师'],
  'marketing': ['marketing manager', 'marketing director', '市场经理', '市场总监'],
};

function matchesJobTitle(value: string, filter: string | string[] | undefined): boolean {
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
    for (const [title, aliases] of Object.entries(JOB_TITLE_ALIASES)) {
      // If value contains this title, check if filter matches any alias
      if (normalizedValue.includes(title)) {
        if (aliases.some(alias => normalizedFilter.includes(alias))) {
          return true;
        }
      }
      // If filter matches title or any alias, check if value contains this title
      if (normalizedFilter.includes(title) || aliases.some(alias => normalizedFilter.includes(alias))) {
        if (normalizedValue.includes(title)) {
          return true;
        }
      }
    }
    
    return false;
  });
}

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
    // Match job title (use flexible job title matching)
    if (!matchesJobTitle(person.title, filters.jobTitle)) {
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

export function search(filters: SimpleSearchFilters, domain: 'person' | 'company' = 'person'): SearchResult {
  // Search based on domain
  if (domain === 'company') {
    const companies = searchCompanies(filters);
    return {
      people: [],
      companies,
      totalPeople: 0,
      totalCompanies: companies.length,
    };
  }
  
  // Default: search people
  const people = searchPeople(filters);
  return {
    people,
    companies: [],
    totalPeople: people.length,
    totalCompanies: 0,
  };
}

export function formatSearchResults(result: SearchResult): string {
  const parts: string[] = [];
  
  if (result.totalPeople > 0) {
    parts.push(`🔍 **Search Complete! Found ${result.totalPeople} matching candidates:**\n`);
    result.people.slice(0, 10).forEach((person, index) => {
      parts.push(`**${index + 1}. ${person.name}** - ${person.title} @ ${person.company}`);
      parts.push(`   - 📍 Location: ${person.location}`);
      parts.push(`   - 🏢 Industry: ${person.industry}`);
      parts.push(`   - 👔 Seniority: ${person.seniority}`);
      parts.push(`   - 📊 Company Size: ${person.companyHeadcount}`);
      parts.push(`   - ⏱️ Experience: ${person.yearsOfExperience} years`);
      parts.push(`   - 🔧 Skills: ${person.skills.join(', ')}\n`);
    });
    
    if (result.totalPeople > 10) {
      parts.push(`\n... and ${result.totalPeople - 10} more candidates`);
    }
  }
  
  if (result.totalCompanies > 0) {
    parts.push(`\n**Found ${result.totalCompanies} matching companies:**\n`);
    result.companies.slice(0, 5).forEach((company, index) => {
      parts.push(`**${index + 1}. ${company.name}**`);
      parts.push(`   - 🏢 Industry: ${company.industry}`);
      parts.push(`   - 📍 Location: ${company.location}`);
      parts.push(`   - 📊 Size: ${company.headcount}`);
      parts.push(`   - 🏷️ Type: ${company.type}\n`);
    });
  }
  
  if (result.totalPeople === 0 && result.totalCompanies === 0) {
    parts.push('😔 **No matching results found**\n\nSuggestions:\n- Try broadening your search criteria\n- Check if location or industry is correct\n- Use more general job titles');
  }
  
  return parts.join('\n');
}
