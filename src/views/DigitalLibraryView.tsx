import React, { useState } from 'react';
import {
  BookOpen,
  Library,
  UploadCloud,
  FileText,
  Bookmark,
  Search,
  Filter,
  Download,
  ExternalLink,
  Plus,
  Clock,
  CheckCircle2,
  Tag,
  Star,
  Trash2,
  Edit2,
  X,
  FileCode,
  Layers,
  GraduationCap,
  Sparkles,
  Eye,
  FileArchive,
  BookMarked
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { LibraryMaterial, SchoolLevel } from '../types';

export const DigitalLibraryView: React.FC = () => {
  const {
    schoolLevel,
    libraryMaterials,
    saveLibraryMaterial,
    deleteLibraryMaterial,
    teachers,
    subjects,
    students,
    language,
  } = useSchool();
  const { currentRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<LibraryMaterial | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Form state for new / edit upload
  const [editingMaterial, setEditingMaterial] = useState<LibraryMaterial | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<LibraryMaterial['type']>('course_material');
  const [formCategory, setFormCategory] = useState<LibraryMaterial['category']>('Sciences');
  const [formSubject, setFormSubject] = useState('Mathématiques & Raisonnement');
  const [formLevel, setFormLevel] = useState<SchoolLevel>(schoolLevel === 'all' ? 'high' : schoolLevel);
  const [formTargetClass, setFormTargetClass] = useState('Terminale S1');
  const [formAuthor, setFormAuthor] = useState(teachers[0]?.name || 'Prof. Laurent Diallo');
  const [formFormat, setFormFormat] = useState<LibraryMaterial['fileFormat']>('PDF');
  const [formFileSize, setFormFileSize] = useState('3.5 MB');
  const [formDuration, setFormDuration] = useState(60);
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState('Cours, Révision, Exercices');
  const [formFeatured, setFormFeatured] = useState(false);

  // Classes list
  const classesList = Array.from(new Set(students.map((s) => s.gradeClass)));

  // Filtered materials
  const filteredMaterials = libraryMaterials.filter((m) => {
    const matchLevel = schoolLevel === 'all' || m.schoolLevel === 'all' || m.schoolLevel === schoolLevel;
    const matchType = selectedType === 'all' || m.type === selectedType;
    const matchCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchClass = selectedClass === 'all' || m.targetClasses.includes(selectedClass) || m.targetClasses.includes('All');
    const matchSearch =
      !searchTerm ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.authorTeacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchLevel && matchType && matchCategory && matchClass && matchSearch;
  });

  // KPI Metrics
  const totalDocs = libraryMaterials.length;
  const courseCount = libraryMaterials.filter((m) => m.type === 'course_material').length;
  const readingListCount = libraryMaterials.filter((m) => m.type === 'reading_list').length;
  const examPrepCount = libraryMaterials.filter((m) => m.type === 'exam_prep').length;
  const totalDownloads = libraryMaterials.reduce((acc, m) => acc + m.downloadsCount, 0);

  // Open Upload / Edit modal
  const handleOpenUpload = (mat?: LibraryMaterial) => {
    if (mat) {
      setEditingMaterial(mat);
      setFormTitle(mat.title);
      setFormType(mat.type);
      setFormCategory(mat.category);
      setFormSubject(mat.subjectName);
      setFormLevel(mat.schoolLevel === 'all' ? 'high' : mat.schoolLevel);
      setFormTargetClass(mat.targetClasses[0] || 'Terminale S1');
      setFormAuthor(mat.authorTeacher);
      setFormFormat(mat.fileFormat);
      setFormFileSize(mat.fileSize || '3.5 MB');
      setFormDuration(mat.readingDurationMinutes || 60);
      setFormDescription(mat.description);
      setFormTags(mat.tags.join(', '));
      setFormFeatured(mat.isFeatured || false);
    } else {
      setEditingMaterial(null);
      setFormTitle('');
      setFormType('course_material');
      setFormCategory('Sciences');
      setFormSubject(subjects[0]?.name || 'Mathématiques');
      setFormLevel(schoolLevel === 'all' ? 'high' : schoolLevel);
      setFormTargetClass('Terminale S1');
      setFormAuthor(teachers[0]?.name || 'Prof. Laurent Diallo');
      setFormFormat('PDF');
      setFormFileSize('4.2 MB');
      setFormDuration(45);
      setFormDescription('');
      setFormTags('Bac, Exercices, Polycopié');
      setFormFeatured(false);
    }
    setIsUploadModalOpen(true);
  };

  const handleSaveUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newMat: LibraryMaterial = {
      id: editingMaterial ? editingMaterial.id : `lib-${Date.now()}`,
      title: formTitle,
      type: formType,
      category: formCategory,
      subjectName: formSubject,
      schoolLevel: formLevel,
      targetClasses: [formTargetClass],
      authorTeacher: formAuthor,
      fileFormat: formFormat,
      fileSize: formFileSize,
      readingDurationMinutes: Number(formDuration),
      description: formDescription,
      tags: tagArray,
      uploadedAt: editingMaterial ? editingMaterial.uploadedAt : new Date().toISOString().split('T')[0],
      downloadsCount: editingMaterial ? editingMaterial.downloadsCount : 0,
      isFeatured: formFeatured,
    };

    await saveLibraryMaterial(newMat);
    setIsUploadModalOpen(false);

    setNotificationMsg(
      language === 'fr'
        ? `✓ Document « ${formTitle} » publié dans la bibliothèque avec succès !`
        : `✓ Material "${formTitle}" successfully published!`
    );
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleDownload = async (mat: LibraryMaterial) => {
    // Increment download counter
    const updated: LibraryMaterial = {
      ...mat,
      downloadsCount: mat.downloadsCount + 1,
    };
    await saveLibraryMaterial(updated);

    // Create a mock document text blob for instant simulated download
    const sampleContent = `========================================================\nEDUSCHOOL DIGITAL LIBRARY - DOCUMENT OFFICIEL\n========================================================\n\nTitre: ${mat.title}\nDiscipline: ${mat.subjectName} (${mat.category})\nEnseignant Auteur: ${mat.authorTeacher}\nNiveau & Classes: ${mat.schoolLevel.toUpperCase()} - ${mat.targetClasses.join(', ')}\nDate de Publication: ${mat.uploadedAt}\nFormat: ${mat.fileFormat} (${mat.fileSize})\n\nRESUMÉ DU DOCUMENT :\n${mat.description}\n\nMOTS-CLÉS / TAGS :\n${mat.tags.join(', ')}\n\n(Document pédagogique certifié par EduSchool International)\n`;

    const blob = new Blob([sampleContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mat.title.replace(/[^a-zA-Z0-9]/g, '_')}_EduSchool.${mat.fileFormat.toLowerCase() === 'pdf' ? 'txt' : mat.fileFormat.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotificationMsg(
      language === 'fr'
        ? `Téléchargement de « ${mat.title} » lancé !`
        : `Downloading "${mat.title}"...`
    );
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const getFormatBadge = (format: LibraryMaterial['fileFormat']) => {
    switch (format) {
      case 'PDF':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'DOCX':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'EPUB':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'ZIP':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'SLIDES':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeLabel = (type: LibraryMaterial['type']) => {
    switch (type) {
      case 'course_material':
        return language === 'fr' ? 'Polycopié de Cours' : 'Course Material';
      case 'reading_list':
        return language === 'fr' ? 'Liste de Lecture' : 'Reading List';
      case 'reference_doc':
        return language === 'fr' ? 'Doc de Référence' : 'Reference Doc';
      case 'exam_prep':
        return language === 'fr' ? 'Annales & Corrigés' : 'Exam Prep';
      case 'e_book':
        return language === 'fr' ? 'Manuel / E-Book' : 'E-Book';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
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

      {/* Header and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
              <Library className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {language === 'fr' ? 'Bibliothèque Numérique & Ressources Pédagogiques' : 'Digital Library & Course Materials'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'fr'
              ? 'Dépôt des polycopiés de cours, listes de lecture, annales corrigées et manuels numériques accessibles aux élèves.'
              : 'Course materials repository, bibliographies, past exams, and digital textbooks for student access.'}
          </p>
        </div>

        <button
          onClick={() => handleOpenUpload()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{language === 'fr' ? 'Publier une Ressource' : 'Upload Material'}</span>
        </button>
      </div>

      {/* Top Stat KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Ressources Totales</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalDocs}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Documents certifiés</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Polycopiés de Cours</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{courseCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Syllabus & chapitres</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Listes de Lecture</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{readingListCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Bibliographies & romans</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Téléchargements Élèves</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalDownloads}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Consultations de fichiers</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={language === 'fr' ? 'Rechercher un cours, livre, annale, auteur ou tag...' : 'Search course, book, author...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">Toutes Disciplines</option>
              <option value="Sciences">Sciences & Maths</option>
              <option value="Humanities">Lettres & Philosophie</option>
              <option value="Languages">Langues Vivantes</option>
              <option value="Arts">Arts & Culture</option>
            </select>

            {/* Target Class */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="all">Toutes Classes</option>
              {classesList.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 text-xs">
          {[
            { id: 'all', label: 'Tout le Catalogue' },
            { id: 'course_material', label: 'Polycopiés de Cours' },
            { id: 'reading_list', label: 'Listes de Lecture' },
            { id: 'reference_doc', label: 'Formulaires & Mémentos' },
            { id: 'exam_prep', label: 'Annales & Corrigés' },
            { id: 'e_book', label: 'Manuels & E-Books' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                selectedType === type.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Cards Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Aucun document ne correspond à vos filtres</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Modifiez vos critères de recherche ou publiez une nouvelle ressource pour enrichir la bibliothèque scolaire.
          </p>
          <button
            onClick={() => handleOpenUpload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            Publier un Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((mat) => (
            <div
              key={mat.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group ${
                mat.isFeatured ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'
              }`}
            >
              {mat.isFeatured && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-extrabold border border-amber-200">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                  <span>À la Une</span>
                </div>
              )}

              <div>
                {/* Badges bar */}
                <div className="flex items-center gap-2 mb-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] border ${getFormatBadge(
                      mat.fileFormat
                    )}`}
                  >
                    {mat.fileFormat}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                    {getTypeLabel(mat.type)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                  {mat.title}
                </h3>

                {/* Subject & Author */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-indigo-700 truncate">{mat.subjectName}</span>
                  <span className="truncate">{mat.authorTeacher}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {mat.description}
                </p>

                {/* Metadata Pills: Classes, Size, Duration */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 text-slate-700 font-medium">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{mat.targetClasses.join(', ')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {mat.readingDurationMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>~{mat.readingDurationMinutes} min</span>
                      </span>
                    )}
                    <span>•</span>
                    <span className="font-mono text-[10px] text-slate-400">{mat.fileSize}</span>
                  </div>
                </div>

                {/* Tags list */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {mat.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 text-[10px] border border-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewMaterial(mat)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Aperçu du document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenUpload(mat)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Modifier la fiche"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteLibraryMaterial(mat.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleDownload(mat)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Reader / Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getFormatBadge(
                      previewMaterial.fileFormat
                    )}`}
                  >
                    {previewMaterial.fileFormat}
                  </span>
                  <span className="text-xs font-semibold text-indigo-700">
                    {previewMaterial.subjectName}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {previewMaterial.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Auteur</span>
                  <strong className="text-slate-800">{previewMaterial.authorTeacher}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Classes cibles</span>
                  <strong className="text-slate-800">{previewMaterial.targetClasses.join(', ')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Taille fichier</span>
                  <strong className="text-slate-800">{previewMaterial.fileSize}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Téléchargements</span>
                  <strong className="text-emerald-700">{previewMaterial.downloadsCount}</strong>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Résumé pédagogique & Objectifs :</h4>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {previewMaterial.description}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Index des mots-clés :</h4>
                <div className="flex flex-wrap gap-1.5">
                  {previewMaterial.tags.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Fermer
              </button>

              <button
                onClick={() => {
                  handleDownload(previewMaterial);
                  setPreviewMaterial(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger le Fichier ({previewMaterial.fileFormat})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload & Organize Material Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingMaterial
                      ? (language === 'fr' ? 'Modifier la Ressource' : 'Edit Course Material')
                      : (language === 'fr' ? 'Publier dans la Bibliothèque' : 'Upload to Digital Library')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mise à disposition pour les élèves et enseignants
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpload} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Titre de la Ressource</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="ex: Polycopié N°3 : Dérivation & Limites"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Type de Document</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="course_material">Polycopié de Cours</option>
                    <option value="reading_list">Liste de Lecture / Bibliographie</option>
                    <option value="reference_doc">Document de Référence / Formulaire</option>
                    <option value="exam_prep">Annales & Sujets d'Examen</option>
                    <option value="e_book">Manuel Numérique / E-Book</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Discipline / Matière</label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Mathématiques"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Niveau & Cycle</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as SchoolLevel)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="all">Tous Niveaux</option>
                    <option value="primary">Primaire (Élémentaire)</option>
                    <option value="middle">Collège</option>
                    <option value="high">Lycée</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Classe Cible Principale</label>
                  <select
                    value={formTargetClass}
                    onChange={(e) => setFormTargetClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="Toutes">Toutes Classes</option>
                    {classesList.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Format Fichier</label>
                  <select
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOCX">Word (DOCX)</option>
                    <option value="EPUB">EPUB</option>
                    <option value="ZIP">Pack ZIP</option>
                    <option value="SLIDES">Diaporama</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Taille Estimée</label>
                  <input
                    type="text"
                    value={formFileSize}
                    onChange={(e) => setFormFileSize(e.target.value)}
                    placeholder="3.5 MB"
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Temps Lecture</label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Enseignant Responsable</label>
                <input
                  type="text"
                  required
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  placeholder="Prof. ..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description & Contenu</label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Détaillez les notions abordées, chapitres, exercices inclus..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mots-clés / Tags (séparés par virgules)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="ex: Bac 2025, Cours, Dérivées, Exercices"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="featured-check" className="text-slate-700 font-semibold cursor-pointer">
                  Mettre en avant sur la page d'accueil de la bibliothèque (À la Une)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  {editingMaterial ? 'Enregistrer les Modifications' : 'Publier le Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
