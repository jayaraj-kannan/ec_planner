<script setup lang="ts">
import { ref } from 'vue';
import {
  state,
  actions,
  readinessMetrics,
} from '../../stores/eventStore';
import {
  Calendar,
  Bell,
  PlayCircle,
  Plus,
  ChevronDown,
  Menu,
  Sparkles,
} from 'lucide-vue-next';

const isNotifOpen = ref(false);

function toggleNotif() {
  isNotifOpen.value = !isNotifOpen.value;
}

const unreadCount = () => {
  return state.notifications.filter((n) => !n.read).length;
};

function onSelectEvent(e: Event) {
  const target = e.target as HTMLSelectElement | null;
  if (target) {
    actions.setActiveEvent(target.value);
  }
}
</script>

<template>
  <header class="top-navbar">
    <div class="navbar-left">
      <!-- Mobile Drawer Hamburger Toggle Button -->
      <button
        class="btn-icon mobile-menu-btn"
        @click="actions.toggleMobileMenu()"
        aria-label="Open Navigation Menu"
      >
        <Menu :size="20" />
      </button>

      <!-- Event Switcher Dropdown -->
      <div class="event-selector-box">
        <Calendar :size="16" style="color: var(--primary); flex-shrink: 0" />
        <select
          class="event-select-dropdown"
          :value="state.activeEventId"
          @change="onSelectEvent"
        >
          <option
            v-for="evt in state.events"
            :key="evt.id"
            :value="evt.id"
          >
            {{ evt.name }} ({{ evt.eventType.toUpperCase() }})
          </option>
        </select>
        <ChevronDown :size="12" style="color: var(--text-muted); flex-shrink: 0" />
      </div>

      <!-- Quick Countdown Badge (compact on mobile) -->
      <span class="badge badge-info nav-countdown-badge" style="font-weight: 700">
        ⏳ {{ readinessMetrics.daysUntil }}d
        <span class="countdown-label-full">to go</span>
      </span>
    </div>

    <div class="navbar-right">
      <!-- Live Run Sheet Trigger -->
      <button
        class="btn btn-outline btn-sm nav-btn-compact"
        @click="actions.openRunSheetLiveModal()"
        title="Open Live Event-Day Run Sheet"
      >
        <PlayCircle :size="14" />
        <span class="btn-text-responsive">Run Sheet</span>
      </button>

      <!-- AI Assistant Button -->
      <button
        class="btn btn-sm nav-btn-compact"
        style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: white; border: none; font-weight: 600"
        @click="actions.openAgentChatModal()"
        title="Open PlanCraft ADK AI Assistant"
      >
        <Sparkles :size="14" />
        <span class="btn-text-responsive">AI Copilot</span>
      </button>

      <!-- New Event Button -->
      <button
        class="btn btn-primary btn-sm nav-btn-compact"
        @click="actions.openCreateEventModal()"
      >
        <Plus :size="14" />
        <span class="btn-text-responsive">Create</span>
      </button>

      <!-- Notification Center Popover -->
      <div style="position: relative">
        <button
          class="btn-icon"
          @click="toggleNotif"
          style="position: relative"
          aria-label="Notifications"
        >
          <Bell :size="17" />
          <span
            v-if="unreadCount() > 0"
            style="
              position: absolute;
              top: 5px;
              right: 5px;
              width: 8px;
              height: 8px;
              background-color: var(--danger);
              border-radius: 50%;
              border: 1.5px solid white;
            "
          ></span>
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="isNotifOpen"
          style="
            position: absolute;
            top: 42px;
            right: 0;
            width: 290px;
            max-width: 90vw;
            background: white;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-xl);
            border: 1px solid var(--surface-border);
            z-index: 60;
            padding: 12px;
            animation: fadeIn 0.15s ease-out;
          "
        >
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 8px;
              padding-bottom: 6px;
              border-bottom: 1px solid var(--surface-border);
            "
          >
            <span style="font-weight: 700; font-size: 0.85rem">Notifications</span>
            <button
              style="font-size: 0.72rem; color: var(--primary); font-weight: 600"
              @click="actions.markAllNotificationsRead()"
            >
              Mark all read
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto">
            <div
              v-for="n in state.notifications"
              :key="n.id"
              style="
                padding: 8px 10px;
                border-radius: var(--radius-sm);
                background-color: var(--surface-subtle);
                border-left: 3px solid;
              "
              :style="{
                borderLeftColor:
                  n.type === 'urgent'
                    ? 'var(--danger)'
                    : n.type === 'success'
                    ? 'var(--success)'
                    : 'var(--warning)',
              }"
              @click="actions.markNotificationRead(n.id)"
            >
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-main); margin-bottom: 2px">
                {{ n.title }}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.25">
                {{ n.message }}
              </div>
              <div style="font-size: 0.65rem; color: var(--text-light); margin-top: 3px">
                {{ n.timestamp }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.mobile-menu-btn {
  display: none;
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }
  .countdown-label-full {
    display: none;
  }
  .btn-text-responsive {
    display: none;
  }
  .nav-btn-compact {
    padding: 6px 8px;
  }
}
</style>
