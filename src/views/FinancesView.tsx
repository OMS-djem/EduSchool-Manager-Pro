import React, { useState } from 'react';
import {
  WalletCards,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  CreditCard,
  Building,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { FinanceTransaction } from '../types';
import { ReceiptModal } from '../components/ReceiptModal';
import { FinanceExportModal } from '../components/FinanceExportModal';

interface FinancesViewProps {
  isAddModalOpenInitially?: boolean;
  onCloseAddModalInitially?: () => void;
}

export const FinancesView: React.FC<FinancesViewProps> = ({
  isAddModalOpenInitially,
  onCloseAddModalInitially
}) => {
  const { schoolLevel, finances, students, saveFinance, language, academicYear, t } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<FinanceTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenInitially || false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // New Transaction Form state
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState<FinanceTransaction['category']>('Tuition');
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [amount, setAmount] = useState(1200);
  const [paymentMethod, setPaymentMethod] = useState<FinanceTransaction['paymentMethod']>('Bank Transfer');
  const [status, setStatus] = useState<FinanceTransaction['status']>('completed');
  const [notes, setNotes] = useState('');

  // Financial aggregates
  const incomeList = finances.filter((f) => f.type === 'income' && f.status === 'completed');
  const expenseList = finances.filter((f) => f.type === 'expense' && f.status === 'completed');
  const overdueList = finances.filter((f) => f.status === 'overdue' || f.status === 'pending');

  const totalIncome = incomeList.reduce((acc, f) => acc + f.amount, 0);
  const totalExpense = expenseList.reduce((acc, f) => acc + f.amount, 0);
  const totalOverdue = overdueList.reduce((acc, f) => acc + f.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  const filteredFinances = finances.filter((f) => {
    const matchesLevel =
      schoolLevel === 'all' || !f.schoolLevel || f.schoolLevel === schoolLevel;
    const matchesType = typeFilter === 'all' || f.type === typeFilter;
    const matchesSearch =
      (f.studentName && f.studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      f.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesType && matchesSearch;
  });

  const handleOpenAdd = () => {
    setTxType('income');
    setCategory('Tuition');
    setStudentId(students[0]?.id || '');
    setAmount(1200);
    setPaymentMethod('Bank Transfer');
    setStatus('completed');
    setNotes('Règlement scolarité');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find((s) => s.id === studentId);
    const invoiceNumber = `${txType === 'income' ? 'INV' : 'EXP'}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTx: FinanceTransaction = {
      id: `fin-${Date.now()}`,
      type: txType,
      category,
      studentId: txType === 'income' ? studentId : undefined,
      studentName: txType === 'income' ? (stu?.name || 'Élève externe') : undefined,
      schoolLevel: txType === 'income' ? stu?.schoolLevel : undefined,
      amount: Number(amount),
      currency: 'EUR',
      paymentMethod,
      status,
      paidDate: status === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
      dueDate: status !== 'completed' ? new Date().toISOString().split('T')[0] : undefined,
      invoiceNumber,
      notes,
    };

    await saveFinance(newTx);
    setIsModalOpen(false);
    if (onCloseAddModalInitially) onCloseAddModalInitially();

    // Auto open receipt preview if completed income
    if (txType === 'income' && status === 'completed') {
      setSelectedReceipt(newTx);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {language === 'fr' ? 'Gestion Financière & Recouvrement Scolarité' : 'Financial Management & Tuition Fees'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'fr'
              ? 'Suivi des encaissements d’écolage, devis, quittances, salaires et factures fournisseurs.'
              : 'Tuition collections, fee structures, receipts generation, payroll, and school expenses.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 shadow-sm transition-all cursor-pointer"
            title="Exporter le budget et écritures comptables au format CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{language === 'fr' ? 'Exporter Rapport CSV' : 'Export CSV Report'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('recordPayment')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Recettes Encaissées</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-950 mt-2">
            {totalIncome.toLocaleString()} €
          </div>
          <p className="text-xs text-slate-500 mt-1">Écolage, cantine, inscriptions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Créances / En Attente</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-950 mt-2">
            {totalOverdue.toLocaleString()} €
          </div>
          <p className="text-xs text-rose-600 font-semibold mt-1">Factures non acquittées</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Charges & Salaires</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {totalExpense.toLocaleString()} €
          </div>
          <p className="text-xs text-slate-500 mt-1">Fournisseurs & maintenance</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Flux Net Trésorerie</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <WalletCards className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-bold mt-2 ${netCashFlow >= 0 ? 'text-indigo-950' : 'text-rose-600'}`}>
            {netCashFlow.toLocaleString()} €
          </div>
          <p className="text-xs text-slate-500 mt-1">Solde d’exploitation actif</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tous Flux
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === 'income'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Encaissements (Revenus)
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              typeFilter === 'expense'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Dépenses (Charges)
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="N° facture, élève, catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800 w-56"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Réf. Facture / Reçu</th>
                <th className="py-3 px-3">Bénéficiaire / Élève</th>
                <th className="py-3 px-3">Catégorie</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-3 text-right">Montant</th>
                <th className="py-3 px-3 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Action Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFinances.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    {tx.invoiceNumber}
                    <span className="block text-[10px] font-sans font-normal text-slate-400">
                      {tx.paidDate || tx.dueDate}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-900 block">
                      {tx.studentName || 'Charges Générales'}
                    </span>
                    {tx.schoolLevel && (
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">
                        {tx.schoolLevel}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-slate-700">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                      {tx.category}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {tx.paymentMethod}
                  </td>

                  <td className={`py-3 px-3 text-right font-bold text-sm ${
                    tx.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()} €
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                      tx.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tx.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {tx.status === 'completed' ? 'Acquitté' : tx.status === 'pending' ? 'En cours' : 'Relance'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedReceipt(tx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Reçu</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment / Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'fr' ? 'Enregistrement Comptable' : 'Record Transaction'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Type d’opération</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="income">Encaissement (Recette)</option>
                    <option value="expense">Dépense (Charge)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="Tuition">Scolarité (Écolage)</option>
                    <option value="Registration">Frais d’Inscription</option>
                    <option value="Transport">Transport Scolaire</option>
                    <option value="Canteen">Demi-Pension (Cantine)</option>
                    <option value="Salaries">Salaires du personnel</option>
                    <option value="Supplies">Fournitures & Manuels</option>
                    <option value="Maintenance">Entretien & Bâtiment</option>
                  </select>
                </div>
              </div>

              {txType === 'income' && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Élève concerné</label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.gradeClass} - {s.matricule})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Montant (€)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mode de Paiement</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="Bank Transfer">Virement Bancaire</option>
                    <option value="Credit Card">Carte Bancaire</option>
                    <option value="Cash">Espèces / Cash</option>
                    <option value="Mobile Money">Mobile Money</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Statut d’encaissement</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="completed">Acquitté / Payé (Reçu émis)</option>
                  <option value="pending">En attente de validation</option>
                  <option value="overdue">Échéance dépassée</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Remarques & Justificatif</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ex: Versement Trimestre 1 - Chèque N°..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
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
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                >
                  Valider & Générer Reçu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          transaction={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* CSV Budget & Transaction Export Modal */}
      <FinanceExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        finances={finances}
        academicYear={academicYear}
        language={language}
      />
    </div>
  );
};
