<script setup lang="ts">
import { ref, reactive } from 'vue';
import {
  currentEvent,
  eventSchedule,
  actions,
} from '../../stores/eventStore';
import type { ScheduleStatus } from '../../types/event';
import {
  Clock,
  PlayCircle,
  Plus,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  X,
  FastForward,
} from 'lucide-vue-next';

const isAddActivityModalOpen = ref(false);

const newActivity = reactive({
  activityName: '',
  scheduleDate: currentEvent.value.startDate,
  startTime: '10:00',
  endTime: '11:30',
  location: 'Main Ballroom',
  responsiblePerson: 'Lead Coordinator',
  backupContact: 'Family Elder',
  phone: '+91 98450 00000',
  status: 'upcoming' as ScheduleStatus,
  notes: '',
});

function handleAddActivity() {
  if (!newActivity.activityName.trim()) return;

  actions.addScheduleActivity({
    eventId: currentEvent.value.id,
    activityName: newActivity.activityName,
    scheduleDate: newActivity.scheduleDate,
    startTime: newActivity.startTime,
    endTime: newActivity.endTime,
    location: newActivity.location,
    responsiblePerson: newActivity.responsiblePerson,
    backupContact: newActivity.backupContact,
    phone: newActivity.phone,
    status: newActivity.status,
    notes: newActivity.notes,
  });

  newActivity.activityName = '';
  isAddActivityModalOpen.value = false;
}

function quickDelay(actId: string, minutes: number) {
  actions.reportScheduleDelay(actId, minutes);
}

function markCompleted(actId: string) {
  actions.updateScheduleStatus(actId, 'completed');
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px">
    <!-- Header with Live Run Sheet Trigger -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px">
      <div>
        <h2 style="font-size: 1.6rem">Event Schedule & Itinerary Timeline</h2>
        <p style="font-size: 0.88rem; color: var(--text-muted)">
          Answer Q5: Sequence of rituals, banquet timings, responsible leads, and live delay tracking.
        </p>
      </div>

      <div style="display: flex; gap: 10px">
        <button
          class="btn btn-primary"
          style="background: linear-gradient(135deg, #0284C7 0%, #0F766E 100%)"
          @click="actions.openRunSheetLiveModal()"
        >
          <PlayCircle :size="17" />
          <span>Launch Live Event-Day Run Sheet</span>
        </button>

        <button class="btn btn-secondary" @click="isAddActivityModalOpen = true">
          <Plus :size="16" />
          <span>+ Add Activity</span>
        </button>
      </div>
    </div>

    <!-- Live Coordinator Callout Banner -->
    <div
      class="card"
      style="
        background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
        border: 1px solid #86EFAC;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      "
    >
      <div style="display: flex; align-items: center; gap: 14px">
        <div
          style="
            width: 44px;
            height: 44px;
            border-radius: var(--radius-md);
            background: #16A34A;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <Clock :size="24" />
        </div>
        <div>
          <div style="font-weight: 700; font-size: 1rem; color: #166534">
            Event-Day Execution Mode
          </div>
          <div style="font-size: 0.82rem; color: #15803D">
            On the day of your event, open the full-screen mobile-optimized view for instant delay reporting and 1-click calls to leads.
          </div>
        </div>
      </div>

      <button
        class="btn btn-sm"
        style="background: #16A34A; color: white"
        @click="actions.openRunSheetLiveModal()"
      >
        Open Mobile View
      </button>
    </div>

    <!-- Timeline of Activities -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <Clock :size="18" style="color: var(--primary)" />
          <span>Ceremonies & Program Sequence ({{ currentEvent.startDate }})</span>
        </div>
      </div>

      <div style="position: relative; padding-left: 28px; display: flex; flex-direction: column; gap: 24px">
        <!-- Vertical connector line -->
        <div
          style="
            position: absolute;
            left: 10px;
            top: 10px;
            bottom: 20px;
            width: 2px;
            background: var(--surface-border-strong);
          "
        ></div>

        <div
          v-for="(act, idx) in eventSchedule"
          :key="act.id"
          style="position: relative; display: flex; flex-direction: column; gap: 10px"
        >
          <!-- Timeline Node Dot -->
          <div
            style="
              position: absolute;
              left: -28px;
              top: 6px;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 0 2px var(--primary);
              background: var(--primary);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 0.65rem;
              font-weight: 800;
            "
            :style="{
              background: act.status === 'completed' ? 'var(--success)' : act.delayMinutes > 0 ? 'var(--danger)' : 'var(--primary)',
              boxShadow: '0 0 0 2px ' + (act.status === 'completed' ? 'var(--success)' : act.delayMinutes > 0 ? 'var(--danger)' : 'var(--primary)'),
            }"
          >
            {{ idx + 1 }}
          </div>

          <!-- Activity Box -->
          <div
            style="
              background: var(--surface-subtle);
              border-radius: var(--radius-md);
              padding: 16px;
              border: 1px solid var(--surface-border);
            "
          >
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px">
              <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px">
                  <span
                    style="
                      font-weight: 800;
                      font-size: 0.88rem;
                      background: white;
                      padding: 4px 10px;
                      border-radius: var(--radius-sm);
                      border: 1px solid var(--surface-border);
                      color: var(--primary);
                    "
                  >
                    ⏰ {{ act.startTime }} – {{ act.endTime }}
                  </span>

                  <span
                    v-if="act.delayMinutes > 0"
                    class="badge badge-danger"
                  >
                    +{{ act.delayMinutes }}m Delayed
                  </span>

                  <span
                    v-if="act.status === 'completed'"
                    class="badge badge-success"
                  >
                    COMPLETED
                  </span>
                </div>

                <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-top: 6px">
                  {{ act.activityName }}
                </h3>
              </div>

              <!-- Quick action buttons -->
              <div style="display: flex; gap: 8px">
                <button
                  v-if="act.status !== 'completed'"
                  class="btn btn-secondary btn-sm"
                  style="font-size: 0.75rem"
                  @click="quickDelay(act.id, 15)"
                  title="Push schedule back by 15 mins"
                >
                  <FastForward :size="13" />
                  <span>+15m Delay</span>
                </button>

                <button
                  v-if="act.status !== 'completed'"
                  class="btn btn-outline btn-sm"
                  style="font-size: 0.75rem"
                  @click="markCompleted(act.id)"
                >
                  <CheckCircle2 :size="13" />
                  <span>Mark Done</span>
                </button>
              </div>
            </div>

            <!-- Details metadata -->
            <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.82rem; color: var(--text-muted); margin-top: 10px">
              <div style="display: flex; align-items: center; gap: 6px">
                <MapPin :size="14" style="color: var(--primary)" />
                <span>{{ act.location }}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px">
                <User :size="14" style="color: var(--primary)" />
                <span>Lead: <strong>{{ act.responsiblePerson }}</strong></span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px">
                <Phone :size="14" style="color: var(--primary)" />
                <a :href="'tel:' + act.phone" style="color: inherit; font-weight: 600">{{ act.phone }}</a>
              </div>
            </div>

            <p v-if="act.notes" style="font-size: 0.8rem; color: var(--text-main); margin-top: 8px; background: white; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px dashed var(--surface-border)">
              💡 <strong>Coordinator Notes:</strong> {{ act.notes }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Activity Modal -->
    <div v-if="isAddActivityModalOpen" class="modal-overlay" @click.self="isAddActivityModalOpen = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3 style="font-size: 1.15rem">Add Ceremony or Activity to Run Sheet</h3>
          <button class="btn-icon" @click="isAddActivityModalOpen = false">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Activity / Ceremony Name</label>
            <input
              v-model="newActivity.activityName"
              type="text"
              class="form-input"
              placeholder="e.g. Grand Entrance & Varmala"
            />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Start Time</label>
              <input v-model="newActivity.startTime" type="time" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">End Time</label>
              <input v-model="newActivity.endTime" type="time" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Location / Hall Section</label>
            <input
              v-model="newActivity.location"
              type="text"
              class="form-input"
              placeholder="e.g. Lawn Garden Pavilion"
            />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Responsible Lead Person</label>
              <input
                v-model="newActivity.responsiblePerson"
                type="text"
                class="form-input"
                placeholder="e.g. Ananya (Sister)"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Lead Phone Number</label>
              <input
                v-model="newActivity.phone"
                type="text"
                class="form-input"
                placeholder="+91 98450 00000"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Key Cues or Instructions</label>
            <textarea
              v-model="newActivity.notes"
              rows="2"
              class="form-textarea"
              placeholder="e.g. Sparkular fireworks to ignite right as the bride reaches mandap..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="isAddActivityModalOpen = false">Cancel</button>
          <button class="btn btn-primary" @click="handleAddActivity">Save Activity</button>
        </div>
      </div>
    </div>
  </div>
</template>
