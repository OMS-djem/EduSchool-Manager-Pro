import React, { useState } from 'react';
import {
  FileCheck2,
  Plus,
  BookOpen,
  Award,
  Calendar,
  Edit3,
  UserCheck,
  CheckCircle,
  Clock,
  Printer,
  X,
  FileSpreadsheet,
  BarChart3,
  Calendar as CalendarIcon,
  LayoutGrid,
  MapPin,
  Mail,
  Send,
  Sparkles,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Exam, Grade, Student } from '../types';
import { ReportCardModal } from '../components/ReportCardModal';
import { ExamsAnalyticsD3 } from '../components/ExamsAnalyticsD3';
import { ExamCalendarScheduler } from '../components/ExamCalendarScheduler';
import { ReportCardEmailDispatchModal } from '../components/ReportCardEmailDispatchModal';
import { AutomatedExamSchedulerModal } from '../components/AutomatedExamSchedulerModal';
import { checkExamConflicts } from '../services/examSchedulerEngine';

export const ExamsView: React.FC = () => {
  const {
    schoolLevel,
    selectedTerm,
    setSelectedTerm,
    exams,
    grades,
    students,
    subjects,
    teachers,
    saveExam,
    saveGrade,
    language,
    t
  } = useSchool();

  const [viewMode, setViewMode] = useState<'calendar' | 'cards'>('calendar');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [activeGradeExam, setActiveGradeExam] = useState<Exam | null>(null);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  const [isEmailDispatchOpen, setIsEmailDispatchOpen] = useState(false);
  const [emailTargetClass, setEmailTargetClass] = useState<string>('Terminale S1');
  const [isAutoSchedulerOpen, setIsAutoSchedulerOpen] = useState(false);

  // New Exam Form
  const [title, setTitle] = useState('');
  const [examLevel, setExamLevel] = useState<'primary' | 'middle' | 'high'>(
    schoolLevel === 'all' ? 'high' : schoolLevel
  );
  const [gradeClass, setGradeClass] = useState('Terminale S1');
  const [subject, setSubject] = useState('Mathématiques');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [room, setRoom] = useState('Salle 204 (Lycée)');
  const [timeSlot, setTimeSlot] = useState('08:30 - 10:30');
  const [invigilatorName, setInvigilatorName] = useState('Prof. Marc Dubois');
  const [maxScore, setMaxScore] = useState(20);
  const [coefficient, setCoefficient] = useState(4);
  const [status, setStatus] = useState<Exam['status']>('scheduled');
  const [teacherName, setTeacherName] = useState('Prof. Laurent Diallo');

  const filteredExams = exams.filter((e) => {
    const matchesLevel = schoolLevel === 'all' || e.schoolLevel === schoolLevel;
    const matchesTerm = e.term === selectedTerm;
    return matchesLevel && matchesTerm;
  });

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    const conflictCheck = checkExamConflicts(
      {
        examDate,
        timeSlot,
        room,
        invigilatorName,
        gradeClass,
      },
      exams
    );

    if (conflictCheck.hasConflict) {
      const confirmCreate = window.confirm(
        `⚠️ Conflit de planification détecté :\n${conflictCheck.messages.join('\n')}\n\nVoulez-vous forcer l'enregistrement ou modifier la salle / surveillant ?`
      );
      if (!confirmCreate) return;
    }

    const newExam: Exam = {
      id: `ex-${Date.now()}`,
      title,
      term: selectedTerm,
      schoolLevel: examLevel,
      gradeClass,
      subject,
      examDate,
      room,
      timeSlot,
      invigilatorName,
      maxScore: Number(maxScore),
      coefficient: Number(coefficient),
      status,
      teacherName,
    };
    await saveExam(newExam);
    setIsAddExamModalOpen(false);
  };

  // Grade Entry Matrix for an Exam
  const examStudents = students.filter(
    (s) => s.gradeClass === activeGradeExam?.gradeClass
  );

  return (
    <div className="space-y-6">
      {/* Title & Term Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {language === 'fr' ? 'Évaluations, Examens & Bulletins Scolaires' : 'Examinations & Report Cards'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'fr'
              ? 'Devoirs surveillés, compositions, relevés de notes pondérés et procès-verbaux.'
              : 'Continuous assessments, formal trimesters, weighted grading, and class councils.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Calendar vs Cards View Mode Toggle */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Planning Calendrier' : 'Calendar View'}</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Vue Cartes' : 'Cards View'}</span>
            </button>
          </div>

          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showAnalytics
                ? 'bg-slate-900 text-white border-slate-800 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>{showAnalytics ? 'Masquer Graphiques' : 'Analytique D3.js'}</span>
          </button>

          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            {(['Trimestre 1', 'Trimestre 2', 'Trimestre 3'] as const).map((term) => (
              <button
                key={term}
                onClick={() => setSelectedTerm(term)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedTerm === term
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {term}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAutoSchedulerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Optimisation automatique et détection des conflits de salles et surveillants"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Planification Anti-Conflits</span>
          </button>

          <button
            onClick={() => {
              setEmailTargetClass(students[0]?.gradeClass || 'Terminale S1');
              setIsEmailDispatchOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Diffuser automatiquement les résumés des bulletins par email à tous les parents"
          >
            <Mail className="w-4 h-4" />
            <span>Diffuser Bulletins (Email)</span>
          </button>

          <button
            onClick={() => setIsAddExamModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('createExam')}</span>
          </button>
        </div>
      </div>

      {/* D3.js Analytics Visualization Component */}
      {showAnalytics && (
        <ExamsAnalyticsD3
          exams={exams}
          grades={grades}
          students={students}
          subjects={subjects}
          schoolLevel={schoolLevel}
          selectedTerm={selectedTerm}
          language={language}
        />
      )}

      {/* Main View: Drag & Drop Calendar Scheduler OR Cards Grid */}
      {viewMode === 'calendar' ? (
        <ExamCalendarScheduler
          exams={exams}
          saveExam={saveExam}
          schoolLevel={schoolLevel}
          selectedTerm={selectedTerm}
          language={language}
        />
      ) : (
        <>
          {/* Section Title for Exam Planning */}
          <div className="flex items-center justify-between pt-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>{language === 'fr' ? 'Épreuves & Devoirs Programmés' : 'Scheduled Exam Sessions'}</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {filteredExams.length} {language === 'fr' ? 'épreuve(s) trouvée(s)' : 'session(s)'}
            </span>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExams.map((exam) => {
              // Grades linked to this exam
              const examGrades = grades.filter((g) => g.examId === exam.id);
              const avg = examGrades.length > 0
                ? (examGrades.reduce((acc, g) => acc + g.score, 0) / examGrades.length).toFixed(1)
                : null;

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {exam.subject}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          exam.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {exam.status === 'published' ? 'Publié' : 'En saisie'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mt-2.5 leading-snug">
                      {exam.title}
                    </h3>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Classe cible :</span>
                        <strong className="text-slate-800">{exam.gradeClass} ({exam.schoolLevel.toUpperCase()})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Salle assignée :</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{exam.room || 'À attribuer'}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date & Horaire :</span>
                        <span className="font-medium text-slate-800">
                          {exam.examDate} {exam.timeSlot ? `(${exam.timeSlot})` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Coefficient :</span>
                        <span className="font-bold text-indigo-700">{exam.coefficient} (Barème /{exam.maxScore})</span>
                      </div>
                      {exam.teacherName && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Correcteur :</span>
                          <span className="font-medium text-slate-700 truncate">{exam.teacherName}</span>
                        </div>
                      )}
                      {exam.invigilatorName && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Surveillant :</span>
                          <span className="font-semibold text-slate-800 truncate flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                            {exam.invigilatorName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Conflict Badge if any */}
                    {(() => {
                      const conflict = checkExamConflicts(exam, exams);
                      if (conflict.hasConflict) {
                        return (
                          <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-700 flex items-center gap-1.5 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate">{conflict.messages[0]}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {avg && (
                      <div className="mt-3 flex items-center justify-between text-xs px-2">
                        <span className="text-slate-500 font-medium">Moyenne de classe :</span>
                        <span className="font-bold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded">
                          {avg} / {exam.maxScore}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setActiveGradeExam(exam)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Saisir / Voir Notes</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Grade Entry & Student Report Quick Picker for the Class */}
      {activeGradeExam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                  Saisie des Notes • {activeGradeExam.gradeClass}
                </span>
                <h3 className="font-bold text-base">{activeGradeExam.title}</h3>
              </div>
              <button
                onClick={() => setActiveGradeExam(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <span className="text-indigo-900 font-medium">
                  Discipline : <strong>{activeGradeExam.subject}</strong> • Coeff : <strong>{activeGradeExam.coefficient}</strong> • Barème sur {activeGradeExam.maxScore}
                </span>
                <span className="text-slate-500 text-[11px]">{examStudents.length} élèves inscrits</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {examStudents.map((stu) => {
                  const existingGrade = grades.find(
                    (g) => g.examId === activeGradeExam.id && g.studentId === stu.id
                  );
                  const currentScore = existingGrade?.score ?? 15.0;

                  return (
                    <div
                      key={stu.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 font-bold flex items-center justify-center text-slate-700 text-xs">
                          {stu.name.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{stu.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{stu.matricule}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-slate-500 font-medium text-[11px]">Note / 20 :</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={activeGradeExam.maxScore}
                            defaultValue={currentScore}
                            onBlur={async (e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                await saveGrade({
                                  id: existingGrade?.id || `gr-${activeGradeExam.id}-${stu.id}`,
                                  examId: activeGradeExam.id,
                                  studentId: stu.id,
                                  studentName: stu.name,
                                  subject: activeGradeExam.subject,
                                  schoolLevel: stu.schoolLevel,
                                  gradeClass: stu.gradeClass,
                                  term: activeGradeExam.term,
                                  score: val,
                                  maxScore: activeGradeExam.maxScore,
                                  coefficient: activeGradeExam.coefficient,
                                  remarks: val >= 16 ? 'Excellent travail.' : val >= 12 ? 'Bon ensemble.' : 'Doit approfondir.',
                                  teacherName: activeGradeExam.teacherName || 'Professeur',
                                  dateRecorded: new Date().toISOString().split('T')[0],
                                });
                              }
                            }}
                            className="w-16 px-2 py-1 border border-slate-300 rounded font-bold text-center text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <button
                          onClick={() => setSelectedStudentForReport(stu)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <Award className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Bulletin</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={async () => {
                  if (activeGradeExam) {
                    await saveExam({
                      ...activeGradeExam,
                      status: 'published',
                    });
                    setEmailTargetClass(activeGradeExam.gradeClass);
                    setActiveGradeExam(null);
                    setIsEmailDispatchOpen(true);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                title="Publier officiellement les notes et diffuser les résumés par email"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publier Notes & Notifier Parents par Email</span>
              </button>

              <button
                onClick={() => setActiveGradeExam(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                Fermer & Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Exam Modal */}
      {isAddExamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Planifier une Évaluation</h3>
              <button onClick={() => setIsAddExamModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Titre de l’examen</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Devoir Surveillé N°2 - Algèbre"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Niveau</label>
                  <select
                    value={examLevel}
                    onChange={(e) => setExamLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="primary">Primaire</option>
                    <option value="middle">Collège</option>
                    <option value="high">Lycée</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Classe</label>
                  <input
                    type="text"
                    required
                    value={gradeClass}
                    onChange={(e) => setGradeClass(e.target.value)}
                    placeholder="Terminale S1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Matière</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Physique - Chimie"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={coefficient}
                    onChange={(e) => setCoefficient(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Barème Maximal</label>
                  <input
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Salle d'Examen assignée</label>
                  <select
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="Salle 204 (Lycée)">Salle 204 (Lycée)</option>
                    <option value="Salle 205 (Lycée)">Salle 205 (Lycée)</option>
                    <option value="Amphithéâtre Jean Jaurès">Amphithéâtre Jean Jaurès</option>
                    <option value="Labo Sciences & Physique">Labo Sciences & Physique</option>
                    <option value="Salle B12 (Collège)">Salle B12 (Collège)</option>
                    <option value="Salle B14 (Collège)">Salle B14 (Collège)</option>
                    <option value="Labo SVT 1">Labo SVT 1</option>
                    <option value="Salle CM2-A">Salle CM2-A</option>
                    <option value="Salle Polyvalente Primaire">Salle Polyvalente Primaire</option>
                    <option value="Centre d’Examen CDI">Centre d’Examen CDI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Créneau Horaire</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="08:00 - 10:00">08:00 - 10:00</option>
                    <option value="08:30 - 10:30">08:30 - 10:30</option>
                    <option value="10:00 - 12:00">10:00 - 12:00</option>
                    <option value="14:00 - 16:00">14:00 - 16:00</option>
                    <option value="15:30 - 17:30">15:30 - 17:30</option>
                    <option value="13:30 - 17:30">13:30 - 17:30</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Professeur correcteur</label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Prof. ..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Surveillant d'Examen</label>
                  <input
                    type="text"
                    required
                    value={invigilatorName}
                    onChange={(e) => setInvigilatorName(e.target.value)}
                    placeholder="Surveillant..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              {/* Real-Time Conflict Detector */}
              {(() => {
                const check = checkExamConflicts(
                  {
                    examDate,
                    timeSlot,
                    room,
                    invigilatorName,
                    gradeClass,
                  },
                  exams
                );

                if (check.hasConflict) {
                  return (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
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
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Disponibilité Confirmée : Aucun conflit de salle ni de surveillant.</span>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddExamModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Enregistrer l’Épreuve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Report Card Modal */}
      {selectedStudentForReport && (
        <ReportCardModal
          student={selectedStudentForReport}
          onClose={() => setSelectedStudentForReport(null)}
        />
      )}

      {/* Automated Email Report Card Dispatch Modal */}
      {isEmailDispatchOpen && (
        <ReportCardEmailDispatchModal
          targetClass={emailTargetClass}
          onClose={() => setIsEmailDispatchOpen(false)}
        />
      )}

      {/* Automated Exam Scheduling & Conflict Resolver Modal */}
      {isAutoSchedulerOpen && (
        <AutomatedExamSchedulerModal
          onClose={() => setIsAutoSchedulerOpen(false)}
        />
      )}
    </div>
  );
};
