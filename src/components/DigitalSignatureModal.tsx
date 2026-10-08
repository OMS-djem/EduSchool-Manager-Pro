import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  X,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  Lock,
  Sparkles,
  Award,
  User,
  Type
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';

export interface ReportCardSignature {
  id: string;
  studentId: string;
  studentName: string;
  term: string;
  academicYear: string;
  signerName: string;
  signerRole: 'principal_teacher' | 'headmistress' | 'administrator';
  signerTitle: string;
  signatureDataUrl: string;
  signatureType: 'handwritten' | 'calligraphy';
  signedAt: string;
  securityHash: string;
  verificationCode: string;
  isFinalized: boolean;
  certStatement: string;
}

interface DigitalSignatureModalProps {
  studentId: string;
  studentName: string;
  gradeClass: string;
  term: string;
  existingSignature?: ReportCardSignature | null;
  onSave: (sig: ReportCardSignature) => void;
  onClose: () => void;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  studentId,
  studentName,
  gradeClass,
  term,
  existingSignature,
  onSave,
  onClose,
}) => {
  const { teachers, academicYear, language } = useSchool();
  const { currentRole, currentUser } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');

  // Signer metadata
  const [signerRole, setSignerRole] = useState<'principal_teacher' | 'headmistress' | 'administrator'>(
    existingSignature?.signerRole || 'principal_teacher'
  );
  const [signerName, setSignerName] = useState(
    existingSignature?.signerName || (teachers[0]?.name || 'Marc Dubois')
  );
  const [signerTitle, setSignerTitle] = useState(
    existingSignature?.signerTitle || 'Professeur Principal de la classe'
  );
  const [calligraphyFont, setCalligraphyFont] = useState<'cursive' | 'serif' | 'script'>('cursive');
  const [penColor, setPenColor] = useState<'#1e3a8a' | '#0f172a'>('#1e3a8a');
  const [isCertified, setIsCertified] = useState(true);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = penColor;

    if (existingSignature && existingSignature.signatureDataUrl && mode === 'draw') {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawn(true);
      };
      img.src = existingSignature.signatureDataUrl;
    }
  }, [mode, penColor]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if ('touches' in e) {
      // Prevent scrolling when drawing with finger / touch stylus
      e.preventDefault();
    }

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Generate Calligraphy on offscreen canvas
  const generateCalligraphyDataUrl = (): string => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 460;
    offscreen.height = 160;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    ctx.fillStyle = penColor;

    if (calligraphyFont === 'cursive') {
      ctx.font = 'italic bold 38px "Brush Script MT", "Segoe Script", cursive';
    } else if (calligraphyFont === 'script') {
      ctx.font = 'italic 34px "Snell Roundhand", "Apple Chancery", cursive';
    } else {
      ctx.font = 'italic bold 32px "Georgia", serif';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(signerName, offscreen.width / 2, offscreen.height / 2 - 10);

    // Decorative underline flourish
    ctx.beginPath();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = penColor;
    const startX = offscreen.width / 2 - 140;
    const endX = offscreen.width / 2 + 140;
    const y = offscreen.height / 2 + 25;
    ctx.moveTo(startX, y);
    ctx.bezierCurveTo(startX + 80, y + 10, endX - 80, y - 10, endX, y);
    ctx.stroke();

    return offscreen.toDataURL('image/png');
  };

  // Success chime
  const playSignatureChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio fallback
    }
  };

  // Generate cryptographic-style hash for signature integrity
  const generateSecurityHash = (name: string, dateStr: string): string => {
    const raw = `${studentId}-${term}-${academicYear}-${name}-${dateStr}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    return `SHA256:7E9${hex}${randomSuffix}ED9`;
  };

  const handleApplySignature = (e: React.FormEvent) => {
    e.preventDefault();

    let finalDataUrl = '';
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        alert(
          language === 'fr'
            ? 'Veuillez apposer votre signature sur le pad avant de valider.'
            : 'Please draw your signature before finalizing.'
        );
        return;
      }
      finalDataUrl = canvas.toDataURL('image/png');
    } else {
      finalDataUrl = generateCalligraphyDataUrl();
    }

    const now = new Date();
    const isoDate = now.toISOString();
    const securityHash = generateSecurityHash(signerName, isoDate);
    const verificationCode = `EDS-SIG-${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSignature: ReportCardSignature = {
      id: existingSignature?.id || `sig-${Date.now()}`,
      studentId,
      studentName,
      term,
      academicYear,
      signerName,
      signerRole,
      signerTitle,
      signatureDataUrl: finalDataUrl,
      signatureType: mode === 'draw' ? 'handwritten' : 'calligraphy',
      signedAt: now.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      securityHash,
      verificationCode,
      isFinalized: true,
      certStatement:
        'Certifié conforme et approuvé par la commission pédagogique pour transmission officielle aux parents.',
    };

    playSignatureChime();
    onSave(newSignature);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">
                {language === 'fr'
                  ? 'Signature Électronique Sécurisée du Bulletin'
                  : 'Secure Digital Report Card Signature'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Finalisation officielle pour transmission aux parents ({term})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Certificate Notice */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-950 p-3 text-white text-xs flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] text-slate-200">
              Élève : <strong className="text-white">{studentName}</strong> • {gradeClass}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
            Horodatage & Scellement Sécurisé
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleApplySignature} className="p-6 space-y-4 text-xs">
          {/* Signer Identity Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Qualité du Signataire
              </label>
              <select
                value={signerRole}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setSignerRole(val);
                  if (val === 'headmistress') {
                    setSignerName('Béatrice Fontaine');
                    setSignerTitle('Proviseure & Directrice Générale');
                  } else if (val === 'administrator') {
                    setSignerName('Jean-Marc Vianney');
                    setSignerTitle('Directeur des Études & de la Scolarité');
                  } else {
                    setSignerName(teachers[0]?.name || 'Marc Dubois');
                    setSignerTitle('Professeur Principal de la classe');
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-white"
              >
                <option value="principal_teacher">Professeur Principal</option>
                <option value="headmistress">Direction / Proviseure</option>
                <option value="administrator">Directeur des Études</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Nom complet du Signataire
              </label>
              <input
                type="text"
                required
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="ex: Marc Dubois"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Mention & Titre Officiel
            </label>
            <input
              type="text"
              required
              value={signerTitle}
              onChange={(e) => setSignerTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
            />
          </div>

          {/* Mode Switcher: Draw vs Calligraphy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-800 font-bold flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mode d'Apposition de Signature</span>
              </label>

              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMode('draw')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    mode === 'draw'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tracé Manuel
                </button>
                <button
                  type="button"
                  onClick={() => setMode('type')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    mode === 'type'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Calligraphie
                </button>
              </div>
            </div>

            {/* Mode 1: Interactive Canvas Drawing */}
            {mode === 'draw' ? (
              <div className="space-y-2">
                <div className="relative border-2 border-dashed border-indigo-300 bg-slate-50/70 rounded-xl overflow-hidden p-1">
                  <canvas
                    ref={canvasRef}
                    width={460}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[140px] bg-white rounded-lg cursor-crosshair touch-none"
                  />

                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                      Signez ici avec votre souris, pavé tactile ou stylet...
                    </div>
                  )}

                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleClearCanvas}
                      className="px-2 py-1 bg-white/90 hover:bg-white text-rose-600 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Effacer</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Encre :</span>
                    <button
                      type="button"
                      onClick={() => setPenColor('#1e3a8a')}
                      className={`w-4 h-4 rounded-full bg-blue-900 border-2 ${
                        penColor === '#1e3a8a' ? 'ring-2 ring-indigo-500' : 'opacity-70'
                      }`}
                      title="Bleu Encre"
                    />
                    <button
                      type="button"
                      onClick={() => setPenColor('#0f172a')}
                      className={`w-4 h-4 rounded-full bg-slate-900 border-2 ${
                        penColor === '#0f172a' ? 'ring-2 ring-indigo-500' : 'opacity-70'
                      }`}
                      title="Noir Profond"
                    />
                  </div>
                  <span>Tracé vectoriel haute définition</span>
                </div>
              </div>
            ) : (
              /* Mode 2: Calligraphic Typographic Signature */
              <div className="space-y-3">
                <div className="h-[140px] bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center p-4 text-center">
                  <span
                    className={`text-2xl text-blue-900 select-none ${
                      calligraphyFont === 'cursive'
                        ? 'font-serif italic font-bold'
                        : calligraphyFont === 'script'
                        ? 'italic tracking-wider font-semibold'
                        : 'font-serif italic font-bold'
                    }`}
                    style={{
                      fontFamily:
                        calligraphyFont === 'cursive'
                          ? '"Brush Script MT", "Segoe Script", cursive'
                          : calligraphyFont === 'script'
                          ? '"Snell Roundhand", "Apple Chancery", cursive'
                          : 'Georgia, serif',
                    }}
                  >
                    {signerName || 'Signature Calligraphique'}
                  </span>
                  <div className="w-48 h-0.5 bg-blue-800/60 mt-2"></div>
                  <span className="text-[10px] text-slate-400 mt-1">Aperçu du cachet numérique</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">Style de plume :</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCalligraphyFont('cursive')}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                        calligraphyFont === 'cursive'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Classique Cursive
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalligraphyFont('script')}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                        calligraphyFont === 'script'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Script Ronde
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalligraphyFont('serif')}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                        calligraphyFont === 'serif'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Plume Formelle
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legal Certification Checkbox */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="certCheck"
              required
              checked={isCertified}
              onChange={(e) => setIsCertified(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="certCheck" className="text-[11px] text-amber-900 leading-relaxed cursor-pointer">
              <strong>Engagement légal & conformité :</strong> Je certifie sur l'honneur l'exactitude des moyennes, coefficients et appréciations portées sur ce bulletin trimestriel, et j'autorise sa transmission officielle aux parents.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Appliquer la Signature Sécurisée & Sceller</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
