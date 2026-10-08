import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SchoolLevel,
  Language,
  Teacher,
  Student,
  Staff,
  FinanceTransaction,
  Exam,
  Grade,
  AttendanceRecord,
  ParentMonitoringItem,
  Subject,
  CourseModule,
  LibraryMaterial,
  TeacherFeedback
} from '../types';
import {
  initialTeachers,
  initialStudents,
  initialStaff,
  initialFinances,
  initialExams,
  initialGrades,
  initialAttendance,
  initialParentMonitoring,
  initialSubjects,
  initialCourseModules,
  initialLibraryMaterials,
  initialTeacherFeedback
} from '../data/mockSeedData';
import { SchoolService } from '../services/schoolService';
import { testConnection } from '../lib/firebase';

interface SchoolContextType {
  schoolLevel: SchoolLevel;
  setSchoolLevel: (level: SchoolLevel) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  academicYear: string;
  setAcademicYear: (year: string) => void;
  selectedTerm: 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3';
  setSelectedTerm: (term: 'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3') => void;
  
  // Data lists
  teachers: Teacher[];
  students: Student[];
  staff: Staff[];
  finances: FinanceTransaction[];
  exams: Exam[];
  grades: Grade[];
  attendance: AttendanceRecord[];
  parentMonitoring: ParentMonitoringItem[];
  subjects: Subject[];
  courseModules: CourseModule[];
  libraryMaterials: LibraryMaterial[];
  teacherFeedback: TeacherFeedback[];

  // Mutators
  saveTeacher: (teacher: Teacher) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  saveStudent: (student: Student) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  saveStaff: (staffMember: Staff) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  saveFinance: (transaction: FinanceTransaction) => Promise<void>;
  deleteFinance: (id: string) => Promise<void>;
  saveExam: (exam: Exam) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  saveGrade: (grade: Grade) => Promise<void>;
  saveAttendance: (record: AttendanceRecord) => Promise<void>;
  saveParentMonitoring: (item: ParentMonitoringItem) => Promise<void>;
  saveSubject: (subject: Subject) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  saveCourseModule: (module: CourseModule) => Promise<void>;
  deleteCourseModule: (id: string) => Promise<void>;
  saveLibraryMaterial: (material: LibraryMaterial) => Promise<void>;
  deleteLibraryMaterial: (id: string) => Promise<void>;
  saveTeacherFeedback: (feedback: TeacherFeedback) => Promise<void>;
  deleteTeacherFeedback: (id: string) => Promise<void>;

  resetData: () => Promise<void>;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    appTitle: 'EduSchool Manager Pro',
    appSubtitle: 'Système Intégré de Gestion Primaire - Collège - Lycée',
    allLevels: 'Tous Niveaux',
    primary: 'Primaire (Élémentaire)',
    middle: 'Collège (Secondaire 1)',
    high: 'Lycée (Secondaire 2)',
    dashboard: 'Tableau de Bord',
    teachers: 'Enseignants',
    students: 'Élèves & Inscriptions',
    staff: 'Personnel & Administration',
    finances: 'Finances & Écolage',
    exams: 'Examens & Bulletins',
    parentMonitoring: 'Suivi Parental',
    curriculum: 'Matières & Cours',
    settings: 'Configuration',
    totalStudents: 'Total Élèves',
    teachersCount: 'Corps Enseignant',
    staffCount: 'Personnel Administratif',
    collectedTuition: 'Taux de Recouvrement',
    avgAttendance: 'Présence Moyenne',
    activeExams: 'Examens Prévus',
    addTeacher: 'Ajouter Enseignant',
    addStudent: 'Inscrire un Élève',
    addStaff: 'Ajouter Personnel',
    recordPayment: 'Encaisser Frais',
    createExam: 'Planifier Examen',
    addModule: 'Nouveau Chapitre',
    search: 'Rechercher...',
    filterByLevel: 'Filtrer par niveau',
    status: 'Statut',
    active: 'Actif',
    onLeave: 'En congé',
    paid: 'Soldé',
    partial: 'Partiel',
    unpaid: 'Impayé',
    actions: 'Actions',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    reportCard: 'Bulletin de Notes',
    generateBulletin: 'Générer Bulletin',
    academicYearLabel: 'Année Scolaire',
    termLabel: 'Période',
    resetSeed: 'Réinitialiser Données Démo',
  },
  en: {
    appTitle: 'EduSchool Manager Pro',
    appSubtitle: 'Integrated K-12 School Management Suite',
    allLevels: 'All Levels',
    primary: 'Primary (Elementary)',
    middle: 'Middle School (Junior)',
    high: 'High School (Senior)',
    dashboard: 'Dashboard',
    teachers: 'Teachers',
    students: 'Students & Enrollment',
    staff: 'Staff & Administration',
    finances: 'Finances & Tuition',
    exams: 'Exams & Report Cards',
    parentMonitoring: 'Parental Monitoring',
    curriculum: 'Subjects & Modules',
    settings: 'Settings',
    totalStudents: 'Total Students',
    teachersCount: 'Teaching Staff',
    staffCount: 'Admin & Support Staff',
    collectedTuition: 'Tuition Recovery Rate',
    avgAttendance: 'Average Attendance',
    activeExams: 'Active Exams',
    addTeacher: 'Add Teacher',
    addStudent: 'Enroll Student',
    addStaff: 'Add Staff Member',
    recordPayment: 'Record Payment',
    createExam: 'Schedule Exam',
    addModule: 'New Course Module',
    search: 'Search...',
    filterByLevel: 'Filter by level',
    status: 'Status',
    active: 'Active',
    onLeave: 'On Leave',
    paid: 'Paid',
    partial: 'Partial',
    unpaid: 'Unpaid',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    reportCard: 'Report Card',
    generateBulletin: 'Generate Report Card',
    academicYearLabel: 'Academic Year',
    termLabel: 'Term',
    resetSeed: 'Reset Demo Data',
  },
  ar: {
    appTitle: 'إيدو سكول برو (EduSchool)',
    appSubtitle: 'النظام المتكامل لإدارة المدارس: الابتدائي • الإعدادي • الثانوي',
    allLevels: 'جميع المستويات',
    primary: 'الابتدائي',
    middle: 'الإعدادي (المتوسط)',
    high: 'الثانوي',
    dashboard: 'لوحة القيادة',
    teachers: 'المعلمون والأساتذة',
    students: 'الطلاب والتسجيل',
    staff: 'الموظفون والإدارة',
    finances: 'المالية والرسوم الدراسية',
    exams: 'الامتحانات وكشوف النقاط',
    parentMonitoring: 'متابعة أولياء الأمور',
    curriculum: 'المواد والوحدات الدراسية',
    settings: 'الإعدادات والنظام',
    totalStudents: 'إجمالي الطلاب',
    teachersCount: 'الهيئة التدريسية',
    staffCount: 'الطاقم الإداري',
    collectedTuition: 'نسبة تحصيل الرسوم',
    avgAttendance: 'متوسط الحضور',
    activeExams: 'الامتحانات المبرمجة',
    addTeacher: 'إضافة أستاذ',
    addStudent: 'تسجيل طالب جديد',
    addStaff: 'إضافة موظف',
    recordPayment: 'تسجيل دفعة مالية',
    createExam: 'برمجة امتحان',
    addModule: 'إضافة وحدة دراسية',
    search: 'بحث...',
    filterByLevel: 'تصفية حسب المستوى',
    status: 'الحالة',
    active: 'نشط',
    onLeave: 'في إجازة',
    paid: 'مدفوع بالكامل',
    partial: 'مدفوع جزئياً',
    unpaid: 'غير مدفوع',
    actions: 'إجراءات',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    reportCard: 'كشف النقاط',
    generateBulletin: 'إصدار كشف النقاط',
    academicYearLabel: 'السنة الدراسية',
    termLabel: 'الفصل الدراسي',
    resetSeed: 'إعادة تعيين البيانات التجريبية',
  }
};

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>('all');
  const [language, setLanguage] = useState<Language>('fr');
  const [academicYear, setAcademicYear] = useState('2024 - 2025');
  const [selectedTerm, setSelectedTerm] = useState<'Trimestre 1' | 'Trimestre 2' | 'Trimestre 3'>('Trimestre 1');

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Datasets
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [finances, setFinances] = useState<FinanceTransaction[]>(initialFinances);
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [grades, setGrades] = useState<Grade[]>(initialGrades);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [parentMonitoring, setParentMonitoring] = useState<ParentMonitoringItem[]>(initialParentMonitoring);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [courseModules, setCourseModules] = useState<CourseModule[]>(initialCourseModules);
  const [libraryMaterials, setLibraryMaterials] = useState<LibraryMaterial[]>(initialLibraryMaterials);
  const [teacherFeedback, setTeacherFeedback] = useState<TeacherFeedback[]>(initialTeacherFeedback);

  // Initialize and attach Firestore listeners
  useEffect(() => {
    testConnection();

    const unsubTeachers = SchoolService.subscribeCollection('teachers', initialTeachers, setTeachers);
    const unsubStudents = SchoolService.subscribeCollection('students', initialStudents, setStudents);
    const unsubStaff = SchoolService.subscribeCollection('staff', initialStaff, setStaff);
    const unsubFinances = SchoolService.subscribeCollection('finances', initialFinances, setFinances);
    const unsubExams = SchoolService.subscribeCollection('exams', initialExams, setExams);
    const unsubGrades = SchoolService.subscribeCollection('grades', initialGrades, setGrades);
    const unsubAttendance = SchoolService.subscribeCollection('attendance', initialAttendance, setAttendance);
    const unsubMonitoring = SchoolService.subscribeCollection('parentMonitoring', initialParentMonitoring, setParentMonitoring);
    const unsubSubjects = SchoolService.subscribeCollection('subjects', initialSubjects, setSubjects);
    const unsubModules = SchoolService.subscribeCollection('courseModules', initialCourseModules, setCourseModules);
    const unsubLibrary = SchoolService.subscribeCollection('libraryMaterials', initialLibraryMaterials, setLibraryMaterials);
    const unsubFeedback = SchoolService.subscribeCollection('teacherFeedback', initialTeacherFeedback, setTeacherFeedback);

    return () => {
      unsubTeachers();
      unsubStudents();
      unsubStaff();
      unsubFinances();
      unsubExams();
      unsubGrades();
      unsubAttendance();
      unsubMonitoring();
      unsubSubjects();
      unsubModules();
      unsubLibrary();
      unsubFeedback();
    };
  }, []);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const saveTeacher = async (teacher: Teacher) => {
    await SchoolService.saveItem('teachers', teacher);
  };
  const deleteTeacher = async (id: string) => {
    await SchoolService.deleteItem('teachers', id);
  };

  const saveStudent = async (student: Student) => {
    await SchoolService.saveItem('students', student);
  };
  const deleteStudent = async (id: string) => {
    await SchoolService.deleteItem('students', id);
  };

  const saveStaff = async (st: Staff) => {
    await SchoolService.saveItem('staff', st);
  };
  const deleteStaff = async (id: string) => {
    await SchoolService.deleteItem('staff', id);
  };

  const saveFinance = async (fin: FinanceTransaction) => {
    await SchoolService.saveItem('finances', fin);
  };
  const deleteFinance = async (id: string) => {
    await SchoolService.deleteItem('finances', id);
  };

  const saveExam = async (exam: Exam) => {
    await SchoolService.saveItem('exams', exam);
  };
  const deleteExam = async (id: string) => {
    await SchoolService.deleteItem('exams', id);
  };

  const saveGrade = async (grade: Grade) => {
    await SchoolService.saveItem('grades', grade);
  };

  const saveAttendance = async (record: AttendanceRecord) => {
    await SchoolService.saveItem('attendance', record);
  };

  const saveParentMonitoring = async (item: ParentMonitoringItem) => {
    await SchoolService.saveItem('parentMonitoring', item);
  };

  const saveSubject = async (subject: Subject) => {
    await SchoolService.saveItem('subjects', subject);
  };
  const deleteSubject = async (id: string) => {
    await SchoolService.deleteItem('subjects', id);
  };

  const saveCourseModule = async (module: CourseModule) => {
    await SchoolService.saveItem('courseModules', module);
  };
  const deleteCourseModule = async (id: string) => {
    await SchoolService.deleteItem('courseModules', id);
  };

  const saveLibraryMaterial = async (material: LibraryMaterial) => {
    await SchoolService.saveItem('libraryMaterials', material);
  };
  const deleteLibraryMaterial = async (id: string) => {
    await SchoolService.deleteItem('libraryMaterials', id);
  };

  const saveTeacherFeedback = async (feedback: TeacherFeedback) => {
    await SchoolService.saveItem('teacherFeedback', feedback);
  };
  const deleteTeacherFeedback = async (id: string) => {
    await SchoolService.deleteItem('teacherFeedback', id);
  };

  const resetData = async () => {
    await SchoolService.resetToSampleData();
  };

  return (
    <SchoolContext.Provider
      value={{
        schoolLevel,
        setSchoolLevel,
        language,
        setLanguage,
        academicYear,
        setAcademicYear,
        selectedTerm,
        setSelectedTerm,
        teachers,
        students,
        staff,
        finances,
        exams,
        grades,
        attendance,
        parentMonitoring,
        subjects,
        courseModules,
        libraryMaterials,
        teacherFeedback,
        saveTeacher,
        deleteTeacher,
        saveStudent,
        deleteStudent,
        saveStaff,
        deleteStaff,
        saveFinance,
        deleteFinance,
        saveExam,
        deleteExam,
        saveGrade,
        saveAttendance,
        saveParentMonitoring,
        saveSubject,
        deleteSubject,
        saveCourseModule,
        deleteCourseModule,
        saveLibraryMaterial,
        deleteLibraryMaterial,
        saveTeacherFeedback,
        deleteTeacherFeedback,
        resetData,
        t,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) throw new Error('useSchool must be used within a SchoolProvider');
  return context;
};
