import { Exam } from '../types';

export interface TimeSlot {
  label: string;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
}

export const STANDARD_TIME_SLOTS: TimeSlot[] = [
  { label: '08:30 - 10:30', startHour: 8, startMin: 30, endHour: 10, endMin: 30 },
  { label: '10:45 - 12:45', startHour: 10, startMin: 45, endHour: 12, endMin: 45 },
  { label: '14:00 - 16:00', startHour: 14, startMin: 0, endHour: 16, endMin: 0 },
  { label: '16:15 - 18:15', startHour: 16, startMin: 15, endHour: 18, endMin: 15 },
];

export interface Classroom {
  name: string;
  level: 'all' | 'primary' | 'middle' | 'high';
  capacity: number;
  type: 'general' | 'lab' | 'amphi' | 'sports';
}

export const INSTITUTIONAL_CLASSROOMS: Classroom[] = [
  { name: 'Salle 204 (Lycée)', level: 'high', capacity: 35, type: 'general' },
  { name: 'Salle 205 (Lycée)', level: 'high', capacity: 35, type: 'general' },
  { name: 'Amphithéâtre Jean Jaurès', level: 'high', capacity: 120, type: 'amphi' },
  { name: 'Labo Sciences & Physique', level: 'high', capacity: 28, type: 'lab' },
  { name: 'Labo Chimie 2', level: 'high', capacity: 26, type: 'lab' },
  { name: 'Salle B12 (Collège)', level: 'middle', capacity: 30, type: 'general' },
  { name: 'Salle B14 (Collège)', level: 'middle', capacity: 30, type: 'general' },
  { name: 'Labo SVT 1', level: 'middle', capacity: 28, type: 'lab' },
  { name: 'Salle Polyvalente Collège', level: 'middle', capacity: 60, type: 'amphi' },
  { name: 'Salle CM2-A', level: 'primary', capacity: 26, type: 'general' },
  { name: 'Salle Polyvalente Primaire', level: 'primary', capacity: 50, type: 'general' },
  { name: 'Centre d’Examen CDI', level: 'all', capacity: 45, type: 'general' },
  { name: 'Grand Gymnase Sportif', level: 'all', capacity: 200, type: 'sports' },
];

/**
 * Checks if two time slot strings overlap
 */
export function doTimeSlotsOverlap(slotA?: string, slotB?: string): boolean {
  if (!slotA || !slotB) return false;
  if (slotA === slotB) return true;

  const parseSlot = (slotStr: string) => {
    const parts = slotStr.split('-').map((s) => s.trim());
    if (parts.length < 2) return null;
    const [sh, sm] = parts[0].split(':').map(Number);
    const [eh, em] = parts[1].split(':').map(Number);
    return {
      start: (sh || 0) * 60 + (sm || 0),
      end: (eh || 0) * 60 + (em || 0),
    };
  };

  const parsedA = parseSlot(slotA);
  const parsedB = parseSlot(slotB);
  if (!parsedA || !parsedB) return slotA === slotB;

  return Math.max(parsedA.start, parsedB.start) < Math.min(parsedA.end, parsedB.end);
}

export interface ConflictReport {
  hasConflict: boolean;
  roomConflict?: {
    conflictingExam: Exam;
    roomName: string;
    timeSlot: string;
  };
  invigilatorConflict?: {
    conflictingExam: Exam;
    invigilatorName: string;
    timeSlot: string;
  };
  classConflict?: {
    conflictingExam: Exam;
    className: string;
    timeSlot: string;
  };
  messages: string[];
}

/**
 * Validates whether an exam schedule conflicts with any other scheduled exams
 */
export function checkExamConflicts(
  target: {
    id?: string;
    examDate: string;
    timeSlot?: string;
    room?: string;
    invigilatorName?: string;
    gradeClass: string;
  },
  allExams: Exam[]
): ConflictReport {
  const messages: string[] = [];
  let roomConflict: ConflictReport['roomConflict'];
  let invigilatorConflict: ConflictReport['invigilatorConflict'];
  let classConflict: ConflictReport['classConflict'];

  for (const existing of allExams) {
    // Skip comparing against itself
    if (target.id && existing.id === target.id) continue;

    // Must be on the exact same date
    if (existing.examDate !== target.examDate) continue;

    // Must overlap in time
    if (!doTimeSlotsOverlap(target.timeSlot, existing.timeSlot)) continue;

    // 1. Classroom Conflict: Two exams in the same room at the same time
    if (
      target.room &&
      existing.room &&
      target.room.trim().toLowerCase() === existing.room.trim().toLowerCase()
    ) {
      roomConflict = {
        conflictingExam: existing,
        roomName: target.room,
        timeSlot: existing.timeSlot || 'Horaire non précisé',
      };
      messages.push(
        `Conflit Salle : La salle "${target.room}" est déjà assignée à l'épreuve "${existing.title}" (${existing.timeSlot || 'même créneau'}).`
      );
    }

    // 2. Invigilator Conflict: The same invigilator/surveillant cannot be in two rooms simultaneously
    if (
      target.invigilatorName &&
      existing.invigilatorName &&
      target.invigilatorName.trim().toLowerCase() === existing.invigilatorName.trim().toLowerCase()
    ) {
      invigilatorConflict = {
        conflictingExam: existing,
        invigilatorName: target.invigilatorName,
        timeSlot: existing.timeSlot || 'Horaire non précisé',
      };
      messages.push(
        `Conflit Surveillant : ${target.invigilatorName} est déjà mobilisé(e) pour surveiller l'épreuve "${existing.title}".`
      );
    }

    // 3. Class Conflict: The same student group / class cannot take two exams at the same time
    if (
      target.gradeClass &&
      existing.gradeClass &&
      target.gradeClass.trim().toLowerCase() === existing.gradeClass.trim().toLowerCase()
    ) {
      classConflict = {
        conflictingExam: existing,
        className: target.gradeClass,
        timeSlot: existing.timeSlot || 'Horaire non précisé',
      };
      messages.push(
        `Conflit Classe : Les élèves de ${target.gradeClass} ont déjà l'épreuve "${existing.title}" à cet horaire.`
      );
    }
  }

  const hasConflict = Boolean(roomConflict || invigilatorConflict || classConflict);
  return {
    hasConflict,
    roomConflict,
    invigilatorConflict,
    classConflict,
    messages,
  };
}

export interface AutomatedScheduleResult {
  updatedExams: Exam[];
  resolvedCount: number;
  totalExams: number;
  conflictsEliminated: number;
  assignmentsSummary: Array<{
    examId: string;
    title: string;
    gradeClass: string;
    date: string;
    timeSlot: string;
    room: string;
    invigilator: string;
  }>;
}

/**
 * Constraint-satisfaction automated scheduler:
 * Assigns optimal conflict-free rooms and invigilators to all exams in the roster.
 */
export function autoScheduleExamsWithoutConflicts(
  examsToSchedule: Exam[],
  allExamsPool: Exam[],
  availableRooms: Classroom[],
  availableInvigilators: string[]
): AutomatedScheduleResult {
  const schedulePool: Exam[] = [...allExamsPool];
  const assignmentsSummary: AutomatedScheduleResult['assignmentsSummary'] = [];
  let resolvedCount = 0;
  let conflictsEliminated = 0;

  // Working copy of exams to update
  const updatedExams = examsToSchedule.map((exam) => {
    // If exam has conflicts or missing room/invigilator, re-assign optimally
    const currentConflict = checkExamConflicts(exam, schedulePool);
    if (!currentConflict.hasConflict && exam.room && exam.invigilatorName) {
      return exam; // already optimal
    }

    if (currentConflict.hasConflict) {
      conflictsEliminated++;
    }

    // Find best conflict-free candidate:
    // Try rooms matching exam level first, then all
    const candidateRooms = [
      ...availableRooms.filter((r) => r.level === exam.schoolLevel),
      ...availableRooms.filter((r) => r.level === 'all'),
      ...availableRooms,
    ];

    const candidateSlots = STANDARD_TIME_SLOTS.map((s) => s.label);

    let assignedRoom = exam.room || candidateRooms[0].name;
    let assignedSlot = exam.timeSlot || candidateSlots[0];
    let assignedInvigilator =
      exam.invigilatorName ||
      availableInvigilators[Math.floor(Math.random() * availableInvigilators.length)] ||
      'Professeur Surveillant';
    let assignedDate = exam.examDate;

    // Search for conflict-free room and invigilator combination
    let foundFreeConfig = false;

    for (const r of candidateRooms) {
      for (const slot of candidateSlots) {
        for (const invig of availableInvigilators) {
          // Check if candidate would conflict
          const testCandidate = {
            id: exam.id,
            examDate: assignedDate,
            timeSlot: slot,
            room: r.name,
            invigilatorName: invig,
            gradeClass: exam.gradeClass,
          };

          const check = checkExamConflicts(testCandidate, schedulePool);
          if (!check.hasConflict) {
            assignedRoom = r.name;
            assignedSlot = slot;
            assignedInvigilator = invig;
            foundFreeConfig = true;
            break;
          }
        }
        if (foundFreeConfig) break;
      }
      if (foundFreeConfig) break;
    }

    const updatedExam: Exam = {
      ...exam,
      room: assignedRoom,
      timeSlot: assignedSlot,
      invigilatorName: assignedInvigilator,
    };

    // Update in schedulePool so next exams account for this assignment
    const poolIdx = schedulePool.findIndex((e) => e.id === exam.id);
    if (poolIdx >= 0) {
      schedulePool[poolIdx] = updatedExam;
    } else {
      schedulePool.push(updatedExam);
    }

    resolvedCount++;
    assignmentsSummary.push({
      examId: exam.id,
      title: exam.title,
      gradeClass: exam.gradeClass,
      date: updatedExam.examDate,
      timeSlot: updatedExam.timeSlot || '08:30 - 10:30',
      room: updatedExam.room || 'Salle non assignée',
      invigilator: updatedExam.invigilatorName || 'Surveillant général',
    });

    return updatedExam;
  });

  return {
    updatedExams,
    resolvedCount,
    totalExams: examsToSchedule.length,
    conflictsEliminated,
    assignmentsSummary,
  };
}
