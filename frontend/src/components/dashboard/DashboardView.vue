<script setup lang="ts">
import {
  currentEvent,
  budgetMetrics,
  taskMetrics,
  guestMetrics,
  readinessMetrics,
  nextSteps,
  eventSchedule,
  formatCurrency,
  actions,
} from '../../stores/eventStore';
import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Users,
  Wallet,
  PlayCircle,
  ArrowRight,
  Sparkles,
  Check,
  PartyPopper,
  Plus,
} from 'lucide-vue-next';

function onToggleTask(taskId: string) {
  actions.toggleTask(taskId);
}
</script>

<template>
  <div class="dashboard-wrap">
    <!-- Empty State for Users with No Events Yet -->
    <div v-if="!currentEvent" class="card empty-dashboard-state">
      <div class="empty-icon-box">
        <PartyPopper :size="36" />
      </div>
      <h2>Welcome to PlanCraft!</h2>
      <p class="empty-subtitle">
        You don't have any celebrations created yet. Start planning your special wedding, birthday, or corporate celebration with our AI Copilot and live run sheet.
      </p>
      <button class="btn btn-primary" style="padding: 10px 20px; font-size: 0.95rem" @click="actions.openCreateEventModal()">
        <Plus :size="18" />
        <span>+ Create Your First Celebration</span>
      </button>
    </div>

    <!-- Top Greeting & Event Hero Banner (Compact & Responsive) -->
    <template v-else>
    <div class="card hero-banner">
      <div class="hero-left">
        <div class="hero-badges">
          <span class="hero-tag">
            {{ currentEvent.eventType.toUpperCase() }}
          </span>
          <span class="hero-theme">
            {{ currentEvent?.theme || 'Celebration' }}
          </span>
        </div>

        <h1 class="hero-title">
          {{ currentEvent?.name }}
        </h1>

        <div class="hero-meta">
          <div class="meta-pill">
            <Calendar :size="13" />
            <span>{{ currentEvent?.startDate }}</span>
          </div>
          <div class="meta-pill">
            <MapPin :size="13" />
            <span class="meta-truncate">{{ currentEvent?.venueName }}</span>
          </div>
          <div class="meta-pill">
            <Users :size="13" />
            <span>{{ currentEvent?.expectedGuestCount }} Guests</span>
          </div>
        </div>
      </div>

      <!-- Compact Countdown & Readiness Card -->
      <div class="hero-readiness-card">
        <div class="countdown-col">
          <div class="countdown-num">
            {{ readinessMetrics.daysUntil }}
          </div>
          <div class="countdown-txt">
            Days To Go
          </div>
        </div>

        <div class="readiness-divider"></div>

        <div class="readiness-col">
          <div class="readiness-header">
            <span>Readiness</span>
            <strong>{{ readinessMetrics.readinessScore }}%</strong>
          </div>
          <div class="progress-track" style="height: 5px; width: 100px; background: rgba(255,255,255,0.25)">
            <div
              class="progress-fill"
              style="background: #34D399"
              :style="{ width: readinessMetrics.readinessScore + '%' }"
            ></div>
          </div>
          <div class="readiness-label">
            {{ readinessMetrics.statusLabel }}
          </div>
        </div>
      </div>
    </div>

    <!-- The 5 Core Questions Grid (Compact 2x2 on Mobile, 4-col on Desktop) -->
    <div class="stats-grid">
      <!-- Q2: How much have I spent, and how much budget remains? -->
      <div class="card stat-card" @click="actions.setActiveTab('budget')">
        <div class="stat-top">
          <div>
            <div class="stat-label">Q2: Budget Health</div>
            <div class="stat-value text-primary">
              {{ formatCurrency(budgetMetrics.remainingBudgetMinor, budgetMetrics.currency) }}
            </div>
            <div class="stat-sub">Remaining buffer</div>
          </div>
          <div class="stat-icon-box bg-primary-subtle">
            <Wallet :size="16" />
          </div>
        </div>

        <div class="stat-bottom">
          <div class="progress-info">
            <span>Spent: {{ formatCurrency(budgetMetrics.actualSpentMinor, budgetMetrics.currency) }}</span>
            <strong>{{ budgetMetrics.spendPercent }}%</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill primary" :style="{ width: budgetMetrics.spendPercent + '%' }"></div>
          </div>
          <div class="stat-extra">
            <span>Due: {{ formatCurrency(budgetMetrics.outstandingAmountMinor, budgetMetrics.currency) }}</span>
          </div>
        </div>
      </div>

      <!-- Q3: Which tasks are overdue or still pending? -->
      <div class="card stat-card" @click="actions.setActiveTab('checklist')">
        <div class="stat-top">
          <div>
            <div class="stat-label">Q3: Tasks Status</div>
            <div class="stat-value" :class="taskMetrics.overdue > 0 ? 'text-danger' : 'text-main'">
              {{ taskMetrics.pending }} Pending
            </div>
            <div class="stat-sub">{{ taskMetrics.completed }} / {{ taskMetrics.total }} Done</div>
          </div>
          <div class="stat-icon-box bg-warning-subtle">
            <AlertCircle :size="16" />
          </div>
        </div>

        <div class="stat-bottom">
          <div class="badges-row">
            <span v-if="taskMetrics.overdue > 0" class="badge badge-danger">
              ⚠️ {{ taskMetrics.overdue }} Overdue
            </span>
            <span class="badge badge-warning">
              {{ taskMetrics.pending }} Pending
            </span>
          </div>
          <div class="progress-track" style="margin-top: 6px">
            <div class="progress-fill warning" :style="{ width: taskMetrics.completionPercent + '%' }"></div>
          </div>
          <div class="stat-extra">
            <span>{{ taskMetrics.completionPercent }}% checklist finished</span>
          </div>
        </div>
      </div>

      <!-- Q4: Who has confirmed attendance? -->
      <div class="card stat-card" @click="actions.setActiveTab('guests')">
        <div class="stat-top">
          <div>
            <div class="stat-label">Q4: Guest RSVPs</div>
            <div class="stat-value text-success">
              {{ guestMetrics.confirmedPax }} Confirmed
            </div>
            <div class="stat-sub">of {{ guestMetrics.totalInvitedPax }} Pax invited</div>
          </div>
          <div class="stat-icon-box bg-success-subtle">
            <Users :size="16" />
          </div>
        </div>

        <div class="stat-bottom">
          <div class="progress-info">
            <span>Pending: {{ guestMetrics.pendingPax }}</span>
            <strong style="color: var(--success)">{{ guestMetrics.confirmedPercent }}%</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill success" :style="{ width: guestMetrics.confirmedPercent + '%' }"></div>
          </div>
          <div class="stat-extra">
            <span>🥗 Veg: {{ guestMetrics.vegPax }} • 🏨 {{ guestMetrics.hotelRoomsRequired }} Rms</span>
          </div>
        </div>
      </div>

      <!-- Q5: Am I ready for the event day? -->
      <div class="card stat-card" @click="actions.openRunSheetLiveModal()">
        <div class="stat-top">
          <div>
            <div class="stat-label">Q5: Event Day Run Sheet</div>
            <div class="stat-value text-info">
              {{ readinessMetrics.statusLabel }}
            </div>
            <div class="stat-sub">{{ readinessMetrics.readyArrangements }}/{{ readinessMetrics.totalArrangements }} Setups Ready</div>
          </div>
          <div class="stat-icon-box bg-info-subtle">
            <PlayCircle :size="16" />
          </div>
        </div>

        <div class="stat-bottom">
          <button
            class="btn btn-outline btn-sm run-sheet-quick-btn"
            @click.stop="actions.openRunSheetLiveModal()"
          >
            <PlayCircle :size="13" />
            <span>Open Coordinator View</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 2 Column Section: Q1 "What Should I Do Next?" + Itinerary Sequence -->
    <div class="dashboard-split-grid">
      <!-- Q1: What should I do next? Actionable Checklist -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">
              <Sparkles :size="16" style="color: var(--primary)" />
              <span>Q1: What Should I Do Next?</span>
            </div>
            <div class="card-subtitle">
              Immediate priority actions needing your attention
            </div>
          </div>
          <button
            class="btn btn-secondary btn-sm"
            @click="actions.setActiveTab('checklist')"
          >
            <span>All Tasks</span>
            <ArrowRight :size="13" />
          </button>
        </div>

        <!-- Actionable checklist items -->
        <div class="task-list-compact">
          <div
            v-for="task in nextSteps"
            :key="task.id"
            class="task-row"
            :class="{
              'task-row-overdue': task.status === 'overdue',
              'task-row-high': task.priority === 'high' && task.status !== 'overdue',
            }"
          >
            <div class="task-left">
              <button
                @click="onToggleTask(task.id)"
                class="task-check-btn"
                :class="{ completed: task.status === 'completed' }"
              >
                <Check v-if="task.status === 'completed'" :size="12" />
              </button>

              <div class="task-content">
                <div
                  class="task-title"
                  :style="{
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    opacity: task.status === 'completed' ? 0.6 : 1,
                  }"
                >
                  {{ task.taskName }}
                </div>
                <div class="task-subtext">
                  <span>{{ task.assignedTo }}</span>
                  <span>•</span>
                  <span :class="{ 'text-danger font-bold': task.status === 'overdue' }">
                    Due: {{ task.dueDate }}
                  </span>
                  <span>•</span>
                  <span class="task-category-tag">{{ task.category }}</span>
                </div>
              </div>
            </div>

            <!-- Priority badge -->
            <div>
              <span
                v-if="task.status === 'overdue'"
                class="badge badge-danger"
              >
                OVERDUE
              </span>
              <span
                v-else-if="task.priority === 'high'"
                class="badge badge-warning"
              >
                HIGH
              </span>
              <span
                v-else
                class="badge badge-neutral"
              >
                {{ task.priority.toUpperCase() }}
              </span>
            </div>
          </div>

          <div v-if="nextSteps.length === 0" class="empty-state-p">
            🎉 All high priority tasks completed! Relax or add new tasks in the checklist.
          </div>
        </div>
      </div>

      <!-- Schedule & Run Sheet preview -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">
              <Clock :size="16" style="color: var(--primary)" />
              <span>Event Day Itinerary</span>
            </div>
            <div class="card-subtitle">
              Ceremonies sequence & responsible leads
            </div>
          </div>
          <button
            class="btn btn-secondary btn-sm"
            @click="actions.setActiveTab('schedule')"
          >
            <span>Timeline</span>
          </button>
        </div>

        <div class="itinerary-list">
          <div
            v-for="act in eventSchedule.slice(0, 4)"
            :key="act.id"
            class="itinerary-item"
          >
            <div class="itinerary-time">
              {{ act.startTime }}
            </div>

            <div class="itinerary-details">
              <div class="itinerary-title">
                {{ act.activityName }}
              </div>
              <div class="itinerary-sub">
                📍 {{ act.location }} • Lead: {{ act.responsiblePerson }}
              </div>
            </div>

            <span
              v-if="act.delayMinutes > 0"
              class="badge badge-danger"
              style="font-size: 0.65rem; padding: 2px 6px"
            >
              +{{ act.delayMinutes }}m
            </span>
          </div>
        </div>

        <div style="margin-top: 12px">
          <button
            class="btn btn-primary btn-sm"
            style="width: 100%; justify-content: center"
            @click="actions.openRunSheetLiveModal()"
          >
            <PlayCircle :size="14" />
            <span>Launch Live Run Sheet View</span>
          </button>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<style scoped>
.empty-dashboard-state {
  text-align: center;
  padding: 56px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--surface-border);
  box-shadow: var(--shadow-sm);
  margin-top: 12px;
}

.empty-icon-box {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: #f0fdfa;
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-subtitle {
  max-width: 480px;
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.5;
}

.dashboard-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Hero Banner */
.hero-banner {
  background: linear-gradient(135deg, #0F766E 0%, #115E59 60%, #042F2E 100%);
  color: white;
  border: none;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  position: relative;
  overflow: hidden;
}

.hero-left {
  max-width: 600px;
}

.hero-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.hero-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-theme {
  font-size: 0.76rem;
  opacity: 0.9;
}

.hero-title {
  color: white;
  font-size: 1.45rem;
  margin-bottom: 8px;
  line-height: 1.2;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 0.8rem;
  opacity: 0.95;
}

.meta-pill {
  display: flex;
  align-items: center;
  gap: 5px;
}

.meta-truncate {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Hero Countdown */
.hero-readiness-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 14px;
}

.countdown-col {
  text-align: center;
}

.countdown-num {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
}

.countdown-txt {
  font-size: 0.65rem;
  opacity: 0.85;
  text-transform: uppercase;
  font-weight: 600;
}

.readiness-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
}

.readiness-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.readiness-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.74rem;
}

.readiness-label {
  font-size: 0.68rem;
  color: #A7F3D0;
  font-weight: 600;
}

/* Stats 4-Card Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  min-height: 110px;
}

.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.03em;
}

.stat-value {
  font-size: 1.15rem;
  font-weight: 800;
  margin-top: 2px;
  line-height: 1.2;
}

.stat-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.stat-icon-box {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-primary-subtle {
  background: var(--primary-light);
  color: var(--primary);
}

.bg-warning-subtle {
  background: var(--warning-bg);
  color: var(--warning);
}

.bg-success-subtle {
  background: var(--success-bg);
  color: var(--success);
}

.bg-info-subtle {
  background: var(--info-bg);
  color: var(--info);
}

.stat-bottom {
  margin-top: 6px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  margin-bottom: 4px;
  color: var(--text-muted);
}

.stat-extra {
  font-size: 0.68rem;
  color: var(--text-light);
  margin-top: 4px;
}

.badges-row {
  display: flex;
  gap: 5px;
}

.run-sheet-quick-btn {
  width: 100%;
  border-color: var(--info);
  color: var(--info);
  font-size: 0.75rem;
  padding: 4px;
}

/* Two-column section */
.dashboard-split-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 14px;
  align-items: start;
}

/* Tasks list */
.task-list-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background-color: var(--surface-subtle);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--primary);
  gap: 8px;
}

.task-row-overdue {
  border-left-color: var(--danger);
}

.task-row-high {
  border-left-color: var(--warning);
}

.task-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.task-check-btn {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid var(--surface-border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: white;
}

.task-check-btn.completed {
  background: var(--success);
  border-color: var(--success);
  color: white;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-subtext {
  display: flex;
  gap: 6px;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-category-tag {
  color: var(--primary);
  font-weight: 600;
}

.empty-state-p {
  text-align: center;
  padding: 16px;
  color: var(--text-muted);
  font-size: 0.82rem;
}

/* Itinerary */
.itinerary-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.itinerary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--surface-border);
  background: white;
}

.itinerary-time {
  padding: 3px 6px;
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 700;
  font-size: 0.72rem;
  border-radius: var(--radius-sm);
  min-width: 44px;
  text-align: center;
}

.itinerary-details {
  flex: 1;
  min-width: 0;
}

.itinerary-title {
  font-weight: 600;
  font-size: 0.82rem;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.itinerary-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Colors */
.text-primary { color: var(--primary); }
.text-danger { color: var(--danger); }
.text-success { color: var(--success); }
.text-info { color: var(--info); }
.text-main { color: var(--text-main); }
.font-bold { font-weight: 700; }

/* Responsive Media Queries */
@media (max-width: 900px) {
  .dashboard-split-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-banner {
    padding: 12px 14px;
  }
  .hero-title {
    font-size: 1.25rem;
  }
  .hero-readiness-card {
    width: 100%;
    justify-content: space-between;
  }
  /* 2x2 grid for stats on mobile */
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .stat-card {
    padding: 10px 12px;
  }
  .stat-value {
    font-size: 0.98rem;
  }
}

@media (max-width: 400px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
