<script setup lang="ts">
import {
  state,
  actions,
  taskMetrics,
} from './stores/eventStore';
import Sidebar from './components/layout/Sidebar.vue';
import Navbar from './components/layout/Navbar.vue';
import DashboardView from './components/dashboard/DashboardView.vue';
import EventsListView from './components/events/EventsListView.vue';
import ChecklistView from './components/checklist/ChecklistView.vue';
import BudgetView from './components/budget/BudgetView.vue';
import GuestsView from './components/guests/GuestsView.vue';
import VendorsView from './components/vendors/VendorsView.vue';
import ScheduleView from './components/schedule/ScheduleView.vue';
import ArrangementsView from './components/arrangements/ArrangementsView.vue';
import DocumentsView from './components/documents/DocumentsView.vue';
import SettingsView from './components/settings/SettingsView.vue';
import CreateEventModal from './components/events/CreateEventModal.vue';
import RunSheetLiveModal from './components/schedule/RunSheetLiveModal.vue';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Wallet,
  MoreHorizontal,
} from 'lucide-vue-next';
</script>

<template>
  <div class="app-container">
    <!-- Desktop & Tablet Sidebar / Mobile Drawer -->
    <Sidebar />

    <!-- Main Content Wrapper -->
    <div class="main-wrapper">
      <!-- Top Sticky Navigation Bar -->
      <Navbar />

      <!-- Active Content View Area -->
      <main class="content-body">
        <DashboardView v-if="state.activeTab === 'dashboard'" />
        <EventsListView v-else-if="state.activeTab === 'events'" />
        <ChecklistView v-else-if="state.activeTab === 'checklist'" />
        <BudgetView v-else-if="state.activeTab === 'budget'" />
        <GuestsView v-else-if="state.activeTab === 'guests'" />
        <VendorsView v-else-if="state.activeTab === 'vendors'" />
        <ScheduleView v-else-if="state.activeTab === 'schedule'" />
        <ArrangementsView v-else-if="state.activeTab === 'arrangements'" />
        <DocumentsView v-else-if="state.activeTab === 'documents'" />
        <SettingsView v-else-if="state.activeTab === 'settings'" />
      </main>

      <!-- Mobile Bottom Navigation Bar (Visible only on screens <= 768px) -->
      <nav class="mobile-bottom-nav">
        <button
          class="bottom-nav-btn"
          :class="{ active: state.activeTab === 'dashboard' }"
          @click="actions.setActiveTab('dashboard')"
        >
          <LayoutDashboard :size="18" />
          <span>Home</span>
        </button>

        <button
          class="bottom-nav-btn"
          :class="{ active: state.activeTab === 'events' }"
          @click="actions.setActiveTab('events')"
        >
          <CalendarDays :size="18" />
          <span>Events</span>
        </button>

        <button
          class="bottom-nav-btn"
          :class="{ active: state.activeTab === 'checklist' }"
          @click="actions.setActiveTab('checklist')"
          style="position: relative"
        >
          <CheckSquare :size="18" />
          <span>Tasks</span>
          <span
            v-if="taskMetrics.overdue > 0"
            style="
              position: absolute;
              top: 4px;
              right: 18px;
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: var(--danger);
            "
          ></span>
        </button>

        <button
          class="bottom-nav-btn"
          :class="{ active: state.activeTab === 'budget' }"
          @click="actions.setActiveTab('budget')"
        >
          <Wallet :size="18" />
          <span>Budget</span>
        </button>

        <button
          class="bottom-nav-btn"
          @click="actions.toggleMobileMenu()"
        >
          <MoreHorizontal :size="18" />
          <span>More</span>
        </button>
      </nav>
    </div>

    <!-- Global Modals -->
    <CreateEventModal v-if="state.isCreateEventModalOpen" />
    <RunSheetLiveModal v-if="state.isRunSheetLiveModalOpen" />
  </div>
</template>

<style>
/* Clean page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
