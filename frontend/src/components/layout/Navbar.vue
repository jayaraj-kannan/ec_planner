<script setup lang="ts">
import { ref } from 'vue';
import {
  state,
  actions,
  readinessMetrics,
} from '../../stores/eventStore';
import { authState, authActions } from '../../stores/authStore';
import {
  Calendar,
  Bell,
  PlayCircle,
  Plus,
  ChevronDown,
  Menu,
  Sparkles,
  LogIn,
  LogOut,
  PartyPopper,
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
      <!-- Unauthenticated: Brand Header -->
      <div v-if="!authState.user" class="guest-nav-brand">
        <div class="logo-badge">
          <PartyPopper :size="18" />
        </div>
        <div class="logo-text">
          <span class="logo-title">PlanCraft</span>
          <span class="logo-subtitle">Event Planning OS</span>
        </div>
      </div>

      <!-- Authenticated: Switcher and Countdown -->
      <template v-else>
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
      </template>
    </div>

    <div class="navbar-right">
      <!-- Authenticated Private Action Buttons & Notification Center -->
      <template v-if="authState.user">
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
          style="background: linear-gradient(135deg, #FF6082 0%, #B26CFF 100%); color: white; border: none; font-weight: 700; text-shadow: 0 1px 2px rgba(90, 10, 50, 0.25); box-shadow: 0 2px 6px rgba(255, 96, 130, 0.35)"
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

        <!-- User Profile / Auth Button -->
        <div class="nav-user-chip">
          <img v-if="authState.profile?.photoURL" :src="authState.profile.photoURL" class="nav-avatar-img" alt="avatar" />
          <div v-else class="nav-avatar-fallback">{{ (authState.profile?.displayName || 'Host').slice(0, 2).toUpperCase() }}</div>
          <span class="nav-user-name btn-text-responsive">{{ authState.profile?.displayName || authState.user.email?.split('@')[0] }}</span>
          <button class="btn-icon btn-logout" @click="authActions.logout()" title="Sign Out">
            <LogOut :size="13" />
          </button>
        </div>

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
      </template>

      <!-- Guest Sign In Button (Only option when not signed in) -->
      <button
        v-else
        class="btn btn-primary btn-sm nav-btn-compact btn-signin"
        @click="authActions.openAuthModal('signin')"
        title="Sign in with Google or Email"
      >
        <LogIn :size="14" />
        <span class="btn-text-responsive">Sign In</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.guest-nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mobile-menu-btn {
  display: none;
}

.nav-user-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-subtle);
  border: 1px solid var(--surface-border);
  padding: 3px 6px 3px 4px;
  border-radius: var(--radius-full);
}

.nav-avatar-img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.nav-avatar-fallback {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-user-name {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-main);
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-logout {
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--text-muted);
}

.btn-logout:hover {
  color: var(--danger);
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
