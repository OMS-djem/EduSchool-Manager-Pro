export type SchoolLevel = 'all' | 'primary' | 'middle' | 'high';

export type Language = 'fr' | 'en' | 'ar';

export type UserRole = 'super_admin' | 'principal' | 'teacher' | 'parent' | 'bursar' | 'student';

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  schoolLevel: SchoolLevel;
  subjects: string[];
  classes: string[];
  weeklyHours: number;
  qualification: string;
  status: 'active' | 'on_leave';
  joinDate?: string;
  avatarUrl?: string;
}

export interface Student {
  id: string;
  matricule: string;
  name: string;
  schoolLevel: 'primary' | 'middle' | 'high';
  gradeClass: string;
  birthDate: string;
  gender: 'M' | 'F';
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentId?: string;
  attendanceRate: number;
  status: 'active' | 'transferred' | 'graduated';
  tuitionStatus: 'paid' | 'partial' | 'unpaid';
  totalTuition: number;
  paidTuition: number;
  photoUrl?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: 'Administration' | 'Finance' | 'Student Affairs' | 'Logistics' | 'Library' | 'Health & Counseling';
  schoolLevel: SchoolLevel;
  email: string;
  phone: string;
  status: 'active' | 'on_leave';
  joinDate?: string;
}

export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense';
  category: 'Tuition' | 'Registration' | 'Transport' | 'Canteen' | 'Salaries' | 'Supplies' | 'Maintenance' | 'Lab Equipment';
  studentId?: string;
  studentName?: string;
  schoolLevel?: 'primary' | 'middle' | 'high';
  amount: number;
  currency: string;
  paymentMethod: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Mobile Money';
  status: 'completed' | 'pending' | 'overdue';
  dueDate?: string;
  paidDate?: string;
  invoiceNumber: string;
  notes?: string;
}

export interface Exam {
  id: string;
  title: string;
  term: 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3';
  schoolLevel: 'primary' | 'middle' | 'high';
  gradeClass: string;
  subject: string;
  examDate: string;
  maxScore: number;
  coefficient: number;
  status: 'scheduled' | 'grading' | 'published';
  teacherName?: string;
  room?: string;
  timeSlot?: string;
  invigilatorName?: string;
  invigilatorId?: string;
}

export interface Grade {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  subject: string;
  schoolLevel: 'primary' | 'middle' | 'high';
  gradeClass: string;
  term: 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3';
  score: number;
  maxScore: number;
  coefficient: number;
  remarks: string;
  teacherName: string;
  dateRecorded: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  gradeClass: string;
  schoolLevel: 'primary' | 'middle' | 'high';
  date: string;
  status: 'present' | 'absent_unjustified' | 'absent_justified' | 'late';
  reason?: string;
  recordedBy: string;
}

export interface ParentMonitoringItem {
  id: string;
  studentId: string;
  studentName: string;
  parentId: string;
  date: string;
  type: 'conduct' | 'homework' | 'achievement' | 'alert' | 'appointment';
  title: string;
  description: string;
  author: string;
  acknowledgedByParent: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  schoolLevel: SchoolLevel;
  category: 'Sciences' | 'Humanities' | 'Languages' | 'Arts' | 'Sports' | 'Technical';
  weeklyHours: number;
  coefficient: number;
  description: string;
}

export interface CourseModule {
  id: string;
  subjectId: string;
  subjectName: string;
  schoolLevel: 'primary' | 'middle' | 'high';
  gradeClass: string;
  chapterNumber: number;
  title: string;
  summary: string;
  objectives: string;
  durationWeeks: number;
  status: 'completed' | 'in_progress' | 'upcoming';
  resourcesCount: number;
  homeworkAssignment?: string;
}

export interface NotificationAlert {
  id: string;
  type: 'exam' | 'finance' | 'announcement' | 'attendance';
  title: string;
  message: string;
  timestamp: string;
  targetRole?: 'all' | 'teachers' | 'parents' | 'admin';
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedId?: string;
  navTab?: 'exams' | 'finances' | 'parentMonitoring' | 'students' | 'library' | 'feedback';
}

export interface LibraryMaterial {
  id: string;
  title: string;
  type: 'course_material' | 'reading_list' | 'reference_doc' | 'exam_prep' | 'e_book';
  category: 'Sciences' | 'Humanities' | 'Languages' | 'Arts' | 'Technical' | 'General';
  subjectName: string;
  schoolLevel: 'primary' | 'middle' | 'high' | 'all';
  targetClasses: string[];
  authorTeacher: string;
  fileFormat: 'PDF' | 'DOCX' | 'EPUB' | 'ZIP' | 'LINK' | 'SLIDES';
  fileSize?: string;
  downloadUrl?: string;
  externalLink?: string;
  description: string;
  readingDurationMinutes?: number;
  uploadedAt: string;
  tags: string[];
  downloadsCount: number;
  isFeatured?: boolean;
}

export interface TeacherFeedback {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectName: string;
  schoolLevel: 'primary' | 'middle' | 'high' | 'all';
  gradeClass: string;
  dateSubmitted: string;
  clarityRating: number;       // Clarté des explications (1-5)
  contentRating: number;       // Qualité des supports de cours (1-5)
  pacingRating: number;        // Rythme du cours (1-5)
  engagementRating: number;    // Écoute & Disponibilité (1-5)
  fairnessRating: number;      // Équité des devoirs et barèmes (1-5)
  overallRating: number;       // Score global moyen (1-5)
  positiveHighlights?: string; // Points forts
  improvementSuggestions?: string; // Pistes d'amélioration
  categoryTag?: 'clarity' | 'pacing' | 'content' | 'homework' | 'pedagogy';
  teacherActionNote?: string;  // Plan d'action ou réponse pédagogique
  status: 'published' | 'reviewed';
}

export type ResourceCategory = 'lab' | 'sports' | 'auditorium' | 'equipment';

export interface FacilityResource {
  id: string;
  name: string;
  category: ResourceCategory;
  location: string;
  capacity: number;
  equipmentList: string[];
  status: 'available' | 'maintenance' | 'reserved';
  schoolLevel: 'primary' | 'middle' | 'high' | 'all';
  description?: string;
  iconName?: string;
}

export interface ResourceReservation {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceCategory: ResourceCategory;
  staffId: string;
  staffName: string;
  staffRole?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. '08:30 - 10:30'
  purpose: string; // e.g. 'TP Chimie Organique'
  targetClass: string; // e.g. 'Terminale S1'
  equipmentRequested?: string[];
  notes?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
}

