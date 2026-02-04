// Mock data for testing search functionality

export interface Person {
  id: string;
  name: string;
  title: string;
  seniority: string;
  location: string;
  industry: string;
  company: string;
  companyHeadcount: string;
  yearsOfExperience: number;
  skills: string[];
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  headcount: string;
  type: string;
}

export const mockPeople: Person[] = [
  // CTOs in Singapore
  { id: '1', name: 'John Chen', title: 'CTO', seniority: 'C-Level', location: 'Singapore', industry: 'Technology', company: 'TechVentures SG', companyHeadcount: '51-200', yearsOfExperience: 15, skills: ['AI', 'Cloud', 'Leadership'] },
  { id: '2', name: 'Sarah Tan', title: 'Chief Technology Officer', seniority: 'C-Level', location: 'Singapore', industry: 'Finance', company: 'FinTech Asia', companyHeadcount: '201-500', yearsOfExperience: 12, skills: ['FinTech', 'Blockchain', 'Security'] },
  { id: '3', name: 'Michael Wong', title: 'CTO', seniority: 'C-Level', location: 'Singapore', industry: 'Finance', company: 'PayNow Global', companyHeadcount: '11-50', yearsOfExperience: 10, skills: ['Payments', 'Mobile', 'API'] },
  
  // CTOs in Tokyo
  { id: '4', name: 'Yuki Tanaka', title: 'CTO', seniority: 'C-Level', location: 'Tokyo', industry: 'Technology', company: 'AI Labs Japan', companyHeadcount: '51-200', yearsOfExperience: 18, skills: ['AI', 'Robotics', 'ML'] },
  { id: '5', name: 'Kenji Yamamoto', title: 'Chief Technology Officer', seniority: 'C-Level', location: 'Tokyo', industry: 'E-commerce', company: 'ShopTech JP', companyHeadcount: '201-500', yearsOfExperience: 14, skills: ['E-commerce', 'Scalability', 'Cloud'] },
  
  // Engineers in San Francisco
  { id: '6', name: 'Alex Johnson', title: 'Senior Software Engineer', seniority: 'Senior', location: 'San Francisco', industry: 'Technology', company: 'CloudScale Inc', companyHeadcount: '11-50', yearsOfExperience: 8, skills: ['Python', 'AWS', 'Kubernetes'] },
  { id: '7', name: 'Emily Davis', title: 'Staff Engineer', seniority: 'Senior', location: 'San Francisco', industry: 'Technology', company: 'DataFlow Labs', companyHeadcount: '51-200', yearsOfExperience: 10, skills: ['Data Engineering', 'Spark', 'Python'] },
  { id: '8', name: 'David Kim', title: 'Senior Engineer', seniority: 'Senior', location: 'San Francisco', industry: 'Technology', company: 'AI Startup XYZ', companyHeadcount: '1-10', yearsOfExperience: 6, skills: ['ML', 'TensorFlow', 'Python'] },
  
  // Engineers in London
  { id: '9', name: 'James Wilson', title: 'Software Engineer', seniority: 'Mid-Level', location: 'London', industry: 'Finance', company: 'FinServ UK', companyHeadcount: '501-1000', yearsOfExperience: 4, skills: ['Java', 'Spring', 'Microservices'] },
  { id: '10', name: 'Emma Brown', title: 'Senior Engineer', seniority: 'Senior', location: 'London', industry: 'Technology', company: 'TechHub London', companyHeadcount: '51-200', yearsOfExperience: 7, skills: ['React', 'Node.js', 'TypeScript'] },
  
  // Designers in New York
  { id: '11', name: 'Jessica Martinez', title: 'Senior Product Designer', seniority: 'Senior', location: 'New York', industry: 'Technology', company: 'DesignCo NYC', companyHeadcount: '51-200', yearsOfExperience: 8, skills: ['Figma', 'UX Research', 'Design Systems'] },
  { id: '12', name: 'Ryan Thompson', title: 'UX Designer', seniority: 'Mid-Level', location: 'New York', industry: 'E-commerce', company: 'ShopStyle NY', companyHeadcount: '201-500', yearsOfExperience: 5, skills: ['UI/UX', 'Prototyping', 'User Testing'] },
  
  // Product Managers
  { id: '13', name: 'Lisa Wang', title: 'Product Manager', seniority: 'Mid-Level', location: 'Singapore', industry: 'Technology', company: 'ProductLab SG', companyHeadcount: '11-50', yearsOfExperience: 5, skills: ['Agile', 'Product Strategy', 'Analytics'] },
  { id: '14', name: 'Mark Anderson', title: 'Senior Product Manager', seniority: 'Senior', location: 'San Francisco', industry: 'Technology', company: 'TechGiant Inc', companyHeadcount: '1001-5000', yearsOfExperience: 9, skills: ['B2B', 'SaaS', 'Growth'] },
  { id: '15', name: 'Anna Lee', title: 'Product Manager', seniority: 'Mid-Level', location: 'London', industry: 'Finance', company: 'NeoBank UK', companyHeadcount: '201-500', yearsOfExperience: 4, skills: ['FinTech', 'Mobile Apps', 'User Research'] },
  
  // Marketing Directors in Europe
  { id: '16', name: 'Sophie Mueller', title: 'Marketing Director', seniority: 'Director', location: 'Berlin', industry: 'Technology', company: 'TechBerlin GmbH', companyHeadcount: '51-200', yearsOfExperience: 12, skills: ['Digital Marketing', 'Brand Strategy', 'Growth'] },
  { id: '17', name: 'Pierre Dubois', title: 'Marketing Director', seniority: 'Director', location: 'Paris', industry: 'E-commerce', company: 'ShopFrance SA', companyHeadcount: '201-500', yearsOfExperience: 10, skills: ['E-commerce Marketing', 'SEO', 'Content'] },
  { id: '18', name: 'Marco Rossi', title: 'Director of Marketing', seniority: 'Director', location: 'Milan', industry: 'Fashion', company: 'FashionTech IT', companyHeadcount: '51-200', yearsOfExperience: 8, skills: ['Fashion Marketing', 'Social Media', 'Influencer'] },
  
  // VP/Directors
  { id: '19', name: 'Robert Chen', title: 'VP of Engineering', seniority: 'VP', location: 'Singapore', industry: 'Technology', company: 'ScaleUp Asia', companyHeadcount: '201-500', yearsOfExperience: 16, skills: ['Engineering Management', 'Architecture', 'Strategy'] },
  { id: '20', name: 'Jennifer Park', title: 'Engineering Director', seniority: 'Director', location: 'Tokyo', industry: 'Technology', company: 'TechJapan KK', companyHeadcount: '501-1000', yearsOfExperience: 14, skills: ['Team Building', 'Agile', 'Cloud'] },
  
  // AI/ML specialists
  { id: '21', name: 'Dr. Wei Zhang', title: 'AI Research Scientist', seniority: 'Senior', location: 'Singapore', industry: 'Technology', company: 'AI Research SG', companyHeadcount: '11-50', yearsOfExperience: 7, skills: ['Deep Learning', 'NLP', 'Computer Vision'] },
  { id: '22', name: 'Priya Sharma', title: 'ML Engineer', seniority: 'Senior', location: 'San Francisco', industry: 'Technology', company: 'MLOps Inc', companyHeadcount: '51-200', yearsOfExperience: 6, skills: ['MLOps', 'PyTorch', 'Kubernetes'] },
  
  // Junior/Entry level
  { id: '23', name: 'Tom Harris', title: 'Software Engineer', seniority: 'Entry-Level', location: 'London', industry: 'Technology', company: 'StartupLondon', companyHeadcount: '1-10', yearsOfExperience: 1, skills: ['JavaScript', 'React', 'Node.js'] },
  { id: '24', name: 'Amy Liu', title: 'Junior Product Designer', seniority: 'Entry-Level', location: 'Singapore', industry: 'Technology', company: 'DesignSG Studio', companyHeadcount: '11-50', yearsOfExperience: 2, skills: ['UI Design', 'Figma', 'Sketch'] },
  
  // Tech Leaders (ambiguous)
  { id: '25', name: 'Chris Taylor', title: 'Tech Lead', seniority: 'Senior', location: 'San Francisco', industry: 'Technology', company: 'LeadTech SF', companyHeadcount: '51-200', yearsOfExperience: 9, skills: ['Technical Leadership', 'Architecture', 'Mentoring'] },
  { id: '26', name: 'Nina Patel', title: 'Engineering Manager', seniority: 'Manager', location: 'New York', industry: 'Finance', company: 'WallStreet Tech', companyHeadcount: '201-500', yearsOfExperience: 11, skills: ['People Management', 'Agile', 'FinTech'] },
  
  // More variety
  { id: '27', name: 'Kevin O\'Brien', title: 'DevOps Engineer', seniority: 'Senior', location: 'Dublin', industry: 'Technology', company: 'CloudOps Ireland', companyHeadcount: '51-200', yearsOfExperience: 7, skills: ['AWS', 'Terraform', 'CI/CD'] },
  { id: '28', name: 'Maria Garcia', title: 'Data Scientist', seniority: 'Mid-Level', location: 'Barcelona', industry: 'E-commerce', company: 'DataShop ES', companyHeadcount: '11-50', yearsOfExperience: 4, skills: ['Python', 'SQL', 'Machine Learning'] },
  { id: '29', name: 'Thomas Schmidt', title: 'Backend Developer', seniority: 'Senior', location: 'Berlin', industry: 'Technology', company: 'CodeBerlin', companyHeadcount: '11-50', yearsOfExperience: 8, skills: ['Go', 'PostgreSQL', 'gRPC'] },
  { id: '30', name: 'Olivia White', title: 'Frontend Engineer', seniority: 'Mid-Level', location: 'Sydney', industry: 'Technology', company: 'WebDev Australia', companyHeadcount: '51-200', yearsOfExperience: 5, skills: ['React', 'TypeScript', 'CSS'] },

  // Healthcare & BioTech
  { id: '31', name: 'Dr. Sarah Lim', title: 'Chief Medical Officer', seniority: 'C-Level', location: 'Singapore', industry: 'Healthcare', company: 'HealthStart SG', companyHeadcount: '51-200', yearsOfExperience: 15, skills: ['Medicine', 'Clinical Trials', 'Leadership'] },
  { id: '32', name: 'James Chen', title: 'CTO', seniority: 'C-Level', location: 'San Francisco', industry: 'Healthcare', company: 'HealthTech Solutions', companyHeadcount: '11-50', yearsOfExperience: 12, skills: ['HealthTech', 'HIPAA', 'Cloud'] },
  { id: '33', name: 'Emily Wong', title: 'Senior Researcher', seniority: 'Senior', location: 'London', industry: 'Healthcare', company: 'BioGen UK', companyHeadcount: '501-1000', yearsOfExperience: 8, skills: ['Bioinformatics', 'Python', 'R'] },
  { id: '34', name: 'Michael Chang', title: 'Product Manager', seniority: 'Mid-Level', location: 'Singapore', industry: 'Healthcare', company: 'MedCare App', companyHeadcount: '11-50', yearsOfExperience: 5, skills: ['Healthcare', 'Product Management', 'UX'] },
  { id: '35', name: 'Lisa Kumar', title: 'Data Scientist', seniority: 'Senior', location: 'New York', industry: 'Healthcare', company: 'PharmaAnalytica', companyHeadcount: '201-500', yearsOfExperience: 7, skills: ['Biostatistics', 'Machine Learning', 'SQL'] },
  { id: '36', name: 'Robert Wilson', title: 'VP of Engineering', seniority: 'VP', location: 'Boston', industry: 'Healthcare', company: 'MediTech Systems', companyHeadcount: '501-1000', yearsOfExperience: 18, skills: ['Engineering Management', 'Healthcare IT', 'Compliance'] },

  // Finance & FinTech
  { id: '37', name: 'David Miller', title: 'CFO', seniority: 'C-Level', location: 'New York', industry: 'Finance', company: 'GlobalBank Corp', companyHeadcount: '5001+', yearsOfExperience: 20, skills: ['Finance', 'Strategy', 'M&A'] },
  { id: '38', name: 'Jennifer Wu', title: 'VP Engineering', seniority: 'VP', location: 'Singapore', industry: 'Finance', company: 'QuantTrade Asia', companyHeadcount: '51-200', yearsOfExperience: 14, skills: ['High Frequency Trading', 'C++', 'System Architecture'] },
  { id: '39', name: 'Thomas Anderson', title: 'Blockchain Developer', seniority: 'Senior', location: 'London', industry: 'Finance', company: 'CryptoTransact', companyHeadcount: '11-50', yearsOfExperience: 6, skills: ['Solidity', 'Smart Contracts', 'Web3'] },
  { id: '40', name: 'Amanda Lewis', title: 'Investment Analyst', seniority: 'Mid-Level', location: 'Hong Kong', industry: 'Finance', company: 'AsiaCapital', companyHeadcount: '201-500', yearsOfExperience: 4, skills: ['Financial Modeling', 'Valuation', 'Research'] },
  { id: '41', name: 'Kevin Zhang', title: 'Quantitative Researcher', seniority: 'Senior', location: 'New York', industry: 'Finance', company: 'HedgeFund X', companyHeadcount: '51-200', yearsOfExperience: 8, skills: ['Python', 'Statistics', 'Mathematics'] },

  // Retail & E-commerce
  { id: '42', name: 'Rachel Green', title: 'Head of E-commerce', seniority: 'Director', location: 'London', industry: 'Retail', company: 'FashionForward', companyHeadcount: '201-500', yearsOfExperience: 10, skills: ['E-commerce', 'Digital Marketing', 'Merchandising'] },
  { id: '43', name: 'Daniel Kim', title: 'Supply Chain Manager', seniority: 'Manager', location: 'Seoul', industry: 'Retail', company: 'GlobalGoods', companyHeadcount: '1001-5000', yearsOfExperience: 9, skills: ['Supply Chain', 'Logistics', 'Operations'] },
  { id: '44', name: 'Laura Martinez', title: 'UX Researcher', seniority: 'Senior', location: 'Barcelona', industry: 'Retail', company: 'ShopEasy ES', companyHeadcount: '51-200', yearsOfExperience: 6, skills: ['User Research', 'Usability Testing', 'Spanish'] },
  { id: '45', name: 'Steve Wozniak', title: 'Mobile Developer', seniority: 'Senior', location: 'San Francisco', industry: 'Retail', company: 'CartApp', companyHeadcount: '11-50', yearsOfExperience: 7, skills: ['iOS', 'Swift', 'Mobile Tech'] },

  // Education & EdTech
  { id: '46', name: 'Prof. Alan Turing', title: 'Chief Learning Officer', seniority: 'C-Level', location: 'London', industry: 'Education', company: 'EduTech Global', companyHeadcount: '201-500', yearsOfExperience: 25, skills: ['Education', 'AI', 'Curriculum Design'] },
  { id: '47', name: 'Mary Johnson', title: 'Senior Instructor', seniority: 'Senior', location: 'Singapore', industry: 'Education', company: 'CodingAcademy', companyHeadcount: '11-50', yearsOfExperience: 8, skills: ['Teaching', 'JavaScript', 'Python'] },
  { id: '48', name: 'Paul Smith', title: 'LMS Administrator', seniority: 'Mid-Level', location: 'Sydney', industry: 'Education', company: 'UniOnline', companyHeadcount: '501-1000', yearsOfExperience: 5, skills: ['LMS', 'Moodle', 'IT Support'] },

  // Manufacturing & IoT
  { id: '49', name: 'Carlos Rodriguez', title: 'IoT Engineer', seniority: 'Senior', location: 'Munich', industry: 'Manufacturing', company: 'AutoTech DE', companyHeadcount: '1001-5000', yearsOfExperience: 7, skills: ['IoT', 'Embedded Systems', 'C++'] },
  { id: '50', name: 'Hans Mueller', title: 'Operations Director', seniority: 'Director', location: 'Berlin', industry: 'Manufacturing', company: 'PrecisionParts', companyHeadcount: '201-500', yearsOfExperience: 15, skills: ['Operations', 'Lean Manufacturing', 'Six Sigma'] },

  // More Technology Roles
  { id: '51', name: 'Grace Hopper', title: 'Distinguished Engineer', seniority: 'VP', location: 'New York', industry: 'Technology', company: 'LegacySystems', companyHeadcount: '5001+', yearsOfExperience: 30, skills: ['COBOL', 'System Architecture', 'Leadership'] },
  { id: '52', name: 'Ada Lovelace', title: 'Algorithmic Trader', seniority: 'Senior', location: 'London', industry: 'Technology', company: 'Numera', companyHeadcount: '11-50', yearsOfExperience: 5, skills: ['Mathematics', 'Algorithms', 'Python'] },
  { id: '53', name: 'Linus Torvalds', title: 'Principal Engineer', seniority: 'Fellow', location: 'Helsinki', industry: 'Technology', company: 'OpenSource Found', companyHeadcount: '51-200', yearsOfExperience: 25, skills: ['C', 'Linux', 'Git'] },
  { id: '54', name: 'Satya N', title: 'Cloud Architect', seniority: 'Senior', location: 'Seattle', industry: 'Technology', company: 'CloudServices', companyHeadcount: '5001+', yearsOfExperience: 12, skills: ['Azure', 'Cloud Architecture', 'Retailing'] },
  { id: '55', name: 'Sheryl S', title: 'COO', seniority: 'C-Level', location: 'Menlo Park', industry: 'Technology', company: 'ConnectWorld', companyHeadcount: '5001+', yearsOfExperience: 20, skills: ['Operations', 'Strategy', 'Leadership'] },

  // Consultants & Freelancers
  { id: '56', name: 'Jack Ma', title: 'Business Consultant', seniority: 'Director', location: 'Hangzhou', industry: 'Consulting', company: 'Dragon Group', companyHeadcount: '1001-5000', yearsOfExperience: 20, skills: ['Business Strategy', 'E-commerce', 'Leadership'] },
  { id: '57', name: 'Elon M', title: 'Product Architect', seniority: 'C-Level', location: 'Austin', industry: 'Automotive', company: 'ElectricFuture', companyHeadcount: '5001+', yearsOfExperience: 20, skills: ['Product Design', 'Engineering', 'Innovation'] },

  // New York Finance
  { id: '58', name: 'Jordan Belfort', title: 'Sales Director', seniority: 'Director', location: 'New York', industry: 'Finance', company: 'Stratton Oak', companyHeadcount: '201-500', yearsOfExperience: 10, skills: ['Sales', 'Persuasion', 'Finance'] },
  { id: '59', name: 'Gordon Gekko', title: 'Portfolio Manager', seniority: 'Senior', location: 'New York', industry: 'Finance', company: 'BlueStar', companyHeadcount: '51-200', yearsOfExperience: 15, skills: ['Investment', 'Stocks', 'M&A'] },

  // Singapore Govt/Public
  { id: '60', name: 'Tan Ah Kow', title: 'Digital Officer', seniority: 'Manager', location: 'Singapore', industry: 'Public Sector', company: 'SmartNation SG', companyHeadcount: '1001-5000', yearsOfExperience: 8, skills: ['Digital Transformation', 'Policy', 'Tech'] },
  
  // More Singapore Tech
  { id: '61', name: 'Lim Mei Ling', title: 'QA Lead', seniority: 'Senior', location: 'Singapore', industry: 'Technology', company: 'SeaGroup', companyHeadcount: '1001-5000', yearsOfExperience: 7, skills: ['QA Automation', 'Selenium', 'Java'] },
  { id: '62', name: 'Ravi Kumar', title: 'SRE', seniority: 'Senior', location: 'Singapore', industry: 'Technology', company: 'GrabTech', companyHeadcount: '1001-5000', yearsOfExperience: 6, skills: ['SRE', 'Go', 'Kubernetes'] },
  { id: '63', name: 'Alice Wong', title: 'HR Manager', seniority: 'Manager', location: 'Singapore', industry: 'Technology', company: 'LazadaTech', companyHeadcount: '1001-5000', yearsOfExperience: 9, skills: ['HR', 'Recruiting', 'People Ops'] },

  // Tokyo Tech
  { id: '64', name: 'Hiroshi Sato', title: 'Game Developer', seniority: 'Senior', location: 'Tokyo', industry: 'Entertainment', company: 'NintendoGame', companyHeadcount: '1001-5000', yearsOfExperience: 8, skills: ['C++', 'Game Design', 'Unity'] },
  { id: '65', name: 'Akira Toriyama', title: 'Art Director', seniority: 'Director', location: 'Tokyo', industry: 'Entertainment', company: 'MangaStudio', companyHeadcount: '51-200', yearsOfExperience: 20, skills: ['Art Direction', 'Design', 'Creative'] },

  // Legal
  { id: '66', name: 'Saul Goodman', title: 'Legal Counsel', seniority: 'Senior', location: 'Albuquerque', industry: 'Legal', company: 'Goodman Law', companyHeadcount: '1-10', yearsOfExperience: 15, skills: ['Law', 'Negotiation', 'Defense'] },
  { id: '67', name: 'Kim Wexler', title: 'Partner', seniority: 'C-Level', location: 'Albuquerque', industry: 'Legal', company: 'S&C Law', companyHeadcount: '51-200', yearsOfExperience: 12, skills: ['Corporate Law', 'Banking', 'Litigation'] },

  // Hospitality
  { id: '68', name: 'Gordon Ramsay', title: 'Executive Chef', seniority: 'C-Level', location: 'London', industry: 'Hospitality', company: 'HellsKitchen', companyHeadcount: '51-200', yearsOfExperience: 25, skills: ['Culinary', 'Management', 'Training'] },
  { id: '69', name: 'Anthony B', title: 'Food Critic', seniority: 'Senior', location: 'New York', industry: 'Media', company: 'TravelFood', companyHeadcount: '201-500', yearsOfExperience: 20, skills: ['Writing', 'Food', 'Travel'] },

  // Real Estate
  { id: '70', name: 'Donald T', title: 'Developer', seniority: 'C-Level', location: 'New York', industry: 'Real Estate', company: 'TrumpOrg', companyHeadcount: '501-1000', yearsOfExperience: 30, skills: ['Development', 'Real Estate', 'Branding'] },

  // More Engineers
  { id: '71', name: 'Gavin Belson', title: 'CEO', seniority: 'C-Level', location: 'San Francisco', industry: 'Technology', company: 'Hooli', companyHeadcount: '5001+', yearsOfExperience: 15, skills: ['Leadership', 'Strategy', 'Acquisitions'] },
  { id: '72', name: 'Richard Hendricks', title: 'CTO', seniority: 'C-Level', location: 'San Francisco', industry: 'Technology', company: 'PiedPiper', companyHeadcount: '11-50', yearsOfExperience: 8, skills: ['Compression', 'Algorithm', 'C++'] },
  { id: '73', name: 'Dinesh C', title: 'Senior Engineer', seniority: 'Senior', location: 'San Francisco', industry: 'Technology', company: 'PiedPiper', companyHeadcount: '11-50', yearsOfExperience: 6, skills: ['Java', 'Scala', 'Tesla'] },
  { id: '74', name: 'Bertram Gilfoyle', title: 'Systems Architect', seniority: 'Senior', location: 'San Francisco', industry: 'Technology', company: 'PiedPiper', companyHeadcount: '11-50', yearsOfExperience: 7, skills: ['Security', 'Server Architecture', 'Hardware'] },
  { id: '75', name: 'Jared Dunn', title: 'COO', seniority: 'C-Level', location: 'San Francisco', industry: 'Technology', company: 'PiedPiper', companyHeadcount: '11-50', yearsOfExperience: 8, skills: ['Business Development', 'Management', 'Support'] },

  // European AI Startups
  { id: '76', name: 'Marie Curie', title: 'AI Research Director', seniority: 'Director', location: 'Paris', industry: 'Technology', company: 'AI Labs Paris', companyHeadcount: '11-50', yearsOfExperience: 12, skills: ['Deep Learning', 'NLP', 'Research'] },
  { id: '77', name: 'Jean Dupont', title: 'ML Engineer', seniority: 'Senior', location: 'Paris', industry: 'Technology', company: 'DeepTech France', companyHeadcount: '1-10', yearsOfExperience: 5, skills: ['PyTorch', 'Computer Vision', 'Python'] },
  { id: '78', name: 'Sophie Martin', title: 'CTO', seniority: 'C-Level', location: 'Paris', industry: 'Technology', company: 'TechParis AI', companyHeadcount: '11-50', yearsOfExperience: 10, skills: ['AI Strategy', 'Cloud', 'Leadership'] },
  { id: '79', name: 'Klaus Weber', title: 'AI Engineer', seniority: 'Senior', location: 'Berlin', industry: 'Technology', company: 'AI Berlin Labs', companyHeadcount: '1-10', yearsOfExperience: 4, skills: ['TensorFlow', 'MLOps', 'Python'] },
  { id: '80', name: 'Anna Schmidt', title: 'Data Scientist', seniority: 'Senior', location: 'Munich', industry: 'Technology', company: 'DataAI Munich', companyHeadcount: '11-50', yearsOfExperience: 6, skills: ['Machine Learning', 'Statistics', 'R'] },
  { id: '81', name: 'Oliver Smith', title: 'Founding Engineer', seniority: 'Senior', location: 'London', industry: 'Technology', company: 'AI Startup UK', companyHeadcount: '1-10', yearsOfExperience: 7, skills: ['Full Stack', 'AI', 'Startup'] },
  { id: '82', name: 'Liam O\'Connor', title: 'ML Research Lead', seniority: 'Senior', location: 'Dublin', industry: 'Technology', company: 'MLIreland', companyHeadcount: '11-50', yearsOfExperience: 8, skills: ['NLP', 'LLMs', 'Python'] },
  { id: '83', name: 'Marco Rossi', title: 'AI Product Manager', seniority: 'Senior', location: 'Milan', industry: 'Technology', company: 'AIItalia', companyHeadcount: '1-10', yearsOfExperience: 6, skills: ['Product', 'AI', 'Strategy'] },
  { id: '84', name: 'Erik Johansson', title: 'Deep Learning Engineer', seniority: 'Senior', location: 'Helsinki', industry: 'Technology', company: 'NordicAI', companyHeadcount: '11-50', yearsOfExperience: 5, skills: ['Deep Learning', 'PyTorch', 'Research'] },
];

export const mockCompanies: Company[] = [
  { id: 'c1', name: 'AI Labs Singapore', industry: 'Technology', location: 'Singapore', headcount: '51-200', type: 'Startup' },
  { id: 'c2', name: 'FinTech Asia', industry: 'Finance', location: 'Singapore', headcount: '201-500', type: 'Startup' },
  { id: 'c3', name: 'TechVentures SG', industry: 'Technology', location: 'Singapore', headcount: '51-200', type: 'Startup' },
  { id: 'c4', name: 'AI Startup XYZ', industry: 'Technology', location: 'San Francisco', headcount: '1-10', type: 'Startup' },
  { id: 'c5', name: 'DataFlow Labs', industry: 'Technology', location: 'San Francisco', headcount: '51-200', type: 'Startup' },
  { id: 'c6', name: 'CloudScale Inc', industry: 'Technology', location: 'San Francisco', headcount: '11-50', type: 'Startup' },
  { id: 'c7', name: 'TechHub London', industry: 'Technology', location: 'London', headcount: '51-200', type: 'Startup' },
  { id: 'c8', name: 'NeoBank UK', industry: 'Finance', location: 'London', headcount: '201-500', type: 'Startup' },
  { id: 'c9', name: 'AI Labs Japan', industry: 'Technology', location: 'Tokyo', headcount: '51-200', type: 'Startup' },
  { id: 'c10', name: 'TechBerlin GmbH', industry: 'Technology', location: 'Berlin', headcount: '51-200', type: 'Startup' },
  
  // Healthcare
  { id: 'c11', name: 'HealthStart SG', industry: 'Healthcare', location: 'Singapore', headcount: '51-200', type: 'SME' },
  { id: 'c12', name: 'HealthTech Solutions', industry: 'Healthcare', location: 'San Francisco', headcount: '11-50', type: 'Startup' },
  { id: 'c13', name: 'BioGen UK', industry: 'Healthcare', location: 'London', headcount: '501-1000', type: 'Enterprise' },
  { id: 'c14', name: 'MedCare App', industry: 'Healthcare', location: 'Singapore', headcount: '11-50', type: 'Startup' },
  
  // Finance
  { id: 'c15', name: 'GlobalBank Corp', industry: 'Finance', location: 'New York', headcount: '5001+', type: 'Enterprise' },
  { id: 'c16', name: 'QuantTrade Asia', industry: 'Finance', location: 'Singapore', headcount: '51-200', type: 'SME' },
  { id: 'c17', name: 'HedgeFund X', industry: 'Finance', location: 'New York', headcount: '51-200', type: 'SME' },
  
  // Retail & Fashion
  { id: 'c18', name: 'FashionForward', industry: 'Retail', location: 'London', headcount: '201-500', type: 'SME' },
  { id: 'c19', name: 'GlobalGoods', industry: 'Retail', location: 'Seoul', headcount: '1001-5000', type: 'Enterprise' },
  { id: 'c20', name: 'ShopEasy ES', industry: 'Retail', location: 'Barcelona', headcount: '51-200', type: 'SME' },
  
  // Education
  { id: 'c21', name: 'EduTech Global', industry: 'Education', location: 'London', headcount: '201-500', type: 'SME' },
  
  // Auto & Manufacturing
  { id: 'c22', name: 'AutoTech DE', industry: 'Manufacturing', location: 'Munich', headcount: '1001-5000', type: 'Enterprise' },
  { id: 'c23', name: 'PrecisionParts', industry: 'Manufacturing', location: 'Berlin', headcount: '201-500', type: 'SME' },
  { id: 'c24', name: 'ElectricFuture', industry: 'Automotive', location: 'Austin', headcount: '5001+', type: 'Enterprise' },
  
  // Big Tech
  { id: 'c25', name: 'LegacySystems', industry: 'Technology', location: 'New York', headcount: '5001+', type: 'Enterprise' },
  { id: 'c26', name: 'CloudServices', industry: 'Technology', location: 'Seattle', headcount: '5001+', type: 'Enterprise' },
  { id: 'c27', name: 'ConnectWorld', industry: 'Technology', location: 'Menlo Park', headcount: '5001+', type: 'Enterprise' },
  { id: 'c28', name: 'Google', industry: 'Technology', location: 'Mountain View', headcount: '5001+', type: 'Enterprise' },
  { id: 'c29', name: 'Meta', industry: 'Technology', location: 'Menlo Park', headcount: '5001+', type: 'Enterprise' },
  
  // Silicon Valley Fictional
  { id: 'c30', name: 'PiedPiper', industry: 'Technology', location: 'San Francisco', headcount: '11-50', type: 'Startup' },
  { id: 'c31', name: 'Hooli', industry: 'Technology', location: 'San Francisco', headcount: '5001+', type: 'Enterprise' },
  
  // European AI Startups
  { id: 'c32', name: 'AI Labs Paris', industry: 'Technology', location: 'Paris', headcount: '11-50', type: 'Startup' },
  { id: 'c33', name: 'DeepTech France', industry: 'Technology', location: 'Paris', headcount: '1-10', type: 'Startup' },
  { id: 'c34', name: 'TechParis AI', industry: 'Technology', location: 'Paris', headcount: '11-50', type: 'Startup' },
  { id: 'c35', name: 'AI Berlin Labs', industry: 'Technology', location: 'Berlin', headcount: '1-10', type: 'Startup' },
  { id: 'c36', name: 'DataAI Munich', industry: 'Technology', location: 'Munich', headcount: '11-50', type: 'Startup' },
  { id: 'c37', name: 'AI Startup UK', industry: 'Technology', location: 'London', headcount: '1-10', type: 'Startup' },
  { id: 'c38', name: 'MLIreland', industry: 'Technology', location: 'Dublin', headcount: '11-50', type: 'Startup' },
  { id: 'c39', name: 'AIItalia', industry: 'Technology', location: 'Milan', headcount: '1-10', type: 'Startup' },
  { id: 'c40', name: 'NordicAI', industry: 'Technology', location: 'Helsinki', headcount: '11-50', type: 'Startup' },
  { id: 'c41', name: 'StartupLondon', industry: 'Technology', location: 'London', headcount: '1-10', type: 'Startup' },
  { id: 'c42', name: 'CodeBerlin', industry: 'Technology', location: 'Berlin', headcount: '11-50', type: 'Startup' },
];
