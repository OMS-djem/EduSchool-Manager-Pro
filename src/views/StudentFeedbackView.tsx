import React, { useState } from 'react';
import {
  MessageSquareQuote,
  Star,
  ShieldCheck,
  Send,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Sparkles,
  Heart,
  TrendingUp,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  UserCheck,
  MessageCircle,
  ThumbsUp,
  Lightbulb,
  X,
  Smile,
  Sliders,
  Check
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { TeacherFeedback, SchoolLevel } from '../types';

export const StudentFeedbackView: React.FC = () => {
  const {
    schoolLevel,
    teachers,
    subjects,
    students,
    teacherFeedback,
    saveTeacherFeedback,
    deleteTeacherFeedback,
    language,
  } = useSchool();
  const { currentRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'submit'>('overview');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Teacher Action Plan modal state
  const [respondingFeedback, setRespondingFeedback] = useState<TeacherFeedback | null>(null);
  const [actionNoteInput, setActionNoteInput] = useState('');

  // Form submission state (Anonymous)
  const [formTeacherId, setFormTeacherId] = useState(teachers[0]?.id || 't-1');
  const [formClass, setFormClass] = useState('Terminale S1');
  const [clarityRating, setClarityRating] = useState(5);
  const [contentRating, setContentRating] = useState(5);
  const [pacingRating, setPacingRating] = useState(4);
  const [engagementRating, setEngagementRating] = useState(5);
  const [fairnessRating, setFairnessRating] = useState(5);
  const [positiveHighlights, setPositiveHighlights] = useState('');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [categoryTag, setCategoryTag] = useState<TeacherFeedback['categoryTag']>('clarity');

  // List of unique classes
  const classesList = Array.from(new Set(students.map((s) => s.gradeClass)));

  // Filter feedbacks
  const filteredFeedbacks = teacherFeedback.filter((fb) => {
    const matchLevel = schoolLevel === 'all' || fb.schoolLevel === 'all' || fb.schoolLevel === schoolLevel;
    const matchTeacher = selectedTeacherFilter === 'all' || fb.teacherId === selectedTeacherFilter;
    const matchTag = selectedTagFilter === 'all' || fb.categoryTag === selectedTagFilter;
    const matchSearch =
      !searchTerm ||
      fb.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fb.positiveHighlights && fb.positiveHighlights.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fb.improvementSuggestions && fb.improvementSuggestions.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchLevel && matchTeacher && matchTag && matchSearch;
  });

  // Calculate Averages
  const totalCount = teacherFeedback.length;
  const avgOverall = totalCount > 0
    ? (teacherFeedback.reduce((acc, f) => acc + f.overallRating, 0) / totalCount).toFixed(1)
    : '5.0';
  const avgClarity = totalCount > 0
    ? (teacherFeedback.reduce((acc, f) => acc + f.clarityRating, 0) / totalCount).toFixed(1)
    : '5.0';
  const avgContent = totalCount > 0
    ? (teacherFeedback.reduce((acc, f) => acc + f.contentRating, 0) / totalCount).toFixed(1)
    : '5.0';
  const avgFairness = totalCount > 0
    ? (teacherFeedback.reduce((acc, f) => acc + f.fairnessRating, 0) / totalCount).toFixed(1)
    : '5.0';

  // Sound chime
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2); // G5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio fallback
    }
  };

  // Submit Feedback Form (100% Anonymous)
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    const matchedTeacher = teachers.find((t) => t.id === formTeacherId) || teachers[0];
    const overall = Number(
      ((clarityRating + contentRating + pacingRating + engagementRating + fairnessRating) / 5).toFixed(1)
    );

    const newFeedback: TeacherFeedback = {
      id: `fb-${Date.now()}`,
      teacherId: matchedTeacher.id,
      teacherName: matchedTeacher.name,
      subjectName: matchedTeacher.subjects[0] || 'Enseignement Général',
      schoolLevel: matchedTeacher.schoolLevel === 'all' ? 'high' : matchedTeacher.schoolLevel,
      gradeClass: formClass,
      dateSubmitted: new Date().toISOString().split('T')[0],
      clarityRating,
      contentRating,
      pacingRating,
      engagementRating,
      fairnessRating,
      overallRating: overall,
      positiveHighlights,
      improvementSuggestions,
      categoryTag,
      status: 'published',
    };

    await saveTeacherFeedback(newFeedback);
    playChime();

    // Reset Form
    setPositiveHighlights('');
    setImprovementSuggestions('');
    setNotificationMsg(
      language === 'fr'
        ? `✓ Merci pour votre retour anonyme sur le cours de ${matchedTeacher.name} !`
        : `✓ Thank you for your anonymous feedback on ${matchedTeacher.name}'s course!`
    );
    setActiveTab('overview');
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Save Teacher Action Plan Response
  const handleSaveActionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingFeedback) return;

    const updated: TeacherFeedback = {
      ...respondingFeedback,
      teacherActionNote: actionNoteInput,
      status: 'reviewed',
    };

    await saveTeacherFeedback(updated);
    setRespondingFeedback(null);
    setActionNoteInput('');
    setNotificationMsg(
      language === 'fr'
        ? `✓ Plan d'action pédagogique enregistré avec succès !`
        : `✓ Action plan response saved successfully!`
    );
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Star Rating Interactive Component
  const StarPicker = ({
    value,
    onChange,
    label,
    description,
  }: {
    value: number;
    onChange: (val: number) => void;
    label: string;
    description: string;
  }) => {
    return (
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-800 text-xs">{label}</div>
          <div className="text-[11px] text-slate-500">{description}</div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => onChange(star)}
              className="p-1 hover:scale-110 transition-transform focus:outline-none"
            >
              <Star
                className={`w-5 h-5 ${
                  star <= value
                    ? 'fill-amber-400 text-amber-500'
                    : 'text-slate-300 hover:text-amber-200'
                }`}
              />
            </button>
          ))}
          <span className="font-bold text-xs text-slate-700 w-6 text-right ml-1 font-mono">
            {value}/5
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="p-3 bg-indigo-900 text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-300 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header and Anonymity Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-xs">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {language === 'fr'
                ? 'Évaluations Pédagogiques & Avis Anonymes Élèves'
                : 'Student-Teacher Feedback Module'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'fr'
              ? 'Canal d’évaluation constructif permettant aux élèves d’exprimer leur avis sur les cours et aux enseignants d’adapter leur pédagogie.'
              : 'Anonymous course evaluations and constructive feedback enabling teachers to continuously refine pedagogical methods.'}
          </p>
        </div>

        {/* Tab switcher: Overview vs Submit */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquareQuote className="w-3.5 h-3.5" />
            <span>{language === 'fr' ? 'Consulter les Avis' : 'View Feedback'}</span>
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'submit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{language === 'fr' ? 'Donner mon Avis' : 'Give Feedback'}</span>
          </button>
        </div>
      </div>

      {/* Anonymity Security Notice */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-2xl border border-emerald-500/30 flex items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-emerald-400">
              {language === 'fr' ? 'Anonymat 100% Certifié & Garanti' : '100% Anonymous & Secure'}
            </span>
            <p className="text-[11px] text-slate-300">
              {language === 'fr'
                ? 'Aucune donnée d’identité (nom, matricule, IP) n’est stockée. Vos retours sont transmis en toute bienveillance pour enrichir l’expérience scolaire.'
                : 'No student identity, matricule, or IP is collected. Honest feedback helps instructors optimize pacing and classroom clarity.'}
            </p>
          </div>
        </div>
        <span className="hidden md:inline px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider shrink-0 border border-emerald-500/40">
          Chiffrement Zéro-Trace
        </span>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Satisfaction Globale</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 flex items-baseline gap-1">
            <span>{avgOverall}</span>
            <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{totalCount} évaluations soumises</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Clarté des Cours</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 flex items-baseline gap-1">
            <span>{avgClarity}</span>
            <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Compréhension notions</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Qualité des Supports</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 flex items-baseline gap-1">
            <span>{avgContent}</span>
            <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Polycopiés & exercices</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Équité des Devoirs</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 flex items-baseline gap-1">
            <span>{avgFairness}</span>
            <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Barèmes & notations</p>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'overview' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={language === 'fr' ? 'Rechercher par enseignant, matière ou mot-clé...' : 'Search feedback by teacher or subject...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedTeacherFilter}
                onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Tous les Enseignants</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">Toutes Thématiques</option>
                <option value="clarity">Clarté des Explications</option>
                <option value="pedagogy">Méthodes Pédagogiques</option>
                <option value="homework">Devoirs & Équité</option>
                <option value="content">Supports & Contenu</option>
                <option value="pacing">Rythme d'Avancement</option>
              </select>
            </div>
          </div>

          {/* Feedback Cards List */}
          {filteredFeedbacks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <MessageSquareQuote className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Aucun avis ne correspond à vos filtres</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Modifiez vos critères de recherche ou soyez le premier à soumettre une évaluation constructive.
              </p>
              <button
                onClick={() => setActiveTab('submit')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                Déposer un Avis Anonyme
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredFeedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Teacher, Subject, Overall Score */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{fb.teacherName}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {fb.gradeClass}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{fb.subjectName}</p>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        <span className="font-bold text-sm text-slate-800 font-mono">
                          {fb.overallRating}
                        </span>
                      </div>
                    </div>

                    {/* Criteria Star Breakdown */}
                    <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Clarté :</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-700">{fb.clarityRating}/5</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Supports :</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-700">{fb.contentRating}/5</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Rythme :</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-700">{fb.pacingRating}/5</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Équité devoirs :</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-700">{fb.fairnessRating}/5</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        </div>
                      </div>
                    </div>

                    {/* Qualitative Comments */}
                    <div className="mt-3.5 space-y-2.5 text-xs">
                      {fb.positiveHighlights && (
                        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-900">
                          <div className="font-bold flex items-center gap-1.5 text-emerald-800 text-[11px] mb-1">
                            <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Points forts appréciés :</span>
                          </div>
                          <p className="leading-relaxed text-slate-700 text-[11px]">
                            {fb.positiveHighlights}
                          </p>
                        </div>
                      )}

                      {fb.improvementSuggestions && (
                        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-amber-900">
                          <div className="font-bold flex items-center gap-1.5 text-amber-800 text-[11px] mb-1">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pistes d'amélioration suggérées :</span>
                          </div>
                          <p className="leading-relaxed text-slate-700 text-[11px]">
                            {fb.improvementSuggestions}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Teacher Action Plan / Pedagogical Note */}
                    {fb.teacherActionNote ? (
                      <div className="mt-3 p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs">
                        <div className="font-bold text-indigo-900 flex items-center gap-1.5 text-[11px] mb-1">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Réponse & Plan d'Action de l'Enseignant :</span>
                        </div>
                        <p className="text-slate-700 text-[11px] leading-relaxed italic">
                          « {fb.teacherActionNote} »
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{fb.dateSubmitted}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setRespondingFeedback(fb);
                          setActionNoteInput(fb.teacherActionNote || '');
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-semibold transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>{fb.teacherActionNote ? 'Modifier Plan d’Action' : 'Ajouter Plan d’Action'}</span>
                      </button>

                      <button
                        onClick={() => deleteTeacherFeedback(fb.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                        title="Supprimer avis"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Anonymous Feedback Submission Form */
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="text-center pb-5 border-b border-slate-100 space-y-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
              🔒 Évaluation 100% Anonyme
            </span>
            <h3 className="font-bold text-slate-900 text-lg">
              Donnez votre avis sur le cours et les méthodes pédagogiques
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Vos réponses aident votre professeur à comprendre ce qui fonctionne bien et ce qui peut être ajusté pour vous aider à progresser.
            </p>
          </div>

          <form onSubmit={handleSubmitFeedback} className="space-y-5 mt-6 text-xs">
            {/* Target Teacher & Class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Enseignant concerné
                </label>
                <select
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.subjects[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Votre Classe (sans nom)
                </label>
                <select
                  value={formClass}
                  onChange={(e) => setFormClass(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  {classesList.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Criteria Star Evaluation */}
            <div className="space-y-2.5 pt-2">
              <label className="block text-slate-800 font-bold text-sm">
                Baromètre d'Évaluation (1 à 5 Étoiles)
              </label>

              <StarPicker
                label="1. Clarté des explications"
                description="Les notions sont-elles expliquées de manière limpide et compréhensible ?"
                value={clarityRating}
                onChange={setClarityRating}
              />

              <StarPicker
                label="2. Qualité des supports de cours"
                description="Les polycopiés, schémas, exercices et résumés sont-ils utiles ?"
                value={contentRating}
                onChange={setContentRating}
              />

              <StarPicker
                label="3. Rythme du cours"
                description="Le rythme est-il adapté (ni trop rapide, ni trop lent) ?"
                value={pacingRating}
                onChange={setPacingRating}
              />

              <StarPicker
                label="4. Disponibilité & Écoute de l'enseignant"
                description="Le professeur répond-il aux questions et encourage-t-il les élèves ?"
                value={engagementRating}
                onChange={setEngagementRating}
              />

              <StarPicker
                label="5. Équité des devoirs et barèmes"
                description="La charge de travail et les barèmes d'évaluation sont-ils justes ?"
                value={fairnessRating}
                onChange={setFairnessRating}
              />
            </div>

            {/* Qualitative Feedback Areas */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ce que vous appréciez le plus dans ce cours (Points forts)</span>
                </label>
                <textarea
                  rows={3}
                  value={positiveHighlights}
                  onChange={(e) => setPositiveHighlights(e.target.value)}
                  placeholder="ex: Les séances d'exercices en binôme m'ont beaucoup aidé, les schémas récapitulatifs au tableau sont très clairs..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ce qui pourrait être amélioré (Pistes concrètes de progrès)</span>
                </label>
                <textarea
                  rows={3}
                  value={improvementSuggestions}
                  onChange={(e) => setImprovementSuggestions(e.target.value)}
                  placeholder="ex: Laisser 5 minutes en fin de séance pour copier les corrections, espacer les dates de rendu des devoirs maison..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Category Tag */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Thématique Principale de ce retour
              </label>
              <select
                value={categoryTag}
                onChange={(e) => setCategoryTag(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
              >
                <option value="clarity">Clarté des Explications</option>
                <option value="pedagogy">Méthodes & Activités Pédagogiques</option>
                <option value="content">Supports & Polycopiés de Cours</option>
                <option value="homework">Devoirs & Évaluations</option>
                <option value="pacing">Rythme d'Avancement</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                🔒 Transmission chiffrée sans identifiant
              </span>

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer mon Évaluation Anonyme</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teacher Action Plan Modal */}
      {respondingFeedback && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Plan d'Action Pédagogique Enseignant
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Répondre de façon constructive aux suggestions de la classe
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRespondingFeedback(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActionPlan} className="space-y-3.5 mt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Enseignant :</span>
                  <strong className="text-slate-800">{respondingFeedback.teacherName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Classe :</span>
                  <strong className="text-indigo-700">{respondingFeedback.gradeClass}</strong>
                </div>
                {respondingFeedback.improvementSuggestions && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      Suggestion formulée par l'élève :
                    </span>
                    <p className="italic text-slate-600 text-[11px]">
                      « {respondingFeedback.improvementSuggestions} »
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Mesures ou ajustements pédagogiques prévus
                </label>
                <textarea
                  rows={4}
                  required
                  value={actionNoteInput}
                  onChange={(e) => setActionNoteInput(e.target.value)}
                  placeholder="ex: Je prévois de consacrer 10 minutes à la fin de chaque séance pour résumer la méthode et clarifier les doutes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRespondingFeedback(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Enregistrer le Plan d'Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
