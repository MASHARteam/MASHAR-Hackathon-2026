export interface PathwayAnswers {
  role: string;
  grades: string[];
  goals: string[];
  priorCoding: string;
  teacherAiUsage: string;
  resources: string;
  focusArea: string;
}

export interface SuggestedResource {
  name: string;
  platform: string;
  url?: string;
}

export interface CurriculumYear {
  yearName: string;
  focus: string;
  skills: string[];
  physicsContext: string;
  suggestedResources: SuggestedResource[];
  milestoneProject: string;
}

export interface CustomizedPathway {
  title: string;
  overview: string;
  years: CurriculumYear[];
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: 'socratic' | 'derivation' | 'lab_report' | 'simulation' | 'teacher';
  promptText: string;
  explanation: string;
  physicsTopic: string;
}

export interface CourseResource {
  id: string;
  title: string;
  platform: string;
  difficulty: 'מתחילים' | 'בינוני' | 'מתקדמים';
  duration: string;
  description: string;
  url: string;
  skillsLearned: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
