import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
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

// Local storage keys for caching and resilient offline state
const STORAGE_PREFIX = 'eduschool_';

function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('Storage set error', err);
  }
}

export class SchoolService {
  // Sync state flags
  private static seeded = false;

  // Generic collection loader with local cache fallback
  static async loadCollection<T extends { id: string }>(
    colName: string,
    initialData: T[]
  ): Promise<T[]> {
    try {
      const snap = await getDocs(collection(db, colName));
      if (snap.empty) {
        // Return local or seed if first run
        const local = getLocal<T[]>(colName, initialData);
        // Async seed into Firestore in background
        this.backgroundSeed(colName, local);
        return local;
      }
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as T));
      setLocal(colName, data);
      return data;
    } catch (error) {
      console.warn(`Firestore read fallback for ${colName}:`, error);
      return getLocal<T[]>(colName, initialData);
    }
  }

  // Subscribe with onSnapshot
  static subscribeCollection<T extends { id: string }>(
    colName: string,
    initialData: T[],
    callback: (items: T[]) => void
  ): () => void {
    // Provide initial immediately
    const cached = getLocal<T[]>(colName, initialData);
    callback(cached);

    try {
      const unsubscribe = onSnapshot(
        collection(db, colName),
        (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as T));
            setLocal(colName, items);
            callback(items);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, colName);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.warn(`Could not attach real-time listener for ${colName}:`, error);
      return () => {};
    }
  }

  // Background seed helper
  private static async backgroundSeed<T extends { id: string }>(colName: string, items: T[]) {
    if (this.seeded) return;
    try {
      for (const item of items) {
        await setDoc(doc(db, colName, item.id), item);
      }
    } catch {
      // Ignore background seeding errors
    }
  }

  // Save / Update item
  static async saveItem<T extends { id: string }>(
    colName: string,
    item: T
  ): Promise<void> {
    // 1. Update local cache immediately for snappy UI
    const current = getLocal<T[]>(colName, []);
    const idx = current.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      current[idx] = item;
    } else {
      current.unshift(item);
    }
    setLocal(colName, current);

    // 2. Persist to Firestore
    try {
      await setDoc(doc(db, colName, item.id), item);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${colName}/${item.id}`);
    }
  }

  // Delete item
  static async deleteItem<T extends { id: string }>(
    colName: string,
    itemId: string
  ): Promise<void> {
    const current = getLocal<T[]>(colName, []);
    const filtered = current.filter(i => i.id !== itemId);
    setLocal(colName, filtered);

    try {
      await deleteDoc(doc(db, colName, itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${colName}/${itemId}`);
    }
  }

  // Reset database with default seed data
  static async resetToSampleData(): Promise<void> {
    setLocal('teachers', initialTeachers);
    setLocal('students', initialStudents);
    setLocal('staff', initialStaff);
    setLocal('finances', initialFinances);
    setLocal('exams', initialExams);
    setLocal('grades', initialGrades);
    setLocal('attendance', initialAttendance);
    setLocal('parentMonitoring', initialParentMonitoring);
    setLocal('subjects', initialSubjects);
    setLocal('courseModules', initialCourseModules);
    setLocal('libraryMaterials', initialLibraryMaterials);
    setLocal('teacherFeedback', initialTeacherFeedback);

    try {
      await Promise.all([
        ...initialTeachers.map(t => setDoc(doc(db, 'teachers', t.id), t)),
        ...initialStudents.map(s => setDoc(doc(db, 'students', s.id), s)),
        ...initialStaff.map(st => setDoc(doc(db, 'staff', st.id), st)),
        ...initialFinances.map(f => setDoc(doc(db, 'finances', f.id), f)),
        ...initialExams.map(e => setDoc(doc(db, 'exams', e.id), e)),
        ...initialGrades.map(g => setDoc(doc(db, 'grades', g.id), g)),
        ...initialAttendance.map(a => setDoc(doc(db, 'attendance', a.id), a)),
        ...initialParentMonitoring.map(p => setDoc(doc(db, 'parentMonitoring', p.id), p)),
        ...initialSubjects.map(sub => setDoc(doc(db, 'subjects', sub.id), sub)),
        ...initialCourseModules.map(m => setDoc(doc(db, 'courseModules', m.id), m)),
        ...initialLibraryMaterials.map(l => setDoc(doc(db, 'libraryMaterials', l.id), l)),
        ...initialTeacherFeedback.map(fb => setDoc(doc(db, 'teacherFeedback', fb.id), fb)),
      ]);
    } catch (err) {
      console.warn('Reset remote sync warning:', err);
    }
  }
}
