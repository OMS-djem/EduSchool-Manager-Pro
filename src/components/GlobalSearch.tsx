import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  GraduationCap,
  Users,
  Briefcase,
  ArrowRight,
  FileText,
  Phone,
  Mail,
  Award,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Command,
  Printer
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Student, Teacher, Staff } from '../types';
import { NavTab } from './Sidebar';
import { ReportCardModal } from './ReportCardModal';
import { StudentProfileReportModal } from './StudentProfileReportModal';
import { TeacherProfileReportModal } from './TeacherProfileReportModal';

interface GlobalSearchProps {
  onNavigate?: (tab: NavTab) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const { students, teachers, staff, language } = useSchool();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'students' | 'teachers' | 'staff'>('all');
  
  // Selected person for modal details
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [selectedStudentForDossier, setSelectedStudentForDossier] = useState<Student | null>(null);
  const [selectedTeacherForDossier, setSelectedTeacherForDossier] = useState<Teacher | null>(null);
  const [detailItem, setDetailItem] = useState<{
    type: 'student' | 'teacher' | 'staff';
    data: Student | Teacher | Staff;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmed = query.trim().toLowerCase();

  // Search filtering
  const matchedStudents = students.filter((s) => {
    if (!trimmed) return true;
    return (
      s.name.toLowerCase().includes(trimmed) ||
      s.matricule.toLowerCase().includes(trimmed) ||
      s.id.toLowerCase().includes(trimmed) ||
      s.gradeClass.toLowerCase().includes(trimmed) ||
      (s.parentName && s.parentName.toLowerCase().includes(trimmed))
    );
  });

  const matchedTeachers = teachers.filter((t) => {
    if (!trimmed) return true;
    return (
      t.name.toLowerCase().includes(trimmed) ||
      t.id.toLowerCase().includes(trimmed) ||
      t.email.toLowerCase().includes(trimmed) ||
      t.subjects.some((sub) => sub.toLowerCase().includes(trimmed)) ||
      t.classes.some((cls) => cls.toLowerCase().includes(trimmed))
    );
  });

  const matchedStaff = staff.filter((st) => {
    if (!trimmed) return true;
    return (
      st.name.toLowerCase().includes(trimmed) ||
      st.id.toLowerCase().includes(trimmed) ||
      st.role.toLowerCase().includes(trimmed) ||
      st.department.toLowerCase().includes(trimmed) ||
      st.email.toLowerCase().includes(trimmed)
    );
  });

  const totalResults = matchedStudents.length + matchedTeachers.length + matchedStaff.length;

  const handleSelectStudent = (stu: Student) => {
    setDetailItem({ type: 'student', data: stu });
  };

  const handleSelectTeacher = (tch: Teacher) => {
    setDetailItem({ type: 'teacher', data: tch });
  };

  const handleSelectStaff = (st: Staff) => {
    setDetailItem({ type: 'staff', data: st });
  };

  const handleJumpToTab = (tab: NavTab) => {
    setIsOpen(false);
    setDetailItem(null);
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <>
      <div ref={containerRef} className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
        {/* Search Input Box */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            placeholder={
              language === 'fr'
                ? 'Rechercher élève, prof, personnel (nom ou ID)...'
                : 'Search student, teacher, staff (name or ID)...'
            }
            className="w-full pl-9 pr-16 py-1.5 bg-slate-800/90 hover:bg-slate-800 text-white placeholder-slate-400 text-xs rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5 pointer-events-none">
            {query ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery('');
                }}
                className="pointer-events-auto p-0.5 text-slate-400 hover:text-white rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-700/50 rounded border border-slate-600/50">
                <Command className="w-2.5 h-2.5" />K
              </span>
            )}
          </div>
        </div>

        {/* Results Dropdown Popover */}
        {isOpen && (
          <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-200">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-2 bg-slate-950/60 border-b border-slate-800 text-xs">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {language === 'fr' ? 'Tous' : 'All'} ({totalResults})
              </button>
              <button
                onClick={() => setActiveFilter('students')}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                  activeFilter === 'students'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <GraduationCap className="w-3 h-3" />
                <span>{language === 'fr' ? 'Élèves' : 'Students'}</span>
                <span className="text-[10px] opacity-80">({matchedStudents.length})</span>
              </button>
              <button
                onClick={() => setActiveFilter('teachers')}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                  activeFilter === 'teachers'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>{language === 'fr' ? 'Enseignants' : 'Teachers'}</span>
                <span className="text-[10px] opacity-80">({matchedTeachers.length})</span>
              </button>
              <button
                onClick={() => setActiveFilter('staff')}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                  activeFilter === 'staff'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-3 h-3" />
                <span>{language === 'fr' ? 'Personnel' : 'Staff'}</span>
                <span className="text-[10px] opacity-80">({matchedStaff.length})</span>
              </button>
            </div>

            {/* Results Body */}
            <div className="max-h-[380px] overflow-y-auto p-2 space-y-3 divide-y divide-slate-800/60 text-xs">
              {totalResults === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <Search className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-300">
                    {language === 'fr' ? 'Aucun résultat trouvé' : 'No matches found'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {language === 'fr'
                      ? 'Vérifiez l’orthographe du nom ou du matricule / identifiant.'
                      : 'Check spelling for name, matricule ID, or keyword.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* STUDENTS GROUP */}
                  {(activeFilter === 'all' || activeFilter === 'students') && matchedStudents.length > 0 && (
                    <div className="pt-2 first:pt-0">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          <span>{language === 'fr' ? 'Élèves Inscrits' : 'Enrolled Students'}</span>
                        </span>
                        <span>{matchedStudents.length}</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {matchedStudents.slice(0, 5).map((stu) => (
                          <div
                            key={stu.id}
                            onClick={() => handleSelectStudent(stu)}
                            className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer border border-transparent hover:border-slate-700"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                                {stu.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white truncate text-xs group-hover:text-indigo-300">
                                    {stu.name}
                                  </span>
                                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                                    {stu.matricule}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span className="font-medium text-slate-300">{stu.gradeClass}</span>
                                  <span>•</span>
                                  <span className="uppercase text-[9px] font-semibold text-emerald-400">
                                    {stu.schoolLevel}
                                  </span>
                                  <span>•</span>
                                  <span>Assiduité: {stu.attendanceRate}%</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudentForReport(stu);
                                }}
                                className="px-2 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-300 rounded text-[11px] font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                                title="Voir le Bulletin Officiel"
                              >
                                <FileText className="w-3 h-3" />
                                <span className="hidden sm:inline">Bulletin</span>
                              </button>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TEACHERS GROUP */}
                  {(activeFilter === 'all' || activeFilter === 'teachers') && matchedTeachers.length > 0 && (
                    <div className="pt-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{language === 'fr' ? 'Corps Enseignant' : 'Teaching Faculty'}</span>
                        </span>
                        <span>{matchedTeachers.length}</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {matchedTeachers.slice(0, 5).map((tch) => (
                          <div
                            key={tch.id}
                            onClick={() => handleSelectTeacher(tch)}
                            className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer border border-transparent hover:border-slate-700"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                                {tch.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white truncate text-xs group-hover:text-purple-300">
                                    {tch.name}
                                  </span>
                                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                                    {tch.id}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                                  <span className="text-purple-300 font-medium truncate">
                                    {tch.subjects[0]}
                                  </span>
                                  <span>•</span>
                                  <span className="uppercase text-[9px] font-semibold text-slate-400">
                                    {tch.schoolLevel}
                                  </span>
                                  <span>•</span>
                                  <span>{tch.weeklyHours}h/sem</span>
                                </div>
                              </div>
                            </div>

                            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STAFF GROUP */}
                  {(activeFilter === 'all' || activeFilter === 'staff') && matchedStaff.length > 0 && (
                    <div className="pt-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          <span>{language === 'fr' ? 'Personnel & Administration' : 'Staff & Administration'}</span>
                        </span>
                        <span>{matchedStaff.length}</span>
                      </div>
                      <div className="space-y-1 mt-1">
                        {matchedStaff.slice(0, 5).map((st) => (
                          <div
                            key={st.id}
                            onClick={() => handleSelectStaff(st)}
                            className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer border border-transparent hover:border-slate-700"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                                {st.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white truncate text-xs group-hover:text-amber-300">
                                    {st.name}
                                  </span>
                                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                                    {st.id}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                                  <span className="text-amber-300 font-medium truncate">{st.role}</span>
                                  <span>•</span>
                                  <span>{st.department}</span>
                                </div>
                              </div>
                            </div>

                            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer summary */}
            <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>
                {language === 'fr'
                  ? 'Tapez un nom, matricule ou matière pour filtrer'
                  : 'Type a name, ID, or subject to filter'}
              </span>
              <span className="font-mono text-[10px] text-slate-500">ESC pour fermer</span>
            </div>
          </div>
        )}
      </div>

      {/* QUICK DETAIL MODAL FOR PERSON CLICKED */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shadow-sm ${
                  detailItem.type === 'student'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : detailItem.type === 'teacher'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {detailItem.data.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                    {detailItem.type === 'student' ? 'Fiche Élève' : detailItem.type === 'teacher' ? 'Fiche Enseignant' : 'Fiche Personnel'}
                  </span>
                  <h3 className="font-bold text-base text-white">{detailItem.data.name}</h3>
                  <span className="font-mono text-xs text-slate-400">
                    ID: {'matricule' in detailItem.data ? detailItem.data.matricule : detailItem.data.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 space-y-4 text-xs">
              {detailItem.type === 'student' && (() => {
                const s = detailItem.data as Student;
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Classe & Cycle</span>
                        <strong className="text-slate-800">{s.gradeClass} ({s.schoolLevel.toUpperCase()})</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assiduité</span>
                        <span className="font-bold text-emerald-700">{s.attendanceRate}% de présence</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Statut Scolarité</span>
                        <span className={`inline-block font-semibold px-2 py-0.5 rounded text-[10px] ${
                          s.tuitionStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {s.tuitionStatus === 'paid' ? 'Soldé (Payé)' : 'Solde restant'} ({s.paidTuition}€/{s.totalTuition}€)
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date Naissance</span>
                        <span className="text-slate-700">{s.birthDate}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Contact Responsable</span>
                      <p className="font-bold text-slate-800">{s.parentName}</p>
                      <p className="text-slate-600 flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {s.parentPhone}</p>
                      {s.parentEmail && (
                        <p className="text-slate-600 flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {s.parentEmail}</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setSelectedStudentForDossier(s);
                          setDetailItem(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-xs"
                        title="Imprimer la Fiche Dossier Officielle de l'Élève"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Imprimer Fiche Profil</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudentForReport(s);
                          setDetailItem(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Voir Bulletin</span>
                      </button>
                      <button
                        onClick={() => handleJumpToTab('students')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {detailItem.type === 'teacher' && (() => {
                const t = detailItem.data as Teacher;
                return (
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Disciplines</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.subjects.map((sub, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold text-[11px]">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Classes Assignées</span>
                          <span className="font-semibold text-slate-800">{t.classes.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Charge Hebdo</span>
                          <span className="font-bold text-indigo-700">{t.weeklyHours}h / semaine</span>
                        </div>
                      </div>
                    </div>

                    {t.qualification && (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="text-slate-700 font-medium">{t.qualification}</span>
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Coordonnées</span>
                      <p className="text-slate-700 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {t.email}</p>
                      <p className="text-slate-700 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {t.phone}</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setSelectedTeacherForDossier(t);
                          setDetailItem(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-xs"
                        title="Imprimer le Dossier Pédagogique de l'Enseignant"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Imprimer Dossier Enseignant</span>
                      </button>
                      <button
                        onClick={() => handleJumpToTab('teachers')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {detailItem.type === 'staff' && (() => {
                const st = detailItem.data as Staff;
                return (
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold">Poste</span>
                        <strong className="text-slate-900">{st.role}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold">Département</span>
                        <span className="font-semibold text-amber-700">{st.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold">Statut</span>
                        <span className="font-semibold text-emerald-700">{st.status === 'active' ? 'En poste' : 'En congé'}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Contact</span>
                      <p className="text-slate-700 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {st.email}</p>
                      <p className="text-slate-700 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {st.phone}</p>
                    </div>

                    <button
                      onClick={() => handleJumpToTab('staff')}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-xs"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Consulter dans l'Équipe Administrative</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Official Report Card Modal for searched student */}
      {selectedStudentForReport && (
        <ReportCardModal
          student={selectedStudentForReport}
          onClose={() => setSelectedStudentForReport(null)}
        />
      )}

      {/* Official Student Profile & Dossier Print Modal */}
      {selectedStudentForDossier && (
        <StudentProfileReportModal
          student={selectedStudentForDossier}
          onClose={() => setSelectedStudentForDossier(null)}
        />
      )}

      {/* Official Teacher Profile & Dossier Print Modal */}
      {selectedTeacherForDossier && (
        <TeacherProfileReportModal
          teacher={selectedTeacherForDossier}
          onClose={() => setSelectedTeacherForDossier(null)}
        />
      )}
    </>
  );
};
