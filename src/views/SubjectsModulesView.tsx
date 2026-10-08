import React, { useState } from 'react';
import {
  BookOpenCheck,
  Plus,
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Edit2,
  Trash2,
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Subject, CourseModule, SchoolLevel } from '../types';

export const SubjectsModulesView: React.FC = () => {
  const {
    schoolLevel,
    subjects,
    courseModules,
    saveCourseModule,
    deleteCourseModule,
    saveSubject,
    language,
    t
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'modules' | 'subjects'>('modules');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);

  // Form states for Course Module
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [moduleLevel, setModuleLevel] = useState<'primary' | 'middle' | 'high'>(
    schoolLevel === 'all' ? 'high' : schoolLevel
  );
  const [gradeClass, setGradeClass] = useState('Terminale S1');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [objectives, setObjectives] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(3);
  const [status, setStatus] = useState<CourseModule['status']>('in_progress');
  const [resourcesCount, setResourcesCount] = useState(4);
  const [homeworkAssignment, setHomeworkAssignment] = useState('');

  const filteredSubjects = subjects.filter((s) => {
    return schoolLevel === 'all' || s.schoolLevel === 'all' || s.schoolLevel === schoolLevel;
  });

  const filteredModules = courseModules.filter((m) => {
    const matchesLevel = schoolLevel === 'all' || m.schoolLevel === schoolLevel;
    const matchesSubject = selectedSubjectId === 'all' || m.subjectId === selectedSubjectId;
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subjectName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSubject && matchesSearch;
  });

  const handleOpenAddModule = () => {
    setEditingModule(null);
    setSubjectId(subjects[0]?.id || '');
    setModuleLevel(schoolLevel === 'all' ? 'high' : schoolLevel);
    setGradeClass(schoolLevel === 'primary' ? 'CM2-A' : schoolLevel === 'middle' ? '3ème-A' : 'Terminale S1');
    setChapterNumber(filteredModules.length + 1);
    setTitle('');
    setSummary('');
    setObjectives('');
    setDurationWeeks(3);
    setStatus('in_progress');
    setResourcesCount(3);
    setHomeworkAssignment('');
    setIsModuleModalOpen(true);
  };

  const handleOpenEditModule = (mod: CourseModule) => {
    setEditingModule(mod);
    setSubjectId(mod.subjectId);
    setModuleLevel(mod.schoolLevel);
    setGradeClass(mod.gradeClass);
    setChapterNumber(mod.chapterNumber);
    setTitle(mod.title);
    setSummary(mod.summary);
    setObjectives(mod.objectives);
    setDurationWeeks(mod.durationWeeks);
    setStatus(mod.status);
    setResourcesCount(mod.resourcesCount);
    setHomeworkAssignment(mod.homeworkAssignment || '');
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    const parentSub = subjects.find((s) => s.id === subjectId);
    const updated: CourseModule = {
      id: editingModule ? editingModule.id : `mod-${Date.now()}`,
      subjectId,
      subjectName: parentSub ? parentSub.name : 'Discipline',
      schoolLevel: moduleLevel,
      gradeClass,
      chapterNumber: Number(chapterNumber),
      title,
      summary,
      objectives,
      durationWeeks: Number(durationWeeks),
      status,
      resourcesCount: Number(resourcesCount),
      homeworkAssignment,
    };
    await saveCourseModule(updated);
    setIsModuleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {language === 'fr' ? 'Programmes, Matières & Modules Pédagogiques' : 'Curriculum, Subjects & Course Modules'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'fr'
              ? 'Progression des cours par chapitre, objectifs d’apprentissage et devoirs assignés.'
              : 'Syllabus chapters, teaching objectives, course progression, and assigned homework.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab('modules')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'modules' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chapitres & Cours
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'subjects' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matières Officielles
            </button>
          </div>

          <button
            onClick={handleOpenAddModule}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Chapitre</span>
          </button>
        </div>
      </div>

      {activeTab === 'modules' ? (
        <>
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium">Filtrer discipline :</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
              >
                <option value="all">Toutes Disciplines</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher chapitre, notion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800 w-56"
              />
            </div>
          </div>

          {/* Modules List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredModules.map((mod) => (
              <div
                key={mod.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-extrabold text-xs flex items-center justify-center border border-indigo-100">
                        Ch.{mod.chapterNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {mod.subjectName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        mod.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        mod.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {mod.status === 'completed' ? 'Terminé' : mod.status === 'in_progress' ? 'En cours' : 'À venir'}
                      </span>
                      <button
                        onClick={() => handleOpenEditModule(mod)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCourseModule(mod.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mt-2.5">
                    {mod.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {mod.summary}
                  </p>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-700 block">Objectifs pédagogiques</span>
                      <p className="text-slate-700 text-[11px] mt-0.5">{mod.objectives}</p>
                    </div>

                    {mod.homeworkAssignment && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <span className="text-[10px] uppercase font-bold text-amber-700 block">Devoir & Travail assigné</span>
                        <p className="text-slate-700 text-[11px] italic mt-0.5">"{mod.homeworkAssignment}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    Classe : {mod.gradeClass} ({mod.schoolLevel.toUpperCase()})
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {mod.durationWeeks} sem.
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {mod.resourcesCount} fiches
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Subjects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredSubjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {sub.code}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {sub.category}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-3">{sub.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-3">{sub.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600 font-medium">
                <span>Coeff : <strong>{sub.coefficient}</strong></span>
                <span>Volume : <strong>{sub.weeklyHours}h / sem</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Course Module Modal */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingModule ? 'Modifier Chapitre de Cours' : 'Nouveau Chapitre de Cours'}
              </h3>
              <button onClick={() => setIsModuleModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Discipline</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">N° du Chapitre</label>
                  <input
                    type="number"
                    min="1"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Titre du Chapitre</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Les Fonctions Exponentielles"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Niveau Établissement</label>
                  <select
                    value={moduleLevel}
                    onChange={(e) => setModuleLevel(e.target.value as any)}
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

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Résumé & Contenu du Cours</label>
                <textarea
                  rows={3}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Points clés du chapitre..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Objectifs d’Apprentissage (Compétences)</label>
                <textarea
                  rows={2}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder="Ce que l'élève doit maîtriser..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Durée (Semaines)</label>
                  <input
                    type="number"
                    min="1"
                    value={durationWeeks}
                    onChange={(e) => setDurationWeeks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Statut d’avancement</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé</option>
                    <option value="upcoming">À venir</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Devoir maison / Fiche d'exercices</label>
                <input
                  type="text"
                  value={homeworkAssignment}
                  onChange={(e) => setHomeworkAssignment(e.target.value)}
                  placeholder="ex: Exercices 12 à 18 page 45..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Enregistrer le Chapitre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
