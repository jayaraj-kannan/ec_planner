<script setup lang="ts">
import { ref } from 'vue';
import {
  state,
  actions,
  formatCurrency,
  calculateDaysUntil,
} from '../../stores/eventStore';
import type { EventItem } from '../../types/event';
import {
  Calendar,
  MapPin,
  Users,
  Wallet,
  Plus,
  ArrowRight,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  X,
  CalendarDays,
} from 'lucide-vue-next';

const eventToDelete = ref<EventItem | null>(null);
const isDeleteModalOpen = ref(false);

function switchEvent(eventId: string) {
  actions.setActiveEvent(eventId);
  actions.setActiveTab('dashboard');
}

function promptDeleteEvent(evt: EventItem) {
  eventToDelete.value = evt;
  isDeleteModalOpen.value = true;
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false;
  eventToDelete.value = null;
}

function confirmDeleteEvent() {
  if (eventToDelete.value) {
    actions.deleteEvent(eventToDelete.value.id);
  }
  closeDeleteModal();
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px">
      <div>
        <h2 style="font-size: 1.6rem">My Events & Celebrations</h2>
        <p style="font-size: 0.88rem; color: var(--text-muted)">
          Switch between your personal events, manage plans, or initiate a new guided celebration.
        </p>
      </div>

      <button class="btn btn-primary" @click="actions.openCreateEventModal()">
        <Plus :size="16" />
        <span>Create New Event</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="state.events.length === 0" class="card empty-events-card"
      style="text-align: center; padding: 48px 24px; display: flex; flex-direction: column; align-items: center; gap: 16px">
      <div style="
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--surface-subtle);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
        <CalendarDays :size="28" />
      </div>
      <div>
        <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 6px">No Celebrations Found</h3>
        <p style="font-size: 0.88rem; color: var(--text-muted); max-width: 420px; margin: 0 auto">
          You don't have any active celebrations. Start by creating a wedding, birthday, or custom celebration with
          guided budgeting and AI assistance.
        </p>
      </div>
      <button class="btn btn-primary" style="margin-top: 8px" @click="actions.openCreateEventModal()">
        <Plus :size="16" />
        <span>+ Create Your First Celebration</span>
      </button>
    </div>

    <!-- Events Grid -->
    <div v-else class="events-grid"
      style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px">
      <div v-for="evt in state.events" :key="evt.id" class="card event-card"
        style="display: flex; flex-direction: column; justify-content: space-between; position: relative" :style="{
          border: evt.id === state.activeEventId ? '2px solid var(--primary)' : '1px solid var(--surface-border)',
          boxShadow: evt.id === state.activeEventId ? '0 6px 20px rgba(15, 118, 110, 0.15)' : 'var(--shadow-sm)',
        }">
        <!-- Active indicator badge -->
        <div v-if="evt.id === state.activeEventId" class="active-event-badge" style="
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
          ">
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

          <div
            style="display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px">
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
        <div class="event-card-footer"
          style="padding-top: 14px; border-top: 1px solid var(--surface-border); display: flex; justify-content: space-between; align-items: center; gap: 8px">
          <button class="btn btn-outline-danger btn-sm btn-delete-event" title="Delete this celebration"
            @click.stop="promptDeleteEvent(evt)">
            <Trash2 :size="14" />
            <span>Delete</span>
          </button>

          <div style="display: flex; align-items: center; gap: 8px">
            <button v-if="evt.id === state.activeEventId" class="btn btn-outline btn-sm"
              @click="actions.setActiveTab('dashboard')">
              <span>Open Dashboard</span>
              <ArrowRight :size="14" />
            </button>
            <button v-else class="btn btn-primary btn-sm" @click="switchEvent(evt.id)">
              <span>Switch to Event</span>
              <ArrowRight :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="isDeleteModalOpen && eventToDelete" class="modal-overlay delete-modal-overlay"
      @click.self="closeDeleteModal">
      <div class="modal-box delete-confirm-box" style="max-width: 480px">
        <div class="modal-header" style="border-bottom: 1px solid var(--danger-border); background: var(--danger-bg)">
          <div style="display: flex; align-items: center; gap: 10px; color: var(--danger)">
            <div style="
                width: 34px;
                height: 34px;
                border-radius: 50%;
                background: white;
                border: 1px solid var(--danger-border);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: var(--shadow-sm);
              ">
              <AlertTriangle :size="18" style="color: var(--danger)" />
            </div>
            <div>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--danger); margin: 0">
                Delete Celebration?
              </h3>
              <span style="font-size: 0.75rem; color: #991B1B">
                Irreversible Action
              </span>
            </div>
          </div>

          <button class="btn-icon btn-close-delete-modal" @click="closeDeleteModal" title="Cancel">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body" style="padding: 20px 22px; display: flex; flex-direction: column; gap: 16px">
          <p style="font-size: 0.9rem; color: var(--text-main); line-height: 1.5; margin: 0">
            Are you sure you want to permanently delete
            <strong style="color: var(--text-main)">"{{ eventToDelete.name }}"</strong>?
          </p>

          <!-- Event Summary Pill -->
          <div style="
              background: var(--surface-subtle);
              border: 1px solid var(--surface-border);
              border-radius: var(--radius-md);
              padding: 12px 14px;
              display: flex;
              flex-direction: column;
              gap: 6px;
              font-size: 0.82rem;
              color: var(--text-muted);
            ">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span class="badge badge-info" style="text-transform: uppercase">{{ eventToDelete.eventType }}</span>
              <span style="font-weight: 600; color: var(--text-main)">
                {{ formatCurrency(eventToDelete.plannedBudgetMinor, eventToDelete.currency) }}
              </span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px">
              <Calendar :size="13" />
              <span>{{ eventToDelete.startDate }}</span>
              <span>•</span>
              <MapPin :size="13" />
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{ eventToDelete.venueName
                }}</span>
            </div>
          </div>

          <div style="
              background: var(--danger-bg);
              border-left: 3px solid var(--danger);
              padding: 10px 12px;
              border-radius: 4px;
              font-size: 0.78rem;
              color: #991B1B;
              line-height: 1.4;
            ">
            ⚠️ <strong>Warning:</strong> Deleting this celebration will permanently purge all associated checklist
            milestones, budget expenses, guest RSVP lists, and schedule activities.
          </div>
        </div>

        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px">
          <button class="btn btn-secondary btn-cancel-delete" @click="closeDeleteModal">
            Cancel
          </button>
          <button class="btn btn-danger btn-confirm-delete" @click="confirmDeleteEvent">
            <Trash2 :size="15" />
            <span>Yes, Delete Celebration</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
