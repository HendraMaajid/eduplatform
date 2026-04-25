import { User, Course, Module, Quiz, Question, Assignment, Submission, Enrollment, Certificate, Notification, Payment } from "./types";

// ============================================
// Mock Users
// ============================================
export const mockUsers: User[] = [
  {
    id: "u1",
    name: "Budi Santoso",
    email: "budi@admin.com",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Budi",
    role: "super_admin",
    bio: "Platform administrator",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "u2",
    name: "Siti Rahayu",
    email: "siti@admin.com",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Siti",
    role: "admin",
    bio: "Course administrator",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "u3",
    name: "Andi Wijaya",
    email: "andi@teacher.com",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Andi",
    role: "teacher",
    bio: "Senior React Native Developer with 8+ years experience",
    createdAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "u4",
    name: "Dewi Lestari",
    email: "dewi@teacher.com",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Dewi",
    role: "teacher",
    bio: "Full-Stack Developer & Tech Educator",
    createdAt: "2024-02-10T00:00:00Z",
  },
  {
    id: "u5",
    name: "Raka Pratama",
    email: "raka@student.com",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Raka",
    role: "student",
    bio: "Aspiring mobile developer",
    createdAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "u6",
    name: "Maya Putri",
    email: "maya@student.com",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Maya",
    role: "student",
    bio: "Computer Science student",
    createdAt: "2024-03-05T00:00:00Z",
  },
  {
    id: "u7",
    name: "Fajar Nugroho",
    email: "fajar@student.com",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Fajar",
    role: "student",
    createdAt: "2024-03-10T00:00:00Z",
  },
  {
    id: "u8",
    name: "Citra Amelia",
    email: "citra@student.com",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Citra",
    role: "student",
    createdAt: "2024-04-01T00:00:00Z",
  },
];

// ============================================
// Mock Courses
// ============================================
export const mockCourses: Course[] = [
  {
    id: "c1",
    title: "Bootcamp React Native",
    slug: "bootcamp-react-native",
    description: "Pelajari React Native dari nol hingga mahir. Bangun aplikasi mobile cross-platform yang siap production dengan best practices terkini.",
    shortDescription: "Bangun aplikasi mobile cross-platform dengan React Native",
    thumbnail: "/images/courses/react-native.jpg",
    price: 1500000,
    category: "Mobile Development",
    level: "beginner",
    status: "published",
    teacherId: "u3",
    teacher: mockUsers[2],
    totalModules: 12,
    totalQuizzes: 6,
    totalAssignments: 3,
    enrolledStudents: 45,
    rating: 4.8,
    totalReviews: 32,
    duration: "12 Minggu",
    createdAt: "2024-02-15T00:00:00Z",
  },
  {
    id: "c2",
    title: "Full-Stack Web Development dengan Go & Next.js",
    slug: "fullstack-go-nextjs",
    description: "Kuasai full-stack web development menggunakan Go untuk backend dan Next.js untuk frontend. Termasuk deployment dan DevOps.",
    shortDescription: "Full-stack web dev dengan Go backend & Next.js frontend",
    thumbnail: "/images/courses/fullstack.jpg",
    price: 2000000,
    category: "Web Development",
    level: "intermediate",
    status: "published",
    teacherId: "u4",
    teacher: mockUsers[3],
    totalModules: 16,
    totalQuizzes: 8,
    totalAssignments: 4,
    enrolledStudents: 38,
    rating: 4.9,
    totalReviews: 28,
    duration: "16 Minggu",
    createdAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "c3",
    title: "UI/UX Design Fundamentals",
    slug: "uiux-design-fundamentals",
    description: "Pelajari prinsip-prinsip desain UI/UX, wireframing, prototyping, dan user research dari dasar.",
    shortDescription: "Dasar-dasar desain UI/UX untuk pemula",
    thumbnail: "/images/courses/uiux.jpg",
    price: 800000,
    category: "Design",
    level: "beginner",
    status: "published",
    teacherId: "u4",
    teacher: mockUsers[3],
    totalModules: 8,
    totalQuizzes: 4,
    totalAssignments: 2,
    enrolledStudents: 62,
    rating: 4.7,
    totalReviews: 45,
    duration: "8 Minggu",
    createdAt: "2024-01-20T00:00:00Z",
  },
  {
    id: "c4",
    title: "Data Science dengan Python",
    slug: "data-science-python",
    description: "Masuk ke dunia data science dengan Python. Pelajari pandas, numpy, matplotlib, dan machine learning dasar.",
    shortDescription: "Data analysis & ML dengan Python",
    thumbnail: "/images/courses/datascience.jpg",
    price: 1800000,
    category: "Data Science",
    level: "intermediate",
    status: "draft",
    teacherId: "u3",
    teacher: mockUsers[2],
    totalModules: 14,
    totalQuizzes: 7,
    totalAssignments: 5,
    enrolledStudents: 0,
    rating: 0,
    totalReviews: 0,
    duration: "14 Minggu",
    createdAt: "2024-04-01T00:00:00Z",
  },
  {
    id: "c5",
    title: "DevOps & Cloud Computing",
    slug: "devops-cloud",
    description: "Pelajari Docker, Kubernetes, CI/CD, dan cloud deployment di AWS/GCP.",
    shortDescription: "Docker, K8s, CI/CD dan cloud deployment",
    thumbnail: "/images/courses/devops.jpg",
    price: 2500000,
    category: "DevOps",
    level: "advanced",
    status: "published",
    teacherId: "u3",
    teacher: mockUsers[2],
    totalModules: 10,
    totalQuizzes: 5,
    totalAssignments: 3,
    enrolledStudents: 22,
    rating: 4.6,
    totalReviews: 15,
    duration: "10 Minggu",
    createdAt: "2024-03-15T00:00:00Z",
  },
];

// ============================================
// Mock Modules
// ============================================
export const mockModules: Module[] = [
  {
    id: "m1", courseId: "c1", title: "Pengenalan React Native", description: "Apa itu React Native dan mengapa menggunakannya",
    content: "# Pengenalan React Native\n\nReact Native adalah framework open-source yang dibuat oleh Meta (Facebook) untuk membangun aplikasi mobile menggunakan JavaScript dan React.\n\n## Mengapa React Native?\n\n- **Cross-platform**: Satu codebase untuk iOS dan Android\n- **Hot Reload**: Lihat perubahan secara real-time\n- **Native Performance**: Menghasilkan komponen native\n- **Community**: Komunitas besar dan ekosistem rich\n\n## Prerequisites\n\n1. Pemahaman dasar JavaScript/TypeScript\n2. Pemahaman dasar React\n3. Node.js terinstall\n4. Android Studio atau Xcode",
    order: 1, duration: "45 menit", isPublished: true, attachments: [],
  },
  {
    id: "m2", courseId: "c1", title: "Setup Environment", description: "Menyiapkan development environment",
    content: "# Setup Development Environment\n\n## Install Node.js\n\nDownload dan install Node.js versi LTS dari [nodejs.org](https://nodejs.org).\n\n## Install React Native CLI\n\n```bash\nnpm install -g @react-native-community/cli\n```\n\n## Setup Android Studio\n\n1. Download Android Studio\n2. Install Android SDK\n3. Setup Emulator",
    order: 2, duration: "60 menit", isPublished: true, attachments: [{ id: "a1", name: "setup-guide.pdf", url: "/files/setup-guide.pdf", size: 2048000, type: "application/pdf" }],
  },
  {
    id: "m3", courseId: "c1", title: "Komponen Dasar", description: "View, Text, Image, dan komponen dasar lainnya",
    content: "# Komponen Dasar React Native\n\n## View\n\n`View` adalah container dasar yang mendukung layout dengan flexbox.\n\n```jsx\nimport { View, Text } from 'react-native';\n\nconst App = () => (\n  <View style={{ flex: 1, padding: 20 }}>\n    <Text>Hello World!</Text>\n  </View>\n);\n```",
    order: 3, duration: "90 menit", isPublished: true, attachments: [],
  },
  {
    id: "m4", courseId: "c1", title: "Styling & Flexbox", description: "Cara styling di React Native",
    content: "# Styling di React Native\n\nReact Native menggunakan JavaScript objects untuk styling, mirip dengan CSS tapi dengan camelCase.",
    order: 4, duration: "75 menit", isPublished: true, attachments: [],
  },
  {
    id: "m5", courseId: "c1", title: "Navigation", description: "React Navigation setup dan penggunaan",
    content: "# React Navigation\n\nNavigation adalah bagian krusial dari setiap aplikasi mobile.",
    order: 5, duration: "90 menit", isPublished: false, attachments: [],
  },
];

// ============================================
// Mock Quizzes
// ============================================
export const mockQuizzes: Quiz[] = [
  {
    id: "q1", courseId: "c1", title: "Quiz: Pengenalan React Native", description: "Uji pemahaman kamu tentang dasar-dasar React Native",
    passingScore: 70, timeLimit: 15, isPublished: true, totalAttempts: 38, averageScore: 82,
    questions: [
      { id: "qq1", type: "multiple_choice", text: "Siapa yang membuat React Native?", options: ["Google", "Meta (Facebook)", "Apple", "Microsoft"], correctAnswer: "1", points: 10, order: 1 },
      { id: "qq2", type: "multiple_choice", text: "Bahasa pemrograman utama yang digunakan di React Native?", options: ["Java", "Swift", "JavaScript", "Kotlin"], correctAnswer: "2", points: 10, order: 2 },
      { id: "qq3", type: "short_answer", text: "Sebutkan fitur React Native yang memungkinkan melihat perubahan kode secara real-time!", correctAnswer: "hot reload", points: 10, order: 3 },
      { id: "qq4", type: "multiple_choice", text: "React Native menghasilkan aplikasi jenis apa?", options: ["Web App", "Hybrid App", "Native App", "PWA"], correctAnswer: "2", points: 10, order: 4 },
      { id: "qq5", type: "short_answer", text: "Apa nama container/komponen dasar di React Native yang mirip dengan div di HTML?", correctAnswer: "view", points: 10, order: 5 },
    ],
  },
  {
    id: "q2", courseId: "c1", title: "Quiz: Setup & Environment", description: "Uji pengetahuan setup environment React Native",
    passingScore: 60, timeLimit: 10, isPublished: true, totalAttempts: 35, averageScore: 78,
    questions: [
      { id: "qq6", type: "multiple_choice", text: "Tool apa yang diperlukan untuk menjalankan emulator Android?", options: ["VS Code", "Android Studio", "Xcode", "IntelliJ"], correctAnswer: "1", points: 10, order: 1 },
      { id: "qq7", type: "short_answer", text: "Apa nama package manager default untuk Node.js?", correctAnswer: "npm", points: 10, order: 2 },
    ],
  },
];

// ============================================
// Mock Assignments
// ============================================
export const mockAssignments: Assignment[] = [
  {
    id: "as1", courseId: "c1", title: "Project: Todo App", description: "Buat aplikasi Todo sederhana dengan React Native",
    instructions: "# Project: Todo App\n\nBuat aplikasi Todo sederhana dengan fitur:\n\n1. Tambah todo\n2. Hapus todo\n3. Mark as complete\n4. Filter (All/Active/Completed)\n\n## Kriteria Penilaian\n- Fungsionalitas (40%)\n- UI/UX (30%)\n- Code Quality (30%)",
    deadline: "2024-06-15T23:59:59Z", maxScore: 100, isPublished: true, totalSubmissions: 28,
  },
  {
    id: "as2", courseId: "c1", title: "Project: Weather App", description: "Buat aplikasi cuaca menggunakan API",
    instructions: "# Project: Weather App\n\nBuat aplikasi yang menampilkan cuaca berdasarkan lokasi pengguna.",
    deadline: "2024-07-15T23:59:59Z", maxScore: 100, isPublished: true, totalSubmissions: 15,
  },
];

// ============================================
// Mock Submissions
// ============================================
export const mockSubmissions: Submission[] = [
  { id: "s1", assignmentId: "as1", studentId: "u5", student: mockUsers[4], fileUrl: "/uploads/todo-app-raka.zip", fileName: "todo-app-raka.zip", description: "Todo app dengan fitur tambahan dark mode", score: 85, feedback: "Bagus! UI-nya clean dan fungsionalitasnya lengkap. Tambahkan animasi untuk UX yang lebih baik.", status: "passed", submittedAt: "2024-06-10T14:30:00Z" },
  { id: "s2", assignmentId: "as1", studentId: "u6", student: mockUsers[5], fileUrl: "/uploads/todo-app-maya.zip", fileName: "todo-app-maya.zip", description: "Implementasi todo app basic", score: 72, feedback: "Fungsionalitas dasar sudah baik, tapi perlu perbaikan di UI.", status: "graded", submittedAt: "2024-06-12T10:15:00Z" },
  { id: "s3", assignmentId: "as1", studentId: "u7", student: mockUsers[6], fileUrl: "/uploads/todo-app-fajar.zip", fileName: "todo-app-fajar.zip", description: "Todo app submission", status: "submitted", submittedAt: "2024-06-14T22:00:00Z" },
];

// ============================================
// Mock Enrollments
// ============================================
export const mockEnrollments: Enrollment[] = [
  { id: "e1", courseId: "c1", course: mockCourses[0], studentId: "u5", student: mockUsers[4], paymentAmount: 1500000, progress: 65, completedModules: ["m1", "m2", "m3"], status: "active", enrolledAt: "2024-03-05T00:00:00Z" },
  { id: "e2", courseId: "c1", course: mockCourses[0], studentId: "u6", student: mockUsers[5], paymentAmount: 1500000, progress: 40, completedModules: ["m1", "m2"], status: "active", enrolledAt: "2024-03-10T00:00:00Z" },
  { id: "e3", courseId: "c2", course: mockCourses[1], studentId: "u5", student: mockUsers[4], paymentAmount: 2000000, progress: 20, completedModules: [], status: "active", enrolledAt: "2024-04-01T00:00:00Z" },
  { id: "e4", courseId: "c3", course: mockCourses[2], studentId: "u7", student: mockUsers[6], paymentAmount: 800000, progress: 100, completedModules: ["m1", "m2", "m3"], status: "certified", enrolledAt: "2024-02-01T00:00:00Z" },
  { id: "e5", courseId: "c1", course: mockCourses[0], studentId: "u8", student: mockUsers[7], paymentAmount: 1500000, progress: 10, completedModules: ["m1"], status: "active", enrolledAt: "2024-04-05T00:00:00Z" },
];

// ============================================
// Mock Payments
// ============================================
export const mockPayments: Payment[] = [
  { id: "p1", courseId: "c1", course: mockCourses[0], studentId: "u5", amount: 1500000, paidAt: "2024-03-05T00:00:00Z" },
  { id: "p2", courseId: "c1", course: mockCourses[0], studentId: "u6", amount: 1500000, paidAt: "2024-03-10T00:00:00Z" },
  { id: "p3", courseId: "c2", course: mockCourses[1], studentId: "u5", amount: 2000000, paidAt: "2024-04-01T00:00:00Z" },
  { id: "p4", courseId: "c3", course: mockCourses[2], studentId: "u7", amount: 800000, paidAt: "2024-02-01T00:00:00Z" },
  { id: "p5", courseId: "c1", course: mockCourses[0], studentId: "u8", amount: 1500000, paidAt: "2024-04-05T00:00:00Z" },
];

// ============================================
// Mock Certificates
// ============================================
export const mockCertificates: Certificate[] = [
  { id: "cert1", studentId: "u7", student: mockUsers[6], courseId: "c3", course: mockCourses[2], certificateNumber: "CERT-2024-001", issuedAt: "2024-04-15T00:00:00Z" },
];

// ============================================
// Mock Notifications
// ============================================
export const mockNotifications: Notification[] = [
  { id: "n1", userId: "u5", title: "Materi Baru", message: "Modul 'Navigation' telah ditambahkan ke Bootcamp React Native", type: "info", isRead: false, link: "/student/courses/c1/modules/m5", createdAt: "2024-04-20T10:00:00Z" },
  { id: "n2", userId: "u5", title: "Nilai Tugas", message: "Tugas 'Todo App' telah dinilai. Skor: 85/100", type: "success", isRead: false, link: "/student/courses/c1/assignments/as1", createdAt: "2024-04-19T14:30:00Z" },
  { id: "n3", userId: "u3", title: "Submission Baru", message: "Fajar Nugroho mengumpulkan tugas 'Todo App'", type: "info", isRead: true, link: "/teacher/courses/c1/grading", createdAt: "2024-04-14T22:00:00Z" },
  { id: "n4", userId: "u1", title: "Pendaftaran Baru", message: "Citra Amelia mendaftar di Bootcamp React Native", type: "info", isRead: true, createdAt: "2024-04-05T00:00:00Z" },
];

// ============================================
// Helper: format currency
// ============================================
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateStr));
}
