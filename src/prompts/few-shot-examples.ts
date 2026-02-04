// Few-shot examples for filter extraction
export const FILTER_EXTRACTION_EXAMPLES = [
  // Simple query example
  {
    input: "Find CTOs in Singapore",
    output: {
      filters: {
        titles: {
          value: ["CTO", "Chief Technology Officer"],
          confidence: "DIRECT",
          source: "User explicitly mentioned CTO"
        },
        locations: {
          value: ["Singapore"],
          confidence: "DIRECT",
          source: "User explicitly mentioned Singapore"
        }
      },
      domain: "person"
    }
  },
  
  // Complex query example
  {
    input: "Find senior engineers at startups in tech industry",
    output: {
      filters: {
        titles: {
          value: ["Software Engineer", "Senior Engineer", "Staff Engineer", "Senior Software Engineer"],
          confidence: "DIRECT",
          source: "User mentioned engineers"
        },
        seniorities: {
          value: ["Senior", "Staff", "Principal"],
          confidence: "DIRECT",
          source: "User specified senior level"
        },
        companyHeadcount: {
          value: ["1-10", "11-50", "51-200"],
          confidence: "GUESS",
          source: "Inferred from 'startups' - typically smaller companies"
        },
        industries: {
          value: ["Technology", "Computer Software", "IT Services", "Internet"],
          confidence: "DIRECT",
          source: "User mentioned tech industry"
        }
      },
      domain: "person"
    }
  },
  
  // Ambiguous query example
  {
    input: "Find tech leaders in Europe",
    output: {
      filters: {
        titles: {
          value: ["CTO", "VP of Engineering", "Engineering Director", "Tech Lead", "Head of Engineering", "Chief Technology Officer"],
          confidence: "GUESS",
          source: "Expanded from ambiguous term 'tech leaders'"
        },
        locations: {
          value: ["United Kingdom", "Germany", "France", "Netherlands", "Spain", "Italy", "Sweden", "Switzerland"],
          confidence: "GUESS",
          source: "Expanded from 'Europe' to major European tech hubs"
        }
      },
      domain: "person",
      clarificationSuggestion: "The term 'tech leaders' is ambiguous. Would you like to specify particular roles?"
    }
  },
  
  // Company search example
  {
    input: "Find AI startups in Singapore",
    output: {
      filters: {
        industries: {
          value: ["Artificial Intelligence", "Machine Learning", "Deep Learning", "AI"],
          confidence: "DIRECT",
          source: "User mentioned AI"
        },
        locations: {
          value: ["Singapore"],
          confidence: "DIRECT",
          source: "User explicitly mentioned Singapore"
        },
        companyHeadcount: {
          value: ["1-10", "11-50", "51-200"],
          confidence: "GUESS",
          source: "Inferred from 'startups'"
        }
      },
      domain: "company"
    }
  },
  
  // Experience query example
  {
    input: "Find marketing directors with 5+ years experience in Europe",
    output: {
      filters: {
        titles: {
          value: ["Marketing Director", "Director of Marketing", "Head of Marketing"],
          confidence: "DIRECT",
          source: "User mentioned marketing directors"
        },
        yearsOfExperience: {
          value: { min: 5 },
          confidence: "DIRECT",
          source: "User specified 5+ years"
        },
        locations: {
          value: ["United Kingdom", "Germany", "France", "Netherlands", "Spain", "Italy"],
          confidence: "GUESS",
          source: "Expanded from 'Europe' to major countries"
        }
      },
      domain: "person"
    }
  },
  
  // Cross-domain query example
  {
    input: "Who are the CTOs at these companies?",
    context: {
      previousDomain: "company",
      previousFilters: {
        industries: { value: ["Artificial Intelligence"], confidence: "DIRECT" },
        locations: { value: ["Singapore"], confidence: "DIRECT" }
      }
    },
    output: {
      filters: {
        titles: {
          value: ["CTO", "Chief Technology Officer"],
          confidence: "DIRECT",
          source: "User explicitly asked for CTOs"
        },
        industries: {
          value: ["Artificial Intelligence"],
          confidence: "DIRECT",
          source: "Inherited from previous company search context"
        },
        locations: {
          value: ["Singapore"],
          confidence: "DIRECT",
          source: "Inherited from previous company search context"
        }
      },
      domain: "person",
      crossDomainPivot: true
    }
  }
];

// Few-shot examples for intent classification
export const INTENT_CLASSIFICATION_EXAMPLES = [
  {
    context: "User previously searched for: CTOs in Singapore",
    input: "in Tokyo",
    output: {
      type: "modify",
      confidence: 0.95,
      explanation: "User is changing the location while keeping other filters"
    }
  },
  {
    context: "User previously searched for: Engineers in London",
    input: "Find designers in New York",
    output: {
      type: "new_search",
      confidence: 0.9,
      explanation: "User is starting a completely new search with different criteria"
    }
  },
  {
    context: "User previously searched for: Engineers",
    input: "also in San Francisco",
    output: {
      type: "refine",
      confidence: 0.95,
      explanation: "User is adding additional conditions to existing search (keyword: also)"
    }
  },
  {
    context: "User previously searched for: Engineers",
    input: "and in tech industry",
    output: {
      type: "refine",
      confidence: 0.95,
      explanation: "User is adding additional conditions to existing search (keyword: and)"
    }
  },
  {
    context: "User previously searched for: AI startups in Singapore",
    input: "Who are the CTOs at these companies?",
    output: {
      type: "cross_domain",
      confidence: 0.95,
      explanation: "User is pivoting from company search to person search using previous context"
    }
  },
  {
    context: "Agent asked: Could you specify the location?",
    input: "Any location is fine",
    output: {
      type: "confirm",
      confidence: 0.85,
      explanation: "User is accepting the search without location constraint"
    }
  },
  {
    context: "Agent asked: I found these filters, shall I search?",
    input: "Yes, go ahead",
    output: {
      type: "confirm",
      confidence: 0.95,
      explanation: "User is confirming the search"
    }
  },
  {
    context: "Agent presented filters",
    input: "No, change the location to Tokyo",
    output: {
      type: "modify",
      confidence: 0.9,
      explanation: "User rejected and wants to modify location"
    }
  }
];

// Format examples for prompt injection
export function formatFewShotExamples(examples: Record<string, unknown>[]): string {
  return examples.map((ex, i) => `
Example ${i + 1}:
Input: "${ex.input}"
${ex.context ? `Context: ${JSON.stringify(ex.context, null, 2)}` : ''}
Output: ${JSON.stringify(ex.output, null, 2)}
`).join('\n---\n');
}

// Query expansion mappings for common terms
export const QUERY_EXPANSIONS: Record<string, string[]> = {
  // Title expansions
  "tech leaders": ["CTO", "VP of Engineering", "Engineering Director", "Tech Lead", "Head of Engineering", "Chief Technology Officer"],
  "tech bros": ["Software Engineer", "Developer", "Tech Lead", "Full Stack Developer"],
  "engineers": ["Software Engineer", "Backend Engineer", "Frontend Engineer", "Full Stack Engineer", "DevOps Engineer"],
  "developers": ["Software Developer", "Web Developer", "Full Stack Developer", "Backend Developer", "Frontend Developer"],
  "product people": ["Product Manager", "Senior Product Manager", "Head of Product", "VP of Product", "Chief Product Officer"],
  "designers": ["UX Designer", "UI Designer", "Product Designer", "Design Lead", "Head of Design"],
  "sales people": ["Sales Representative", "Account Executive", "Sales Manager", "VP of Sales", "Head of Sales"],
  "marketers": ["Marketing Manager", "Digital Marketing Manager", "Head of Marketing", "VP of Marketing", "CMO"],
  
  // Company expansions
  "big tech": ["Google", "Apple", "Microsoft", "Amazon", "Meta", "Netflix"],
  "faang": ["Facebook", "Meta", "Apple", "Amazon", "Netflix", "Google"],
  "startups": ["1-10", "11-50", "51-200"], // headcount
  "enterprise": ["1001-5000", "5001-10000", "10001+"], // headcount
  
  // Location expansions
  "europe": ["United Kingdom", "Germany", "France", "Netherlands", "Spain", "Italy", "Sweden", "Switzerland", "Ireland"],
  "asia": ["Singapore", "Japan", "South Korea", "China", "India", "Hong Kong", "Taiwan"],
  "southeast asia": ["Singapore", "Malaysia", "Thailand", "Indonesia", "Vietnam", "Philippines"],
  "north america": ["United States", "Canada"],
  "bay area": ["San Francisco", "San Jose", "Palo Alto", "Mountain View", "Sunnyvale"],
  
  // Industry expansions
  "tech industry": ["Technology", "Computer Software", "IT Services", "Internet", "Information Technology"],
  "finance": ["Financial Services", "Banking", "Investment Banking", "Fintech", "Insurance"],
  "healthcare": ["Healthcare", "Hospital & Health Care", "Medical Devices", "Pharmaceuticals", "Biotechnology"]
};

// Seniority level mappings
export const SENIORITY_LEVELS: Record<string, string[]> = {
  "junior": ["Junior", "Entry Level", "Associate"],
  "mid": ["Mid-Level", "Intermediate"],
  "senior": ["Senior", "Staff", "Principal"],
  "lead": ["Lead", "Staff", "Principal"],
  "manager": ["Manager", "Senior Manager"],
  "director": ["Director", "Senior Director"],
  "vp": ["VP", "Vice President", "SVP", "Senior Vice President"],
  "c-level": ["C-Level", "Chief", "CTO", "CEO", "CFO", "CMO", "COO", "CIO"]
};
