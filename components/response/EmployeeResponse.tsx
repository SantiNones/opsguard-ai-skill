'use client';

import { useState } from 'react';
import { EmployeeResponse, PayrollReport, PayrollReportLineItem } from '@/lib/types';
import { EmployeeIcon, ArrowRightIcon, DocumentIcon, EyeIcon, EyeOffIcon, LockIcon, PayrollIcon, SparkleIcon } from '@/components/ui/Icons';
import { SensitiveAmount } from './SensitiveAmount';

interface EmployeeResponseProps {
  response: EmployeeResponse;
}

const statusColors = {
  answered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  needs_more_info: 'bg-amber-50 text-amber-700 border-amber-200',
  sent_to_hr_review: 'bg-violet-50 text-violet-700 border-violet-200',
  not_allowed: 'bg-red-50 text-red-700 border-red-200',
};

const statusLabels = {
  answered: 'Answered',
  needs_more_info: 'Needs more info',
  sent_to_hr_review: 'Sent to HR review',
  not_allowed: 'Access restricted',
};

function renderWithBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-stone-900">{part}</strong> : part
  );
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function formatPayrollMonth(month: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${month}-01T00:00:00Z`));
}

function sumLineItems(items: PayrollReportLineItem[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

export function EmployeeResponseComponent({ response }: EmployeeResponseProps) {
  const { title, message, status, visibleCitations, missingFields, nextStep, privacyNote, answerSource } = response;
  const [selectedPayrollReport, setSelectedPayrollReport] = useState<PayrollReport | null>(null);
  const [showPayrollAmounts, setShowPayrollAmounts] = useState(false);
  const repeatsStatus = title.trim().toLowerCase() === statusLabels[status].toLowerCase();

  return (
    <div className="og-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#f0e8e4] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <EmployeeIcon className="w-4 h-4" />
          </span>
          <span className="text-sm font-semibold text-stone-700">OpsGuard Response</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-2.5">
          {!repeatsStatus && <h3 className="text-lg font-semibold text-stone-900">{title}</h3>}
          {answerSource === 'enterprise_context' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <SparkleIcon className="w-3 h-3" />
              Live Data
            </span>
          )}
        </div>

        <div className="text-sm text-stone-600 leading-relaxed mb-4 whitespace-pre-wrap">
          {renderWithBold(message)}
        </div>

        {response.payrollReports && response.payrollReports.length > 0 && (
          <div className="mb-4 space-y-3">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-2">
                <LockIcon className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wide">Privacy notice</span>
                  <p className="text-sm text-amber-800 mt-0.5">
                    These payroll reports contain sensitive compensation and payment information. They are shown only for your own employee record and should not be shared externally.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PayrollIcon className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Latest payroll reports</span>
                <button
                  type="button"
                  onClick={() => setShowPayrollAmounts((visible) => !visible)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                  aria-pressed={showPayrollAmounts}
                >
                  {showPayrollAmounts ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeOffIcon className="w-3.5 h-3.5" />}
                  {showPayrollAmounts ? 'Hide amounts' : 'Show amounts'}
                </button>
              </div>
              <div className="relative">
                <div className={`space-y-2 transition-all duration-200 ${showPayrollAmounts ? '' : 'blur-sm pointer-events-none select-none'}`}>
                  {response.payrollReports.map((report) => (
                    <button
                      key={report.recordId}
                      type="button"
                      onClick={() => setSelectedPayrollReport(report)}
                      className="w-full text-left p-3 bg-[#faf6f4] rounded-xl border border-[#f0e8e4] hover:border-brand-200 hover:bg-white transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-stone-900">{formatPayrollMonth(report.payrollMonth)}</div>
                          <div className="text-xs text-stone-500 mt-0.5">
                            Paid {formatDate(report.paymentDate)} · {report.payrollStatus}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] uppercase tracking-wide text-stone-400 font-semibold">Net pay</div>
                          <SensitiveAmount
                            value={formatCurrency(report.netSalary, report.currency)}
                            visible={showPayrollAmounts}
                            onToggle={() => setShowPayrollAmounts((current) => !current)}
                            className="justify-end"
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {!showPayrollAmounts && (
                  <button
                    type="button"
                    onClick={() => setShowPayrollAmounts(true)}
                    className="absolute inset-0 rounded-xl border border-[#f0e8e4] bg-white/25"
                    aria-label="Reveal sensitive payroll reports"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Next Step */}
        {nextStep && (
          <div className="mb-3 p-3 bg-[#faf6f4] rounded-xl border border-[#f0e8e4]">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightIcon className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Next step</span>
            </div>
            <p className="text-sm text-stone-600">{nextStep}</p>
          </div>
        )}

        {/* Missing Fields */}
        {missingFields.length > 0 && (
          <div className="mb-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">Information needed</span>
            <ul className="mt-1.5 text-sm text-amber-700 space-y-1">
              {missingFields.map((field, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5" />
                  <span>{field}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Citations */}
        {visibleCitations.length > 0 && (
          <div className="mb-1">
            <div className="flex items-center gap-2 mb-2">
              <DocumentIcon className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">Policy references</span>
            </div>
            <div className="space-y-2">
              {visibleCitations.map((citation, index) => (
                <div key={index} className="text-xs p-2.5 bg-[#faf6f4] rounded-lg border border-[#f0e8e4]">
                  <div className="font-semibold text-stone-800">{citation.code}: {citation.title}</div>
                  <div className="text-stone-500 mt-0.5">{citation.excerpt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Note */}
        {privacyNote && (
          <div className="mt-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
            <div className="flex items-start gap-2">
              <LockIcon className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wide">Privacy note</span>
                <p className="text-sm text-sky-700 mt-0.5">{privacyNote}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedPayrollReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/35 backdrop-blur-sm"
            onClick={() => setSelectedPayrollReport(null)}
            aria-label="Close payroll report"
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto og-card shadow-2xl">
            <div className="px-6 py-4 border-b border-[#f0e8e4] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1">
                  <PayrollIcon className="w-3.5 h-3.5" />
                  Payroll report
                </div>
                <h3 className="text-xl font-bold text-stone-950">{formatPayrollMonth(selectedPayrollReport.payrollMonth)}</h3>
                <p className="text-sm text-stone-500 mt-1">
                  {selectedPayrollReport.employeeName} · {selectedPayrollReport.recordId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayrollReport(null)}
                className="w-9 h-9 rounded-xl border border-[#f0e8e4] text-stone-500 hover:text-stone-900 hover:bg-stone-50"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800 flex items-start justify-between gap-3">
                <div>
                  <span className="font-semibold text-amber-900">Privacy Notice:</span> This report contains sensitive payroll information. Access is limited to your own employee record.
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayrollAmounts((visible) => !visible)}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-white transition-colors"
                  aria-pressed={showPayrollAmounts}
                >
                  {showPayrollAmounts ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeOffIcon className="w-3.5 h-3.5" />}
                  {showPayrollAmounts ? 'Hide' : 'Reveal'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#faf6f4] border border-[#f0e8e4]">
                  <div className="text-[11px] uppercase tracking-wide text-stone-400 font-semibold">Gross pay</div>
                  <SensitiveAmount
                    value={formatCurrency(selectedPayrollReport.grossPay, selectedPayrollReport.currency)}
                    visible={showPayrollAmounts}
                    onToggle={() => setShowPayrollAmounts((current) => !current)}
                    size="lg"
                  />
                </div>
                <div className="p-3 rounded-xl bg-[#faf6f4] border border-[#f0e8e4]">
                  <div className="text-[11px] uppercase tracking-wide text-stone-400 font-semibold">Deductions</div>
                  <SensitiveAmount
                    value={formatCurrency(sumLineItems(selectedPayrollReport.deductions), selectedPayrollReport.currency)}
                    visible={showPayrollAmounts}
                    onToggle={() => setShowPayrollAmounts((current) => !current)}
                    size="lg"
                  />
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-[11px] uppercase tracking-wide text-emerald-600 font-semibold">Net pay</div>
                  <SensitiveAmount
                    value={formatCurrency(selectedPayrollReport.netSalary, selectedPayrollReport.currency)}
                    visible={showPayrollAmounts}
                    onToggle={() => setShowPayrollAmounts((current) => !current)}
                    size="lg"
                    revealedClassName="text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl border border-[#f0e8e4]">
                  <div className="text-[11px] uppercase tracking-wide text-stone-400 font-semibold mb-1">Pay period</div>
                  <div className="text-stone-700">{formatDate(selectedPayrollReport.periodStart)} – {formatDate(selectedPayrollReport.periodEnd)}</div>
                </div>
                <div className="p-3 rounded-xl border border-[#f0e8e4]">
                  <div className="text-[11px] uppercase tracking-wide text-stone-400 font-semibold mb-1">Payment</div>
                  <div className="text-stone-700">{formatDate(selectedPayrollReport.paymentDate)} · {selectedPayrollReport.ibanCountry} •••• {selectedPayrollReport.bankAccountLast4}</div>
                </div>
              </div>

              <PayrollLineSection
                title="Earnings"
                items={selectedPayrollReport.earnings}
                currency={selectedPayrollReport.currency}
                amountsVisible={showPayrollAmounts}
                onToggleAmounts={() => setShowPayrollAmounts((current) => !current)}
              />
              <PayrollLineSection
                title="Deductions"
                items={selectedPayrollReport.deductions}
                currency={selectedPayrollReport.currency}
                amountsVisible={showPayrollAmounts}
                onToggleAmounts={() => setShowPayrollAmounts((current) => !current)}
              />
              <PayrollLineSection
                title="Employer contributions"
                items={selectedPayrollReport.employerContributions}
                currency={selectedPayrollReport.currency}
                amountsVisible={showPayrollAmounts}
                onToggleAmounts={() => setShowPayrollAmounts((current) => !current)}
              />

              {selectedPayrollReport.notes && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-sm text-sky-800">
                  {selectedPayrollReport.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PayrollLineSection({
  title,
  items,
  currency,
  amountsVisible,
  onToggleAmounts,
}: {
  title: string;
  items: PayrollReportLineItem[];
  currency: string;
  amountsVisible: boolean;
  onToggleAmounts: () => void;
}) {
  return (
    <div>
      <h4 className="text-sm font-bold text-stone-900 mb-2">{title}</h4>
      <div className="rounded-xl border border-[#f0e8e4] overflow-hidden">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 px-3 py-2 text-sm border-b border-[#f0e8e4] last:border-b-0">
            <span className="text-stone-600">{item.label}</span>
            <SensitiveAmount
              value={formatCurrency(item.amount, currency)}
              visible={amountsVisible}
              onToggle={onToggleAmounts}
              className="justify-end"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
