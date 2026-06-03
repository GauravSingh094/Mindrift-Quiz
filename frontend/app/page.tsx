'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Brain,
  Trophy,
  Users,
  Target,
  Shield,
  Activity,
  Zap,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Clock,
  Award,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpaceBackground } from '@/components/animations/space-background';
import { Typography } from '@/components/ui/typography';
import { StatCard } from '@/components/ui/stat-card';
import { RechartsAreaWrapper } from '@/components/ui/chart-wrappers';
import { Fade, SlideUp, Stagger, Scale } from '@/components/ui/motion';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';

// --- Client-side Animated Counter ---
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalDuration = 1500;
    const incrementTime = Math.max(Math.floor(totalDuration / end), 15);

    const timer = setInterval(() => {
      start += Math.ceil(end / (totalDuration / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="font-mono font-bold tracking-tight">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// --- Custom Accordion FAQ Component ---
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border/40 py-4 transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left font-medium text-foreground hover:text-brand-purple transition-colors"
      >
        <span className="text-sm sm:text-base font-medium">{question}</span>
        <ChevronDown className={cn("h-4 w-4 text-foreground-disabled transition-transform duration-300", isOpen && "rotate-180 text-brand-purple")} />
      </button>
      {isOpen && (
        <p className="mt-3 text-xs sm:text-sm text-foreground-muted leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto-scrolled navigation detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Testimonial Rotation
  const testimonials = [
    {
      name: 'Dr. Sarah Jenkins',
      role: 'Dean of Computer Science',
      text: 'Mindrift has transformed our competitive algorithm modules. The AI quiz generator creates outstanding conceptual evaluations in seconds.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    {
      name: 'Alex Rivera',
      role: 'Competitive Learner',
      text: 'The live competition lobbies feel exactly like high-frequency SRE operations. The latency is practically non-existent, and the ranking updates are immediate.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      name: 'Gaurav Singh',
      role: 'Full Stack Engineer',
      text: 'Integrating Clerk identities, Zustand stores, and watching the stats update on our Recharts wrappers is amazing. The Design System V2 interface is extremely polished.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Mock charts data for performance preview
  const mockChartData = [
    { date: 'Mon', score: 65 },
    { date: 'Tue', score: 72 },
    { date: 'Wed', score: 68 },
    { date: 'Thu', score: 85 },
    { date: 'Fri', score: 92 },
    { date: 'Sat', score: 88 },
    { date: 'Sun', score: 96 },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background flex flex-col text-foreground font-sans selection:bg-brand-purple/30 selection:text-foreground">
      <SpaceBackground />

      {/* --- TASK 1: STICKY NAVBAR --- */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
          isScrolled || isMobileMenuOpen
            ? "bg-background-surface/85 backdrop-blur-md border-border/50 shadow-elevated-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <Brain className="h-6 w-6 text-brand-purple group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-sans font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground-disabled">
                Mindrift
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="#features" className="text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-background-elevated text-foreground-muted hover:text-foreground transition-all duration-fast">
                Features
              </Link>
              <Link href="#competitions" className="text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-background-elevated text-foreground-muted hover:text-foreground transition-all duration-fast">
                Competitions
              </Link>
              <Link href="#ai" className="text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-background-elevated text-foreground-muted hover:text-foreground transition-all duration-fast">
                AI Hub
              </Link>
              <Link href="#analytics" className="text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-background-elevated text-foreground-muted hover:text-foreground transition-all duration-fast">
                Analytics
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {clerkUser ? (
              <Button onClick={() => router.push('/dashboard')} size="sm" className="bg-brand-purple hover:bg-brand-purple/90 text-foreground transition-all shadow-elevated-md hover:scale-102">
                Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link href="/login" className="text-xs font-semibold text-foreground hover:text-brand-purple transition-colors">
                  Sign In
                </Link>
                <Button onClick={() => router.push('/register')} size="sm" className="bg-brand-purple hover:bg-brand-purple/90 text-foreground transition-all shadow-elevated-md hover:scale-102">
                  Get Started
                </Button>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-foreground hover:text-brand-purple transition-colors"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/30 bg-background-surface p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-2">
              <Link onClick={() => setIsMobileMenuOpen(false)} href="#features" className="text-sm font-medium p-2 rounded-md hover:bg-background-elevated text-foreground-muted hover:text-foreground">
                Features
              </Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="#competitions" className="text-sm font-medium p-2 rounded-md hover:bg-background-elevated text-foreground-muted hover:text-foreground">
                Competitions
              </Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="#ai" className="text-sm font-medium p-2 rounded-md hover:bg-background-elevated text-foreground-muted hover:text-foreground">
                AI Hub
              </Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} href="#analytics" className="text-sm font-medium p-2 rounded-md hover:bg-background-elevated text-foreground-muted hover:text-foreground">
                Analytics
              </Link>
            </nav>
            {!clerkUser && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border/20">
                <Button variant="ghost" onClick={() => { setIsMobileMenuOpen(false); router.push('/login'); }} className="w-full text-xs font-semibold justify-center">
                  Sign In
                </Button>
                <Button onClick={() => { setIsMobileMenuOpen(false); router.push('/register'); }} className="w-full bg-brand-purple hover:bg-brand-purple/90 text-foreground transition-all shadow-elevated-md justify-center">
                  Get Started
                </Button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* --- TASK 2: HERO SECTION --- */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 max-w-7xl mx-auto px-6 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <SlideUp delay={0.05}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-xs font-semibold text-brand-purple tracking-wide">
                <Sparkles className="h-3.5 w-3.5" /> Mindrift Design V2 Live
              </div>
            </SlideUp>

            <SlideUp delay={0.1}>
              <Typography variant="display">
                The Future of AI-Powered Competitive Learning
              </Typography>
            </SlideUp>

            <SlideUp delay={0.15}>
              <Typography variant="body" className="max-w-xl mx-auto lg:mx-0">
                Participate in live quiz competitions, access dynamic customized learning paths, and audit deep cognitive metrics driven by advanced AI models.
              </Typography>
            </SlideUp>

            <SlideUp delay={0.2} className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Button onClick={() => router.push(clerkUser ? '/dashboard' : '/register')} size="lg" className="bg-brand-purple hover:bg-brand-purple/90 text-foreground transition-all shadow-elevated-md hover:scale-102 font-semibold">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border hover:bg-background-surface text-foreground transition-colors font-medium">
                <Link href="#features">Explore Features</Link>
              </Button>
            </SlideUp>

            {/* Trust indicators */}
            <SlideUp delay={0.25} className="pt-6 border-t border-border/20 flex flex-wrap justify-center lg:justify-start items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand-green" />
                <span className="text-xs font-semibold text-foreground-disabled">No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand-green" />
                <span className="text-xs font-semibold text-foreground-disabled">Supabase storage ready</span>
              </div>
            </SlideUp>
          </div>

          {/* Premium Dashboard Preview */}
          <div className="lg:col-span-6">
            <Scale delay={0.15}>
              <div className="relative group overflow-hidden bg-background-surface border border-border/60 rounded-xl shadow-elevated-lg">
                {/* Glowing radial gradient backdrop */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 to-transparent pointer-events-none z-0" />
                
                {/* Header mock */}
                <div className="h-10 bg-background-elevated/70 border-b border-border/40 px-4 flex items-center gap-2 relative z-10">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-amber/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-green/60" />
                  <div className="ml-4 h-4 w-40 rounded bg-border/40 animate-pulse" />
                </div>

                <div className="p-6 relative z-10 space-y-6">
                  {/* Dashboard stats mock */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-background-elevated/50 border border-border/30 rounded-md">
                      <span className="text-[10px] uppercase font-semibold text-foreground-disabled">Accuracy</span>
                      <p className="text-lg font-bold font-mono text-brand-green">94.2%</p>
                    </div>
                    <div className="p-3 bg-background-elevated/50 border border-border/30 rounded-md">
                      <span className="text-[10px] uppercase font-semibold text-foreground-disabled">Quizzes</span>
                      <p className="text-lg font-bold font-mono text-brand-purple">124</p>
                    </div>
                    <div className="p-3 bg-background-elevated/50 border border-border/30 rounded-md">
                      <span className="text-[10px] uppercase font-semibold text-foreground-disabled">Streak</span>
                      <p className="text-lg font-bold font-mono text-brand-amber">12 Days</p>
                    </div>
                  </div>

                  {/* Active quiz attempt panel mockup */}
                  <div className="p-4 bg-background-elevated/30 border border-border/30 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-brand-purple">ACTIVE CHALLENGE</span>
                      <span className="text-[10px] font-mono text-foreground-muted">Time Left: 14s</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      Which mechanism prevents outbox scheduling proxy bypass in distributed SRE audits?
                    </p>
                    <div className="space-y-1.5">
                      <div className="p-2 bg-brand-purple/10 border border-brand-purple/30 rounded text-[11px] text-brand-purple font-medium">
                        Transactional Outbox with Lock-Free CDC pipelines
                      </div>
                      <div className="p-2 bg-background-elevated/40 border border-border/20 rounded text-[11px] text-foreground-muted">
                        JIT Clerk User identity provisioning filters
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Scale>
          </div>
        </div>
      </section>

      {/* --- TASK 3: SOCIAL PROOF / METRICS --- */}
      <section className="py-12 bg-background-surface/30 border-y border-border/20 z-10 relative">
        <div className="max-w-7xl mx-auto px-6">
          <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-brand-purple">
                <Counter value={250} suffix="K+" />
              </p>
              <p className="text-xs sm:text-sm font-semibold text-foreground-disabled uppercase tracking-wide">
                Questions Generated
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-brand-green">
                <Counter value={12} suffix="K+" />
              </p>
              <p className="text-xs sm:text-sm font-semibold text-foreground-disabled uppercase tracking-wide">
                Active Learners
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-brand-amber">
                <Counter value={850} suffix="+" />
              </p>
              <p className="text-xs sm:text-sm font-semibold text-foreground-disabled uppercase tracking-wide">
                Competitions Hosted
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-foreground">
                <Counter value={45} suffix="K+" />
              </p>
              <p className="text-xs sm:text-sm font-semibold text-foreground-disabled uppercase tracking-wide">
                Learning Hours
              </p>
            </div>
          </Stagger>
        </div>
      </section>

      {/* --- TASK 4: FEATURE SHOWCASE --- */}
      <section id="features" className="py-20 md:py-28 max-w-7xl mx-auto px-6 z-10 relative space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Typography variant="h2">Engineered for Advanced Knowledge Retention</Typography>
          <Typography variant="body">
            Unlike static multiple-choice setups, Mindrift merges competitive SRE game theory and generative AI models.
          </Typography>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="AI Quiz Generation"
            value="Automated"
            description="Generate deep conceptual quizzes instantly by providing any topic or documentation."
            icon={<Brain className="h-5 w-5 text-brand-purple" />}
            glowColor="purple"
          />
          <StatCard
            title="Real-Time Competitions"
            value="Live STOMP"
            description="Participate in high-frequency live events with immediate score synchronization."
            icon={<Users className="h-5 w-5 text-brand-green" />}
            glowColor="green"
          />
          <StatCard
            title="Anti-Cheat Proctoring"
            value="Secure RLS"
            description="Integrated browser validation prevents copy-paste cheats and dual window abuse."
            icon={<Shield className="h-5 w-5 text-brand-amber" />}
            glowColor="amber"
          />
          <StatCard
            title="Smart Analytics"
            value="Deep Timer"
            description="Analyze learning charts, cognitive performance tracking, and accuracy records."
            icon={<Activity className="h-5 w-5 text-foreground" />}
            glowColor="purple"
          />
          <StatCard
            title="AI Learning Paths"
            value="Personalized"
            description="Dynamic, adaptive schedules suggest focus areas based on failed responses."
            icon={<Zap className="h-5 w-5 text-brand-green" />}
            glowColor="green"
          />
          <StatCard
            title="Global Leaderboards"
            value="Rankings"
            description="Climb competitive tiers, collect trophies, and earn your place among top scholars."
            icon={<Trophy className="h-5 w-5 text-brand-amber" />}
            glowColor="amber"
          />
        </div>
      </section>

      {/* --- TASK 5: COMPETITION SHOWCASE --- */}
      <section id="competitions" className="py-20 md:py-28 border-t border-border/20 z-10 relative bg-background-surface/10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-amber/10 border border-brand-amber/20 text-xs font-semibold text-brand-amber tracking-wide">
                <Target className="h-3.5 w-3.5" /> High-frequency STOMP Session
              </div>
              <Typography variant="h2">Real-Time Lobbies</Typography>
              <Typography variant="body">
                Compete live against learners globally. Our reactive WebSocket backbone broadcasts attempts, responses, and score changes immediately, keeping the contest alive.
              </Typography>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-sm text-foreground-muted">
                  <CheckCircle className="h-4 w-4 text-brand-amber mt-0.5" /> Live ticking timers keep the intensity high.
                </li>
                <li className="flex items-start gap-2.5 text-sm text-foreground-muted">
                  <CheckCircle className="h-4 w-4 text-brand-amber mt-0.5" /> Dynamic rank shifting animates positions.
                </li>
                <li className="flex items-start gap-2.5 text-sm text-foreground-muted">
                  <CheckCircle className="h-4 w-4 text-brand-amber mt-0.5" /> Instant trophies are awarded to top three participants.
                </li>
              </ul>
            </div>

            {/* Competition Visual Mockup */}
            <div className="lg:col-span-7">
              <Scale delay={0.2}>
                <div className="bg-background-surface border border-border/60 rounded-xl overflow-hidden shadow-elevated-lg relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-amber/5 to-transparent pointer-events-none z-0" />
                  
                  {/* Lobby header */}
                  <div className="p-4 bg-background-elevated/70 border-b border-border/40 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-brand-amber animate-pulse" />
                      <span className="text-xs font-semibold text-foreground">SRE K8s Cluster Auditing Contest</span>
                    </div>
                    <span className="text-[11px] font-mono bg-brand-amber/10 border border-brand-amber/20 px-2.5 py-0.5 rounded text-brand-amber">
                      LIVE
                    </span>
                  </div>

                  {/* Leaderboard rows mockup */}
                  <div className="p-6 space-y-3 relative z-10">
                    <div className="flex items-center justify-between p-3 bg-brand-amber/5 border border-brand-amber/20 rounded-md">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-brand-amber">#1</span>
                        <div className="h-6 w-6 rounded-full bg-border/40" />
                        <span className="text-xs font-semibold text-foreground">Sarah_Jenkins</span>
                      </div>
                      <span className="font-mono text-xs text-brand-amber font-bold">1,240 pts</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background-elevated/50 border border-border/30 rounded-md">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-foreground-disabled">#2</span>
                        <div className="h-6 w-6 rounded-full bg-border/40" />
                        <span className="text-xs font-semibold text-foreground">Alex_Rivera</span>
                      </div>
                      <span className="font-mono text-xs text-foreground font-bold">1,120 pts</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background-elevated/50 border border-border/30 rounded-md">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-foreground-disabled">#3</span>
                        <div className="h-6 w-6 rounded-full bg-border/40" />
                        <span className="text-xs font-semibold text-foreground">Gaurav_Singh</span>
                      </div>
                      <span className="font-mono text-xs text-foreground font-bold">950 pts</span>
                    </div>
                  </div>
                </div>
              </Scale>
            </div>
          </div>
        </div>
      </section>

      {/* --- TASK 6: AI SHOWCASE --- */}
      <section id="ai" className="py-20 md:py-28 border-t border-border/20 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* AI Mockup */}
            <div className="lg:col-span-7 order-last lg:order-first">
              <Scale delay={0.2}>
                <div className="bg-background-surface border border-border/60 rounded-xl overflow-hidden shadow-elevated-lg relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 to-transparent pointer-events-none z-0" />
                  
                  {/* AI panel header */}
                  <div className="p-4 bg-background-elevated/70 border-b border-border/40 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-brand-purple" />
                      <span className="text-xs font-semibold text-foreground">Mindrift AI Generation Engine</span>
                    </div>
                  </div>

                  {/* AI Input Mockup */}
                  <div className="p-6 space-y-4 relative z-10">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-foreground-disabled">Prompt Topic or Doc Link</label>
                      <div className="flex gap-2">
                        <div className="flex-1 p-2 bg-background-elevated border border-border/30 text-xs rounded text-foreground-muted">
                          https://neon.tech/docs/introduction/architecture
                        </div>
                        <Button size="sm" className="bg-brand-purple hover:bg-brand-purple/90 text-foreground font-mono text-[10px] h-auto">
                          GENERATE
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-background-elevated/40 border border-border/20 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-brand-purple font-semibold">
                        <CheckCircle className="h-3.5 w-3.5" /> Core logic extracted successfully.
                      </div>
                      <p className="text-xs text-foreground-muted">
                        Constructing 10 conceptual SRE questions representing Neon's serverless storage architecture, branching pages, and point-in-time recovery mechanisms.
                      </p>
                    </div>
                  </div>
                </div>
              </Scale>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-xs font-semibold text-brand-purple tracking-wide">
                <Sparkles className="h-3.5 w-3.5" /> AI-Powered learning paths
              </div>
              <Typography variant="h2">Instant Quiz Generation</Typography>
              <Typography variant="body">
                Paste any documentation link, markdown notes, or educational textbook. Our model parses the concepts recursively and produces robust, balanced conceptual questions in seconds.
              </Typography>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-sm text-foreground-muted">
                  <CheckCircle className="h-4 w-4 text-brand-purple mt-0.5" /> Leverages advanced Gemini and Claude models.
                </li>
                <li className="flex items-start gap-2.5 text-sm text-foreground-muted">
                  <CheckCircle className="h-4 w-4 text-brand-purple mt-0.5" /> Simulates mock technical interviews dynamically.
                </li>
                <li className="flex items-start gap-2.5 text-sm text-foreground-muted">
                  <CheckCircle className="h-4 w-4 text-brand-purple mt-0.5" /> Automatically adjusts difficulty indexes.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- TASK 7: ANALYTICS SHOWCASE --- */}
      <section id="analytics" className="py-20 md:py-28 border-t border-border/20 z-10 relative bg-background-surface/10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/20 text-xs font-semibold text-brand-green tracking-wide">
                <Activity className="h-3.5 w-3.5" /> Observed cognitive tracking
              </div>
              <Typography variant="h2">Analytics Dashboard</Typography>
              <Typography variant="body">
                Never wonder what concepts you missed. Binds directly to our custom Recharts area grids plotting daily accuracies, average completion times, and category score trends.
              </Typography>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-sm text-foreground-muted">
                  <CheckCircle className="h-4 w-4 text-brand-green mt-0.5" /> Analyzes learning speeds by question type.
                </li>
                <li className="flex items-start gap-2.5 text-sm text-foreground-muted">
                  <CheckCircle className="h-4 w-4 text-brand-green mt-0.5" /> Plots weekly conceptual growth timelines.
                </li>
                <li className="flex items-start gap-2.5 text-sm text-foreground-muted">
                  <CheckCircle className="h-4 w-4 text-brand-green mt-0.5" /> Identifies structural weaknesses automatically.
                </li>
              </ul>
            </div>

            {/* Recharts Area Chart Mockup */}
            <div className="lg:col-span-7">
              <Scale delay={0.2}>
                <div className="bg-background-surface border border-border/60 rounded-xl p-6 shadow-elevated-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Performance Trend (Weekly Accuracy)</span>
                    <span className="text-[10px] font-mono text-brand-green font-bold">AVG. 83.4%</span>
                  </div>
                  <RechartsAreaWrapper
                    data={mockChartData}
                    dataKey="score"
                    categoryKey="date"
                    height={220}
                    glowColor="green"
                  />
                </div>
              </Scale>
            </div>
          </div>
        </div>
      </section>

      {/* --- TASK 8: ACHIEVEMENT SYSTEM PREVIEW --- */}
      <section className="py-20 md:py-28 border-t border-border/20 z-10 relative">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Typography variant="h2">Tier Rankings & Achievements</Typography>
            <Typography variant="body">
              Consistent training is rewarded. Unlock tiers, trophies, and streaks.
            </Typography>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-background-surface border border-border/40 p-6 rounded-lg text-center space-y-3 hover:border-brand-purple/20 transition-all duration-300">
              <div className="h-10 w-10 mx-auto bg-brand-purple/10 border border-brand-purple/20 rounded-full flex items-center justify-center text-brand-purple">
                <Flame className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">Weekly Streak</h4>
              <p className="text-xs text-foreground-disabled">Keep the momentum going by answering 5 consecutive daily questions.</p>
            </div>

            <div className="bg-background-surface border border-border/40 p-6 rounded-lg text-center space-y-3 hover:border-brand-green/20 transition-all duration-300">
              <div className="h-10 w-10 mx-auto bg-brand-green/10 border border-brand-green/20 rounded-full flex items-center justify-center text-brand-green">
                <Award className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">Scholar Tier</h4>
              <p className="text-xs text-foreground-disabled">Unlocked after completing 50 quizzes with a minimum accuracy of 80%.</p>
            </div>

            <div className="bg-background-surface border border-border/40 p-6 rounded-lg text-center space-y-3 hover:border-brand-amber/20 transition-all duration-300">
              <div className="h-10 w-10 mx-auto bg-brand-amber/10 border border-brand-amber/20 rounded-full flex items-center justify-center text-brand-amber">
                <Trophy className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">Elite Champion</h4>
              <p className="text-xs text-foreground-disabled">Awarded to players who capture first place in standard competitive events.</p>
            </div>

            <div className="bg-background-surface border border-border/40 p-6 rounded-lg text-center space-y-3 hover:border-foreground/20 transition-all duration-300">
              <div className="h-10 w-10 mx-auto bg-foreground/10 border border-foreground/20 rounded-full flex items-center justify-center text-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">AI Architect</h4>
              <p className="text-xs text-foreground-disabled">Granted to users who successfully generate 10 high-quality quizzes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- TASK 9: TESTIMONIALS --- */}
      <section className="py-20 md:py-28 border-t border-border/20 z-10 relative bg-background-surface/10">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <Typography variant="h2">Endorsed by Top Engineers</Typography>
          
          <div className="relative min-h-[160px] flex items-center justify-center">
            {testimonials.map((t, index) => (
              <div
                key={index}
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center space-y-4 transition-all duration-500 transform",
                  index === activeTestimonial
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-4 scale-95 pointer-events-none"
                )}
              >
                <p className="text-base sm:text-lg italic text-foreground-muted leading-relaxed max-w-2xl">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="h-8 w-8 rounded-full border border-border" />
                  <div className="text-left">
                    <h5 className="text-xs font-bold text-foreground leading-none">{t.name}</h5>
                    <span className="text-[10px] text-foreground-disabled">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-1.5">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === activeTestimonial ? "w-6 bg-brand-purple" : "w-1.5 bg-border"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- TASK 10: FAQ ACCORDION --- */}
      <section className="py-20 md:py-28 border-t border-border/20 z-10 relative max-w-3xl mx-auto px-6 space-y-10">
        <div className="text-center space-y-2">
          <Typography variant="h2">Frequently Asked Questions</Typography>
          <Typography variant="body">Find answers to common questions about our platform.</Typography>
        </div>

        <div className="space-y-1">
          <FaqItem
            question="How does the AI generate quiz questions?"
            answer="Our platform integrates Claude and Gemini API architectures. When you input a topic, link, or markdown document, it parses the semantic concepts recursively and constructs balanced conceptual questions with clear, detailed explanations."
          />
          <FaqItem
            question="Is the platform truly real-time for competitions?"
            answer="Yes. We leverage standard Spring Boot WebSocket STOMP relays. Rankings, timers, and submission attempts are immediately synchronized across all connected browsers under 100ms."
          />
          <FaqItem
            question="How is cheating prevented in competitions?"
            answer="Our secure proctoring subsystem monitors window changes, clipboard events, and focus states during attempts. Cheating triggers prompt instant alerts and SRE outbox logging."
          />
          <FaqItem
            question="Can I host private competitions for my class or team?"
            answer="Absolutely. Creators can build private custom rooms, configure participation counts, set ticking timers, and invite participants via secure join keys."
          />
        </div>
      </section>

      {/* --- TASK 11: CTA SECTION --- */}
      <section className="py-20 md:py-28 border-t border-border/20 z-10 relative bg-gradient-to-b from-transparent to-brand-purple/5">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-xs font-semibold text-brand-purple tracking-wide">
            <Zap className="h-3.5 w-3.5" /> Start Learning Faster Today
          </div>
          <Typography variant="display" className="text-3xl sm:text-5xl">
            Unleash Your Cognitive Potential
          </Typography>
          <Typography variant="body" className="max-w-xl mx-auto">
            Join thousands of modern developers, SREs, and learners mapping their accuracy, conquering live leaderboards, and mastering knowledge retention.
          </Typography>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Button onClick={() => router.push('/register')} size="lg" className="bg-brand-purple hover:bg-brand-purple/90 text-foreground transition-all shadow-elevated-md hover:scale-102 font-semibold">
              Get Started Free
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border hover:bg-background-surface text-foreground transition-colors font-medium">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* --- TASK 12: FOOTER --- */}
      <footer className="relative z-10 py-16 border-t border-border/40 bg-background-surface/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-4 col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <Brain className="h-5 w-5 text-brand-purple" />
              <span className="font-sans font-bold text-sm tracking-tight text-foreground">
                Mindrift
              </span>
            </Link>
            <p className="text-xs text-foreground-disabled leading-relaxed max-w-[200px]">
              The future of AI-powered competitive learning platforms.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">Product</h5>
            <ul className="space-y-2 text-xs text-foreground-disabled">
              <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
              <li><Link href="#competitions" className="hover:text-foreground transition-colors">Competitions</Link></li>
              <li><Link href="#ai" className="hover:text-foreground transition-colors">AI Hub</Link></li>
              <li><Link href="#analytics" className="hover:text-foreground transition-colors">Analytics</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">Resources</h5>
            <ul className="space-y-2 text-xs text-foreground-disabled">
              <li><a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Next.js Docs</a></li>
              <li><a href="https://clerk.com/docs" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Clerk Auth</a></li>
              <li><a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Supabase Docs</a></li>
              <li><a href="https://recharts.org" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Recharts API</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">Developer</h5>
            <ul className="space-y-2 text-xs text-foreground-disabled">
              <li><strong className="text-foreground-muted">Gaurav Singh</strong></li>
              <li>
                <a
                  href="https://www.linkedin.com/in/gaurav-singh-276944292"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  💼 LinkedIn Profile
                </a>
              </li>
              <li>
                <a
                  href="mailto:gauravsinghx2510@gmail.com"
                  className="hover:text-foreground transition-colors"
                >
                  📧 Contact Email
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-border/20 text-center text-[11px] text-foreground-disabled flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Mindrift Platform. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}