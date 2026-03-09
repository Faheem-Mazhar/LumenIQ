import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  PlayCircle,
  Sparkles,
  Zap,
  ShieldCheck,
  Workflow,
  LineChart,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import logoImage from '../components/photos/LumenIQ Logo.png';
import { useUnicornStudio } from '../utils/useUnicornStudio';

const showcaseStats = [
  { label: 'To your first content plan', value: '< 10 min' },
  { label: 'Saved Every Month', value: '7-10 hours' },
  { label: 'Calls, clicks, and foot traffic', value: 'Real results' }
];

const featureCards = [
  {
    title: 'Weekly auto-planner',
    description:'Upload a few photos, products, or promos and get a full week of ready-to-post content in minutes.',
    icon: <Sparkles className="h-5 w-5 text-blue-800" />
  },
  {
    title: 'AI-generated captions & ideas',
    description:'Competitor-informed captions, hooks, hashtags, and post ideas tailored to your business.',
    icon: <Zap className="h-5 w-5 text-blue-800" />
  },
  {
    title: 'Human-in-the-loop control',
    description:'Review, edit, and approve everything before it goes live — you’re always in control.',
    icon: <ShieldCheck className="h-5 w-5 text-blue-800" />
  },
  {
    title: 'Built for solo owners',
    description:'No marketing team needed. Designed to work just as well for one busy business owner.',
    icon: <Users className="h-5 w-5 text-blue-800" />
  },
  {
    title: 'Always up to date',
    description:'Content adapts automatically as your promos, menus, or products change.',
    icon: <Workflow className="h-5 w-5 text-blue-800" />
  },
  {
    title: 'Results that matter',
    description:'Track clicks, calls, direction requests, and signals tied to real business outcomes.',
    icon: <LineChart className="h-5 w-5 text-blue-800" />
  }
];


const steps = [
  {
    title: 'Connect your business',
    description:'Link your social accounts and upload a few photos, products, or promos.'
  },
  {
    title: 'Review your weekly plan',
    description:'We analyze competitors and draft a ready-to-post calendar with captions and ideas.'
  },
  {
    title: 'Approve and publish',
    description:'Make quick edits, approve posts, and let LumenIQ schedule everything automatically.'
  }
];


const involvementCards = [
  {
    title: 'Built with small businesses',
    description:'Designed alongside café owners, trainers, and solo founders who run marketing themselves.'
  },
  {
    title: 'Talk to the team',
    description:'Share how you currently handle social media and help shape where LumenIQ goes next.'
  },
  {
    title: 'See real workflows',
    description:'Explore how weekly planners turn a few assets into consistent, on-brand posts.'
  }
];


export function LandingPage() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useUnicornStudio();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 0);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white/10 text-slate-900 no-scrollbar">
      <div className="relative text-white">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div
            data-us-project="57WCL9Xqt44BBvTV9ehL"
            data-us-production="true"
            data-us-lazyload="true"
            className="h-full w-full"
          />
          <div className="absolute inset-0 bg-slate-950/55" aria-hidden="true" />
        </div>
        <header className="sm:backdrop-blur font-switzer pt-8 pb-4">
          <div className="relative mx-auto flex max-w-6xl xl:max-w-[88rem] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="LumenIQ" className="hidden h-9 w-auto" />
              <span className="text-4xl font-outfit tracking-tight">LumenIQ</span>
            </div>
            <nav className="hidden items-center gap-12 text-base md:text-lg text-white/80 md:flex">
              <a href="#product" className="hover:text-white">Product</a>
              <a href="#how-it-works" className="hover:text-white">How it works</a>
              <a href="#get-involved" className="hover:text-white">Get involved</a>
            </nav>
            <button
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={isMobileNavOpen}
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/90 hover:text-white md:hidden"
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col items-center justify-center gap-1">
                <span className="h-0.5 w-5 rounded-full bg-current" />
                <span className="h-0.5 w-5 rounded-full bg-current" />
                <span className="h-0.5 w-5 rounded-full bg-current" />
              </span>
            </button>
            <div className="hidden md:flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3 text-base md:text-lg ">
              <Button asChild variant="ghost" className="justify-center text-white hover:text-white text-base">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild className="gradient-blue-primary text-white hover:opacity-90 text-base">
                <Link to="/signup">Sign up free</Link>
              </Button>
            </div>
            {isMobileNavOpen && (
              <div className="absolute left-4 right-4 top-full mt-3 rounded-2xl border border-white/15 bg-slate-950/95 p-5 text-white shadow-xl md:hidden z-50">
                <nav className="flex flex-col gap-4 text-base">
                  <a href="#product" className="hover:text-white" onClick={() => setIsMobileNavOpen(false)}>Product</a>
                  <a href="#how-it-works" className="hover:text-white" onClick={() => setIsMobileNavOpen(false)}>How it works</a>
                  <a href="#get-involved" className="hover:text-white" onClick={() => setIsMobileNavOpen(false)}>Get involved</a>
                </nav>
                <div className="mt-5 flex flex-col gap-3 text-base">
                  <Button asChild variant="ghost" className="justify-center text-white hover:text-white">
                    <Link to="/login" onClick={() => setIsMobileNavOpen(false)}>Log in</Link>
                  </Button>
                  <Button asChild className="gradient-blue-primary text-white hover:opacity-90">
                    <Link to="/signup" onClick={() => setIsMobileNavOpen(false)}>Sign up free</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </header>

        <section className="relative overflow-hidden font-switzer">
          <div className="absolute inset-0" />
          <div className="relative mx-auto grid max-w-6xl xl:max-w-[88rem] gap-12 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-24">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-white/80">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Your marketing, finally on autopilot
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-outfit leading-tight sm:text-4xl md:text-5xl">
                  Run your social media on autopilot with LumenIQ
                </h1>
                <p className="text-base text-white/80 sm:text-lg">
                  Turn the photos, products, and promos you already have into a full week of on-brand posts — planned, written, and scheduled for you in minutes.
                  
                </p>
              </div>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Button asChild size="lg" className="gradient-blue-primary text-white hover:opacity-90 w-1/2 mx-auto sm:w-auto sm:mx-0">
                  <Link to="/signup">
                    Build my first week<ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 hover:bg-white/10 hover:text-white w-1/2 mx-auto sm:w-auto sm:mx-0">
                  <a href="#showcase">
                    <PlayCircle className="h-4 w-4" /> See how it works
                  </a>
                </Button>
              </div>
              <div className="gap-4 pt-4 text-sm text-white/80 grid-cols-3 hidden sm:grid">
                {showcaseStats.map((stat) => (
                  <div key={stat.label} className="space-y-1">
                    <p className="text-2xl font-outfit text-white">{stat.value}</p>
                    <p>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <Card className="border-white/15 bg-white/85 p-5 sm:p-6 backdrop-blur">
                <div className="flex items-center justify-between text-sm text-slate-900">
                  <span>Live preview</span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-sm">Auto-updating</span>
                </div>
                <div className="mt-6 space-y-5 pb-6">
                  <div className="rounded-2xl border border-white/15 bg-blue-500/20 p-5 sm:p-6">
                    <p className="text-sm uppercase text-slate-900">live preview</p>
                    <h2 className="mt-3 text-xl font-outfit text-slate-900">Your Planned Content</h2>
                    <p className="mt-2 text-sm text-slate-900">
                      We analyze competitors, draft captions, and build a ready-to-publish calendar <br /> you just review and approve.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-900">
                      <span className="rounded-full bg-white/10 px-3 py-1">Competitor Insights</span>
                      <span className="rounded-full bg-white/10 px-3 py-1">Auto-Planning</span>
                      <span className="rounded-full bg-white/10 px-3 py-1">Performance Tracking</span>
                    </div>
                  </div>
                  <div className="grid gap-4 text-sm text-slate-900 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/15 bg-blue-500/20 p-4">
                      <p className="text-slate-900">Content ideas planned</p>
                      <p className="mt-2 text-lg font-outfit text-slate-900">30+</p>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-blue-500/20 p-4">
                      <p className="text-slate-900">Human approved</p>
                      <p className="mt-2 text-lg font-outfit text-slate-900">Always in control</p>
                    </div>
                  </div>
                </div>
              </Card>
              <div className="absolute -bottom-18 -right-24 hidden rounded-2xl border border-white/15 bg-white/85 p-5 text-sm text-slate-900 md:block">
                <p className="font-outfit text-slate-900 text-base">“Social media finally stopped feeling like a chore”</p>
                <p className="mt-1 text-slate-900 text-base">Cafe owner, using LumenIQ </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <main className="">
        <section id="product" className="mx-auto max-w-6xl xl:max-w-[88rem] px-4 py-14 sm:px-6 md:py-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-outfit uppercase tracking-[0.2em] text-blue-400">Product</p>
              <h2 className="text-2xl font-outfit sm:text-3xl text-white">Everything you need to stay visible</h2>
              <p className="max-w-2xl text-white/80">
              LumenIQ combines strategy, creation, scheduling, and analytics so small businesses can market consistently without hiring an agency.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <Card key={feature.title} className="border-slate-200 bg-white/85 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
                  {feature.icon}
                </div>
                <h3 className=" text-lg md:text-xl font-outfit text-slate-900">{feature.title}</h3>
                <p className="text-sm md:text-base text-slate-900">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="">
          <div className="mx-auto grid max-w-6xl xl:max-w-[88rem] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:py-20">
            <div className="space-y-4">
              <p className="text-sm font-outfit uppercase tracking-[0.2em] text-blue-400">How it works</p>
              <h2 className="text-2xl font-outfit sm:text-3xl text-white">From setup to scheduled in one flow</h2>
              <p className="text-white/80">
                Connect your accounts once. LumenIQ turns what you already have into plans that get you results.
              </p>
              <Button asChild variant="ghost" className="hover:text-white bg-slate-100 hover:bg-blue-500">
                <Link to="/signup">
                  Launch a demo <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.title} className="rounded-2xl border bg-white/85 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-sm font-outfit text-blue-700">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-outfit text-slate-900">{step.title}</h3>
                      <p className="mt-1 text-sm text-slate-900">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="get-involved" className="">
          <div className="mx-auto max-w-6xl xl:max-w-[88rem] px-4 py-14 sm:px-6 md:py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-outfit uppercase tracking-[0.2em] text-blue-400">Get involved</p>
                <h2 className="text-2xl font-outfit sm:text-3xl text-white">Be part of the LumenIQ story</h2>
                <p className="max-w-2xl text-white/80">
                  We’re building LumenIQ alongside small business owners. See how it works today, and help decide what comes next.
                </p>
              </div>
              <Button asChild variant="outline" className="hover:text-white bg-slate-100 hover:bg-blue-500 w-1/2 mx-auto sm:w-auto sm:mx-0">
                <Link to="/signup">Join the community</Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {involvementCards.map((card) => (
                <Card key={card.title} className="border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-outfit text-slate-900">{card.title}</h3>
                  <p className="text-sm text-slate-600">{card.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl xl:max-w-[88rem] px-4 py-14 sm:px-6 md:py-20">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-100 via-white to-white p-6 text-center sm:p-10">
            <h2 className="text-2xl font-outfit sm:text-3xl">Start running social media smarter today.</h2>
            <p className="mt-3 text-slate-600">
              Launch your first interactive plan in minutes and keep your social media in sync with your business.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="gradient-blue-primary text-white hover:opacity-90">
                <Link to="/signup">Get started free</Link>
              </Button> 
              <Button asChild size="lg" variant="outline" className="hover:text-white bg-slate-100 hover:bg-blue-500">
                <Link to="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="flex justify-center items-center py-6">
          <span className="text-sm text-white">© 2026 LumenIQ. All rights reserved.</span>
        </div>
      </footer>
      {showScrollTop && (
        <button
          type="button"
          aria-label="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white text-white shadow-lg transition hover:bg-slate-900">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-blue-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
          </svg>
        </button>
      )}
    </div>
  );
}
