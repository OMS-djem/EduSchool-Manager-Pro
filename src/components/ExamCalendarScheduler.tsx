import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Move,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Sparkles,
  BookOpen,
  User,
  GraduationCap,
  UserCheck,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { Exam, SchoolLevel } from '../types';
import { checkExamConflicts } from '../services/examSchedulerEngine';
import { AutomatedExamSchedulerModal } from './AutomatedExamSchedulerModal';

interface ExamCalendarSchedulerProps {
  exams: Exam[];
  saveExam: (exam: Exam) => Promise<void>;
  schoolLevel: SchoolLevel;
  selectedTerm: string;
  language: 'fr' | 'en';
}

const AVAILABLE_ROOMS = [
  { name: 'Salle 204 (Lycée)', level: 'high', capacity: 35 },
  { name: 'Salle 205 (Lycée)', level: 'high', capacity: 35 },
  { name: 'Amphithéâtre Jean Jaurès', level: 'high', capacity: 120 },
  { name: 'Labo Sciences & Physique', level: 'high', capacity: 28 },
  { name: 'Labo Chimie 2', level: 'high', capacity: 26 },
  { name: 'Salle B12 (Collège)', level: 'middle', capacity: 30 },
  { name: 'Salle B14 (Collège)', level: 'middle', capacity: 30 },
  { name: 'Labo SVT 1', level: 'middle', capacity: 28 },
  { name: 'Salle Polyvalente Collège', level: 'middle', capacity: 60 },
  { name: 'Salle CM2-A', level: 'primary', capacity: 26 },
  { name: 'Salle Polyvalente Primaire', level: 'primary', capacity: 50 },
  { name: 'Centre d’Examen CDI', level: 'all', capacity: 45 },
  { name: 'Grand Gymnase Sportif', level: 'all', capacity: 200 },
];

export const ExamCalendarScheduler: React.FC<ExamCalendarSchedulerProps> = ({
  exams,
  saveExam,
  schoolLevel,
  selectedTerm,
  language,
}) => {
  // Calendar base: October 2024 as default academic demo month, can navigate
  const [currentDate, setCurrentDate] = useState(new Date(2024, 9, 1)); // October 2024
  const [draggedExamId, setDraggedExamId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState('all');
  const [editingRoomExam, setEditingRoomExam] = useState<Exam | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Edit room modal fields
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('08:30 - 10:30');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedInvigilator, setSelectedInvigilator] = useState('Prof. Laurent Diallo');
  const [isAutoSchedulerOpen, setIsAutoSchedulerOpen] = useState(false);

  // List of unique classes
  const classesList = Array.from(new Set(exams.map((e) => e.gradeClass)));

  // Navigation helpers
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date(2024, 9, 1)); // anchor to academic start
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  // Convert Sunday (0) to 6, Monday (1) to 0
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Month names
  const monthNamesFr = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthTitle = `${language === 'fr' ? monthNamesFr[month] : monthNamesEn[month]} ${year}`;

  const weekDaysFr = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const weekDaysEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDays = language === 'fr' ? weekDaysFr : weekDaysEn;

  // Filter exams for this view
  const filteredExams = exams.filter((e) => {
    const matchLevel = schoolLevel === 'all' || e.schoolLevel === schoolLevel;
    const matchClass = classFilter === 'all' || e.gradeClass === classFilter;
    return matchLevel && matchClass;
  });

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, exam: Exam) => {
    setDraggedExamId(exam.id);
    e.dataTransfer.setData('text/plain', exam.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const examId = e.dataTransfer.getData('text/plain') || draggedExamId;
    if (!examId) return;

    const examToUpdate = exams.find((ex) => ex.id === examId);
    if (!examToUpdate) return;

    if (examToUpdate.examDate === targetDateStr) return;

    // Check for room & invigilator conflicts on target date
    const conflictCheck = checkExamConflicts(
      {
        id: examToUpdate.id,
        examDate: targetDateStr,
        timeSlot: examToUpdate.timeSlot,
        room: examToUpdate.room,
        invigilatorName: examToUpdate.invigilatorName,
        gradeClass: examToUpdate.gradeClass,
      },
      exams
    );

    const updatedExam: Exam = {
      ...examToUpdate,
      examDate: targetDateStr,
    };

    await saveExam(updatedExam);
    setDraggedExamId(null);

    const toast = conflictCheck.hasConflict
      ? (language === 'fr'
          ? `⚠️ Attention (Conflit Détecté) : ${conflictCheck.messages[0]}`
          : `⚠️ Warning (Conflict Detected): ${conflictCheck.messages[0]}`)
      : (language === 'fr'
          ? `✓ Épreuve « ${examToUpdate.title} » reprogrammée sans conflit au ${targetDateStr} !`
          : `✓ Exam "${examToUpdate.title}" successfully rescheduled to ${targetDateStr}!`);

    setNotificationMsg(toast);
    setTimeout(() => setNotificationMsg(null), 4500);
  };

  // Open Room & Invigilator Assignment Modal
  const handleOpenRoomModal = (exam: Exam) => {
    setEditingRoomExam(exam);
    setSelectedRoom(exam.room || AVAILABLE_ROOMS[0].name);
    setSelectedTimeSlot(exam.timeSlot || '08:30 - 10:30');
    setSelectedDate(exam.examDate);
    setSelectedInvigilator(exam.invigilatorName || 'Prof. Laurent Diallo');
  };

  const handleSaveRoomAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomExam) return;

    const conflictCheck = checkExamConflicts(
      {
        id: editingRoomExam.id,
        examDate: selectedDate,
        timeSlot: selectedTimeSlot,
        room: selectedRoom,
        invigilatorName: selectedInvigilator,
        gradeClass: editingRoomExam.gradeClass,
      },
      exams
    );

    if (conflictCheck.hasConflict) {
      const confirmOverride = window.confirm(
        `⚠️ Conflit détecté :\n${conflictCheck.messages.join('\n')}\n\nVoulez-vous quand même enregistrer cette programmation ?`
      );
      if (!confirmOverride) return;
    }

    const updated: Exam = {
      ...editingRoomExam,
      room: selectedRoom,
      timeSlot: selectedTimeSlot,
      examDate: selectedDate,
      invigilatorName: selectedInvigilator,
    };

    await saveExam(updated);
    setEditingRoomExam(null);

    setNotificationMsg(
      language === 'fr'
        ? `✓ Salle « ${selectedRoom} » et surveillant « ${selectedInvigilator} » assignés.`
        : `✓ Room "${selectedRoom}" and invigilator "${selectedInvigilator}" assigned.`
    );
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Build calendar matrix
  const calendarCells: {
    dayNum: number;
    dateStr: string;
    isCurrentMonth: boolean;
    isWeekend: boolean;
    exams: Exam[];
  }[] = [];

  // Previous month trailing days
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, day);
    const dateStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      dayNum: day,
      dateStr,
      isCurrentMonth: false,
      isWeekend: false,
      exams: filteredExams.filter((ex) => ex.examDate === dateStr),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    calendarCells.push({
      dayNum: d,
      dateStr,
      isCurrentMonth: true,
      isWeekend,
      exams: filteredExams.filter((ex) => ex.examDate === dateStr),
    });
  }

  // Next month trailing days to complete grid
  const remainingCells = 42 - calendarCells.length;
  for (let nextD = 1; nextD <= remainingCells; nextD++) {
    const nextMonthDate = new Date(year, month + 1, nextD);
    const dateStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-${String(nextD).padStart(2, '0')}`;
    calendarCells.push({
      dayNum: nextD,
      dateStr,
      isCurrentMonth: false,
      isWeekend: false,
      exams: filteredExams.filter((ex) => ex.examDate === dateStr),
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-800">
      {/* Toast Notification Banner */}
      {notificationMsg && (
        <div className="p-3 bg-indigo-900 text-white text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-300 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Calendar Toolbar Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base tracking-tight">
              {language === 'fr' ? 'Planning & Calendrier des Examens' : 'Exam Calendar & Room Scheduling'}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
              Glisser-Déposer / Drag & Drop
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'fr'
              ? 'Glissez une épreuve d’un jour à l’autre pour reprogrammer sa date et attribuez les salles d’examen.'
              : 'Drag and drop exams between dates to reschedule, and assign examination rooms.'}
          </p>
        </div>

        {/* Calendar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-800 text-white">Toutes Classes</option>
              {classesList.map((cls) => (
                <option key={cls} value={cls} className="bg-slate-800 text-white">
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Month Steppers */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={prevMonth}
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition-colors"
              title="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-white px-2.5 whitespace-nowrap min-w-32 text-center text-xs">
              {monthTitle}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition-colors"
              title="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            Oct 2024
          </button>

          <button
            onClick={() => setIsAutoSchedulerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Outil de planification automatique et anti-conflits"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Planification Auto</span>
          </button>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center font-bold text-xs text-slate-600 py-2">
        {weekDays.map((d, i) => (
          <div key={i} className={i >= 5 ? 'text-slate-400' : ''}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid (42 cells: 6 rows x 7 days) */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 min-h-[540px] bg-slate-100">
        {calendarCells.map((cell, idx) => {
          const isTargeted = dragOverDate === cell.dateStr;
          const hasExams = cell.exams.length > 0;

          return (
            <div
              key={idx}
              onDragOver={(e) => handleDragOver(e, cell.dateStr)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, cell.dateStr)}
              className={`p-1.5 sm:p-2 flex flex-col justify-between min-h-[95px] sm:min-h-[115px] transition-all relative ${
                !cell.isCurrentMonth
                  ? 'bg-slate-50/70 text-slate-400'
                  : cell.isWeekend
                  ? 'bg-slate-50/40 text-slate-600'
                  : 'bg-white text-slate-800'
              } ${
                isTargeted
                  ? 'bg-indigo-100/90 ring-2 ring-indigo-500 ring-inset z-10'
                  : ''
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                    cell.dateStr === '2024-10-24'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : cell.isCurrentMonth
                      ? 'text-slate-700'
                      : 'text-slate-300'
                  }`}
                >
                  {cell.dayNum}
                </span>

                {isTargeted && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-200/80 px-1.5 py-0.2 rounded animate-pulse">
                    Déposer ici
                  </span>
                )}
              </div>

              {/* Scheduled Exams in this Date Cell */}
              <div className="space-y-1.5 flex-1 overflow-y-auto">
                {cell.exams.map((exam) => (
                  <div
                    key={exam.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, exam)}
                    className="p-1.5 rounded-lg bg-gradient-to-r from-slate-900 to-indigo-950 text-white text-[11px] shadow-xs cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.02] transition-all border border-indigo-500/30 group"
                  >
                    {/* Exam Title & Drag Indicator */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-bold truncate text-[11px] text-white">
                        {exam.subject}
                      </div>
                      <Move className="w-2.5 h-2.5 text-indigo-300 shrink-0 opacity-60 group-hover:opacity-100" />
                    </div>

                    <div className="text-[10px] text-indigo-200 truncate mt-0.5">
                      {exam.gradeClass} • Coeff: {exam.coefficient}
                    </div>

                    {/* Room & Time Pill (Clickable to Edit Room) */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRoomModal(exam);
                      }}
                      className="mt-1 pt-1 border-t border-slate-700/80 flex items-center justify-between text-[9px] text-slate-300 hover:text-white cursor-pointer bg-slate-800/60 px-1 py-0.5 rounded"
                      title="Cliquez pour changer la salle ou l'horaire"
                    >
                      <span className="flex items-center gap-1 font-semibold text-emerald-300 truncate">
                        <MapPin className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
                        <span className="truncate">{exam.room || 'Sans salle'}</span>
                      </span>

                      {exam.timeSlot && (
                        <span className="text-[9px] text-slate-400 shrink-0 ml-1">
                          {exam.timeSlot.split('-')[0].trim()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick drag indicator prompt when empty */}
              {!hasExams && isTargeted && (
                <div className="text-[10px] text-center text-indigo-600 font-semibold py-1">
                  Glisser l'épreuve ici
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Room Legend & Instructions Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Salles Principales :</span>
          </span>
          <span className="text-[11px] text-slate-500">
            Amphithéâtre (120p) • Labo Physique (28p) • Labo SVT (28p) • Salles 204-205 (35p) • Polyvalente Primaire (50p)
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-indigo-700 font-medium">
            <Move className="w-3 h-3" />
            <span>Glissez-déposez n'importe quelle carte sur un jour</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">
            Cliquez sur le badge salle pour réassigner
          </span>
        </div>
      </div>

      {/* Room & Schedule Assignment Modal */}
      {editingRoomExam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {language === 'fr' ? 'Attribution de Salle & Horaire' : 'Room & Time Assignment'}
                  </h3>
                  <p className="text-[11px] text-slate-500">{editingRoomExam.title}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRoomExam(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoomAssignment} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Salle d'Examen assignée
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {AVAILABLE_ROOMS.map((rm) => (
                    <option key={rm.name} value={rm.name}>
                      {rm.name} (Capacité: {rm.capacity} places - {rm.level.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Surveillant(e) d'Examen Désigné(e)</span>
                </label>
                <input
                  type="text"
                  required
                  value={selectedInvigilator}
                  onChange={(e) => setSelectedInvigilator(e.target.value)}
                  placeholder="Nom du surveillant (ex: Prof. Laurent Diallo)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Créneau Horaire</span>
                  </label>
                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="08:00 - 10:00">08:00 - 10:00 (Matin 1)</option>
                    <option value="08:30 - 10:30">08:30 - 10:30</option>
                    <option value="10:00 - 12:00">10:00 - 12:00 (Matin 2)</option>
                    <option value="13:30 - 15:30">13:30 - 15:30 (Après-midi 1)</option>
                    <option value="14:00 - 16:00">14:00 - 16:00</option>
                    <option value="15:30 - 17:30">15:30 - 17:30 (Après-midi 2)</option>
                    <option value="13:30 - 17:30">13:30 - 17:30 (Grand Devoir 4h)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Date Programmée</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Real-time Conflict Detector */}
              {(() => {
                const check = checkExamConflicts(
                  {
                    id: editingRoomExam.id,
                    examDate: selectedDate,
                    timeSlot: selectedTimeSlot,
                    room: selectedRoom,
                    invigilatorName: selectedInvigilator,
                    gradeClass: editingRoomExam.gradeClass,
                  },
                  exams
                );

                if (check.hasConflict) {
                  return (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Conflit Détecté :</span>
                      </div>
                      {check.messages.map((m, idx) => (
                        <p key={idx} className="text-[11px] text-rose-700 leading-tight">
                          • {m}
                        </p>
                      ))}
                    </div>
                  );
                }

                return (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Salle & Surveillant disponibles sans aucun conflit.</span>
                  </div>
                );
              })()}

              {/* Target info preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Classe concernée :</span>
                  <strong className="text-slate-800">{editingRoomExam.gradeClass} ({editingRoomExam.schoolLevel.toUpperCase()})</strong>
                </div>
                <div className="flex justify-between">
                  <span>Discipline / Matière :</span>
                  <strong className="text-indigo-700">{editingRoomExam.subject}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Correcteur :</span>
                  <span>{editingRoomExam.teacherName || 'Non assigné'}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRoomExam(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Enregistrer l'Attribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Automated Exam Scheduler Modal */}
      {isAutoSchedulerOpen && (
        <AutomatedExamSchedulerModal
          onClose={() => setIsAutoSchedulerOpen(false)}
        />
      )}
    </div>
  );
};
