'use client';

import { SearchFilters, SearchMeta, ConfidenceType, FILTER_FIELD_LABELS_CN } from '@/types';

interface FilterDisplayProps {
  filters: SearchFilters;
  meta?: SearchMeta;
  compact?: boolean;
}

const FIELD_LABELS: Record<keyof SearchFilters, string> = {
  titles: 'Job Titles',
  locations: 'Locations',
  industries: 'Industries',
  seniorities: 'Seniority',
  companyHeadcount: 'Company Size',
  yearsOfExperience: 'Experience',
  skills: 'Skills',
  companies: 'Companies',
};

function ConfidenceBadge({ confidence }: { confidence: ConfidenceType }) {
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
        confidence === 'DIRECT'
          ? 'bg-green-100 text-green-700'
          : 'bg-amber-100 text-amber-700'
      }`}
    >
      {confidence === 'DIRECT' ? 'Explicit' : 'Inferred'}
    </span>
  );
}

export default function FilterDisplay({ filters, meta, compact = false }: FilterDisplayProps) {
  const entries = Object.entries(filters).filter(
    ([_, field]) => field?.value !== undefined
  );
  
  if (entries.length === 0) {
    return null;
  }
  
  return (
    <div className={compact ? 'text-sm' : ''}>
      {/* Header */}
      <div className={`font-medium flex items-center gap-2 ${compact ? 'mb-2' : 'mb-3'}`}>
        <span>📋</span>
        <span>Search Filters</span>
        {meta && (
          <span className="text-xs font-normal text-gray-500">
            ({meta.completenessScore}% complete)
          </span>
        )}
      </div>
      
      {/* Filter list */}
      <ul className={`space-y-${compact ? '1.5' : '2'}`}>
        {entries.map(([key, field]) => {
          if (!field) return null;
          
          const label = FIELD_LABELS[key as keyof SearchFilters] || key;
          let displayValue: string;
          
          if (Array.isArray(field.value)) {
            displayValue = field.value.join(', ');
          } else if (typeof field.value === 'object' && field.value !== null) {
            // Handle yearsOfExperience
            const exp = field.value as { min?: number; max?: number };
            if (exp.min !== undefined && exp.max !== undefined) {
              displayValue = `${exp.min}-${exp.max} years`;
            } else if (exp.min !== undefined) {
              displayValue = `${exp.min}+ years`;
            } else if (exp.max !== undefined) {
              displayValue = `Up to ${exp.max} years`;
            } else {
              displayValue = 'Any';
            }
          } else {
            displayValue = String(field.value);
          }
          
          return (
            <li key={key} className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              <span className="font-medium text-gray-600 min-w-[80px]">{label}:</span>
              <span className="flex-1 text-gray-800">{displayValue}</span>
              <ConfidenceBadge confidence={field.confidence} />
            </li>
          );
        })}
      </ul>
      
      {/* Meta info */}
      {meta && !compact && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Domain: {meta.domain}</span>
            {meta.isNewSearch && <span className="text-blue-600">New search</span>}
          </div>
          {meta.missingFields.length > 0 && (
            <div className="mt-1 text-amber-600">
              Missing: {meta.missingFields.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
