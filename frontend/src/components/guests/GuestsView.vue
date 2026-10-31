<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import {
  currentEvent,
  eventGuests,
  guestMetrics,
  actions,
} from '../../stores/eventStore';
import type { RSVPStatus, MealPreference } from '../../types/event';
import {
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  X,
} from 'lucide-vue-next';

const searchQuery = ref('');
const selectedRSVPFilter = ref<string>('all');
const selectedCategory = ref<string>('all');
const isAddGuestModalOpen = ref(false);

const newGuest = reactive({
  guestName: '',
  familyName: '',
  category: 'Family' as const,
  mobileNumber: '',
  email: '',
  partySize: 2,
  rsvpStatus: 'confirmed' as RSVPStatus,
  mealPreference: 'Veg' as MealPreference,
  accommodationRequired: false,
  notes: '',
});

const filteredGuests = computed(() => {
  return eventGuests.value.filter((g) => {
    // Search
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchName = g.guestName.toLowerCase().includes(q);
      const matchFamily = (g.familyName || '').toLowerCase().includes(q);
      const matchPhone = (g.mobileNumber || '').includes(q);
      if (!matchName && !matchFamily && !matchPhone) return false;
    }

    // RSVP Filter
    if (selectedRSVPFilter.value !== 'all' && g.rsvpStatus !== selectedRSVPFilter.value) {
      return false;
    }

    // Category Filter
    if (selectedCategory.value !== 'all' && g.category !== selectedCategory.value) {
      return false;
    }

    return true;
  });
});

function handleAddGuest() {
  if (!currentEvent.value || !newGuest.guestName.trim()) return;

  actions.addGuest({
    eventId: currentEvent.value.id,
    guestName: newGuest.guestName,
    familyName: newGuest.familyName || newGuest.guestName + ' Party',
    category: newGuest.category,
    mobileNumber: newGuest.mobileNumber,
    email: newGuest.email,
    partySize: Number(newGuest.partySize) || 1,
    rsvpStatus: newGuest.rsvpStatus,
    mealPreference: newGuest.mealPreference,
    accommodationRequired: newGuest.accommodationRequired,
    notes: newGuest.notes,
  });

  newGuest.guestName = '';
  newGuest.mobileNumber = '';
  newGuest.notes = '';
  isAddGuestModalOpen.value = false;
}

function quickToggleRSVP(guestId: string, current: RSVPStatus) {
  const next: RSVPStatus = current === 'confirmed' ? 'declined' : current === 'declined' ? 'pending' : 'confirmed';
  actions.updateGuestRSVP(guestId, next);
}

function exportCSV() {
  const rows = [
    ['Guest Name', 'Family Group', 'Category', 'Party Size', 'RSVP Status', 'Meal', 'Hotel Rooms Required', 'Phone'],
    ...eventGuests.value.map((g) => [
      g.guestName,
      g.familyName || '',
      g.category,
      g.partySize.toString(),
      g.rsvpStatus.toUpperCase(),
      g.mealPreference,
      g.accommodationRequired ? 'YES' : 'NO',
      g.mobileNumber,
    ]),
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const evtName = currentEvent.value?.name || 'Celebration';
  link.setAttribute('download', `${evtName.replace(/\s+/g, '_')}_Guest_List.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<template>
  <div class="view-wrap">
    <!-- Header with CSV Export & Add Guest -->
    <div class="view-header">
      <div>
        <h2 class="view-title">Guest List & RSVP Coordinator</h2>
        <p class="view-subtitle">
          Real-time confirmation tracker, headcounts, dietary splits, and room reservations.
        </p>
      </div>

      <div style="display: flex; gap: 8px">
        <button class="btn btn-secondary btn-sm" @click="exportCSV">
          <Download :size="14" />
          <span>Export</span>
        </button>

        <button class="btn btn-primary btn-sm" @click="isAddGuestModalOpen = true">
          <Plus :size="14" />
          <span>Add Guest</span>
        </button>
      </div>
    </div>

    <!-- RSVP Headcount Metric Cards (Section 6.5) -->
    <div class="guest-metrics-grid">
      <!-- Total Invited -->
      <div class="card metric-card">
        <div class="metric-label">Total Invited</div>
        <div class="metric-val text-main">
          {{ guestMetrics.totalInvitedPax }} Pax
        </div>
        <div class="metric-hint">across {{ guestMetrics.totalGuests }} groups</div>
      </div>

      <!-- Confirmed -->
      <div class="card metric-card">
        <div class="metric-label text-success">✓ Confirmed</div>
        <div class="metric-val text-success">
          {{ guestMetrics.confirmedPax }} Pax
        </div>
        <div class="metric-hint text-success font-bold">
          {{ guestMetrics.confirmedPercent }}% confirmed
        </div>
      </div>

      <!-- Pending -->
      <div class="card metric-card">
        <div class="metric-label text-warning">⏳ Pending</div>
        <div class="metric-val text-warning">
          {{ guestMetrics.pendingPax }} Pax
        </div>
        <div class="metric-hint">Awaiting reply</div>
      </div>

      <!-- Declined -->
      <div class="card metric-card">
        <div class="metric-label text-danger">✕ Declined</div>
        <div class="metric-val text-danger">
          {{ guestMetrics.declinedPax }} Pax
        </div>
        <div class="metric-hint">Unable to attend</div>
      </div>

      <!-- Hotel Accommodation -->
      <div class="card metric-card">
        <div class="metric-label text-info">🏨 Hotel Stay</div>
        <div class="metric-val text-info">
          {{ guestMetrics.hotelRoomsRequired }} Rooms
        </div>
        <div class="metric-hint">For outstation relatives</div>
      </div>
    </div>

    <!-- Filters & Search Bar -->
    <div class="card" style="padding: 16px 20px">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px">
        <!-- Search box -->
        <div
          style="display: flex; align-items: center; gap: 8px; flex: 1; max-width: 320px; background: var(--surface-subtle); padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--surface-border)">
          <Search :size="16" style="color: var(--text-light)" />
          <input v-model="searchQuery" type="text" placeholder="Search name, family, phone..."
            style="border: none; background: transparent; outline: none; width: 100%; font-size: 0.88rem" />
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center">
          <!-- Status filter -->
          <div style="display: flex; gap: 6px">
            <button class="btn btn-sm" :class="selectedRSVPFilter === 'all' ? 'btn-primary' : 'btn-secondary'"
              @click="selectedRSVPFilter = 'all'">
              All
            </button>
            <button class="btn btn-sm" :class="selectedRSVPFilter === 'confirmed' ? 'btn-primary' : 'btn-secondary'"
              @click="selectedRSVPFilter = 'confirmed'">
              Confirmed
            </button>
            <button class="btn btn-sm" :class="selectedRSVPFilter === 'pending' ? 'btn-primary' : 'btn-secondary'"
              @click="selectedRSVPFilter = 'pending'">
              Pending
            </button>
            <button class="btn btn-sm" :class="selectedRSVPFilter === 'declined' ? 'btn-primary' : 'btn-secondary'"
              @click="selectedRSVPFilter = 'declined'">
              Declined
            </button>
          </div>

          <!-- Category filter -->
          <select v-model="selectedCategory" class="form-select"
            style="width: auto; padding: 6px 12px; font-size: 0.82rem">
            <option value="all">All Groups</option>
            <option value="Bride Family">Bride Family</option>
            <option value="Groom Family">Groom Family</option>
            <option value="Friends">Friends</option>
            <option value="VIP">VIP</option>
            <option value="Colleagues">Colleagues</option>
            <option value="Family">General Family</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Guests Table -->
    <div class="card">
      <div style="overflow-x: auto">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left">
          <thead>
            <tr
              style="border-bottom: 2px solid var(--surface-border); color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase">
              <th style="padding: 10px 14px">Guest / Family Contact</th>
              <th style="padding: 10px 14px">Affiliation</th>
              <th style="padding: 10px 14px">Pax</th>
              <th style="padding: 10px 14px">RSVP Status (Click to Toggle)</th>
              <th style="padding: 10px 14px">Meal Diet</th>
              <th style="padding: 10px 14px">Hotel Stay</th>
              <th style="padding: 10px 14px; text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in filteredGuests" :key="g.id" style="border-bottom: 1px solid var(--surface-border)">
              <td style="padding: 14px">
                <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem">
                  {{ g.guestName }}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px">
                  {{ g.familyName || 'Party' }} • {{ g.mobileNumber }}
                </div>
                <div v-if="g.notes"
                  style="font-size: 0.72rem; color: var(--text-light); font-style: italic; margin-top: 2px">
                  Note: {{ g.notes }}
                </div>
              </td>

              <td style="padding: 14px">
                <span class="badge badge-neutral" style="font-size: 0.75rem">
                  {{ g.category }}
                </span>
              </td>

              <td style="padding: 14px">
                <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-main)">
                  {{ g.partySize }}
                </span>
              </td>

              <!-- Quick RSVP Status Toggle button -->
              <td style="padding: 14px">
                <button @click="quickToggleRSVP(g.id, g.rsvpStatus)"
                  style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease"
                  :class="{
                    'badge-success': g.rsvpStatus === 'confirmed',
                    'badge-warning': g.rsvpStatus === 'pending',
                    'badge-danger': g.rsvpStatus === 'declined',
                  }" title="Click to toggle RSVP status">
                  <CheckCircle2 v-if="g.rsvpStatus === 'confirmed'" :size="13" />
                  <Clock v-else-if="g.rsvpStatus === 'pending'" :size="13" />
                  <XCircle v-else :size="13" />
                  <span>{{ g.rsvpStatus.toUpperCase() }}</span>
                </button>
              </td>

              <td style="padding: 14px">
                <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted)">
                  {{ g.mealPreference }}
                </span>
              </td>

              <td style="padding: 14px">
                <span v-if="g.accommodationRequired" class="badge badge-info" style="font-size: 0.72rem">
                  🏨 REQUIRED
                </span>
                <span v-else style="font-size: 0.78rem; color: var(--text-light)">
                  Not needed
                </span>
              </td>

              <td style="padding: 14px; text-align: right">
                <button class="btn-icon" style="color: var(--text-light)" @click="actions.deleteGuest(g.id)"
                  title="Remove guest">
                  <Trash2 :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredGuests.length === 0" style="text-align: center; padding: 30px; color: var(--text-muted)">
          No guests found matching your search and filter criteria.
        </div>
      </div>
    </div>

    <!-- Add Guest Modal -->
    <div v-if="isAddGuestModalOpen" class="modal-overlay" @click.self="isAddGuestModalOpen = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3 style="font-size: 1.15rem">Add Guest or Family Group</h3>
          <button class="btn-icon" @click="isAddGuestModalOpen = false">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Primary Guest / Family Head Name</label>
            <input v-model="newGuest.guestName" type="text" class="form-input"
              placeholder="e.g. Ramesh & Gayatri Murthy" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Family / Group Name</label>
              <input v-model="newGuest.familyName" type="text" class="form-input" placeholder="e.g. Murthy Clan" />
            </div>

            <div class="form-group">
              <label class="form-label">Category Group</label>
              <select v-model="newGuest.category" class="form-select">
                <option value="Bride Family">Bride Family</option>
                <option value="Groom Family">Groom Family</option>
                <option value="Friends">Friends</option>
                <option value="VIP">VIP</option>
                <option value="Colleagues">Colleagues</option>
                <option value="Family">General Family</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Party Size (Number of Pax)</label>
              <input v-model.number="newGuest.partySize" type="number" min="1" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">RSVP Status</label>
              <select v-model="newGuest.rsvpStatus" class="form-select">
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Mobile Number</label>
              <input v-model="newGuest.mobileNumber" type="text" class="form-input" placeholder="+91 98450 00000" />
            </div>

            <div class="form-group">
              <label class="form-label">Meal Preference</label>
              <select v-model="newGuest.mealPreference" class="form-select">
                <option value="Veg">Vegetarian</option>
                <option value="Non-Veg">Non-Vegetarian</option>
                <option value="Jain">Strict Jain</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.9rem">
              <input v-model="newGuest.accommodationRequired" type="checkbox" style="width: 18px; height: 18px" />
              <span>Requires Hotel Room Booking / Outstation Stay</span>
            </label>
          </div>

          <div class="form-group">
            <label class="form-label">Special Notes or Flight Timings</label>
            <textarea v-model="newGuest.notes" rows="2" class="form-textarea"
              placeholder="e.g. Arriving Bangalore airport at 11 AM, needs ground floor room..."></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="isAddGuestModalOpen = false">Cancel</button>
          <button class="btn btn-primary" @click="handleAddGuest">Save Guest</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 10px;
}

.view-title {
  font-size: 1.35rem;
  line-height: 1.2;
}

.view-subtitle {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.guest-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
}

.metric-card {
  padding: 10px 14px;
}

.metric-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.metric-val {
  font-size: 1.15rem;
  font-weight: 800;
  margin-top: 2px;
}

.metric-hint {
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 1px;
}

.text-primary {
  color: var(--primary);
}

.text-danger {
  color: var(--danger);
}

.text-warning {
  color: var(--warning);
}

.text-success {
  color: var(--success);
}

.text-info {
  color: var(--info);
}

.text-main {
  color: var(--text-main);
}

.font-bold {
  font-weight: 700;
}

@media (max-width: 640px) {
  .guest-metrics-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .metric-card {
    padding: 8px 10px;
  }

  .metric-val {
    font-size: 0.98rem;
  }
}
</style>
