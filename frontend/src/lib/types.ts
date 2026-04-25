export type UserRole = "super_admin" | "admin" | "teacher" | "student";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published" | "archived";
export type EnrollmentStatus = "active" | "completed" | "certified";
export type SubmissionStatus = "submitted" | "graded" | "passed" | "failed";
export type QuestionType = "multiple_choice" | "short_answer";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  bio?: string;
  phone?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  price: number;
  category: string;
  level: CourseLevel;
  status: CourseStatus;
  teacherId: string;
  teacher?: User;
  totalModules: number;
  totalQuizzes: number;
  totalAssignments: number;
  enrolledStudents: number;
  rating: number;
  totalReviews: number;
  duration: string;
  createdAt: string;
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

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number;
  timeLimit: number;
  isPublished: boolean;
  totalAttempts: number;
  averageScore: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  order: number;
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

export interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  points: number;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  instructions: string;
  deadline: string;
  maxScore: number;
  isPublished: boolean;
  totalSubmissions: number;
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

export interface Enrollment {
  id: string;
  courseId: string;
  course?: Course;
  studentId: string;
  student?: User;
  paymentAmount: number;
  progress: number;
  completedModules: string[];
  status: EnrollmentStatus;
  enrolledAt: string;
}

export interface Payment {
  id: string;
  courseId: string;
  course?: Course;
  studentId: string;
  amount: number;
  paidAt: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  student?: User;
  courseId: string;
  course?: Course;
  certificateNumber: string;
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

export interface AdminStats {
  totalCourses: number;
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  coursesTrend: number;
  studentsTrend: number;
  revenueTrend: number;
  monthlyRevenue: ChartData[];
  coursesByCategory: ChartData[];
}

export interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  pendingSubmissions: number;
  averageRating: number;
  recentSubmissions: Submission[];
}

export interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  certificates: number;
  averageScore: number;
  currentCourses: Enrollment[];
  upcomingDeadlines: Assignment[];
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface NavItem {
  title: string;
  titleEn: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}
