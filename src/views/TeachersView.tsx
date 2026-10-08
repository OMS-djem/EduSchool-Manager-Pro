import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  BookOpen,
  Award,
  Clock,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Star,
  MessageSquareQuote,
  Printer
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Teacher, SchoolLevel } from '../types';
import { TeacherProfileReportModal } from '../components/TeacherProfileReportModal';

export const TeachersView: React.FC = () => {
  const { schoolLevel, teachers, saveTeacher, deleteTeacher, teacherFeedback, language, t } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacherForDossier, setSelectedTeacherForDossier] = useState<Teacher | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [teacherLevel, setTeacherLevel] = useState<SchoolLevel>('high');
  const [subjectsStr, setSubjectsStr] = useState('');
  const [classesStr, setClassesStr] = useState('');
  const [weeklyHours, setWeeklyHours] = useState(18);
  const [qualification, setQualification] = useState('');
  const [status, setStatus] = useState<'active' | 'on_leave'>('active');

  const filteredTeachers = teachers.filter((tch) => {
    const matchesLevel =
      schoolLevel === 'all' || tch.schoolLevel === 'all' || tch.schoolLevel === schoolLevel;
    const matchesSearch =
      tch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tch.subjects.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      tch.classes.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setName('');
    setEmail('');
    setPhone('');
    setTeacherLevel(schoolLevel === 'all' ? 'high' : schoolLevel);
    setSubjectsStr('');
    setClassesStr('');
    setWeeklyHours(18);
    setQualification('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tch: Teacher) => {
    setEditingTeacher(tch);
    setName(tch.name);
    setEmail(tch.email);
    setPhone(tch.phone);
    setTeacherLevel(tch.schoolLevel);
    setSubjectsStr(tch.subjects.join(', '));
    setClassesStr(tch.classes.join(', '));
    setWeeklyHours(tch.weeklyHours);
    setQualification(tch.qualification);
    setStatus(tch.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Teacher = {
      id: editingTeacher ? editingTeacher.id : `t-${Date.now()}`,
      name,
      email,
      phone,
      schoolLevel: teacherLevel,
      subjects: subjectsStr.split(',').map((s) => s.trim()).filter(Boolean),
      classes: classesStr.split(',').map((c) => c.trim()).filter(Boolean),
      weeklyHours: Number(weeklyHours) || 18,
      qualification,
      status,
      joinDate: editingTeacher?.joinDate || new Date().toISOString().split('T')[0],
    };
    await saveTeacher(updated);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {language === 'fr' ? 'Gestion du Corps Enseignant' : 'Teaching Faculty Management'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'fr'
              ? 'Professeurs des écoles, certifiés et agrégés par niveau et discipline.'
              : 'Primary, middle, and high school teachers, assignments, and weekly teaching loads.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={language === 'fr' ? 'Chercher professeur, matière...' : 'Search teacher, subject...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52 sm:w-64 text-slate-800"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addTeacher')}</span>
          </button>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeachers.map((tch) => (
          <div
            key={tch.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-100 to-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-base">
                    {tch.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{tch.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        tch.schoolLevel === 'primary' ? 'bg-amber-100 text-amber-800' :
                        tch.schoolLevel === 'middle' ? 'bg-indigo-100 text-indigo-800' :
                        tch.schoolLevel === 'high' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {tch.schoolLevel.toUpperCase()}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${tch.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedTeacherForDossier(tch)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50"
                    title="Imprimer le Dossier Enseignant (A4)"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(tch)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                    title="Modifier"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteTeacher(tch.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Qualification */}
              {tch.qualification && (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                  <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{tch.qualification}</span>
                </div>
              )}

              {/* Student Evaluation Rating */}
              {(() => {
                const tFeedbacks = teacherFeedback.filter((f) => f.teacherId === tch.id);
                if (tFeedbacks.length === 0) return null;
                const avg = (tFeedbacks.reduce((acc, f) => acc + f.overallRating, 0) / tFeedbacks.length).toFixed(1);
                return (
                  <div className="mt-2 flex items-center justify-between text-[11px] bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200/70">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>Avis Élèves : {avg} / 5</span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-semibold">
                      {tFeedbacks.length} évaluation{tFeedbacks.length > 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })()}

              {/* Subjects & Classes */}
              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    {language === 'fr' ? 'Disciplines enseignées' : 'Subjects'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tch.subjects.map((sub, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium text-[11px]">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    {language === 'fr' ? 'Classes assignées' : 'Assigned Classes'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tch.classes.map((cls, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with hours & contact */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 font-medium text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{tch.weeklyHours}h</span>
                </div>
                <button
                  onClick={() => setSelectedTeacherForDossier(tch)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  title="Imprimer la Fiche Dossier Enseignant"
                >
                  <Printer className="w-3 h-3" />
                  <span>Dossier</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <a href={`mailto:${tch.email}`} className="text-slate-400 hover:text-indigo-600" title={tch.email}>
                  <Mail className="w-4 h-4" />
                </a>
                <a href={`tel:${tch.phone}`} className="text-slate-400 hover:text-indigo-600" title={tch.phone}>
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingTeacher
                  ? (language === 'fr' ? 'Modifier l’Enseignant' : 'Edit Teacher')
                  : (language === 'fr' ? 'Nouvel Enseignant' : 'New Teacher')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nom Complet</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Prof. Martin Dupont"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Niveau Établissement</label>
                  <select
                    value={teacherLevel}
                    onChange={(e) => setTeacherLevel(e.target.value as SchoolLevel)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  >
                    <option value="primary">Primaire (Élémentaire)</option>
                    <option value="middle">Collège</option>
                    <option value="high">Lycée</option>
                    <option value="all">Tous Niveaux</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email académique</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="martin.dupont@eduschool.org"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 00 00 00 00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Matières (séparées par des virgules)</label>
                <input
                  type="text"
                  required
                  value={subjectsStr}
                  onChange={(e) => setSubjectsStr(e.target.value)}
                  placeholder="Mathématiques, Géométrie, Algèbre"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Classes assignées (séparées par virgules)</label>
                <input
                  type="text"
                  required
                  value={classesStr}
                  onChange={(e) => setClassesStr(e.target.value)}
                  placeholder="Terminale S1, 1ère S2, 2nde-A"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Heures hebdo (Charge)</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Diplôme / Qualification</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="Agrégation, CAPES, Master"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Teacher Profile & Pedagogical Dossier Print Modal */}
      {selectedTeacherForDossier && (
        <TeacherProfileReportModal
          teacher={selectedTeacherForDossier}
          onClose={() => setSelectedTeacherForDossier(null)}
        />
      )}
    </div>
  );
};
