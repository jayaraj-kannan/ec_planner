<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { authActions } from '../../stores/authStore';
import { actions } from '../../stores/eventStore';
import {
  Sparkles,
  PlayCircle,
  Calendar,
  Clock,
  Wallet,
  Users,
  CheckSquare,
  Briefcase,
  Layers,
  Cloud,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Check,
  Star,
  Zap,
  LogIn,
  PartyPopper,
} from 'lucide-vue-next';

// ----------------------------------------------------
// Example Carousel State & Controls
// ----------------------------------------------------
interface CarouselSlide {
  id: number;
  tag: string;
  theme: string;
  title: string;
  subtitle: string;
  badgeBg: string;
  badgeColor: string;
  stats: { label: string; value: string; hint?: string }[];
  keyHighlights: string[];
  ctaLabel: string;
  ctaType: 'auth' | 'copilot';
}

const slides: CarouselSlide[] = [
  {
    id: 1,
    tag: 'GRAND WEDDING SHOWCASE',
    theme: 'Royal Palace Celebration',
    title: 'Priya & Rahul’s Grand Royal Wedding',
    subtitle: '4-day celebration across Udaipur City Palace with 350 international guests, 84 phased tasks, and a zero-delay live run sheet.',
    badgeBg: '#fef3c7',
    badgeColor: '#b45309',
    stats: [
      { label: 'Planned Budget', value: '₹85,00,000', hint: 'Multi-category cap' },
      { label: 'Readiness Score', value: '94%', hint: 'Exceptional readiness' },
      { label: 'Confirmed Guests', value: '310 / 350', hint: '88% RSVP response' },
      { label: 'Event Schedule', value: '4 Days', hint: 'Baraat, Sangeet, Pheras' },
    ],
    keyHighlights: [
      'Live minute-by-minute Baraat and Sangeet run sheet with WhatsApp stage hotlines',
      'Categorized budget for Royal Venue, Catering, Photography & Sangeet Artists',
      'Dietary management tracking 180 Veg, 90 Non-Veg, 40 Jain, and 25 Vegan guests',
    ],
    ctaLabel: 'Sign In to Plan Similar Wedding',
    ctaType: 'auth',
  },
  {
    id: 2,
    tag: 'GOOGLE ADK & GEMINI 2.5',
    theme: 'Intelligent AI Event Copilot',
    title: 'Prompt-to-Plan with Interactive A2UI Cards',
    subtitle: 'Ask natural-language questions and watch the Google ADK Agent calculate budget allocations, milestones, and vendor contracts in seconds.',
    badgeBg: '#e0f2fe',
    badgeColor: '#0369a1',
    stats: [
      { label: 'AI Model', value: 'Gemini 2.5', hint: 'High-speed reasoning' },
      { label: 'SDK Architecture', value: 'Google ADK', hint: 'Agent Development Kit' },
      { label: 'Card Format', value: 'Native A2UI', hint: 'Rich interactive cards' },
      { label: 'Turnaround', value: '< 2 Sec', hint: 'Instant structured output' },
    ],
    keyHighlights: [
      '“Generate a $25,000 budget breakdown for a 120-guest milestone anniversary”',
      '“Draft the day-of run sheet with 15-minute buffers for photographer delays”',
      '“Compare 3 sound & lighting vendors with standard contractual clauses”',
    ],
    ctaLabel: 'Launch AI Copilot Now',
    ctaType: 'copilot',
  },
  {
    id: 3,
    tag: 'DAY-OF EVENT COORDINATOR',
    theme: 'Zero-Panic Live Run Sheet',
    title: 'Real-Time Schedule with Dynamic Delay Detection',
    subtitle: 'Never let unexpected delays derail your timeline. PlanCraft automatically propagates schedule adjustments and provides 1-tap contact hotlines.',
    badgeBg: '#dcfce7',
    badgeColor: '#15803d',
    stats: [
      { label: 'Live Tracking', value: 'Minute-Level', hint: 'Time-synced clock' },
      { label: 'Delay Handling', value: 'Dynamic Shift', hint: 'Auto downstream recalc' },
      { label: 'Coordinator Phone', value: '1-Tap Dial', hint: 'Lead & backup contacts' },
      { label: 'Status Updates', value: 'Instant', hint: 'Ready / Live / Done' },
    ],
    keyHighlights: [
      'Automatic +20m Baraat delay alert recalculates dinner & stage lighting times',
      'Primary responsible lead and emergency backup phone number for every single activity',
      'Offline-capable full screen Run Sheet mode designed for event-day tablets',
    ],
    ctaLabel: 'Sign In to Unlock Live Run Sheet',
    ctaType: 'auth',
  },
  {
    id: 4,
    tag: 'FINANCIAL ACCURACY',
    theme: 'Smart Budget & Expense Engine',
    title: 'Precision Expense Ledger with Minor-Unit Math',
    subtitle: 'Track agreed vendor contracts versus advance payments, category allocation caps, and invoice receipts with zero rounding discrepancies.',
    badgeBg: '#f3e8ff',
    badgeColor: '#7e22ce',
    stats: [
      { label: 'Currency Support', value: 'INR / USD / EUR', hint: 'Locale-aware formats' },
      { label: 'Math Precision', value: 'Minor Units', hint: 'Paise / cents precision' },
      { label: 'Vendor Advances', value: 'Real-Time', hint: 'Pending balance alerts' },
      { label: 'Budget Caps', value: 'Automated', hint: 'Overbudget warnings' },
    ],
    keyHighlights: [
      'Visual progress meters tracking committed vendor deposits and remaining liquid cash',
      'Detailed category allocations for Venue, Catering, Decor, Entertainment, and Gifts',
      'Instant warning indicators if any category breaches its pre-planned budget target',
    ],
    ctaLabel: 'Create Account to Manage Budget',
    ctaType: 'auth',
  },
];

const currentSlide = ref(0);
let autoAdvanceTimer: any = null;
const isHovered = ref(false);

function nextSlide() {
  currentSlide.value = (currentSlide.value + 1) % slides.length;
}

function prevSlide() {
  currentSlide.value = (currentSlide.value - 1 + slides.length) % slides.length;
}

function goToSlide(index: number) {
  currentSlide.value = index;
}

function handleSlideCta(slide: CarouselSlide) {
  if (slide.ctaType === 'copilot') {
    actions.openAgentChatModal();
  } else {
    authActions.openAuthModal('signup');
  }
}

function startTimer() {
  stopTimer();
  autoAdvanceTimer = setInterval(() => {
    if (!isHovered.value) {
      nextSlide();
    }
  }, 5000);
}

function stopTimer() {
  if (autoAdvanceTimer) {
    clearInterval(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

onMounted(() => {
  startTimer();
});

onUnmounted(() => {
  stopTimer();
});

// ----------------------------------------------------
// Comprehensive Feature Cards
// ----------------------------------------------------
interface FeatureCard {
  id: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  tag: string;
  title: string;
  description: string;
  bullets: string[];
  ctaText: string;
  action: () => void;
}

const featureCards: FeatureCard[] = [
  {
    id: 'ai-copilot',
    icon: Sparkles,
    iconBg: '#eff6ff',
    iconColor: '#2563eb',
    tag: 'Google ADK · Gemini 2.5',
    title: 'ADK AI Event Copilot & A2UI',
    description: 'Conversational planning engine that builds complete milestone checklists, budget breakdowns, and vendor interview questions via rich interactive cards.',
    bullets: ['A2UI interactive card rendering', 'Gemini 2.5 deep domain reasoning', 'Session persistence via ADK memory'],
    ctaText: 'Test Copilot Free',
    action: () => actions.openAgentChatModal(),
  },
  {
    id: 'run-sheet',
    icon: Clock,
    iconBg: '#ecfdf5',
    iconColor: '#059669',
    tag: 'Day-Of Operations',
    title: 'Minute-Level Live Run Sheet',
    description: 'Keep your event running smoothly. Synchronized day-of timeline with minute-by-minute activity cards, delay recalculation, and 1-tap phone dials.',
    bullets: ['Automatic delay propagation', 'Responsible lead + backup contact', 'Live event-day fullscreen view'],
    ctaText: 'Sign In to Access',
    action: () => authActions.openAuthModal('signin'),
  },
  {
    id: 'readiness',
    icon: ShieldCheck,
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    tag: 'Intelligent Scoring',
    title: 'Event Readiness Score (0–100%)',
    description: 'Automated pre-flight readiness algorithm that factors task completion, budget risk, vendor contracts, and confirmed RSVPs before the big day arrives.',
    bullets: ['Weighted algorithmic scoring', 'Proactive risk warnings', 'Actionable next-step recommendations'],
    ctaText: 'Sign In to Calculate',
    action: () => authActions.openAuthModal('signin'),
  },
  {
    id: 'budget',
    icon: Wallet,
    iconBg: '#f3e8ff',
    iconColor: '#9333ea',
    tag: 'Financial Precision',
    title: 'Smart Budget & Expense Ledger',
    description: 'Avoid surprise expenses with multi-currency tracking (INR, USD, EUR) in minor units. Compare initial quotes, track paid advances, and monitor category caps.',
    bullets: ['Minor-unit integer math precision', 'Category caps with overbudget alerts', 'Vendor advance & balance ledger'],
    ctaText: 'Sign In to Manage Budget',
    action: () => authActions.openAuthModal('signin'),
  },
  {
    id: 'checklist',
    icon: CheckSquare,
    iconBg: '#fef2f2',
    iconColor: '#dc2626',
    tag: 'Task Management',
    title: 'Executive Milestone Checklist',
    description: 'Phased checklist pipelines tailored for weddings, birthdays, baby showers, and custom events. Never miss a deadline with overdue indicators.',
    bullets: ['Phased milestone organization', 'High, Medium & Low priorities', 'Instant checkbox toggles & metrics'],
    ctaText: 'Sign In to View Checklist',
    action: () => authActions.openAuthModal('signin'),
  },
  {
    id: 'guests',
    icon: Users,
    iconBg: '#e0f2fe',
    iconColor: '#0284c7',
    tag: 'Hospitality & RSVPs',
    title: 'Guest RSVP & Dietary Suite',
    description: 'Manage invitations, family grouping, RSVP statuses, dietary preferences (Veg, Jain, Vegan, Non-Veg), and hotel room reservations all in one matrix.',
    bullets: ['Dietary breakdown analytics', 'Family grouping & party sizes', 'Hotel room booking coordinator'],
    ctaText: 'Sign In to Track Guests',
    action: () => authActions.openAuthModal('signin'),
  },
  {
    id: 'vendors',
    icon: Briefcase,
    iconBg: '#fdf4ff',
    iconColor: '#c026d3',
    tag: 'Vendor Directory',
    title: 'Vendor Vetting & Contracts',
    description: 'Consolidate caterers, photographers, decorators, sound engineers, and makeup artists. Track quoted prices, signed contracts, ratings, and contact info.',
    bullets: ['Centralized vendor address book', 'Advance vs remaining payment balances', 'Contract status tracking'],
    ctaText: 'Sign In for Vendor Hub',
    action: () => authActions.openAuthModal('signin'),
  },
  {
    id: 'arrangements',
    icon: Layers,
    iconBg: '#ecfeff',
    iconColor: '#0891b2',
    tag: 'Physical Setup',
    title: 'Floor Plan & Arrangements',
    description: 'Ensure stage lighting, floral mandaps, audio microphones, guest seating rows, and dining buffets are verified ready before guests arrive.',
    bullets: ['Setup readiness verification', 'Vendor & item assignment', 'Due-time execution tracking'],
    ctaText: 'Sign In to Coordinate',
    action: () => authActions.openAuthModal('signin'),
  },
  {
    id: 'cloud-sync',
    icon: Cloud,
    iconBg: '#FFE4F6',
    iconColor: '#FF6082',
    tag: 'Cloud & Offline',
    title: 'Firebase Auth & Firestore Sync',
    description: 'Sign in effortlessly with Google or Email/Password. Your celebration documents synchronize hierarchically in Firestore with resilient offline caching.',
    bullets: ['One-click Google Sign-In', 'Hierarchical Firestore subcollections', 'Resilient offline data persistence'],
    ctaText: 'Sign In / Register',
    action: () => authActions.openAuthModal('signup'),
  },
];
</script>

<template>
  <div class="guest-home-container">
    <!-- Top Hero Section -->
    <section class="guest-hero-section">
      <div class="hero-badge-pill">
        <Sparkles :size="14" class="sparkle-icon" />
        <span>PLANNING OPERATING SYSTEM · GOOGLE ADK GEMINI 2.5</span>
      </div>

      <h1 class="guest-hero-title">
        Plan Every Celebration With
        <span class="gradient-text">Absolute Confidence</span>
      </h1>

      <p class="guest-hero-subtitle">
        From 500-guest royal palace weddings to milestone birthdays and corporate galas.
        Manage budgets, coordinate minute-by-minute day-of schedules, track dietary RSVPs,
        and collaborate with our Google ADK Gemini 2.5 AI Event Copilot.
      </p>

      <div class="guest-hero-actions">
        <button
          class="btn btn-primary btn-hero-primary"
          @click="authActions.openAuthModal('signup')"
        >
          <LogIn :size="16" />
          <span>Sign In / Create Free Account</span>
          <ArrowRight :size="15" />
        </button>

        <button
          class="btn btn-secondary btn-hero-secondary"
          @click="actions.openAgentChatModal()"
        >
          <Sparkles :size="16" style="color: var(--primary)" />
          <span>Launch AI Copilot</span>
        </button>
      </div>

      <!-- Quick Highlights Bar -->
      <div class="hero-highlights-strip">
        <div class="highlight-item">
          <ShieldCheck :size="16" class="hl-icon" />
          <span>Real-time Readiness Score (0–100%)</span>
        </div>
        <div class="highlight-item">
          <Clock :size="16" class="hl-icon" />
          <span>Minute-by-Minute Live Run Sheet</span>
        </div>
        <div class="highlight-item">
          <Wallet :size="16" class="hl-icon" />
          <span>Multi-Currency Minor-Unit Budget</span>
        </div>
        <div class="highlight-item">
          <Users :size="16" class="hl-icon" />
          <span>Dietary & RSVP Hospitality Suite</span>
        </div>
      </div>
    </section>

    <!-- Interactive Example Carousel Section -->
    <section
      class="carousel-section"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <div class="section-header-row">
        <div>
          <span class="section-tag-badge">INTERACTIVE EXAMPLE SHOWCASE</span>
          <h2 class="section-heading">Explore Real Celebration Plans & AI Execution</h2>
          <p class="section-description">
            Cycle through realistic celebration templates and see how PlanCraft handles complex timelines, budgets, and AI workflows.
          </p>
        </div>

        <!-- Carousel Navigation Controls -->
        <div class="carousel-nav-arrows">
          <button
            class="btn-carousel-arrow"
            @click="prevSlide"
            title="Previous example"
            aria-label="Previous slide"
          >
            <ChevronLeft :size="20" />
          </button>
          <button
            class="btn-carousel-arrow"
            @click="nextSlide"
            title="Next example"
            aria-label="Next slide"
          >
            <ChevronRight :size="20" />
          </button>
        </div>
      </div>

      <!-- The Carousel Card -->
      <div class="carousel-slider-window">
        <div
          v-for="(slide, index) in slides"
          :key="slide.id"
          class="carousel-slide-card"
          :class="{ active: currentSlide === index }"
        >
          <div class="slide-header">
            <div class="slide-tag-group">
              <span
                class="slide-pill"
                :style="{ background: slide.badgeBg, color: slide.badgeColor }"
              >
                {{ slide.tag }}
              </span>
              <span class="slide-theme-text">{{ slide.theme }}</span>
            </div>
            <div class="slide-counter">
              Example {{ index + 1 }} of {{ slides.length }}
            </div>
          </div>

          <div class="slide-content-grid">
            <div class="slide-left-col">
              <h3 class="slide-title">{{ slide.title }}</h3>
              <p class="slide-subtitle">{{ slide.subtitle }}</p>

              <!-- Stats Row -->
              <div class="slide-stats-grid">
                <div
                  v-for="(st, sIdx) in slide.stats"
                  :key="sIdx"
                  class="slide-stat-box"
                >
                  <div class="stat-value">{{ st.value }}</div>
                  <div class="stat-label">{{ st.label }}</div>
                  <div v-if="st.hint" class="stat-hint">{{ st.hint }}</div>
                </div>
              </div>
            </div>

            <div class="slide-right-col">
              <div class="highlights-card">
                <div class="highlights-title">
                  <Zap :size="15" style="color: var(--primary)" />
                  <span>Key Workflow Highlights:</span>
                </div>
                <ul class="highlights-list">
                  <li v-for="(hl, hIdx) in slide.keyHighlights" :key="hIdx">
                    <Check :size="15" class="check-icon" />
                    <span>{{ hl }}</span>
                  </li>
                </ul>

                <button
                  class="btn btn-primary btn-slide-action"
                  @click="handleSlideCta(slide)"
                >
                  <span>{{ slide.ctaLabel }}</span>
                  <ArrowRight :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dots Indicators -->
      <div class="carousel-dots-row">
        <button
          v-for="(_, dIdx) in slides"
          :key="dIdx"
          class="dot-indicator"
          :class="{ active: currentSlide === dIdx }"
          @click="goToSlide(dIdx)"
          :aria-label="`Go to slide ${dIdx + 1}`"
        ></button>
      </div>
    </section>

    <!-- All Features Grid Section -->
    <section class="features-section">
      <div class="features-header-center">
        <span class="section-tag-badge">COMPREHENSIVE FEATURE STUDIO</span>
        <h2 class="section-heading">Everything You Need For Flawless Events</h2>
        <p class="section-description" style="max-width: 680px; margin: 0 auto">
          Nine specialized planning modules engineered to coordinate every phase — from initial budget calculation and milestone checklists to live event-day run sheets.
        </p>
      </div>

      <!-- Feature Cards Grid -->
      <div class="features-grid">
        <div
          v-for="feat in featureCards"
          :key="feat.id"
          class="feature-card"
        >
          <div class="feature-card-top">
            <div
              class="feature-icon-box"
              :style="{ background: feat.iconBg, color: feat.iconColor }"
            >
              <component :is="feat.icon" :size="22" />
            </div>
            <span class="feature-tag-chip">{{ feat.tag }}</span>
          </div>

          <h3 class="feature-title">{{ feat.title }}</h3>
          <p class="feature-desc">{{ feat.description }}</p>

          <ul class="feature-bullets">
            <li v-for="(b, bIdx) in feat.bullets" :key="bIdx">
              <Check :size="14" class="bullet-check" />
              <span>{{ b }}</span>
            </li>
          </ul>

          <div class="feature-card-footer">
            <button
              class="btn-feature-cta"
              @click="feat.action()"
            >
              <span>{{ feat.ctaText }}</span>
              <ArrowRight :size="13" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works-section">
      <h3 class="how-title">How PlanCraft Orchestrates Your Event</h3>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-num">1</div>
          <div class="step-heading">Create Celebration</div>
          <p class="step-desc">Pick your event type (Wedding, Birthday, Gala, Custom) and set guest targets and dates.</p>
        </div>
        <div class="step-card">
          <div class="step-num">2</div>
          <div class="step-heading">AI Generates Plan</div>
          <p class="step-desc">Google ADK Copilot automatically seeds phased milestones, budget targets, and contracts.</p>
        </div>
        <div class="step-card">
          <div class="step-num">3</div>
          <div class="step-heading">Coordinate Vendors & RSVPs</div>
          <p class="step-desc">Track advance deposits, dietary meal requirements, and monitor real-time readiness.</p>
        </div>
        <div class="step-card">
          <div class="step-num">4</div>
          <div class="step-heading">Live Run Sheet Execution</div>
          <p class="step-desc">On event day, track minute-by-minute activities with instant delay shifting and lead hotlines.</p>
        </div>
      </div>
    </section>

    <!-- Bottom Sign-In Banner CTA -->
    <section class="bottom-cta-banner">
      <div class="cta-banner-content">
        <div class="cta-text-side">
          <div class="cta-pill">
            <PartyPopper :size="14" />
            <span>CLOUD SYNC & SECURE AUTHENTICATION</span>
          </div>
          <h2 class="cta-banner-title">Ready to Craft an Unforgettable Event?</h2>
          <p class="cta-banner-desc">
            Sign in with your Google account or create a username/password account to access all 9 planning studios, save your events to Cloud Firestore, and collaborate with our Google ADK Copilot.
          </p>
        </div>

        <div class="cta-buttons-side">
          <button
            class="btn btn-primary btn-cta-large"
            @click="authActions.openAuthModal('signin')"
          >
            <LogIn :size="18" />
            <span>Sign In to PlanCraft</span>
          </button>
          <button
            class="btn btn-secondary btn-cta-secondary"
            @click="authActions.openAuthModal('signup')"
          >
            <span>Create New Account</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.guest-home-container {
  display: flex;
  flex-direction: column;
  gap: 36px;
  padding: 10px 0 40px;
}

/* ---------------- Hero Section ---------------- */
.guest-hero-section {
  text-align: center;
  padding: 44px 20px 32px;
  background: radial-gradient(circle at 50% 10%, rgba(255, 96, 130, 0.14) 0%, rgba(178, 108, 255, 0.1) 40%, rgba(252, 250, 253, 0) 70%), var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #FFE4F6;
  border: 1px solid #E8C1F0;
  color: #705EFF;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 5px 14px;
  border-radius: var(--radius-full);
  margin-bottom: 18px;
}

.sparkle-icon {
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.15); }
}

.guest-hero-title {
  font-size: 2.45rem;
  font-weight: 850;
  color: var(--text-main);
  line-height: 1.2;
  letter-spacing: -0.02em;
  max-width: 820px;
  margin-bottom: 16px;
}

.gradient-text {
  background: linear-gradient(135deg, #FF6082 0%, #B26CFF 50%, #705EFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.guest-hero-subtitle {
  font-size: 1.02rem;
  color: var(--text-muted);
  max-width: 720px;
  line-height: 1.6;
  margin-bottom: 28px;
}

.guest-hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.btn-hero-primary {
  padding: 12px 24px;
  font-size: 0.96rem;
  font-weight: 700;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(255, 96, 130, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-hero-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(255, 96, 130, 0.5);
}

.btn-hero-secondary {
  padding: 12px 22px;
  font-size: 0.96rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  background: white;
  border: 1px solid var(--surface-border-strong);
}

.hero-highlights-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  padding-top: 20px;
  border-top: 1px solid var(--surface-border);
  width: 100%;
  max-width: 900px;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
}

.hl-icon {
  color: var(--primary);
  flex-shrink: 0;
}

/* ---------------- Carousel Section ---------------- */
.carousel-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.section-tag-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--primary);
  background: var(--primary-light);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  margin-bottom: 8px;
}

.section-heading {
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.section-description {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.carousel-nav-arrows {
  display: flex;
  gap: 8px;
}

.btn-carousel-arrow {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: white;
  border: 1px solid var(--surface-border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-main);
  box-shadow: var(--shadow-sm);
  transition: all 0.15s ease;
}

.btn-carousel-arrow:hover {
  background: var(--surface-subtle);
  border-color: var(--primary);
  color: var(--primary);
}

.carousel-slider-window {
  position: relative;
  min-height: 380px;
}

.carousel-slide-card {
  display: none;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-md);
  animation: fadeInSlide 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.carousel-slide-card.active {
  display: block;
}

@keyframes fadeInSlide {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--surface-border);
  flex-wrap: wrap;
  gap: 12px;
}

.slide-tag-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slide-pill {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
}

.slide-theme-text {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
}

.slide-counter {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-light);
}

.slide-content-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 28px;
  align-items: center;
}

@media (max-width: 900px) {
  .slide-content-grid {
    grid-template-columns: 1fr;
  }
}

.slide-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 8px;
}

.slide-subtitle {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 20px;
}

.slide-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.slide-stat-box {
  background: var(--surface-subtle);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
}

.stat-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--primary);
}

.stat-label {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--text-main);
  margin-top: 2px;
}

.stat-hint {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.highlights-card {
  background: linear-gradient(145deg, #f0fdfa 0%, #ffffff 100%);
  border: 1px solid rgba(15, 118, 110, 0.2);
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.highlights-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--text-main);
}

.highlights-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.highlights-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.check-icon {
  color: var(--primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.btn-slide-action {
  width: 100%;
  padding: 10px 14px;
  font-size: 0.88rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.carousel-dots-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 6px;
}

.dot-indicator {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--surface-border-strong);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dot-indicator.active {
  width: 28px;
  background: var(--primary);
}

/* ---------------- Features Grid ---------------- */
.features-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.features-header-center {
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.feature-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  padding: 22px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary);
}

.feature-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.feature-icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-tag-chip {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--surface-subtle);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}

.feature-title {
  font-size: 1.12rem;
  font-weight: 750;
  color: var(--text-main);
  margin-bottom: 6px;
}

.feature-desc {
  font-size: 0.83rem;
  color: var(--text-muted);
  line-height: 1.45;
  margin-bottom: 14px;
  flex: 1;
}

.feature-bullets {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
}

.feature-bullets li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-main);
}

.bullet-check {
  color: var(--primary);
  flex-shrink: 0;
}

.feature-card-footer {
  border-top: 1px solid var(--surface-subtle);
  padding-top: 12px;
}

.btn-feature-cta {
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 0.82rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 0;
  transition: gap 0.15s ease;
}

.btn-feature-cta:hover {
  gap: 9px;
  text-decoration: underline;
}

/* ---------------- How It Works ---------------- */
.how-it-works-section {
  background: var(--surface-subtle);
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  border: 1px solid var(--surface-border);
}

.how-title {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 22px;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 18px;
}

.step-card {
  background: white;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: 18px;
  position: relative;
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 800;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.step-heading {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 4px;
}

.step-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.4;
}

/* ---------------- Bottom CTA Banner ---------------- */
.bottom-cta-banner {
  background: linear-gradient(135deg, #1C0F2B 0%, #2A123D 50%, #151136 100%);
  border: 1px solid rgba(178, 108, 255, 0.3);
  color: white;
  border-radius: var(--radius-lg);
  padding: 36px 32px;
  box-shadow: var(--shadow-lg);
}

.cta-banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.cta-text-side {
  max-width: 640px;
}

.cta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.cta-banner-title {
  font-size: 1.85rem;
  font-weight: 850;
  color: white;
  line-height: 1.25;
  margin-bottom: 10px;
}

.cta-banner-desc {
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
}

.cta-buttons-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 220px;
}

.btn-cta-large {
  background: white;
  color: var(--primary);
  font-size: 0.95rem;
  font-weight: 800;
  padding: 12px 22px;
  border: none;
  justify-content: center;
}

.btn-cta-large:hover {
  background: #f8fafc;
  color: var(--primary-hover);
}

.btn-cta-secondary {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 0.9rem;
  font-weight: 700;
  padding: 10px 18px;
  justify-content: center;
}

.btn-cta-secondary:hover {
  background: rgba(255, 255, 255, 0.25);
}

@media (max-width: 768px) {
  .guest-hero-title {
    font-size: 1.85rem;
  }
  .bottom-cta-banner {
    padding: 24px 20px;
  }
}
</style>
