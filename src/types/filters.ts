// Filter confidence types
export type ConfidenceType = 'DIRECT' | 'GUESS';

// Generic filter field with confidence tracking
export interface FilterField<T> {
  value: T;
  confidence: ConfidenceType;
  source?: string; // Explanation of where this value came from
}

// Search filters structure
export interface SearchFilters {
  titles?: FilterField<string[]>;
  locations?: FilterField<string[]>;
  industries?: FilterField<string[]>;
  seniorities?: FilterField<string[]>;
  companyHeadcount?: FilterField<string[]>;
  yearsOfExperience?: FilterField<{ min?: number; max?: number }>;
  skills?: FilterField<string[]>;
  companies?: FilterField<string[]>;
}

// Search metadata
export interface SearchMeta {
  domain: 'person' | 'company';
  isNewSearch: boolean;
  completenessScore: number;
  missingFields: string[];
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
}

// Complete search result
export interface SearchResult {
  filters: SearchFilters;
  meta: SearchMeta;
  rawQuery: string;
  rewrittenQuery?: string;
}

// Filter display helpers
export const FILTER_FIELD_LABELS: Record<keyof SearchFilters, string> = {
  titles: 'Job Titles',
  locations: 'Locations',
  industries: 'Industries',
  seniorities: 'Seniority Levels',
  companyHeadcount: 'Company Size',
  yearsOfExperience: 'Experience',
  skills: 'Skills',
  companies: 'Companies'
};

export const FILTER_FIELD_LABELS_CN: Record<keyof SearchFilters, string> = {
  titles: '职位',
  locations: '地点',
  industries: '行业',
  seniorities: '级别',
  companyHeadcount: '公司规模',
  yearsOfExperience: '工作经验',
  skills: '技能',
  companies: '公司'
};
