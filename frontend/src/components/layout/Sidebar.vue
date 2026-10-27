<script setup lang="ts">
import { computed } from 'vue';
import {
  state,
  actions,
  taskMetrics,
  type ActiveTab,
} from '../../stores/eventStore';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Wallet,
  Users,
  Briefcase,
  Clock,
  Layers,
  FileText,
  Settings,
  Sparkles,
  PartyPopper,
  X,
  LogIn,
  LogOut,
  User,
} from 'lucide-vue-next';
import { authState, authActions } from '../../stores/authStore';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: any;
  badge?: number;
  badgeType?: 'danger' | 'primary';
}

const navItems = computed<NavItem[]>(() => [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'events', label: 'My Events', icon: CalendarDays },
  {
    id: 'checklist',
    label: 'Checklist',
    icon: CheckSquare,
    badge: taskMetrics.value.overdue > 0 ? taskMetrics.value.overdue : undefined,
    badgeType: 'danger',
  },
  { id: 'budget', label: 'Budget & Expenses', icon: Wallet },
  { id: 'guests', label: 'Guests & RSVP', icon: Users },
  { id: 'vendors', label: 'Vendors', icon: Briefcase },
  { id: 'schedule', label: 'Schedule & Run Sheet', icon: Clock },
  { id: 'arrangements', label: 'Arrangements', icon: Layers },
  { id: 'documents', label: 'Documents', icon: FileText },
]);

function setTab(tab: ActiveTab) {
  if (!authState.user && tab !== 'dashboard') {
    authActions.openAuthModal('signin');
    return;
  }
  actions.setActiveTab(tab);
}
</script>

<template>
  <!-- Desktop / Tablet Sticky Sidebar -->
  <aside class="sidebar">
    <!-- Brand / Logo -->
    <div class="sidebar-header">
      <div class="logo-badge">
        <PartyPopper :size="18" />
      </div>
      <div class="logo-text">
        <span class="logo-title">PlanCraft</span>
        <span class="logo-subtitle">Event Planning OS</span>
      </div>
    </div>

    <!-- Navigation List -->
    <nav class="sidebar-nav">
      <div class="nav-section-title">Navigation</div>

      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-item"
        :class="{ active: state.activeTab === item.id }"
        @click="setTab(item.id)"
      >
        <div class="nav-item-left">
          <component :is="item.icon" :size="16" />
          <span>{{ item.label }}</span>
        </div>
        <span
          v-if="item.badge"
          class="nav-badge"
          :class="item.badgeType || 'primary'"
        >
          {{ item.badge }}
        </span>
      </button>

      <div class="nav-section-title" style="margin-top: 8px">System</div>

      <button
        class="nav-item"
        :class="{ active: state.activeTab === 'settings' }"
        @click="setTab('settings')"
      >
        <div class="nav-item-left">
          <Settings :size="16" />
          <span>Settings</span>
        </div>
      </button>
    </nav>

    <!-- AI Assistant CTA in Sidebar (only when signed in) -->
    <div v-if="authState.user" style="padding: 6px 12px 0 12px">
      <button
        class="btn"
        style="width: 100%; font-size: 0.8rem; padding: 8px 10px; background: #f0fdfa; color: var(--primary); border: 1px solid #ccfbf1; font-weight: 600"
        @click="actions.openAgentChatModal()"
      >
        <Sparkles :size="14" />
        <span>Ask AI Copilot</span>
      </button>
    </div>

    <!-- Create Event CTA in Sidebar (only when signed in) -->
    <div v-if="authState.user" style="padding: 8px 12px 10px 12px">
      <button
        class="btn btn-primary"
        style="width: 100%; font-size: 0.8rem; padding: 8px 10px;"
        @click="actions.openCreateEventModal()"
      >
        <PartyPopper :size="14" />
        <span>+ New Event</span>
      </button>
    </div>

    <!-- Sidebar Footer / User Profile & Auth -->
    <div class="sidebar-footer">
      <div v-if="authState.user" class="user-profile-card">
        <img
          v-if="authState.user.photoURL"
          :src="authState.user.photoURL"
          alt="Avatar"
          class="avatar"
          style="object-fit: cover"
        />
        <div v-else class="avatar">
          {{ (authState.profile?.displayName || authState.user.email || 'U').slice(0, 2).toUpperCase() }}
        </div>
        <div style="flex: 1; overflow: hidden">
          <div style="font-weight: 600; font-size: 0.8rem; color: var(--text-main); white-space: nowrap; text-overflow: ellipsis; overflow: hidden">
            {{ authState.profile?.displayName || authState.user.displayName || authState.user.email?.split('@')[0] }}
          </div>
          <div style="font-size: 0.68rem; color: var(--text-muted); white-space: nowrap; text-overflow: ellipsis; overflow: hidden">
            {{ authState.user.email }}
          </div>
        </div>
        <button
          class="btn btn-ghost"
          style="padding: 4px; color: var(--text-muted)"
          title="Sign Out"
          @click="authActions.logout()"
        >
          <LogOut :size="14" />
        </button>
      </div>

      <div v-else style="padding: 4px">
        <button
          class="btn btn-secondary"
          style="width: 100%; font-size: 0.78rem; padding: 7px 10px; justify-content: center"
          @click="authActions.openAuthModal('signin')"
        >
          <LogIn :size="14" />
          <span>Sign In / Register</span>
        </button>
      </div>
    </div>
  </aside>

  <!-- Mobile Slide-Out Drawer (When open on mobile < 768px) -->
  <div
    v-if="state.isMobileMenuOpen"
    class="mobile-drawer-overlay"
    @click="actions.closeMobileMenu()"
  >
    <div class="mobile-drawer" @click.stop>
      <div class="sidebar-header" style="justify-content: space-between">
        <div style="display: flex; align-items: center; gap: 8px">
          <div class="logo-badge">
            <PartyPopper :size="16" />
          </div>
          <div class="logo-text">
            <span class="logo-title" style="font-size: 1.05rem">PlanCraft</span>
            <span class="logo-subtitle">Event Planning OS</span>
          </div>
        </div>
        <button class="btn-icon" @click="actions.closeMobileMenu()">
          <X :size="18" />
        </button>
      </div>

      <nav class="sidebar-nav" style="padding: 12px">
        <div class="nav-section-title">Navigation</div>
        <button
          v-for="item in navItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: state.activeTab === item.id }"
          @click="setTab(item.id)"
          style="padding: 10px 12px; font-size: 0.9rem"
        >
          <div class="nav-item-left">
            <component :is="item.icon" :size="18" />
            <span>{{ item.label }}</span>
          </div>
          <span
            v-if="item.badge"
            class="nav-badge"
            :class="item.badgeType || 'primary'"
          >
            {{ item.badge }}
          </span>
        </button>

        <div class="nav-section-title" style="margin-top: 10px">System</div>
        <button
          class="nav-item"
          :class="{ active: state.activeTab === 'settings' }"
          @click="setTab('settings')"
          style="padding: 10px 12px; font-size: 0.9rem"
        >
          <div class="nav-item-left">
            <Settings :size="18" />
            <span>Settings & Data</span>
          </div>
        </button>
      </nav>

      <div v-if="authState.user" style="padding: 12px 14px; border-top: 1px solid var(--surface-border)">
        <button
          class="btn btn-primary"
          style="width: 100%; font-size: 0.85rem; padding: 10px"
          @click="actions.openCreateEventModal()"
        >
          <Sparkles :size="15" />
          <span>+ New Event Wizard</span>
        </button>
      </div>
    </div>
  </div>
</template>
