import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentStateType, inheritFiltersForCrossDomain } from '../state';
import { FILTER_EXTRACTION_SYSTEM_PROMPT } from '@/prompts';
import { SearchFilters } from '@/types';

export async function extractFilters(
  state: AgentStateType,
  llm: ChatOpenAI
): Promise<Partial<AgentStateType>> {
  const userInput = state.userInput;
  const intent = state.intent;
  const currentFilters = state.currentFilters;
  const previousContext = state.previousContext;
  
  // Build context based on intent
  let contextInfo = '';
  
  if (intent?.type === 'refine' || intent?.type === 'modify') {
    if (Object.keys(currentFilters).length > 0) {
      contextInfo = `IMPORTANT: User is ${intent.type === 'refine' ? 'adding to' : 'modifying'} existing search.
Current filters: ${JSON.stringify(currentFilters, null, 2)}

${intent.type === 'refine' ? 'MERGE the new conditions with existing filters.' : 'REPLACE the specific field being modified.'}`;
    }
  } else if (intent?.type === 'cross_domain' && previousContext) {
    contextInfo = `IMPORTANT: User is pivoting from ${previousContext.domain} search to a new domain.
Previous ${previousContext.domain} search context: ${JSON.stringify(previousContext.filters, null, 2)}

Inherit relevant fields (locations, industries) from previous context if applicable.`;
  }
  
  const prompt = `${contextInfo ? contextInfo + '\n\n' : ''}User query: "${userInput}"`;
  
  try {
    const response = await llm.invoke([
      new SystemMessage(FILTER_EXTRACTION_SYSTEM_PROMPT),
      new HumanMessage(prompt)
    ]);
    
    const content = response.content as string;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      let newFilters: SearchFilters;
      const extractedFilters = normalizeFilters(parsed.filters);
      
      switch (intent?.type) {
        case 'new_search':
          // New search: use only extracted filters
          newFilters = extractedFilters;
          break;
          
        case 'modify':
          // Modify: replace specific fields, keep others
          newFilters = mergeFiltersReplace(currentFilters, extractedFilters);
          break;
          
        case 'cross_domain':
          // Cross-domain: inherit relevant context + extracted
          if (previousContext) {
            const inherited = inheritFiltersForCrossDomain(
              previousContext.filters,
              parsed.domain || 'person'
            );
            newFilters = mergeFiltersReplace(inherited, extractedFilters);
          } else {
            newFilters = extractedFilters;
          }
          break;
          
        case 'refine':
        default:
          // Refine: merge filters
          newFilters = mergeFiltersDeep(currentFilters, extractedFilters);
          break;
      }
      
      // Determine domain: for refine/modify, keep original domain; for new_search/cross_domain, use parsed
      let newDomain: 'person' | 'company';
      if (intent?.type === 'refine' || intent?.type === 'modify') {
        // Keep the original domain when refining or modifying
        newDomain = state.meta.domain;
      } else if (intent?.type === 'cross_domain') {
        // Cross-domain explicitly changes domain
        newDomain = parsed.domain || 'person';
      } else {
        // New search uses parsed domain
        newDomain = parsed.domain || 'person';
      }
      
      return {
        currentFilters: newFilters,
        meta: {
          ...state.meta,
          domain: newDomain,
          isNewSearch: intent?.type === 'new_search',
        },
      };
    }
  } catch (e) {
    console.error('Failed to extract filters:', e);
  }
  
  return {};
}

// Normalize filter structure from LLM response
function normalizeFilters(filters: Record<string, unknown> | undefined): SearchFilters {
  if (!filters) return {};
  
  const normalized: SearchFilters = {};
  
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue;
    
    // Handle different value formats
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const filterValue = value as Record<string, unknown>;
      
      if ('value' in filterValue) {
        // Already in correct format with value property
        assignFilter(normalized, key, {
          value: filterValue.value,
          confidence: (filterValue.confidence as 'DIRECT' | 'GUESS') || 'DIRECT',
          source: filterValue.source as string | undefined,
        });
      } else if ('min' in filterValue || 'max' in filterValue) {
        // Experience range without wrapper
        assignFilter(normalized, key, {
          value: { min: filterValue.min as number | undefined, max: filterValue.max as number | undefined },
          confidence: 'DIRECT',
        });
      }
    } else if (Array.isArray(value)) {
      // Plain array, wrap it
      assignFilter(normalized, key, {
        value: value as string[],
        confidence: 'DIRECT',
      });
    }
  }
  
  return normalized;
}

// Helper to assign filter with proper typing
function assignFilter(
  filters: SearchFilters,
  key: string,
  field: { value: unknown; confidence: 'DIRECT' | 'GUESS'; source?: string }
): void {
  switch (key) {
    case 'titles':
      if (Array.isArray(field.value)) {
        filters.titles = { value: field.value as string[], confidence: field.confidence, source: field.source };
      }
      break;
    case 'locations':
      if (Array.isArray(field.value)) {
        filters.locations = { value: field.value as string[], confidence: field.confidence, source: field.source };
      }
      break;
    case 'industries':
      if (Array.isArray(field.value)) {
        filters.industries = { value: field.value as string[], confidence: field.confidence, source: field.source };
      }
      break;
    case 'seniorities':
      if (Array.isArray(field.value)) {
        filters.seniorities = { value: field.value as string[], confidence: field.confidence, source: field.source };
      }
      break;
    case 'companyHeadcount':
      if (Array.isArray(field.value)) {
        filters.companyHeadcount = { value: field.value as string[], confidence: field.confidence, source: field.source };
      }
      break;
    case 'skills':
      if (Array.isArray(field.value)) {
        filters.skills = { value: field.value as string[], confidence: field.confidence, source: field.source };
      }
      break;
    case 'companies':
      if (Array.isArray(field.value)) {
        filters.companies = { value: field.value as string[], confidence: field.confidence, source: field.source };
      }
      break;
    case 'yearsOfExperience':
      if (typeof field.value === 'object' && field.value !== null) {
        filters.yearsOfExperience = {
          value: field.value as { min?: number; max?: number },
          confidence: field.confidence,
          source: field.source,
        };
      }
      break;
  }
}

// Replace specific fields
function mergeFiltersReplace(current: SearchFilters, update: SearchFilters): SearchFilters {
  const merged: SearchFilters = { ...current };
  
  if (update.titles) merged.titles = update.titles;
  if (update.locations) merged.locations = update.locations;
  if (update.industries) merged.industries = update.industries;
  if (update.seniorities) merged.seniorities = update.seniorities;
  if (update.companyHeadcount) merged.companyHeadcount = update.companyHeadcount;
  if (update.yearsOfExperience) merged.yearsOfExperience = update.yearsOfExperience;
  if (update.skills) merged.skills = update.skills;
  if (update.companies) merged.companies = update.companies;
  
  return merged;
}

// Deep merge filters, combining arrays
function mergeFiltersDeep(current: SearchFilters, update: SearchFilters): SearchFilters {
  const merged: SearchFilters = { ...current };
  
  // Helper to merge array fields
  const mergeArrayField = <K extends 'titles' | 'locations' | 'industries' | 'seniorities' | 'companyHeadcount' | 'skills' | 'companies'>(
    fieldName: K
  ) => {
    const currentField = current[fieldName];
    const updateField = update[fieldName];
    
    if (updateField) {
      if (currentField) {
        const mergedValues = [...new Set([...currentField.value, ...updateField.value])];
        merged[fieldName] = {
          value: mergedValues,
          confidence: updateField.confidence,
          source: updateField.source || currentField.source,
        };
      } else {
        merged[fieldName] = updateField;
      }
    }
  };
  
  mergeArrayField('titles');
  mergeArrayField('locations');
  mergeArrayField('industries');
  mergeArrayField('seniorities');
  mergeArrayField('companyHeadcount');
  mergeArrayField('skills');
  mergeArrayField('companies');
  
  // Handle yearsOfExperience separately (not an array)
  if (update.yearsOfExperience) {
    merged.yearsOfExperience = update.yearsOfExperience;
  }
  
  return merged;
}
