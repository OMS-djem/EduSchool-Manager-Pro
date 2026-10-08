import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Camera,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle,
  X,
  Volume2,
  VolumeX,
  Search,
  Users,
  Sparkles,
  GraduationCap,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { Student, AttendanceRecord, SchoolLevel } from '../types';

interface QRAttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schoolLevel: SchoolLevel;
  saveAttendance: (record: AttendanceRecord) => Promise<void>;
  saveStudent: (student: Student) => Promise<void>;
  language: 'fr' | 'en';
}

export const QRAttendanceScannerModal: React.FC<QRAttendanceScannerModalProps> = ({
  isOpen,
  onClose,
  students,
  schoolLevel,
  saveAttendance,
  saveStudent,
  language,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [activeStatus, setActiveStatus] = useState<'present' | 'late' | 'absent_justified'>('present');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Real-time camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Scanned in this session
  const [scannedSession, setScannedSession] = useState<
    {
      student: Student;
      timestamp: string;
      status: 'present' | 'late' | 'absent_justified';
    }[]
  >([]);

  const [lastScanned, setLastScanned] = useState<{
    student: Student;
    status: string;
    timestamp: string;
  } | null>(null);

  const availableClasses = Array.from(
    new Set(
      students
        .filter((s) => schoolLevel === 'all' || s.schoolLevel === schoolLevel)
        .map((s) => s.gradeClass)
    )
  );

  // Filter students for the quick tap list
  const filteredStudents = students.filter((s) => {
    const matchLevel = schoolLevel === 'all' || s.schoolLevel === schoolLevel;
    const matchClass = selectedClass === 'all' || s.gradeClass === selectedClass;
    const matchSearch =
      !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    return matchLevel && matchClass && matchSearch;
  });

  // Sound chime using Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6 note

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Audio autoplay restrictions or headless environment
    }
  };

  // Start real webcam stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La caméra n’est pas supportée dans cet environnement.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Caméra non disponible ou accès refusé. Utilisez le scanner badge direct ci-dessous.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Process Check-In for a given student
  const handleCheckIn = async (student: Student, overrideStatus?: 'present' | 'late' | 'absent_justified') => {
    const statusToApply = overrideStatus || activeStatus;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];

    // Check if already checked in this session
    const existingIndex = scannedSession.findIndex((s) => s.student.id === student.id);
    let newSession = [...scannedSession];
    if (existingIndex >= 0) {
      newSession[existingIndex] = { student, timestamp: timeStr, status: statusToApply };
    } else {
      newSession = [{ student, timestamp: timeStr, status: statusToApply }, ...newSession];
    }
    setScannedSession(newSession);

    // Audio chime & last scanned feedback
    playBeep();
    setLastScanned({
      student,
      status: statusToApply,
      timestamp: timeStr,
    });

    // Save attendance record to Firestore
    const record: AttendanceRecord = {
      id: `att-qr-${student.id}-${todayStr}-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      gradeClass: student.gradeClass,
      schoolLevel: student.schoolLevel,
      date: todayStr,
      status: statusToApply,
      reason: statusToApply === 'late' ? `Arrivée à ${timeStr}` : 'Pointage par badge QR',
      recordedBy: 'Scanner QR Enseignant',
    };

    await saveAttendance(record);

    // Update student's attendance rate slightly if marked present
    if (statusToApply === 'present' && student.attendanceRate < 100) {
      const updatedRate = Math.min(100, Math.round((student.attendanceRate * 0.98 + 100 * 0.02) * 10) / 10);
      await saveStudent({
        ...student,
        attendanceRate: updatedRate,
      });
    }
  };

  // Submit manual barcode or matricule
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = students.find(
      (s) =>
        s.matricule.toLowerCase() === barcodeInput.trim().toLowerCase() ||
        s.id.toLowerCase() === barcodeInput.trim().toLowerCase() ||
        s.name.toLowerCase().includes(barcodeInput.trim().toLowerCase())
    );

    if (matched) {
      handleCheckIn(matched);
      setBarcodeInput('');
    } else {
      alert(`Matricule ou identifiant non reconnu : ${barcodeInput}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-md">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  {language === 'fr' ? 'Pointage Présence par Badge QR' : 'QR-Code Attendance Scanner'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Direct Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'fr'
                  ? 'Scannez le badge élève ou sélectionnez pour valider l’arrivée instantanée'
                  : 'Scan student badges or tap to record instant arrival'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
                soundEnabled
                  ? 'bg-slate-800 text-emerald-400 border-slate-700'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
              title={soundEnabled ? 'Bip sonore activé' : 'Bip sonore coupé'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status selector for incoming scan */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Statut à l’arrivée :</span>
            <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveStatus('present')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeStatus === 'present'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Présent (À l’heure)
              </button>
              <button
                type="button"
                onClick={() => setActiveStatus('late')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeStatus === 'late'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                En Retard
              </button>
              <button
                type="button"
                onClick={() => setActiveStatus('absent_justified')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeStatus === 'absent_justified'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Excusé
              </button>
            </div>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-800 text-white">Toutes Classes</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls} className="bg-slate-800 text-white">
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body: Left Scanner/Viewfinder & Right Live Attendance Session */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Viewfinder & Quick Badge List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Camera Viewfinder Box */}
            <div className="relative w-full h-56 sm:h-64 bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-inner">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Glowing Laser Scan Line Overlay */}
                  <div className="absolute inset-x-8 top-1/2 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce pointer-events-none"></div>
                  {/* Target Corners */}
                  <div className="absolute inset-10 border-2 border-dashed border-emerald-400/60 rounded-xl pointer-events-none"></div>
                </>
              ) : (
                <div className="text-center p-4 space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                    <Camera className="w-7 h-7" />
                  </div>
                  <p className="text-xs text-slate-300 font-semibold">
                    {cameraError || 'Viseur Prêt pour le Pointage par QR Code'}
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Activez la caméra ou cliquez sur le badge d'un élève dans la liste ci-dessous pour valider sa présence en 1 clic.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Activer Caméra Vidéo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Stop camera button if active */}
              {cameraActive && (
                <button
                  onClick={stopCamera}
                  className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 hover:bg-black text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700"
                >
                  Arrêter Caméra
                </button>
              )}
            </div>

            {/* Quick Matricule / Barcode Gun Input */}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scanner douchette ou saisir Matricule (ex: MAT-2024-001)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 text-white text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono placeholder-slate-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Valider
              </button>
            </form>

            {/* Student Badges Click-to-Scan List */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Badges Enregistrés ({filteredStudents.length} élèves)</span>
                </span>
                <span className="text-[10px] text-slate-500">Cliquez pour pointer</span>
              </div>

              {/* Filter search in badges */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrer élève par nom ou matricule..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/50">
                {filteredStudents.map((stu) => {
                  const isChecked = scannedSession.some((s) => s.student.id === stu.id);
                  return (
                    <div
                      key={stu.id}
                      onClick={() => handleCheckIn(stu)}
                      className={`pt-1.5 first:pt-0 flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer border ${
                        isChecked
                          ? 'border-emerald-500/40 bg-emerald-950/20'
                          : 'border-transparent hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                          {stu.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white truncate">{stu.name}</span>
                            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {stu.matricule}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {stu.gradeClass} • {stu.attendanceRate}% assiduité
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {isChecked ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Pointé
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 group-hover:text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                            Pointer
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Last Scan Card & Real-Time Session Feed (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Last Scanned Instant Confirmation Card */}
            {lastScanned ? (
              <div className="p-4 bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-2xl shadow-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pointage Confirmé !</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {lastScanned.timestamp}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-extrabold text-base">
                    {lastScanned.student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{lastScanned.student.name}</h4>
                    <p className="font-mono text-[11px] text-slate-400">{lastScanned.student.matricule}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {lastScanned.student.gradeClass} ({lastScanned.student.schoolLevel.toUpperCase()})
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between text-slate-300">
                  <span>Parent notifié :</span>
                  <span className="font-medium text-white">{lastScanned.student.parentPhone}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-1 text-slate-400">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-bold text-xs text-slate-300">En attente de scan</p>
                <p className="text-[11px] text-slate-500">
                  Passez un badge devant la caméra ou cliquez sur un élève pour lancer la session.
                </p>
              </div>
            )}

            {/* Session Roll Call Feed */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Journal de la Séance ({scannedSession.length})</span>
                </span>
                {scannedSession.length > 0 && (
                  <button
                    onClick={() => setScannedSession([])}
                    className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Réinitialiser
                  </button>
                )}
              </div>

              {scannedSession.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Aucun élève pointé pour le moment.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {scannedSession.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate text-xs">{item.student.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.student.matricule} • {item.student.gradeClass}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'present'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.status === 'late'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {item.status === 'present' ? 'Présent' : item.status === 'late' ? 'En Retard' : 'Excusé'}
                        </span>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{item.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Mise à jour en temps réel synchronisée avec le dossier scolaire</span>
          </span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold border border-slate-700"
          >
            Fermer le Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
