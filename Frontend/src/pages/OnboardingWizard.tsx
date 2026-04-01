import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { PlanSelectionContent } from '../modals/PlanSelectionModal';
import logoImage from '../components/photos/LumenIQClear.png';
import logoImageFull from '../components/photos/LumenIQFull.png';
import {
  validateEmail,
  validatePhone,  
  validateName,
  validateRequired,
  validateUrl,
} from '../utils/validation';
import { toast } from 'sonner';
import {
  ArrowRight,
  ArrowLeft,
  User,
  Building2,
  Globe,
  CreditCard,
  Sparkles,
  Check,
  Zap,
  ShieldCheck,
  LineChart,
  Loader2,
} from 'lucide-react';
import { onboardingApi } from '../api/onboarding';
import { plansApi } from '../api/plans';
import { paymentsApi } from '../api/payments';
import { useAuth } from '../auth/hooks/useAuth';
import type { PlanStream } from '../types/plans';

interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  businessDescription: string;
  brandColor: string;
  businessType: 'digital' | 'physical';
  b2bOrB2c: 'b2b' | 'b2c' | 'both';
  websiteUrl: string;
  instagramHandle: string;
  targetLocation: string;
  idealCustomer: string;
  productsServices: string;
  industryNiche: string;
  selectedPlan: string;
}

const phases = [
  { id: 1, label: 'Account', icon: User, description: 'Your details' },
  { id: 2, label: 'Business', icon: Building2, description: 'Your company' },
  { id: 3, label: 'Audience', icon: Globe, description: 'Your market' },
  { id: 4, label: 'Plan', icon: CreditCard, description: 'Your tier' },
  { id: 5, label: 'Launch', icon: Sparkles, description: 'You\'re set' },
];

const valueProps = [
  { icon: Zap, text: 'AI-generated content in minutes' },
  { icon: ShieldCheck, text: 'Always human-approved before publishing' },
  { icon: LineChart, text: 'Real engagement, tracked automatically' },
];

function planLabelFromStreams(streams: PlanStream[], planId?: string): string {
  if (!planId) return '';
  for (const s of streams) {
    const p = s.plans.find((pl) => pl.id === planId);
    if (p) return p.name;
  }
  return planId;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
  }),
};

export function OnboardingWizard() {
  const { user, signup: authSignup, completeOnboarding, updateUser, fetchProfileAndBusinesses } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    return stepParam && parseInt(stepParam) >= 1 && parseInt(stepParam) <= 5 ? parseInt(stepParam) : 1;
  });
  const [direction, setDirection] = useState(1);
  const totalSteps = 5;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planStreams, setPlanStreams] = useState<PlanStream[]>([]);
  const formRef = useRef<HTMLDivElement>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentVerificationFailed, setPaymentVerificationFailed] = useState(false);
  const hasVerifiedRef = useRef(false);

  const navState = location.state as {
    businessType?: 'digital' | 'physical';
    email?: string;
    password?: string;
  } | null;

  const isSignupMode = !!navState?.email && !!navState?.password;

  useEffect(() => {
    if (!isSignupMode && !user) {
      navigate('/signup', { replace: true });
    }
  }, [isSignupMode, user, navigate]);

  const [data, setData] = useState<Partial<OnboardingData>>({
    email: navState?.email ?? user?.email ?? '',
    businessType: navState?.businessType ?? 'digital',
    b2bOrB2c: 'b2c',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    plansApi.list().then(setPlanStreams).catch(() => {});
  }, []);

  useEffect(() => {
    if (step === 5 && !hasVerifiedRef.current) {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      if (sessionId) {
        hasVerifiedRef.current = true;
        setIsVerifyingPayment(true);
        paymentsApi.verifyCheckout({ session_id: sessionId })
          .then((res) => {
            if (!res.success) {
              setPaymentVerificationFailed(true);
              toast.error("Payment verification failed. Please check your account.");
            }
          })
          .catch(() => {
            setPaymentVerificationFailed(true);
            toast.error("An error occurred while verifying the payment.");
          })
          .finally(() => {
            setIsVerifyingPayment(false);
          });
      }
    }
  }, [step]);

  const filteredPlanStreams = useMemo(
    () => planStreams.filter(s => s.id === data.businessType),
    [planStreams, data.businessType],
  );

  const updateData = useCallback((field: keyof OnboardingData, value: string) => {
    setData(prev => {
      const next: Partial<OnboardingData> = { ...prev, [field]: value };
      if (field === 'businessType' && value !== prev.businessType) {
        delete next.selectedPlan;
      }
      return next;
    });
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: {
        const fn = validateName(data.firstName || '', 'First name');
        if (!fn.isValid) newErrors.firstName = fn.error!;
        const ln = validateName(data.lastName || '', 'Last name');
        if (!ln.isValid) newErrors.lastName = ln.error!;
        const em = validateEmail(data.email || '');
        if (!em.isValid) newErrors.email = em.error!;
        if (data.phone) {
          const ph = validatePhone(data.phone);
          if (!ph.isValid) newErrors.phone = ph.error!;
        }
        break;
      }
      case 2: {
        const bn = validateRequired(data.businessName || '', 'Business name');
        if (!bn.isValid) newErrors.businessName = bn.error!;
        break;
      }
      case 3: {
        if (data.websiteUrl) {
          const url = validateUrl(data.websiteUrl, false);
          if (!url.isValid) newErrors.websiteUrl = url.error!;
        }
        break;
      }
      case 4: {
        if (!data.selectedPlan) {
          newErrors.selectedPlan = 'Please select a plan to continue';
        }
        break;
      }
    }

    setErrors(newErrors);
    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      toast.error(newErrors[errorKeys[0]]);
    }
    return errorKeys.length === 0;
  };

  const handleCheckoutFlow = async () => {
    setIsSubmitting(true);
    try {

      if (isSignupMode) {
        await authSignup(navState!.email!, navState!.password!);
      }

      await onboardingApi.complete({
        user: {
          first_name: data.firstName || undefined,
          last_name: data.lastName || undefined,
          phone: data.phone || undefined,
        },
        business: {
          name: data.businessName!,
          business_format: data.businessType,
          description: data.businessDescription || undefined,
          b2b_or_b2c: data.b2bOrB2c,
          website_url: data.websiteUrl || undefined,
          instagram_handle: data.instagramHandle || undefined,
          target_location: data.targetLocation || undefined,
          ideal_customer: data.idealCustomer || undefined,
          products_services: data.productsServices || undefined,
          industry_niche: data.industryNiche || undefined,
        },
        plan_id: data.selectedPlan || undefined,
      });

      completeOnboarding();
      if (data.firstName || data.lastName) {
        updateUser({ firstName: data.firstName, lastName: data.lastName });
      }
      await fetchProfileAndBusinesses('');


      const { checkout_url } = await paymentsApi.createCheckout({
        plan_id: data.selectedPlan || 'digital-solo',
        success_url: `${window.location.origin}/onboarding?step=5&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/onboarding?step=4`,
      });
      
      window.location.href = checkout_url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete setup';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step === 5) {
      // Businesses aren't persisted in localStorage—only auth state is.
      // After the Stripe redirect (full page reload) SessionRestorer skips
      // the fetch because `user` is already hydrated, leaving the business
      // list empty.  Fetch here so the dashboard has data on first load.
      await fetchProfileAndBusinesses('');
      navigate('/app/dashboard', { replace: true });
      return;
    }

    if (!validateStep()) return;

    if (step < 4) {
      setDirection(1);
      setStep(s => s + 1);
    } else if (step === 4) {
      await handleCheckoutFlow();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleNext();
      }
    }
  };

  const inputBase = 'h-12 rounded-xl border bg-white text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 transition-colors';

  const fieldClasses = (field: string) =>
    `${inputBase} ${errors[field] ? 'border-red-400 focus-visible:ring-red-500/20' : 'border-slate-200/80'}`;

  const textareaBase = 'rounded-xl border border-slate-200/80 bg-white text-base text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 resize-none';

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="phase-1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-7"
          >
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-outfit text-slate-900 leading-tight">Create your account</h2>
              <p className="text-base text-slate-500">The basics — so we know who we're building for.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">First name</Label>
                <Input
                  id="firstName"
                  placeholder="Jane"
                  value={data.firstName || ''}
                  onChange={(e) => updateData('firstName', e.target.value)}
                  className={fieldClasses('firstName')}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  value={data.lastName || ''}
                  onChange={(e) => updateData('lastName', e.target.value)}
                  className={fieldClasses('lastName')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@mybusiness.com"
                value={data.email || ''}
                onChange={(e) => updateData('email', e.target.value)}
                className={fieldClasses('email')}
                disabled={isSignupMode || !!user?.email}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                Phone <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={data.phone || ''}
                onChange={(e) => updateData('phone', e.target.value)}
                className={fieldClasses('phone')}
              />
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="phase-2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-7"
          >
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-outfit text-slate-900 leading-tight">Tell us about your business</h2>
              <p className="text-base text-slate-500">This helps us tailor your content strategy from day one.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-sm font-medium text-slate-700">Business name</Label>
              <Input
                id="businessName"
                placeholder="Sunrise Coffee Co."
                value={data.businessName || ''}
                onChange={(e) => updateData('businessName', e.target.value)}
                className={fieldClasses('businessName')}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Business type</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'digital', label: 'Digital', sub: 'Online, SaaS, e-commerce' },
                  { value: 'physical', label: 'Physical', sub: 'Café, retail, local service' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateData('businessType', opt.value as 'digital' | 'physical')}
                    className={`rounded-xl border-2 p-5 text-left transition-all ${
                      data.businessType === opt.value
                        ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className={`text-base font-medium ${data.businessType === opt.value ? 'text-blue-700' : 'text-slate-900'}`}>{opt.label}</p>
                    <p className="text-sm text-slate-500 mt-1">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Customer type</Label>
              <div className="flex gap-2.5">
                {[
                  { value: 'b2c', label: 'Consumers' },
                  { value: 'b2b', label: 'Businesses' },
                  { value: 'both', label: 'Both' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateData('b2bOrB2c', opt.value as 'b2b' | 'b2c' | 'both')}
                    className={`flex-1 rounded-xl border px-4 py-3 text-base font-medium transition-all ${
                      data.b2bOrB2c === opt.value
                        ? 'border-blue-500 bg-blue-50/70 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessDescription" className="text-sm font-medium text-slate-700">
                What does your business do? <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="businessDescription"
                placeholder="We roast single-origin coffee and serve it from our two downtown locations..."
                value={data.businessDescription || ''}
                onChange={(e) => updateData('businessDescription', e.target.value)}
                className={`min-h-24 ${textareaBase}`}
              />
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="phase-3"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-7"
          >
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-outfit text-slate-900 leading-tight">Your audience & presence</h2>
              <p className="text-base text-slate-500">Help us understand who you're reaching and where you are online.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl" className="text-sm font-medium text-slate-700">
                  Website <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://yoursite.com"
                  value={data.websiteUrl || ''}
                  onChange={(e) => updateData('websiteUrl', e.target.value)}
                  className={fieldClasses('websiteUrl')}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagramHandle" className="text-sm font-medium text-slate-700">
                  Instagram <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="instagramHandle"
                  placeholder="@yourbusiness"
                  value={data.instagramHandle || ''}
                  onChange={(e) => updateData('instagramHandle', e.target.value)}
                  className={inputBase + ' border-slate-200/80'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetLocation" className="text-sm font-medium text-slate-700">
                Where are your customers? <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="targetLocation"
                placeholder="e.g., Downtown Toronto, Bay Area, Nationwide"
                value={data.targetLocation || ''}
                onChange={(e) => updateData('targetLocation', e.target.value)}
                className={inputBase + ' border-slate-200/80'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idealCustomer" className="text-sm font-medium text-slate-700">
                Describe your ideal customer <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="idealCustomer"
                placeholder="Young professionals who care about quality and convenience..."
                value={data.idealCustomer || ''}
                onChange={(e) => updateData('idealCustomer', e.target.value)}
                className={`min-h-20 ${textareaBase}`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="productsServices" className="text-sm font-medium text-slate-700">
                  Products / services <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="productsServices"
                  placeholder="Coffee, pastries, catering"
                  value={data.productsServices || ''}
                  onChange={(e) => updateData('productsServices', e.target.value)}
                  className={inputBase + ' border-slate-200/80'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industryNiche" className="text-sm font-medium text-slate-700">
                  Industry <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="industryNiche"
                  placeholder="Food & beverage"
                  value={data.industryNiche || ''}
                  onChange={(e) => updateData('industryNiche', e.target.value)}
                  className={inputBase + ' border-slate-200/80'}
                />
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="phase-4"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-7"
          >
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-outfit text-slate-900 leading-tight">Choose your plan</h2>
              <p className="text-base text-slate-500">Pick the tier that matches your posting cadence and team size.</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Selected plan</p>
              <p className="text-xl font-outfit text-slate-900 mt-1">
                {data.selectedPlan
                  ? planLabelFromStreams(filteredPlanStreams, data.selectedPlan)
                  : 'No plan selected'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <div className="border-b border-slate-200/80 bg-slate-50/80 px-5 py-4">
                <h3 className="text-base font-medium font-outfit text-slate-900">Compare plans</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Review pricing and features — your choice is saved when you continue.
                </p>
              </div>
              <div className="p-4 sm:p-6 max-h-[min(70vh,920px)] overflow-y-auto">
                <PlanSelectionContent
                  currentPlanId={data.selectedPlan}
                  onSelectPlan={(planId) => updateData('selectedPlan', planId)}
                  streams={filteredPlanStreams}
                  hideSelectionSummary
                />
              </div>
            </div>

            {data.selectedPlan && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4"
              >
                <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                <p className="text-base text-emerald-700">
                  <span className="font-medium">{planLabelFromStreams(filteredPlanStreams, data.selectedPlan)}</span>{' '}
                  selected — you can change this anytime in settings.
                </p>
              </motion.div>
            )}
          </motion.div>
        );

      case 5:
        if (isVerifyingPayment) {
          return (
            <motion.div
              key="phase-5-verifying"
              className="flex flex-col items-center justify-center space-y-6 pt-16"
            >
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              <h2 className="text-xl font-medium text-slate-800">Verifying your payment...</h2>
              <p className="text-slate-500">Please wait while we confirm your subscription.</p>
            </motion.div>
          );
        }

        if (paymentVerificationFailed) {
          return (
            <motion.div
              key="phase-5-failed"
              className="flex flex-col items-center justify-center space-y-6 pt-16 text-center shadow-sm p-8 rounded-2xl bg-white border border-red-100"
            >
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-red-600 text-3xl">!</span>
              </div>
              <h2 className="text-xl font-medium text-slate-800">Payment Unsuccessful</h2>
              <p className="text-slate-500 max-w-sm">We couldn't verify your payment. Your card may have been declined or the process was interrupted.</p>
              <Button onClick={() => setStep(4)} variant="outline" className="mt-4 border-red-200 text-red-600 hover:bg-red-50">
                Go back to Plans
              </Button>
            </motion.div>
          );
        }

        return (
          <motion.div
            key="phase-5"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-8"
          >
            <div className="text-center space-y-4 pt-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mx-auto flex h-18 w-18 items-center justify-center rounded-2xl gradient-blue-primary shadow-lg shadow-blue-500/25"
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-outfit text-slate-900 leading-tight">You're all set, {data.firstName || 'there'}</h2>
              <p className="text-base text-slate-500 max-w-md mx-auto">
                We'll use everything you've shared to build your first weekly content plan — ready for review in minutes.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100">
              {[
                { label: 'Name', value: data.firstName || user?.firstName || '—' },
                { label: 'Business', value: data.businessName || 'Your Business' },
                { label: 'Type', value: data.businessType === 'digital' ? 'Digital' : 'Physical' },
                { label: 'Plan', value: planLabelFromStreams(planStreams, data.selectedPlan) || 'Subscribed' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-6 py-4">
                   <span className="text-sm text-slate-500 uppercase tracking-wide">{row.label}</span>
                   <span className="text-base font-medium text-slate-900">{row.value}</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-400 text-center">
              You can update any of this later from Settings.
            </p>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-blue-50/40 font-switzer" onKeyDown={handleKeyDown}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
      </div>

      <div className="relative flex h-full">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-96 xl:w-112 shrink-0 flex-col justify-between bg-gradient-to-b from-blue-500 to-blue-900 p-10 xl:p-12">
          <div className="space-y-14">
            <div className="flex items-center gap-2.5">
              <img src={logoImage} alt="LumenIQ" className="h-12 w-auto" />
              <p className="text-3xl font-outfit text-white">LumenIQ</p>
            </div>

            <nav className="space-y-1">
              {phases.map((phase, i) => {
                const Icon = phase.icon;
                const isActive = step === phase.id;
                const isCompleted = step > phase.id;
                return (
                  <div key={phase.id} className="flex items-start gap-4 py-4">
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-xl transition-all duration-300 ${
                          isCompleted
                            ? 'gradient-blue-primary text-white shadow-md shadow-blue-500/20'
                            : isActive
                              ? 'border-2 border-blue-500 bg-blue-500/10 text-white'
                              : 'border border-white/10 text-white/30'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-6 w-6" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                      </div>
                      {i < phases.length - 1 && (
                        <div className={`mt-1 h-6 w-px transition-colors duration-300 ${
                          isCompleted ? 'bg-blue-500/50' : 'bg-white'
                        }`} />
                      )}
                    </div>

                    <div className="pt-2">
                      <p className={`text-base font-medium transition-colors duration-300 ${
                        isActive ? 'text-white' : isCompleted ? 'text-white/70' : 'text-white/30'
                      }`}>
                        {phase.label}
                      </p>
                      <p className={`text-sm mt-0.5 transition-colors duration-300 ${
                        isActive ? 'text-white/50' : 'text-white/20'
                      }`}>
                        {phase.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="space-y-5">
            <div className="h-px bg-white/10" />
            {valueProps.map(vp => {
              const Icon = vp.icon;
              return (
                <div key={vp.text} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    <Icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-sm text-white/50">{vp.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="md:hidden flex items-center justify-between border-b border-slate-200/60 bg-white/60 backdrop-blur-sm px-5 py-4">
            <img src={logoImageFull} alt="LumenIQ" className="h-10 w-auto" />
            <span className="text-sm text-slate-900">Step {step} of {totalSteps}</span>
          </div>

          <div className="lg:hidden px-5 pt-5">
            <div className="flex gap-2">
              {phases.map(phase => (
                <div
                  key={phase.id}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    step >= phase.id ? 'gradient-blue-primary' : 'bg-slate-200/60'
                  }`}
                />
              ))}
            </div>
          </div>

          <div ref={formRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 md:py-12 lg:py-16 xl:py-20">
              <AnimatePresence mode="wait" custom={direction}>
                {renderStep()}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="shrink-0 border-t border-slate-200/60 bg-white/60 backdrop-blur-sm">
            <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-4 sm:px-8 md:py-5">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1 || isSubmitting}
                className={`text-base h-10 px-5 gap-2 transition-all text-black hover:text-black hover:bg-slate-100 ${
                  step === 1
                    ? 'text-black cursor-not-allowed'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
              <ArrowLeft className="h-4 w-4 text-black" />
                Back
              </Button>

              <div className="hidden lg:flex items-center gap-2">
                {phases.map(phase => (
                  <div
                    key={phase.id}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      step === phase.id ? 'w-7 gradient-blue-primary' : step > phase.id ? 'w-2 bg-blue-400/50' : 'w-2 bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={(step === 4 && !data.selectedPlan) || isSubmitting}
                className="gradient-blue-primary text-white hover:opacity-90 text-base h-11 px-6 gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : step === totalSteps ? (
                  <>
                    Launch LumenIQ
                    <Sparkles className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
