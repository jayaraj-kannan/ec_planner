<script setup lang="ts">
import {
  state,
  actions,
  formatCurrency,
  calculateDaysUntil,
} from '../../stores/eventStore';
import {
  Calendar,
  MapPin,
  Users,
  Wallet,
  Plus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-vue-next';

function switchEvent(eventId: string) {
  actions.setActiveEvent(eventId);
  actions.setActiveTab('dashboard');
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px">
      <div>
        <h2 style="font-size: 1.6rem">My Events & Celebrations</h2>
        <p style="font-size: 0.88rem; color: var(--text-muted)">
          Switch between your personal events or initiate a new guided celebration.
        </p>
      </div>

      <button
        class="btn btn-primary"
        @click="actions.openCreateEventModal()"
      >
        <Plus :size="16" />
        <span>+ Create New Event</span>
      </button>
    </div>

    <!-- Events Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px">
      <div
        v-for="evt in state.events"
        :key="evt.id"
        class="card"
        style="display: flex; flex-direction: column; justify-content: space-between; position: relative"
        :style="{
          border: evt.id === state.activeEventId ? '2px solid var(--primary)' : '1px solid var(--surface-border)',
          boxShadow: evt.id === state.activeEventId ? '0 6px 20px rgba(15, 118, 110, 0.15)' : 'var(--shadow-sm)',
        }"
      >
        <!-- Active indicator badge -->
        <div
          v-if="evt.id === state.activeEventId"
          style="
            position: absolute;
            top: 14px;
            right: 14px;
            background: var(--primary);
            color: white;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: var(--radius-full);
            display: flex;
            align-items: center;
            gap: 4px;
          "
        >
          <CheckCircle2 :size="12" />
          <span>CURRENT ACTIVE</span>
        </div>

        <div>
          <!-- Type and Date -->
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
            <span class="badge badge-info" style="text-transform: uppercase; font-size: 0.7rem">
              {{ evt.eventType }}
            </span>
            <span style="font-size: 0.8rem; color: var(--text-muted)">
              ⏳ {{ calculateDaysUntil(evt.startDate) }} days away
            </span>
          </div>

          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; padding-right: 70px">
            {{ evt.name }}
          </h3>

          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px">
            <div style="display: flex; align-items: center; gap: 8px">
              <Calendar :size="15" style="color: var(--primary)" />
              <span>{{ evt.startDate }}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px">
              <MapPin :size="15" style="color: var(--primary)" />
              <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{ evt.venueName }}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px">
              <Users :size="15" style="color: var(--primary)" />
              <span>{{ evt.expectedGuestCount }} Expected Attendees</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px">
              <Wallet :size="15" style="color: var(--primary)" />
              <span>Budget: <strong>{{ formatCurrency(evt.plannedBudgetMinor, evt.currency) }}</strong></span>
            </div>
          </div>
        </div>

        <!-- Action button -->
        <div style="padding-top: 14px; border-top: 1px solid var(--surface-border); display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 0.75rem; color: var(--text-muted)">
            Created: {{ new Date(evt.createdAt).toLocaleDateString() }}
          </span>

          <button
            v-if="evt.id === state.activeEventId"
            class="btn btn-outline btn-sm"
            @click="actions.setActiveTab('dashboard')"
          >
            <span>Open Dashboard</span>
            <ArrowRight :size="14" />
          </button>
          <button
            v-else
            class="btn btn-primary btn-sm"
            @click="switchEvent(evt.id)"
          >
            <span>Switch to Event</span>
            <ArrowRight :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
