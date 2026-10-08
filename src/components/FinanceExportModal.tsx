import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  X,
  FileText,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { FinanceTransaction, SchoolLevel } from '../types';

interface FinanceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  finances: FinanceTransaction[];
  academicYear: string;
  language: 'fr' | 'en';
}

export const FinanceExportModal: React.FC<FinanceExportModalProps> = ({
  isOpen,
  onClose,
  finances,
  academicYear,
  language,
}) => {
  const [periodType, setPeriodType] = useState<'yearly' | 'monthly' | 'all'>('yearly');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('2024-09');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [levelFilter, setLevelFilter] = useState<SchoolLevel>('all');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  // Filter transactions based on chosen criteria
  const matchingTransactions = finances.filter((tx) => {
    // 1. Level filter
    if (levelFilter !== 'all' && tx.schoolLevel && tx.schoolLevel !== levelFilter) {
      return false;
    }

    // 2. Type filter
    if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) {
      return false;
    }

    // 3. Period filter
    const dateToCheck = tx.paidDate || tx.dueDate || '';
    if (periodType === 'monthly') {
      if (!dateToCheck.startsWith(selectedMonth)) {
        return false;
      }
    } else if (periodType === 'yearly') {
      if (!dateToCheck.startsWith(selectedYear)) {
        // Also check if academic year includes this year
        const cleanYear = academicYear.replace(/\s/g, '');
        if (!cleanYear.includes(dateToCheck.slice(0, 4))) {
          return false;
        }
      }
    }

    return true;
  });

  const totalIncome = matchingTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = matchingTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const handleDownloadCSV = () => {
    // Generate headers
    const headers = language === 'fr'
      ? [
          'Reference_Facture',
          'Date_Paiement',
          'Type_Operation',
          'Categorie',
          'Eleve_Beneficiaire',
          'Niveau_Scolaire',
          'Montant_EUR',
          'Mode_Paiement',
          'Statut',
          'Remarques_Justificatif'
        ]
      : [
          'Invoice_Reference',
          'Payment_Date',
          'Transaction_Type',
          'Category',
          'Student_Beneficiary',
          'School_Level',
          'Amount_EUR',
          'Payment_Method',
          'Status',
          'Notes'
        ];

    // Build rows
    const rows = matchingTransactions.map((tx) => [
      `"${tx.invoiceNumber || ''}"`,
      `"${tx.paidDate || tx.dueDate || ''}"`,
      `"${tx.type === 'income' ? (language === 'fr' ? 'Recette' : 'Income') : (language === 'fr' ? 'Dépense' : 'Expense')}"`,
      `"${tx.category || ''}"`,
      `"${(tx.studentName || 'Charges Établissement').replace(/"/g, '""')}"`,
      `"${tx.schoolLevel ? tx.schoolLevel.toUpperCase() : 'GÉNÉRAL'}"`,
      tx.amount,
      `"${tx.paymentMethod || ''}"`,
      `"${tx.status === 'completed' ? (language === 'fr' ? 'Acquitté' : 'Completed') : tx.status === 'pending' ? (language === 'fr' ? 'En cours' : 'Pending') : (language === 'fr' ? 'Relance' : 'Overdue')}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`
    ]);

    // Summary lines at the bottom of the CSV
    const summaryRows = [
      [],
      [
        `"--- RÉCAPITULATIF FINANCIER (${periodType === 'yearly' ? `Année ${selectedYear}` : periodType === 'monthly' ? `Mois ${selectedMonth}` : 'Global'}) ---"`
      ],
      [`"Total Recettes Encaissées (EUR)"`, `""`, `""`, `""`, `""`, `""`, totalIncome],
      [`"Total Dépenses & Charges (EUR)"`, `""`, `""`, `""`, `""`, `""`, totalExpense],
      [`"Solde Net d'Exploitation (EUR)"`, `""`, `""`, `""`, `""`, `""`, netBalance]
    ];

    // Combine with UTF-8 BOM (\uFEFF) for Excel compatibility
    const csvContent =
      '\uFEFF' +
      [
        headers.join(';'),
        ...rows.map((r) => r.join(';')),
        ...summaryRows.map((r) => r.join(';'))
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const filename =
      periodType === 'yearly'
        ? `Rapport_Financier_Annuel_${selectedYear}_EduSchool.csv`
        : periodType === 'monthly'
        ? `Rapport_Financier_Mensuel_${selectedMonth}_EduSchool.csv`
        : `Rapport_Financier_Global_EduSchool.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {language === 'fr' ? 'Export Comptable & Rapports CSV' : 'Financial Reports & CSV Export'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'fr'
                  ? 'Générez et téléchargez le grand livre budgétaire mensuel ou annuel'
                  : 'Generate and download monthly or yearly ledger transactions'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-4 text-xs">
          {/* 1. Period Selector */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'fr' ? 'Période du Rapport' : 'Report Period'}</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPeriodType('yearly')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  periodType === 'yearly'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {language === 'fr' ? 'Rapport Annuel' : 'Yearly Report'}
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('monthly')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  periodType === 'monthly'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {language === 'fr' ? 'Rapport Mensuel' : 'Monthly Report'}
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('all')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  periodType === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {language === 'fr' ? 'Tout l’historique' : 'All History'}
              </button>
            </div>

            {/* Dynamic input for year or month */}
            {periodType === 'yearly' && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-slate-500 font-medium">Année de référence :</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="2024">Année Civile 2024</option>
                  <option value="2025">Année Civile 2025</option>
                  <option value="2026">Année Civile 2026</option>
                </select>
                <span className="text-[11px] text-slate-400">
                  (Année scolaire active : {academicYear})
                </span>
              </div>
            )}

            {periodType === 'monthly' && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-slate-500 font-medium">Mois sélectionné :</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* 2. Type & Level Filters */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                <span>Flux Opérationnels</span>
              </label>
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
              >
                <option value="all">Budget Global (Recettes & Dépenses)</option>
                <option value="income">Recettes Seules (Écolage & Droits)</option>
                <option value="expense">Dépenses Seules (Charges & Salaires)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Niveau d'Enseignement</span>
              </label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as SchoolLevel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
              >
                <option value="all">Tous Niveaux Confondus</option>
                <option value="primary">Primaire (Élémentaire)</option>
                <option value="middle">Collège</option>
                <option value="high">Lycée</option>
              </select>
            </div>
          </div>

          {/* 3. Live Selection Preview Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span>{language === 'fr' ? 'Transactions correspondantes :' : 'Matched records:'}</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                {matchingTransactions.length} écriture(s)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
              <div>
                <span className="text-slate-400 block uppercase font-medium">Recettes</span>
                <strong className="text-emerald-700 text-xs">+{totalIncome.toLocaleString()} €</strong>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-medium">Charges</span>
                <strong className="text-slate-800 text-xs">-{totalExpense.toLocaleString()} €</strong>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-medium">Solde Net</span>
                <strong className={`text-xs ${netBalance >= 0 ? 'text-indigo-900 font-extrabold' : 'text-rose-600 font-bold'}`}>
                  {netBalance.toLocaleString()} €
                </strong>
              </div>
            </div>
          </div>

          {/* Success banner */}
          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl flex items-center gap-2 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Rapport CSV généré et téléchargé avec succès !</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 font-mono">
              Format: UTF-8 CSV (Séparateur ';')
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDownloadCSV}
                disabled={matchingTransactions.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger Rapport CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
