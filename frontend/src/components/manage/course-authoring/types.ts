export type ModuleDraft = {
  title: string;
  description: string;
  content: string;
  duration: string;
  order: number;
  isPublished: boolean;
};

export type QuizDraft = {
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number;
  isPublished: boolean;
};

export type AssignmentDraft = {
  title: string;
  description: string;
  instructions: string;
  deadline: string;
  maxScore: number;
  isPublished: boolean;
};

export const EMPTY_MODULE: ModuleDraft = {
  title: "",
  description: "",
  content: "",
  duration: "",
  order: 1,
  isPublished: false,
};

export const EMPTY_QUIZ: QuizDraft = {
  title: "",
  description: "",
  passingScore: 70,
  timeLimit: 15,
  isPublished: false,
};

export const EMPTY_ASSIGNMENT: AssignmentDraft = {
  title: "",
  description: "",
  instructions: "",
  deadline: "",
  maxScore: 100,
  isPublished: false,
};
