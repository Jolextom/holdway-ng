'use client';

import { useState } from 'react';
import { Plus, X, Trash2, ShieldCheck } from 'lucide-react';
import Sidebar from '@/components/sidebar';
import copy from '@/lib/content/copy.json';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FAQ {
  id: string;
  keyword: string;
  response: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const NIGERIAN_BANKS = [
  'Access Bank',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'Fidelity Bank',
  'First Bank of Nigeria',
  'First City Monument Bank (FCMB)',
  'Globus Bank',
  'Guaranty Trust Bank (GTBank)',
  'Heritage Bank',
  'Jaiz Bank',
  'Keystone Bank',
  'Kuda Bank',
  'Moniepoint Microfinance Bank',
  'OPay Digital Services',
  'Palmpay',
  'Polaris Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank Nigeria',
  'Sterling Bank',
  'SunTrust Bank Nigeria',
  'Titan Trust Bank',
  'Union Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Unity Bank',
  'VFD Microfinance Bank',
  'Wema Bank',
  'Zenith Bank',
] as const;

const MOCK_BUSINESS = {
  name: "Zara's Ankara Fabrics",
  whatsapp: '+234 801 234 5678',
};

const MOCK_PAYOUT = {
  bankName: 'Zenith Bank',
  accountNumber: '2081234567',
  accountName: 'ZARA ADEBIMPE OKAFOR',
  isVerified: true,
};

const MOCK_FAQS: FAQ[] = [
  { id: '1', keyword: 'delivery time',  response: 'We deliver within 2–4 working days in Lagos.' },
  { id: '2', keyword: 'payment',        response: 'Payment is held in escrow and only released after you confirm delivery.' },
  { id: '3', keyword: 'return',         response: 'We accept returns within 24 hours of delivery. Contact us on WhatsApp.' },
];

// ─── Shared input class ──────────────────────────────────────────────────────

const inputBase =
  'w-full bg-surface border border-border rounded-md px-4 py-2.5 text-base text-ink placeholder:text-ink-faint focus:outline-none focus:border-trust focus:ring-2 focus:ring-trust/20 transition-colors';

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({ children, eyebrow }: { children: React.ReactNode; eyebrow: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-card mb-8">
      <p className="text-xs font-semibold text-ink-muted tracking-wider uppercase mb-4">
        {eyebrow}
      </p>
      {children}
    </div>
  );
}

function SaveButton() {
  return (
    <div className="flex justify-end pt-2">
      <button className="px-5 py-2 bg-trust text-white text-sm font-semibold rounded-md hover:bg-trust-mid transition-colors focus:outline-none focus:ring-2 focus:ring-trust/50">
        {copy.settings.saveChanges}
      </button>
    </div>
  );
}

function PayoutVerificationBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-trust font-semibold">
      <ShieldCheck className="w-3.5 h-3.5" />
      {copy.settings.payout.verifiedBadge}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState(MOCK_BUSINESS.name);
  const [bankName, setBankName] = useState(MOCK_PAYOUT.bankName);
  const [accountNumber, setAccountNumber] = useState(MOCK_PAYOUT.accountNumber);
  const [accountName] = useState(MOCK_PAYOUT.accountName);
  const [isVerified] = useState(MOCK_PAYOUT.isVerified);

  // FAQ state
  const [faqs, setFaqs] = useState<FAQ[]>(MOCK_FAQS);
  const [isFaqFormOpen, setIsFaqFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqFormData, setFaqFormData] = useState({ keyword: '', response: '' });

  const resetFaqForm = () => {
    setFaqFormData({ keyword: '', response: '' });
    setEditingFaq(null);
    setIsFaqFormOpen(false);
  };

  const handleFaqInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFaqFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = faqFormData.keyword.trim().toLowerCase();
    const response = faqFormData.response.trim();
    if (!keyword || !response) return;

    const newFaq: FAQ = { id: Date.now().toString(), keyword, response };

    if (editingFaq) {
      setFaqs((prev) => prev.map((f) => (f.id === editingFaq.id ? { ...newFaq, id: editingFaq.id } : f)));
    } else {
      setFaqs((prev) => [...prev, newFaq]);
    }
    resetFaqForm();
  };

  const handleEditFaq = (faq: FAQ) => {
    setEditingFaq(faq);
    setFaqFormData({ keyword: faq.keyword, response: faq.response });
    setIsFaqFormOpen(true);
  };

  const handleDeleteFaq = (id: string) => {
    if (window.confirm(copy.settings.faq.confirmDelete)) {
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    }
  };

  return (
    <div className="flex min-h-screen bg-canvas font-sans">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl">
          {/* Page Header */}
          <h1 className="text-2xl font-bold text-ink tracking-tight mb-6">
            {copy.settings.title}
          </h1>

          {/* ─── Business Info ─────────────────────────────────────────────── */}
          <SectionCard eyebrow={copy.settings.sections.businessInfo}>
            <div className="space-y-4">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-ink mb-1.5">
                  {copy.settings.business.nameLabel}
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={inputBase}
                />
              </div>
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-ink mb-1.5">
                  {copy.settings.business.whatsappLabel}
                </label>
                <input
                  id="whatsapp"
                  type="text"
                  readOnly
                  value={MOCK_BUSINESS.whatsapp}
                  className="w-full bg-surface-raised border border-border rounded-md px-4 py-2.5 text-base font-mono text-ink-muted cursor-not-allowed opacity-80 focus:outline-none"
                />
                <p className="text-xs text-ink-muted mt-2">
                  {copy.settings.business.whatsappReadOnlyNote}
                </p>
              </div>
              <SaveButton />
            </div>
          </SectionCard>

          {/* ─── Payout Details ────────────────────────────────────────────── */}
          <SectionCard eyebrow={copy.settings.sections.payoutDetails}>
            <div className="space-y-4">
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-ink mb-1.5">
                  {copy.settings.payout.bankLabel}
                </label>
                <select
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className={`${inputBase} appearance-none cursor-pointer`}
                >
                  {NIGERIAN_BANKS.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-ink mb-1.5">
                  {copy.settings.payout.accountNumberLabel}
                </label>
                <input
                  id="accountNumber"
                  type="text"
                  inputMode="numeric"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  className={`${inputBase} font-mono`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-ink">
                    {copy.settings.payout.accountNameLabel}
                  </label>
                  {isVerified && <PayoutVerificationBadge />}
                </div>
                <input
                  type="text"
                  readOnly
                  value={accountName}
                  className="w-full bg-surface-raised border border-border rounded-md px-4 py-2.5 text-base font-mono text-ink-muted cursor-not-allowed opacity-80 focus:outline-none"
                />
              </div>

              <SaveButton />
            </div>
          </SectionCard>

          {/* ─── Automated Replies / FAQs ──────────────────────────────────── */}
          <SectionCard eyebrow={copy.settings.sections.automatedReplies}>
            <p className="text-xs text-ink-muted mb-4">
              {copy.settings.faq.description}
            </p>

            {/* FAQ Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">
                    <th scope="col" className="px-3 py-2">{copy.settings.faq.keywordCol}</th>
                    <th scope="col" className="px-3 py-2">{copy.settings.faq.responseCol}</th>
                    <th scope="col" className="px-3 py-2 text-right w-16">{copy.settings.faq.deleteCol}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {faqs.map((faq) => (
                    <tr key={faq.id} className="hover:bg-surface-raised/50 transition-colors">
                      <td className="px-3 py-3 text-sm font-mono text-ink">
                        <button
                          onClick={() => handleEditFaq(faq)}
                          className="hover:text-trust transition-colors text-left"
                        >
                          {faq.keyword}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-sm text-ink-muted">
                        {faq.response}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="p-1 text-error-mid hover:text-error hover:bg-error-light rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-error/20"
                          aria-label={copy.settings.faq.deleteCol}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add / Close FAQ Button */}
            <button
              onClick={() => {
                if (isFaqFormOpen && !editingFaq) {
                  resetFaqForm();
                } else {
                  setEditingFaq(null);
                  setFaqFormData({ keyword: '', response: '' });
                  setIsFaqFormOpen(true);
                }
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-md text-sm font-medium text-ink hover:bg-surface-raised hover:border-ink-faint transition-colors focus:outline-none focus:ring-2 focus:ring-border"
            >
              {isFaqFormOpen && !editingFaq ? (
                <><X className="w-4 h-4" />{copy.settings.faq.addClose}</>
              ) : (
                <><Plus className="w-4 h-4" />{copy.settings.faq.addOpen}</>
              )}
            </button>

            {/* Inline FAQ Form */}
            {isFaqFormOpen && (
              <form
                onSubmit={handleAddFaq}
                className="mt-4 p-4 bg-surface-raised border border-border rounded-md space-y-4"
              >
                <div>
                  <label htmlFor="faqKeyword" className="block text-sm font-medium text-ink mb-1.5">
                    {copy.settings.faq.keywordLabel}
                  </label>
                  <input
                    id="faqKeyword"
                    name="keyword"
                    type="text"
                    required
                    value={faqFormData.keyword}
                    onChange={handleFaqInputChange}
                    placeholder={copy.settings.faq.keywordPlaceholder}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label htmlFor="faqResponse" className="block text-sm font-medium text-ink mb-1.5">
                    {copy.settings.faq.responseLabel}
                  </label>
                  <textarea
                    id="faqResponse"
                    name="response"
                    rows={3}
                    required
                    value={faqFormData.response}
                    onChange={handleFaqInputChange}
                    placeholder={copy.settings.faq.responsePlaceholder}
                    className={`${inputBase} resize-none`}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-trust text-white text-sm font-semibold rounded-md hover:bg-trust-mid transition-colors focus:outline-none focus:ring-2 focus:ring-trust/50"
                  >
                    {editingFaq ? copy.settings.faq.submitUpdate : copy.settings.faq.submitAdd}
                  </button>
                  <button
                    type="button"
                    onClick={resetFaqForm}
                    className="text-sm text-ink-muted hover:text-ink transition-colors"
                  >
                    {copy.settings.faq.cancel}
                  </button>
                </div>
              </form>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
