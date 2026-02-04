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
];
