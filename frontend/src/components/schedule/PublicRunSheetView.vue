<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  state,
  actions,
  getPublicRunSheetUrl,
} from '../../stores/eventStore';
import { INITIAL_EVENTS } from '../../data/initialData';
import { authState } from '../../stores/authStore';
import {
  Clock,
  Calendar,
  MapPin,
  User,
  Phone,
  Share2,
  Copy,
  Check,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ShieldAlert,
  Hash,
  Zap,
} from 'lucide-vue-next';
import { runSheetWsService } from '../../services/websocket.service';

const props = defineProps<{
  eventId: string;
}>();

const currentTime = ref('');
const copied = ref(false);
const isRefreshing = ref(false);
let timer: any = null;

function updateTime() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('en-IN', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

onMounted(async () => {
  updateTime();
  timer = setInterval(updateTime, 1000);
  if (props.eventId) {
    await actions.loadEventForPublicRunSheet(props.eventId);
  }
  const targetRoom = event.value.runSheetHashCode || props.eventId || event.value.id;
  runSheetWsService.connect(targetRoom, {
    onDelay: (data) => {
      actions.reportScheduleDelay(data.activity_id, data.delay_minutes, { fromWs: true });
    },
    onStatus: (data) => {
      actions.updateScheduleStatus(data.activity_id, data.status as any, { fromWs: true });
    },
    onLaunch: (data) => {
      actions.handleWsRunSheetLaunched(targetRoom, data.is_launched, data.hash_code);
    },
    onSync: (data) => {
      actions.handleWsActivitiesSynced(targetRoom, data.schedule);
    },
  });
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  runSheetWsService.disconnect();
});

const event = computed(() => {
  return (
    state.events.find((e) => e.id === props.eventId || e.runSheetHashCode === props.eventId) ||
    INITIAL_EVENTS.find((e) => e.id === props.eventId || e.runSheetHashCode === props.eventId) ||
    state.events[0] || {
      id: props.eventId,
      name: 'Event Run Sheet',
      eventType: 'wedding',
      startDate: new Date().toISOString().split('T')[0],
      venueName: 'The Leela Palace, Bengaluru',
      venueAddress: 'HAL Old Airport Rd, Bengaluru',
      timeZone: 'Asia/Kolkata',
      expectedGuestCount: 150,
      plannedBudgetMinor: 0,
      currency: 'INR',
      status: 'in_progress',
      isRunSheetLaunched: true,
      runSheetHashCode: 'rs-priya-rahul-9a8f',
      createdAt: new Date().toISOString(),
    }
  );
});

const isLaunched = computed(() => {
  return !!event.value.isRunSheetLaunched;
});

const isOwner = computed(() => {
  return !!authState.user;
});

const activities = computed(() => {
  const targetId = props.eventId || event.value.id;
  return state.schedule
    .filter((s) => s.eventId === targetId)
    .slice()
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
});

const publicUrl = computed(() => {
  return getPublicRunSheetUrl(props.eventId || event.value.id);
});

const hashUrlCode = computed(() => {
  const code = event.value.runSheetHashCode || props.eventId || event.value.id;
  return `#/runsheet/${code}`;
});

const totalActivities = computed(() => activities.value.length);
const completedActivities = computed(
  () => activities.value.filter((a) => a.status === 'completed').length
);
const delayedActivities = computed(
  () => activities.value.filter((a) => (a.delayMinutes || 0) > 0 && a.status !== 'completed').length
);

const progressPercent = computed(() => {
  if (totalActivities.value === 0) return 0;
  return Math.round((completedActivities.value / totalActivities.value) * 100);
});

const activeOrNextActivity = computed(() => {
  const pending = activities.value.filter((a) => a.status !== 'completed');
  return pending[0] || null;
});

async function copyUrl() {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(publicUrl.value);
    }
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2500);
  } catch (err) {
    console.warn('Clipboard write failed:', err);
  }
}

async function shareUrl() {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `${event.value.name} — Live Run Sheet`,
        text: `Watch the live itinerary, ceremony timings, and schedule updates for ${event.value.name}.`,
        url: publicUrl.value,
      });
      return;
    } catch {
      // Fallback to copy if user dismisses or share fails
    }
  }
  await copyUrl();
}

async function handleRefresh() {
  isRefreshing.value = true;
  await actions.loadEventForPublicRunSheet(props.eventId);
  setTimeout(() => {
    isRefreshing.value = false;
  }, 600);
}

function handleCoordinatorDelay(actId: string, mins: number) {
  actions.reportScheduleDelay(actId, mins);
}

function handleCoordinatorDone(actId: string) {
  actions.updateScheduleStatus(actId, 'completed');
}

function handleLaunchLive() {
  actions.launchRunSheet(event.value.id);
}

function returnToPlanner() {
  actions.closePublicRunSheet();
  actions.setActiveTab('schedule');
}
</script>

<template>
  <div class="public-runsheet-wrapper">
    <!-- Top Organizer Bar (Only visible when logged-in owner/organizer is viewing) -->
    <div v-if="isOwner" class="organizer-top-banner">
      <div class="organizer-banner-content">
        <span class="organizer-crown">👑</span>
        <div>
          <strong>EVENT ORGANIZER MODE:</strong>
          <span>
            {{ isLaunched ? ' Viewing Live Run Sheet' : ' Run Sheet is NOT Launched yet (Offline to attendees)' }}
          </span>
        </div>
      </div>
      <div class="organizer-banner-actions">
        <button
          v-if="!isLaunched"
          class="btn btn-xs btn-launch-now"
          @click="handleLaunchLive"
        >
          🚀 Launch Live to Guests
        </button>
        <button
          class="btn btn-xs btn-exit-planner"
          @click="returnToPlanner"
        >
          ← Return to Full Planner (All Features)
        </button>
      </div>
    </div>

    <!-- Top Floating Navigation (Compact, No Back or Exit buttons) -->
    <header class="public-header-bar">
      <div class="header-left">
        <div class="live-pill" :class="{ 'unlaunched-pill': !isLaunched }">
          <span class="pulse-dot" :class="{ 'amber-dot': !isLaunched }"></span>
          <span>{{ isLaunched ? 'LIVE RUN SHEET' : 'STANDBY MODE' }}</span>
        </div>

        <div class="hash-badge" title="Dynamic Hash Code">
          <Hash :size="12" class="hash-icon" />
          <span>{{ hashUrlCode }}</span>
        </div>

        <div
          class="ws-badge"
          :class="{
            'ws-connected': runSheetWsService.isConnected.value,
            'ws-connecting': runSheetWsService.isConnecting.value,
          }"
          :title="runSheetWsService.isConnected.value ? 'Live WebSocket real-time broadcast connected' : 'Connecting to live WebSocket status server'"
        >
          <Zap :size="11" class="ws-icon" />
          <span>{{ runSheetWsService.isConnected.value ? 'WS LIVE' : 'WS CONNECTING' }}</span>
        </div>
      </div>

      <div class="header-right">
        <!-- Compact IST Clock in Header -->
        <div class="header-clock">
          <Clock :size="13" class="clock-icon" />
          <span class="clock-text">{{ currentTime || 'LIVE' }}</span>
        </div>

        <button
          class="btn btn-secondary btn-sm compact-btn"
          :class="{ 'btn-loading': isRefreshing }"
          @click="handleRefresh"
          title="Sync schedule updates"
        >
          <RefreshCw :size="13" :class="{ spinning: isRefreshing }" />
          <span class="hide-mobile">Sync</span>
        </button>

        <button
          v-if="isLaunched || isOwner"
          class="btn btn-primary btn-sm share-btn compact-btn"
          @click="shareUrl"
          title="Share dynamic hash URL with guests"
        >
          <component :is="copied ? Check : Share2" :size="13" />
          <span>{{ copied ? 'Copied' : 'Share' }}</span>
        </button>
      </div>
    </header>

    <!-- Main Compact Content Container -->
    <div class="public-content-container">
      <!-- Unlaunched Standby State for Public Attendees -->
      <section v-if="!isLaunched && !isOwner" class="unlaunched-guest-card">
        <div class="standby-icon-wrapper">
          <Radio :size="36" class="standby-pulse" />
        </div>
        <h2 class="standby-title">Live Run Sheet Not Launched Yet</h2>
        <p class="standby-message">
          The event coordinator for <strong>{{ event.name }}</strong> has not launched the live run sheet.
        </p>
        <div class="standby-details">
          <div class="standby-row">
            <Calendar :size="16" />
            <span>Event Date: <strong>{{ event.startDate }}</strong></span>
          </div>
          <div class="standby-row">
            <MapPin :size="16" />
            <span>Venue: <strong>{{ event.venueName }}</strong></span>
          </div>
        </div>
        <p class="standby-hint">
          Ceremony schedules, coordinator contacts, and live delay tracking will appear here automatically when the ceremony begins.
        </p>
        <button class="btn btn-secondary btn-sm" @click="handleRefresh">
          <RefreshCw :size="14" :class="{ spinning: isRefreshing }" />
          <span>Check Again / Sync</span>
        </button>
      </section>

      <!-- Full Run Sheet Timeline (When Launched OR Organizer Preview) -->
      <template v-else>
        <!-- Offline Warning for Organizer -->
        <div v-if="!isLaunched && isOwner" class="organizer-offline-alert">
          <AlertTriangle :size="16" />
          <span>Attendees currently see a Standby Screen until you click <strong>🚀 Launch Live to Guests</strong> above.</span>
        </div>

        <!-- Compact Event Hero Card -->
        <section class="event-hero-compact">
        <div class="hero-main-row">
          <div class="hero-title-area">
            <div class="event-badge-tag">
              <Radio :size="12" class="pulse-icon" />
              <span>OFFICIAL CEREMONY ITINERARY</span>
            </div>
            <h1 class="event-title">{{ event.name }}</h1>
          </div>

          <!-- Compact Meta Tags Bar -->
          <div class="compact-meta-row">
            <span class="meta-tag">
              <Calendar :size="13" class="tag-icon" />
              <span>{{ event.startDate }}</span>
            </span>
            <span class="meta-tag">
              <MapPin :size="13" class="tag-icon" />
              <span>{{ event.venueName || (event as any).location || 'The Leela Palace, Bengaluru' }}</span>
            </span>
            <span class="meta-tag">
              <Clock :size="13" class="tag-icon" />
              <span>{{ completedActivities }}/{{ totalActivities }} Done</span>
            </span>
            <span class="meta-tag hash-tag hide-mobile">
              <Hash :size="12" class="tag-icon" />
              <span>{{ hashUrlCode }}</span>
            </span>
          </div>
        </div>

        <!-- Sleek Single-Line Share Bar -->
        <div class="compact-share-bar">
          <span class="share-prefix">Dynamic URL:</span>
          <input
            type="text"
            class="share-input-compact"
            readonly
            :value="publicUrl"
            @focus="($event.target as HTMLInputElement)?.select()"
          />
          <button
            class="btn btn-secondary btn-xs copy-btn-compact"
            @click="copyUrl"
          >
            <component :is="copied ? Check : Copy" :size="12" />
            <span>{{ copied ? 'Copied' : 'Copy' }}</span>
          </button>
        </div>
      </section>

      <!-- Compact Spotlight Card with Visual Progress & Curve to Next -->
      <section v-if="activeOrNextActivity" class="spotlight-compact">
        <div class="spotlight-top">
          <div class="spotlight-badge">
            <span class="beacon-dot"></span>
            <span>NEXT / HAPPENING NOW</span>
          </div>
          <span class="spotlight-timing">
            ⏰ {{ activeOrNextActivity.startTime }} – {{ activeOrNextActivity.endTime }}
          </span>
        </div>

        <div class="spotlight-row">
          <h2 class="spotlight-name">{{ activeOrNextActivity.activityName }}</h2>
          <div class="spotlight-meta-tags">
            <span>📍 {{ activeOrNextActivity.location }}</span>
            <span>👤 Lead: {{ activeOrNextActivity.responsiblePerson }}</span>
            <a v-if="activeOrNextActivity.phone" :href="'tel:' + activeOrNextActivity.phone" class="spotlight-phone">
              📞 {{ activeOrNextActivity.phone }}
            </a>
          </div>
        </div>

        <div v-if="activeOrNextActivity.delayMinutes > 0" class="compact-delay-alert">
          <AlertTriangle :size="14" />
          <span>Running <strong>+{{ activeOrNextActivity.delayMinutes }}m behind schedule</strong></span>
        </div>

        <!-- Compact Progress Bar -->
        <div class="compact-progress-wrap">
          <div class="progress-labels">
            <span>Event Timeline Progress</span>
            <span>{{ completedActivities }} of {{ totalActivities }} Completed ({{ progressPercent }}%)</span>
          </div>
          <div class="progress-track-compact">
            <div class="progress-fill-compact" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
      </section>

      <!-- Compact Timeline Section -->
      <section class="timeline-compact-section">
        <div class="timeline-compact-header">
          <h3 class="timeline-title">
            <Clock :size="16" style="color: #B26CFF" />
            <span>Ceremony Sequence Timeline</span>
          </h3>
          <div class="timeline-pills-row">
            <span class="pill-sm pill-done">{{ completedActivities }} Done</span>
            <span v-if="delayedActivities > 0" class="pill-sm pill-delayed">{{ delayedActivities }} Delayed</span>
            <span class="pill-sm pill-pending">{{ totalActivities - completedActivities }} Upcoming</span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="activities.length === 0" class="empty-state-compact">
          <Clock :size="28" style="color: #B26CFF; margin-bottom: 6px" />
          <p>No ceremonies scheduled yet for this event.</p>
        </div>

        <!-- Timeline Activities with Visual Curve Line pointing to NEXT -->
        <div v-else class="timeline-list">
          <!-- Continuous Vertical Spine Rail -->
          <div class="timeline-spine"></div>

          <div
            v-for="(act, idx) in activities"
            :key="act.id"
            class="timeline-row-item"
            :class="{
              'is-completed': act.status === 'completed',
              'is-delayed': (act.delayMinutes || 0) > 0 && act.status !== 'completed',
              'is-next': act.id === activeOrNextActivity?.id && act.status !== 'completed',
            }"
          >
            <!-- Timeline Node Bullet -->
            <div class="timeline-node">
              <span v-if="act.status === 'completed'" class="node-check">✓</span>
              <span v-else-if="act.id === activeOrNextActivity?.id" class="node-pulse"></span>
              <span v-else class="node-num">{{ idx + 1 }}</span>
            </div>

            <!-- VISUAL CURVE LINE: Smooth Bezier Connector pointing to Next Ceremony -->
            <div
              v-if="act.id === activeOrNextActivity?.id && act.status !== 'completed'"
              class="next-curve-indicator"
            >
              <svg class="curve-svg" viewBox="0 0 100 36" fill="none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="curveNextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#705EFF" />
                    <stop offset="50%" stop-color="#B26CFF" />
                    <stop offset="100%" stop-color="#FF6082" />
                  </linearGradient>
                </defs>
                <!-- Curved bezier line branching from spine to card -->
                <path
                  d="M 2 4 C 18 4, 24 28, 52 28 L 94 28"
                  stroke="url(#curveNextGrad)"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-dasharray="4 3"
                />
                <circle cx="94" cy="28" r="3.5" fill="#FF6082" class="curve-beacon-dot" />
              </svg>

              <div class="next-floating-tag">
                <span class="beacon-glow"></span>
                <span>NEXT UP</span>
              </div>
            </div>

            <!-- Compact Activity Card Content -->
            <div class="compact-act-card">
              <div class="card-top-strip">
                <div class="time-sequence-pill">
                  <span class="seq-num">#{{ idx + 1 }}</span>
                  <span class="time-val">{{ act.startTime }} – {{ act.endTime }}</span>
                </div>

                <!-- Status Badge -->
                <span v-if="act.status === 'completed'" class="status-badge badge-done">
                  <CheckCircle2 :size="12" />
                  <span>Completed</span>
                </span>
                <span v-else-if="act.delayMinutes > 0" class="status-badge badge-delayed">
                  <AlertTriangle :size="12" />
                  <span>+{{ act.delayMinutes }}m Delay</span>
                </span>
                <span v-else-if="act.id === activeOrNextActivity?.id" class="status-badge badge-next">
                  <span class="mini-live-dot"></span>
                  <span>Happening Now</span>
                </span>
                <span v-else class="status-badge badge-upcoming">
                  Upcoming
                </span>
              </div>

              <!-- Ceremony Name -->
              <h4 class="act-title">{{ act.activityName }}</h4>

              <!-- Inline Compact Metadata Badges -->
              <div class="act-compact-meta">
                <span class="act-meta-item">
                  <MapPin :size="12" class="item-icon" />
                  <span>{{ act.location }}</span>
                </span>
                <span class="act-meta-item">
                  <User :size="12" class="item-icon" />
                  <span>{{ act.responsiblePerson }}</span>
                </span>
                <span v-if="act.phone" class="act-meta-item">
                  <Phone :size="12" class="item-icon" />
                  <a :href="'tel:' + act.phone" class="phone-link">{{ act.phone }}</a>
                </span>
              </div>

              <div v-if="act.notes" class="act-notes-compact">
                💡 {{ act.notes }}
              </div>

              <!-- Logged-in Coordinator Quick Actions (compact) -->
              <div v-if="authState.user" class="coordinator-compact-row">
                <span class="coord-label">Coordinator:</span>
                <div class="coord-btns">
                  <button
                    v-if="act.status !== 'completed'"
                    class="btn btn-xs delay-btn"
                    @click="handleCoordinatorDelay(act.id, 15)"
                  >
                    +15m Delay
                  </button>
                  <button
                    v-if="act.status !== 'completed'"
                    class="btn btn-xs done-btn"
                    @click="handleCoordinatorDone(act.id)"
                  >
                    ✓ Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Compact Concierge Footer (No Back/Exit buttons) -->
      <footer class="public-footer-compact">
        <div class="concierge-row">
          <ShieldAlert :size="16" style="color: #EF4444; flex-shrink: 0" />
          <div class="concierge-text">
            <span>Help Desk: <strong>+91 80 6660 5678</strong></span>
            <span class="divider">|</span>
            <span>Coordinator: <strong>{{ activities[0]?.phone || '+91 98450 12345' }}</strong></span>
          </div>
        </div>
        <div class="sync-disclaimer">
          Live schedule automatically synchronizes in real time as the event progresses.
        </div>
      </footer>
      </template>
    </div>
  </div>
</template>

<style scoped>
.public-runsheet-wrapper {
  min-height: 100vh;
  background-color: #0F081D;
  color: #F8FAFC;
  font-family: inherit;
  padding-bottom: 40px;
}

/* Organizer Top Bar (Exclusive to event owner / logged-in coordinator) */
.organizer-top-banner {
  background: linear-gradient(135deg, #1C0F2B 0%, #2A123D 100%);
  border-bottom: 1px solid rgba(178, 108, 255, 0.35);
  color: #FFE4F6;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 0.8rem;
  z-index: 60;
  position: relative;
}

.organizer-banner-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.organizer-crown {
  font-size: 1.1rem;
}

.organizer-banner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-launch-now {
  background: linear-gradient(135deg, #FF6082 0%, #B26CFF 100%);
  color: white;
  border: none;
  font-weight: 700;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 0.78rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(255, 96, 130, 0.35);
  transition: all 0.2s;
}

.btn-launch-now:hover {
  background: linear-gradient(135deg, #E84D70 0%, #9F54EE 100%);
}

.btn-exit-planner {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-weight: 600;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-exit-planner:hover {
  background: rgba(255, 255, 255, 0.25);
}

.organizer-offline-alert {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #FBBF24;
  border-radius: 8px;
  padding: 8px 14px;
  margin-bottom: 12px;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Standby Screen for Unlaunched Public Attendees */
.unlaunched-guest-card {
  max-width: 520px;
  margin: 60px auto 40px;
  background: #180D2B;
  border: 1px solid rgba(178, 108, 255, 0.3);
  border-radius: 16px;
  padding: 36px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}

.standby-icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 96, 130, 0.12);
  border: 2px solid rgba(255, 96, 130, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FF6082;
}

.standby-pulse {
  animation: pulse 2s infinite ease-in-out;
}

.standby-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0;
}

.standby-message {
  font-size: 0.92rem;
  color: #9C8EAE;
  line-height: 1.5;
  margin: 0;
}

.standby-details {
  background: #1C0F2B;
  border: 1px solid rgba(178, 108, 255, 0.25);
  border-radius: 10px;
  padding: 12px 18px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.85rem;
  color: #E2CFE9;
  text-align: left;
}

.standby-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.standby-hint {
  font-size: 0.8rem;
  color: #6C5D80;
  margin: 0;
}

.unlaunched-pill {
  background: rgba(255, 96, 130, 0.15) !important;
  color: #FF6082 !important;
  border-color: rgba(255, 96, 130, 0.35) !important;
}

.amber-dot {
  background: #FF6082 !important;
  box-shadow: 0 0 6px #FF6082 !important;
}

/* Compact Sticky Top Bar (No Exit / Back button) */
.public-header-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(28, 15, 43, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(178, 108, 255, 0.25);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.live-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(16, 185, 129, 0.15);
  color: #34D399;
  border: 1px solid rgba(16, 185, 129, 0.35);
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  background-color: #10B981;
  border-radius: 50%;
  box-shadow: 0 0 6px #10B981;
  animation: pulse-ring 1.8s infinite;
}

.hash-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #1C0F2B;
  color: #FFE4F6;
  border: 1px solid rgba(178, 108, 255, 0.3);
  padding: 2px 7px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.72rem;
  font-weight: 600;
}

.hash-icon {
  color: #B26CFF;
}

.ws-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(178, 108, 255, 0.15);
  color: #FFE4F6;
  border: 1px solid rgba(178, 108, 255, 0.35);
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  transition: all 0.2s;
}

.ws-badge.ws-connected {
  background: rgba(16, 185, 129, 0.12);
  color: #34D399;
  border-color: rgba(16, 185, 129, 0.35);
}

.ws-badge.ws-connecting {
  background: rgba(245, 158, 11, 0.12);
  color: #FBBF24;
  border-color: rgba(245, 158, 11, 0.35);
}

.ws-icon {
  flex-shrink: 0;
}

.header-clock {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #140A22;
  border: 1px solid rgba(178, 108, 255, 0.3);
  padding: 3px 8px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.78rem;
  font-weight: 700;
  color: #FFE4F6;
}

.clock-icon {
  color: #B26CFF;
}

.compact-btn {
  padding: 4px 10px;
  font-size: 0.75rem;
  gap: 4px;
}

.share-btn {
  background: linear-gradient(135deg, #FF6082 0%, #B26CFF 100%);
  border: none;
}

/* Content Container */
.public-content-container {
  max-width: 840px;
  margin: 0 auto;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Compact Hero Card */
.event-hero-compact {
  background: linear-gradient(135deg, #1C0F2B 0%, #251338 50%, #151136 100%);
  border: 1px solid rgba(178, 108, 255, 0.3);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hero-main-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;
}

.event-badge-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 800;
  color: #FF6082;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.event-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #FFFFFF;
  margin: 0;
  line-height: 1.2;
}

.compact-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #140A22;
  border: 1px solid rgba(178, 108, 255, 0.25);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 0.74rem;
  color: #E2CFE9;
}

.hash-tag {
  color: #B26CFF;
  font-family: monospace;
}

.tag-icon {
  color: #FF6082;
}

.compact-share-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #140A22;
  border: 1px solid rgba(178, 108, 255, 0.25);
  border-radius: 6px;
  padding: 4px 8px;
}

.share-prefix {
  font-size: 0.7rem;
  color: #9C8EAE;
  font-weight: 600;
  white-space: nowrap;
}

.share-input-compact {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #FFE4F6;
  font-family: monospace;
  font-size: 0.74rem;
}

.copy-btn-compact {
  background: #FF6082;
  color: #FFFFFF;
  border: none;
  font-weight: 700;
  font-size: 0.7rem;
  padding: 3px 9px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Spotlight Compact */
.spotlight-compact {
  background: linear-gradient(135deg, #25123A 0%, #180D2B 100%);
  border: 1px solid rgba(255, 96, 130, 0.4);
  box-shadow: 0 4px 18px rgba(255, 96, 130, 0.2);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spotlight-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
}

.spotlight-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
  color: #FF6082;
  letter-spacing: 0.05em;
}

.beacon-dot {
  width: 7px;
  height: 7px;
  background-color: #FF6082;
  border-radius: 50%;
  animation: pulse-ring 1.5s infinite;
}

.spotlight-timing {
  font-family: monospace;
  font-weight: 800;
  color: #FFE4F6;
}

.spotlight-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.spotlight-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.spotlight-meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 0.78rem;
  color: #E2CFE9;
}

.spotlight-phone {
  color: #B26CFF;
  text-decoration: none;
  font-weight: 600;
}

.compact-delay-alert {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid #EF4444;
  color: #FCA5A5;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.76rem;
}

.compact-progress-wrap {
  margin-top: 4px;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #9C8EAE;
  margin-bottom: 4px;
}

.progress-track-compact {
  height: 4px;
  background: #25173B;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill-compact {
  height: 100%;
  background: linear-gradient(90deg, #FF6082 0%, #B26CFF 50%, #705EFF 100%);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

/* Timeline Compact Section */
.timeline-compact-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.timeline-compact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.timeline-title {
  font-size: 1.05rem;
  color: #F1F5F9;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

.timeline-pills-row {
  display: flex;
  gap: 6px;
}

.pill-sm {
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 700;
}

.pill-done {
  background: rgba(16, 185, 129, 0.15);
  color: #34D399;
}

.pill-delayed {
  background: rgba(239, 68, 68, 0.15);
  color: #F87171;
}

.pill-pending {
  background: rgba(178, 108, 255, 0.15);
  color: #FFE4F6;
}

/* Continuous Timeline List with Spine */
.timeline-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 28px;
}

.timeline-spine {
  position: absolute;
  left: 10px;
  top: 8px;
  bottom: 12px;
  width: 2px;
  background: rgba(178, 108, 255, 0.3);
}

.timeline-row-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Timeline Node Bullet on Spine */
.timeline-node {
  position: absolute;
  left: -28px;
  top: 10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #1C0F2B;
  border: 2px solid #5A476E;
  color: #9C8EAE;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  z-index: 2;
}

.timeline-row-item.is-completed .timeline-node {
  background: #064E3B;
  border-color: #10B981;
  color: #34D399;
}

.timeline-row-item.is-delayed .timeline-node {
  background: #451A03;
  border-color: #EF4444;
  color: #F87171;
}

.timeline-row-item.is-next .timeline-node {
  background: #25123A;
  border-color: #FF6082;
  color: #FF6082;
  box-shadow: 0 0 10px rgba(255, 96, 130, 0.5);
}

.node-pulse {
  width: 8px;
  height: 8px;
  background: #FF6082;
  border-radius: 50%;
  animation: pulse-ring 1.5s infinite;
}

/* VISUAL CURVE LINE: Smooth Bezier Connector into Next Ceremony */
.next-curve-indicator {
  position: relative;
  height: 26px;
  margin-top: -6px;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
}

.curve-svg {
  position: absolute;
  left: -20px;
  top: 0;
  width: 100px;
  height: 28px;
  overflow: visible;
  z-index: 1;
}

.curve-beacon-dot {
  animation: pulse-ring 1.5s infinite;
}

.next-floating-tag {
  margin-left: 70px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #FFE4F6;
  border: 1px solid #FF6082;
  color: #705EFF;
  padding: 1px 7px;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  box-shadow: 0 0 12px rgba(255, 96, 130, 0.35);
}

.beacon-glow {
  width: 5px;
  height: 5px;
  background: #FF6082;
  border-radius: 50%;
  animation: pulse-ring 1.2s infinite;
}

/* Compact Activity Card */
.compact-act-card {
  background: #180D2B;
  border: 1px solid rgba(178, 108, 255, 0.2);
  border-radius: 10px;
  padding: 10px 14px;
  border-left: 4px solid #705EFF;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.timeline-row-item.is-completed .compact-act-card {
  border-left-color: #10B981;
  opacity: 0.85;
}

.timeline-row-item.is-delayed .compact-act-card {
  border-left-color: #EF4444;
}

.timeline-row-item.is-next .compact-act-card {
  border-left-color: #FF6082;
  border-color: #B26CFF;
  background: linear-gradient(135deg, #221235 0%, #2A1733 100%);
  box-shadow: 0 0 14px rgba(255, 96, 130, 0.25);
}

.card-top-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-sequence-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.seq-num {
  background: rgba(178, 108, 255, 0.25);
  color: #FFE4F6;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
}

.time-val {
  font-family: monospace;
  font-size: 0.88rem;
  font-weight: 800;
  color: #FFE4F6;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.badge-done {
  background: rgba(16, 185, 129, 0.2);
  color: #34D399;
}

.badge-delayed {
  background: rgba(239, 68, 68, 0.2);
  color: #F87171;
}

.badge-next {
  background: rgba(255, 96, 130, 0.2);
  color: #FF6082;
  border: 1px solid rgba(255, 96, 130, 0.4);
}

.badge-upcoming {
  background: #25173B;
  color: #9C8EAE;
}

.mini-live-dot {
  width: 5px;
  height: 5px;
  background: #FF6082;
  border-radius: 50%;
  animation: pulse-ring 1.5s infinite;
}

.act-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
  line-height: 1.25;
}

.act-compact-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.78rem;
  color: #C3B4D2;
}

.act-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.item-icon {
  color: #B26CFF;
}

.phone-link {
  color: #B26CFF;
  text-decoration: none;
  font-weight: 600;
}

.phone-link:hover {
  text-decoration: underline;
}

.act-notes-compact {
  font-size: 0.74rem;
  color: #E2CFE9;
  font-style: italic;
  background: rgba(28, 15, 43, 0.7);
  border-radius: 4px;
  padding: 4px 8px;
  border-left: 2px solid #B26CFF;
}

/* Coordinator actions row */
.coordinator-compact-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-top: 1px solid rgba(178, 108, 255, 0.2);
  padding-top: 6px;
  margin-top: 4px;
}

.coord-label {
  font-size: 0.68rem;
  color: #C3B4D2;
  font-weight: 600;
}

.coord-btns {
  display: flex;
  gap: 6px;
}

.btn-xs {
  font-size: 0.72rem;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.delay-btn {
  background: #451A03;
  color: #F59E0B;
  border: 1px solid #78350F;
}

.done-btn {
  background: #064E3B;
  color: #34D399;
  border: 1px solid #047857;
}

/* Compact Footer (No Back/Exit buttons) */
.public-footer-compact {
  margin-top: 8px;
  background: #180D2B;
  border: 1px solid rgba(178, 108, 255, 0.25);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.76rem;
}

.concierge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #E2E8F0;
}

.concierge-text {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.divider {
  color: rgba(178, 108, 255, 0.4);
}

.sync-disclaimer {
  font-size: 0.68rem;
  color: #9C8EAE;
  text-align: center;
  border-top: 1px solid rgba(178, 108, 255, 0.2);
  padding-top: 6px;
}

.empty-state-compact {
  background: #180D2B;
  border: 1px dashed rgba(178, 108, 255, 0.3);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  color: #9C8EAE;
  font-size: 0.85rem;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse-ring {
  0% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.8; }
}

@media (max-width: 640px) {
  .hero-main-row {
    flex-direction: column;
  }
  .hide-mobile {
    display: none;
  }
}
</style>
