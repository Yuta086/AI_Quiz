
export interface User {
  id: string;
  name: string;
}

export interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number; // 1-based index
}

export interface Project {
  id: string;
  name: string;
  transcript: string;
  url_slug: string;
  is_published: boolean;
  questions: Question[];
  createdAt: string;
}

export interface Submission {
  id: string;
  projectId: string;
  userId: string;
  submittedAt: string;
  attempt_count: number;
}

export interface Attempt {
    id: string;
    projectId: string;
    userId: string;
    score: number;
    attemptedAt: string;
}
