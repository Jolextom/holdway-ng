'use client';

import { useState, useEffect, useRef } from 'react';
import { theme, getInputClasses } from '@/lib/theme';
import copy from '@/lib/content/copy.json';

// ─── Types ──────────────────────────────────────────────────────────────────

type Step = 'business' | 'otp' | 'payout' | 'complete';
type VerifyState = 'idle' | 'verifying' | 'verified' | 'error';

interface FormData {
    businessName: string;
    whatsappPhone: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
}

interface FormErrors {
    businessName?: string;
    whatsappPhone?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NIGERIAN_BANKS = [
    'Access Bank', 'Citibank Nigeria', 'Ecobank Nigeria', 'Fidelity Bank',
    'First Bank of Nigeria', 'First City Monument Bank (FCMB)', 'Globus Bank',
    'Guaranty Trust Bank (GTBank)', 'Heritage Bank', 'Jaiz Bank', 'Keystone Bank',
    'Kuda Bank', 'Moniepoint Microfinance Bank', 'OPay Digital Services',
    'Palmpay', 'Polaris Bank', 'Providus Bank', 'Stanbic IBTC Bank',
    'Standard Chartered Bank Nigeria', 'Sterling Bank', 'SunTrust Bank Nigeria',
    'Titan Trust Bank', 'Union Bank of Nigeria', 'United Bank for Africa (UBA)',
    'Unity Bank', 'VFD Microfinance Bank', 'Wema Bank', 'Zenith Bank',
] as const;

const MOCK_ACCOUNT_NAMES: Record<string, string> = {
    '2081234567': 'ADEBAYO OLUWAFEMI K.',
    '0123456789': 'CHIDINMA OKONKWO',
    '3012345678': 'IBRAHIM MUSA ALIYU',
    '0987654321': 'NGOZI EZE-OKAFOR',
    '1234567890': 'TUNDE AFOLABI BADMUS',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SpinnerIcon() {
    return (
        <svg className="animate-spin h-4 w-4 text-ink-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg className="h-4 w-4 text-trust-mid flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 13.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
    );
}

function BrandWordmark() {
    return (
        <span className="font-mono text-sm font-medium text-ink tracking-wider select-none">
            {copy.brand.name}
        </span>
    );
}

interface InputFieldProps {
    id: string;
    label: string;
    helper?: string;
    error?: string;
    children: React.ReactNode;
}

function InputField({ id, label, helper, error, children }: InputFieldProps) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-ink mb-2">
                {label}
            </label>
            {children}
            {helper && !error && (
                <p className="text-xs text-ink-muted mt-1">{helper}</p>
            )}
            {error && (
                <p className={`text-xs ${theme.colors.error.text} mt-1`} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
    const steps = ['business', 'otp', 'payout'];
    const labels = copy.onboarding.steps;
    const currentIndex = steps.indexOf(currentStep);

    return (
        <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
                const isActive = index <= currentIndex;
                return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isActive ? 'bg-trust text-white' : 'bg-surface-raised border border-border text-ink-muted'}`}>
                                {index + 1}
                            </div>
                            <span className={`text-sm font-medium hidden sm:block ${isActive ? 'text-ink' : 'text-ink-muted'}`}>
                                {labels[index]}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`h-px flex-1 mx-3 transition-colors ${isActive && index < currentIndex ? 'bg-trust' : 'bg-border'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function OnboardPage() {
    const [step, setStep] = useState<Step>('business');
    const [form, setForm] = useState<FormData>({
        businessName: '', whatsappPhone: '', bankName: '', accountNumber: '', accountName: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const verifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [verifyState, setVerifyState] = useState<VerifyState>('idle');

    useEffect(() => {
        if (step === 'otp' && !canResend) {
            setResendTimer(30);
            const interval = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [step, canResend]);

    useEffect(() => {
        if (verifyTimerRef.current) clearTimeout(verifyTimerRef.current);

        if (form.accountNumber.length === 10) {
            setVerifyState('verifying');
            setForm((prev) => ({ ...prev, accountName: '' }));

            verifyTimerRef.current = setTimeout(() => {
                const name = MOCK_ACCOUNT_NAMES[form.accountNumber];
                setForm((prev) => ({
                    ...prev,
                    accountName: name || 'EMEKA OSEI MENSAH',
                }));
                setVerifyState('verified');
            }, 1400);
        } else {
            setVerifyState('idle');
            setForm((prev) => ({ ...prev, accountName: '' }));
        }

        return () => {
            if (verifyTimerRef.current) clearTimeout(verifyTimerRef.current);
        };
    }, [form.accountNumber]);

    useEffect(() => {
        if (step === 'otp' && otp.length === 6 && !otpError) {
            handleVerifyOtp(new Event('submit') as any);
        }
    }, [otp, step]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        if (name === 'accountNumber') {
            setForm((prev) => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 10) }));
        } else if (name === 'whatsappPhone') {
            setForm((prev) => ({ ...prev, [name]: value.replace(/[^\d+\s\-]/g, '') }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }

    function validateBusinessStep(): boolean {
        const next: FormErrors = {};
        if (!form.businessName.trim()) next.businessName = copy.onboarding.form.businessName.errorRequired;
        if (!form.whatsappPhone.trim()) {
            next.whatsappPhone = copy.onboarding.form.whatsapp.errorRequired;
        } else if (!/^(\+234|0)[7-9][01]\d{8}$/.test(form.whatsappPhone.replace(/[\s\-]/g, ''))) {
            next.whatsappPhone = copy.onboarding.form.whatsapp.errorInvalid;
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function handleSendOtp(e: React.FormEvent) {
        e.preventDefault();
        if (!validateBusinessStep()) return;
        setIsSendingOtp(true);
        setTimeout(() => {
            setIsSendingOtp(false);
            setStep('otp');
            setOtp('');
            setOtpError('');
            setCanResend(false);
        }, 1200);
    }

    function handleResendOtp() {
        if (!canResend) return;
        setCanResend(false);
        setResendTimer(30);
        setIsSendingOtp(true);
        setTimeout(() => {
            setIsSendingOtp(false);
            setOtp('');
            setOtpError('');
        }, 1000);
    }

    function handleVerifyOtp(e: React.FormEvent) {
        e.preventDefault();
        if (otp.length !== 6) {
            setOtpError(copy.onboarding.form.otp.errorLength);
            return;
        }
        if (otp === '000000') {
            setOtpError(copy.onboarding.form.otp.errorInvalid);
            setOtp('');
            return;
        }
        setOtpError('');
        setStep('payout');
    }

    function validatePayout(): boolean {
        const next: FormErrors = {};
        if (!form.bankName) next.bankName = copy.onboarding.form.payout.bankError;
        if (!form.accountNumber || form.accountNumber.length < 10) next.accountNumber = copy.onboarding.form.payout.accountErrorRequired;
        if (verifyState !== 'verified') next.accountNumber = copy.onboarding.form.payout.accountErrorVerify;
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function handlePayoutContinue(e: React.FormEvent) {
        e.preventDefault();
        if (!validatePayout()) return;
        setStep('complete');
    }

    function renderBusinessStep() {
        return (
            <form onSubmit={handleSendOtp} noValidate>
                <div className="space-y-5">
                    <InputField id="businessName" label={copy.onboarding.form.businessName.label} error={errors.businessName}>
                        <input
                            id="businessName" name="businessName" type="text" autoComplete="organization"
                            placeholder={copy.onboarding.form.businessName.placeholder}
                            value={form.businessName} onChange={handleChange}
                            className={getInputClasses(!!errors.businessName)}
                        />
                    </InputField>

                    <InputField id="whatsappPhone" label={copy.onboarding.form.whatsapp.label} helper={copy.onboarding.form.whatsapp.helper} error={errors.whatsappPhone}>
                        <input
                            id="whatsappPhone" name="whatsappPhone" type="tel" autoComplete="tel"
                            placeholder={copy.onboarding.form.whatsapp.placeholder}
                            value={form.whatsappPhone} onChange={handleChange}
                            className={getInputClasses(!!errors.whatsappPhone)}
                        />
                    </InputField>
                </div>

                <button type="submit" disabled={isSendingOtp} className={`mt-8 ${theme.colors.button.primary}`}>
                    {isSendingOtp ? <><SpinnerIcon /><span>{copy.onboarding.actions.sending}</span></> : copy.onboarding.actions.sendOtp}
                </button>
            </form>
        );
    }

    function renderOtpStep() {
        const timerDisplay = `${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')}`;

        return (
            <form onSubmit={handleVerifyOtp} noValidate>
                <div className="mb-6">
                    <p className="text-sm text-ink-muted">
                        {copy.onboarding.form.otp.sentMessage} <span className="font-mono font-medium text-ink">{form.whatsappPhone}</span>{copy.onboarding.form.otp.instruction}
                    </p>
                </div>

                <InputField id="otp" label={copy.onboarding.form.otp.label} error={otpError}>
                    <input
                        id="otp" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code"
                        placeholder={copy.onboarding.form.otp.placeholder}
                        value={otp}
                        onChange={(e) => {
                            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                            if (otpError) setOtpError('');
                        }}
                        className={`${getInputClasses(!!otpError)} text-xl text-center font-mono tracking-[0.3em]`}
                    />
                </InputField>

                <div className="mt-6 flex items-center justify-between">
                    <button type="button" onClick={handleResendOtp} disabled={!canResend || isSendingOtp} className="text-sm text-trust hover:text-trust-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {isSendingOtp ? <span className="flex items-center gap-1"><SpinnerIcon /> {copy.onboarding.actions.resending}</span> : canResend ? copy.onboarding.actions.resend : <span>{copy.onboarding.actions.resendIn}<span className="font-mono">{timerDisplay}</span></span>}
                    </button>
                </div>

                <button type="submit" disabled={otp.length !== 6} className={`mt-8 ${theme.colors.button.primary}`}>
                    {copy.onboarding.actions.verify}
                </button>

                <button type="button" onClick={() => setStep('business')} className={`mt-3 ${theme.colors.button.ghost}`}>
                    {copy.onboarding.actions.goBack}
                </button>
            </form>
        );
    }

    function renderPayoutStep() {
        return (
            <form onSubmit={handlePayoutContinue} noValidate>
                <div className="space-y-5">
                    <div className="bg-surface-raised border border-border rounded-md p-4 text-sm text-ink-muted">
                        <p className="font-medium text-ink mb-1">{copy.onboarding.form.payout.whyNeedThisTitle}</p>
                        <p>
                            {copy.onboarding.form.payout.whyNeedThisBody1}
                            <span className="font-semibold text-ink">{copy.onboarding.form.payout.whyNeedThisBold}</span>
                            {copy.onboarding.form.payout.whyNeedThisBody2}
                        </p>
                    </div>

                    <InputField id="bankName" label={copy.onboarding.form.payout.bankLabel} error={errors.bankName}>
                        <select
                            id="bankName" name="bankName" value={form.bankName} onChange={handleChange}
                            className={`${getInputClasses(!!errors.bankName)} appearance-none cursor-pointer ${!form.bankName ? 'text-ink-faint' : 'text-ink'}`}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236B6760' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '36px' }}
                        >
                            <option value="" disabled>{copy.onboarding.form.payout.bankPlaceholder}</option>
                            {NIGERIAN_BANKS.map((bank) => (<option key={bank} value={bank}>{bank}</option>))}
                        </select>
                    </InputField>

                    <InputField id="accountNumber" label={copy.onboarding.form.payout.accountLabel} helper={form.accountNumber.length < 10 ? `${form.accountNumber.length}/10 digits` : undefined} error={errors.accountNumber}>
                        <input
                            id="accountNumber" name="accountNumber" type="text" inputMode="numeric" autoComplete="off"
                            placeholder={copy.onboarding.form.payout.accountPlaceholder}
                            value={form.accountNumber} onChange={handleChange} maxLength={10}
                            className={`${getInputClasses(!!errors.accountNumber)} font-mono tracking-wide`}
                        />
                    </InputField>

                    {form.accountNumber.length === 10 && (
                        <InputField id="accountName" label={copy.onboarding.form.payout.accountNameLabel}>
                            <div className="relative">
                                <input
                                    id="accountName" name="accountName" type="text" readOnly disabled
                                    value={verifyState === 'verifying' ? '' : form.accountName}
                                    placeholder={verifyState === 'verifying' ? copy.onboarding.form.payout.verifying : ''}
                                    className="w-full font-mono bg-surface-raised border border-border rounded-md px-4 py-3 text-base text-ink-muted tracking-wide cursor-not-allowed opacity-80 focus:outline-none pr-10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                    {verifyState === 'verifying' && <SpinnerIcon />}
                                    {verifyState === 'verified' && <CheckIcon />}
                                </div>
                            </div>
                            {verifyState === 'verified' && (
                                <p className="text-xs text-trust-mid mt-1 flex items-center gap-1">
                                    <CheckIcon /> {copy.onboarding.form.payout.verified}
                                </p>
                            )}
                        </InputField>
                    )}
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    <button type="submit" className={theme.colors.button.primary}>{copy.onboarding.actions.continue}</button>
                    <button type="button" onClick={() => setStep('complete')} className={theme.colors.button.ghost}>{copy.onboarding.actions.skip}</button>
                </div>
            </form>
        );
    }

    function renderCompleteStep() {
        return (
            <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-trust-light flex items-center justify-center mx-auto mb-5">
                    <svg className="w-6 h-6 text-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-xl font-semibold text-ink tracking-tight leading-tight mb-2">{copy.onboarding.headings.complete}</h1>
                <p className="text-sm text-ink-muted mb-6 leading-relaxed">{copy.onboarding.descriptions.complete}</p>
                <a href="/inventory" className={theme.colors.button.primary}>{copy.onboarding.actions.goToInventory}</a>
                <p className="mt-4 text-xs text-ink-faint">{copy.onboarding.actions.updateLater}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-canvas px-4">
            <header className="pt-6 pb-0">
                <BrandWordmark />
            </header>

            <div className="max-w-md mx-auto pt-10 pb-20">
                <div className="mb-8">
                    <h1 className="text-xl font-semibold text-ink tracking-tight leading-tight mb-1">
                        {copy.onboarding.headings[step]}
                    </h1>
                    <p className="text-sm text-ink-muted leading-relaxed">
                        {copy.onboarding.descriptions[step]}
                    </p>
                </div>

                {step !== 'complete' && <StepIndicator currentStep={step} />}

                <div className="bg-surface border border-border rounded-lg p-6 shadow-card">
                    {step === 'business' && renderBusinessStep()}
                    {step === 'otp' && renderOtpStep()}
                    {step === 'payout' && renderPayoutStep()}
                    {step === 'complete' && renderCompleteStep()}
                </div>

                {step !== 'complete' && (
                    <p className="mt-6 text-center text-xs text-ink-faint leading-relaxed">
                        {copy.onboarding.descriptions.trustNote}
                    </p>
                )}
            </div>
        </div>
    );
}