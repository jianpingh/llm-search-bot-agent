import { AgentStateType } from '../state';
import { SearchFilters, SearchMeta } from '@/types';

// Minimum number of filters for a complete search
const MINIMUM_FILTERS_COUNT = 2;

// Recommended fields by domain
const RECOMMENDED_FIELDS: Record<string, (keyof SearchFilters)[]> = {
  person: ['titles', 'locations', 'industries'],
  company: ['industries', 'locations', 'companyHeadcount']
};

// Field importance weights for completeness calculation
const FIELD_IMPORTANCE: Record<keyof SearchFilters, number> = {
  titles: 3,
  locations: 2,
  industries: 2,
  seniorities: 1,
  companyHeadcount: 1,
  yearsOfExperience: 1,
  skills: 1,
  companies: 2
};

export function checkCompleteness(state: AgentStateType): Partial<AgentStateType> {
  const filters = state.currentFilters;
  const domain = state.meta.domain;
  const skipFields = state.skipFields || [];
  
  // Get filled fields
  const filledFields = Object.keys(filters).filter(
    key => {
      const field = filters[key as keyof SearchFilters];
      return field?.value !== undefined && 
             (Array.isArray(field.value) ? field.value.length > 0 : true);
    }
  );
  
  // Calculate completeness score
  const maxScore = Object.values(FIELD_IMPORTANCE).reduce((a, b) => a + b, 0);
  const currentScore = filledFields.reduce(
    (score, field) => score + (FIELD_IMPORTANCE[field as keyof SearchFilters] || 0),
    0
  );
  const completenessScore = Math.min(100, Math.round((currentScore / maxScore) * 100));
  
  // Find missing recommended fields
  const recommendedForDomain = RECOMMENDED_FIELDS[domain] || RECOMMENDED_FIELDS.person;
  const missingFields = recommendedForDomain.filter(
    field => {
      // Field is missing if not filled AND not in skip list
      const isFilled = filledFields.includes(field);
      const isSkipped = skipFields.includes(field);
      return !isFilled && !isSkipped;
    }
  );
  
  // Determine if clarification is needed
  // Only ask for clarification if:
  // 1. Less than minimum filters
  // 2. OR important fields are missing (and not skipped)
  // 3. AND completeness is low
  const needsClarification = 
    (filledFields.length < MINIMUM_FILTERS_COUNT || 
     (missingFields.length > 0 && completenessScore < 60)) &&
    missingFields.length > 0;
  
  // Generate clarification question if needed
  let clarificationQuestion: string | undefined;
  if (needsClarification && missingFields.length > 0) {
    clarificationQuestion = generateClarificationQuestion(missingFields, domain, filters);
  }
  
  return {
    meta: {
      ...state.meta,
      completenessScore,
      missingFields,
      clarificationNeeded: needsClarification,
      clarificationQuestion,
    },
    needsClarification,
  };
}

function generateClarificationQuestion(
  missingFields: string[],
  domain: string,
  currentFilters: SearchFilters
): string {
  const fieldDescriptions: Record<string, { en: string; cn: string; examples: string }> = {
    titles: { 
      en: 'specific job titles', 
      cn: '具体职位',
      examples: 'e.g., "CTO", "Software Engineer", "Product Manager"'
    },
    locations: { 
      en: 'geographic locations', 
      cn: '地理位置',
      examples: 'e.g., "Singapore", "New York", "Europe"'
    },
    industries: { 
      en: 'industry sectors', 
      cn: '行业领域',
      examples: 'e.g., "Technology", "Finance", "Healthcare"'
    },
    seniorities: { 
      en: 'seniority levels', 
      cn: '职位级别',
      examples: 'e.g., "Senior", "Director", "VP"'
    },
    companyHeadcount: { 
      en: 'company size', 
      cn: '公司规模',
      examples: 'e.g., "startup", "mid-size", "enterprise"'
    },
    yearsOfExperience: { 
      en: 'years of experience', 
      cn: '工作经验',
      examples: 'e.g., "5+ years", "3-5 years"'
    },
    skills: { 
      en: 'specific skills', 
      cn: '技能要求',
      examples: 'e.g., "Python", "Machine Learning"'
    },
    companies: { 
      en: 'specific companies', 
      cn: '特定公司',
      examples: 'e.g., "Google", "startups"'
    }
  };
  
  // Prioritize which field to ask about
  const priorityOrder: (keyof SearchFilters)[] = ['locations', 'industries', 'titles', 'seniorities'];
  const fieldToAsk = priorityOrder.find(f => missingFields.includes(f)) || missingFields[0];
  
  const fieldInfo = fieldDescriptions[fieldToAsk];
  if (!fieldInfo) {
    return `Could you provide more details for your search?`;
  }
  
  // Build question based on current context
  const hasTitle = currentFilters.titles?.value;
  
  if (fieldToAsk === 'locations' && hasTitle) {
    return `To narrow down the search, which location(s) are you interested in? (${fieldInfo.examples}) Or you can say "any location" if you don't have a preference.`;
  }
  
  if (fieldToAsk === 'industries' && hasTitle) {
    return `What industry should I focus on? (${fieldInfo.examples}) Or say "any industry" if it doesn't matter.`;
  }
  
  // Generic question
  return `Could you specify ${fieldInfo.en}? (${fieldInfo.examples}) Or say "any" if you don't have a preference.`;
}

// Check if a response indicates "any" or "no preference"
export function isAnyResponse(input: string): boolean {
  const anyPatterns = [
    /^any/i,
    /doesn'?t?\s*matter/i,
    /don'?t\s*care/i,
    /no\s*preference/i,
    /anywhere/i,
    /whatever/i,
    /all\s*(of them|locations?|industries?)?$/i,
    /^ok$/i,
    /^fine$/i,
    /都行/,
    /无所谓/,
    /随便/,
    /没关系/,
    /都可以/,
    /不限/,
    /任意/,
  ];
  
  return anyPatterns.some(pattern => pattern.test(input.trim()));
}

// Detect which field user is responding about
export function detectFieldFromResponse(input: string, lastAskedField?: string): string | undefined {
  const fieldPatterns: Record<string, RegExp[]> = {
    locations: [/location/i, /place/i, /city/i, /country/i, /region/i, /地点/, /地方/, /位置/],
    industries: [/industry/i, /sector/i, /field/i, /行业/, /领域/],
    seniorities: [/seniority/i, /level/i, /experience/i, /级别/],
    companyHeadcount: [/company\s*size/i, /headcount/i, /公司规模/],
  };
  
  for (const [field, patterns] of Object.entries(fieldPatterns)) {
    if (patterns.some(p => p.test(input))) {
      return field;
    }
  }
  
  // Default to last asked field
  return lastAskedField;
}
