export enum UserLevel {
  GENERAL = 'GENERAL',          // הקהל הרחב
  HIGH_SCHOOL = 'HIGH_SCHOOL',  // תיכון 5 יח"ל פיזיקה
  ACADEMIA = 'ACADEMIA',        // אקדמיה
}

export enum Domain {
  BASICS = 'BASICS',            // יסודות הגלים
  MUSIC = 'MUSIC',              // מוזיקה וגלים
  EM_WAVES = 'EM_WAVES',        // גלים אלקטרומגנטיים ואור
  TECH = 'TECH',                // טכנולוגיות מבוססות גלים
  QUIZZES = 'QUIZZES',          // שאלוני תרגול עצמי
}

export enum LearnMode {
  TOUR = 'TOUR',                // סיור מודרך
  SANDBOX = 'SANDBOX',          // ארגז חול
}

export interface ResourceLink {
  title: string;
  url: string;
  description: string;
}

export interface DomainConcept {
  id: string;
  title: string;
  explanations: {
    [key in UserLevel]: string;
  };
  formulas?: {
    [key in UserLevel]?: string[];
  };
  deepLinks: ResourceLink[];
}

export interface DomainResources {
  domain: Domain;
  title: string;
  subtitle: string;
  intro: {
    [key in UserLevel]: string;
  };
  concepts: DomainConcept[];
}
