export type UserRole = "super_admin" | "admin" | "teacher" | "student";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published" | "archived";
export type LearningStatus = "in_progress" | "completed" | "certified";
export type SubmissionStatus = "submitted" | "graded" | "passed" | "failed";
export type QuestionType = "multiple_choice" | "short_answer";
export type Locale = "id" | "en";
export type ThemePreference = "light" | "dark" | "system";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  bio?: string;
  phone?: string;
  hasPassword?: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  category: string;
  level: CourseLevel;
  status: CourseStatus;
  teacherId: string;
  teacher?: Pick<User, "id" | "name" | "avatar" | "bio">;
  totalModules: number;
  totalQuizzes: number;
  totalAssignments: number;
  enrolledStudents: number;
  rating: number;
  totalReviews: number;
  duration: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CourseCategory {
  name: string;
  count: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  order: number;
  duration: string;
  isPublished: boolean;
  attachments: Attachment[];
}

export interface Question {
  id: string;
  quizId?: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  order: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description: string;
  questions?: Question[];
  passingScore: number;
  timeLimit: number;
  isPublished: boolean;
  totalAttempts?: number;
  averageScore?: number;
}

export interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  points?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  student?: User;
  answers: QuizAnswer[];
  score: number;
  totalPoints: number;
  passed: boolean;
  completedAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  course?: Course;
  title: string;
  description: string;
  instructions: string;
  deadline: string;
  maxScore: number;
  isPublished: boolean;
  totalSubmissions?: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignment?: Assignment;
  studentId: string;
  student?: User;
  fileUrl: string;
  fileName: string;
  description: string;
  score?: number;
  feedback?: string;
  status: SubmissionStatus;
  submittedAt: string;
}

export interface LearningProgress {
  id: string;
  courseId: string;
  course?: Course;
  studentId: string;
  student?: User;
  completedModules: string[];
  progress: number;
  status: LearningStatus;
  lastModuleId?: string;
  lastModule?: Module;
  startedAt: string;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  student?: User;
  courseId: string;
  course?: Course;
  certificateNumber: string;
  issuer: string;
  issuedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface PlatformSettings {
  id: number;
  name: string;
  descriptionId: string;
  descriptionEn: string;
  supportEmail: string;
  logoUrl: string;
  defaultLocale: Locale;
  certificateIssuer: string;
  notifyNewRegistration: boolean;
  notifyNewSubmission: boolean;
  notifyGradePublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreference {
  userId: string;
  locale: Locale;
  theme: ThemePreference;
  notifyCourseUpdates: boolean;
  notifyAssignments: boolean;
  notifyGrades: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalCourses: number;
  totalStudents: number;
  totalTeachers: number;
  activeLearners: number;
  completedLearnings: number;
  certificatesIssued: number;
  weeklyActivity: Array<{
    week: string;
    activeLearners: number;
    completedModules: number;
  }>;
  progressBreakdown: Array<{
    status: LearningStatus;
    total: number;
  }>;
}

export interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  pendingSubmissions: number;
  averageRating?: number;
}

export interface StudentStats {
  startedCourses: number;
  completedCourses: number;
  certificates: number;
  upcomingDeadlines: Assignment[];
  recentActivities: Array<{
    id: string;
    title: string;
    type: "assignment" | "quiz" | "course";
    createdAt: string;
  }>;
}

export interface AuthResponse {
  token: string;
  refresh_token: string;
  user: User;
}
