<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  currentEvent,
  eventSchedule,
  actions,
} from '../../stores/eventStore';
import {
  X,
  Phone,
  FastForward,
  CheckCircle2,
  PlayCircle,
  ShieldAlert,
} from 'lucide-vue-next';

const currentTime = ref('');

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

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

function handleDelay(actId: string, mins: number) {
  actions.reportScheduleDelay(actId, mins);
}

function handleDone(actId: string) {
  actions.updateScheduleStatus(actId, 'completed');
}
</script>

<template>
  <div class="modal-overlay" style="padding: 10px" @click.self="actions.closeRunSheetLiveModal()">
    <div
      class="modal-box large"
      style="
        max-width: 600px;
        height: 92vh;
        background: #0F172A;
        color: white;
        border: 1px solid #334155;
      "
    >
      <!-- Mobile Run Sheet Header -->
      <div
        style="
          padding: 16px 20px;
          border-bottom: 1px solid #334155;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #1E293B;
        "
      >
        <div style="display: flex; align-items: center; gap: 10px">
          <div
            style="
              width: 34px;
              height: 34px;
              border-radius: 50%;
              background: #10B981;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <PlayCircle :size="20" />
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #94A3B8; text-transform: uppercase; font-weight: 700">
              LIVE COORDINATOR RUN SHEET
            </div>
            <div style="font-weight: 700; font-size: 1.05rem; color: white">
              {{ currentEvent.name }}
            </div>
          </div>
        </div>

        <button
          class="btn-icon"
          style="color: #94A3B8"
          @click="actions.closeRunSheetLiveModal()"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Live Clock & Status Bar -->
      <div
        style="
          padding: 14px 20px;
          background: #0B1120;
          border-bottom: 1px solid #334155;
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <div>
          <div style="font-size: 0.72rem; color: #64748B; text-transform: uppercase">CURRENT TIME (IST)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: #38BDF8; font-family: monospace">
            {{ currentTime }}
          </div>
        </div>

        <div style="text-align: right">
          <span class="badge badge-success" style="font-size: 0.75rem">
            ● SYSTEM ONLINE
          </span>
          <div style="font-size: 0.72rem; color: #94A3B8; margin-top: 2px">
            {{ currentEvent.startDate }}
          </div>
        </div>
      </div>

      <!-- Run Sheet Activities List -->
      <div class="modal-body" style="padding: 16px; display: flex; flex-direction: column; gap: 14px">
        <div
          v-for="(act, idx) in eventSchedule"
          :key="act.id"
          style="
            background: #1E293B;
            border-radius: var(--radius-md);
            border: 1px solid #334155;
            padding: 16px;
            position: relative;
          "
          :style="{
            borderLeft: act.status === 'completed' ? '4px solid #10B981' : act.delayMinutes > 0 ? '4px solid #EF4444' : '4px solid #38BDF8',
          }"
        >
          <!-- Sequence Badge -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px">
            <div style="display: flex; align-items: center; gap: 8px">
              <span
                style="
                  background: #334155;
                  color: #E2E8F0;
                  font-size: 0.75rem;
                  font-weight: 700;
                  padding: 2px 8px;
                  border-radius: 4px;
                "
              >
                #{{ idx + 1 }}
              </span>
              <span style="font-family: monospace; font-size: 0.95rem; font-weight: 800; color: #38BDF8">
                {{ act.startTime }} - {{ act.endTime }}
              </span>
            </div>

            <!-- Status Indicator -->
            <span
              v-if="act.status === 'completed'"
              class="badge badge-success"
              style="font-size: 0.7rem"
            >
              ✓ COMPLETED
            </span>
            <span
              v-else-if="act.delayMinutes > 0"
              class="badge badge-danger"
              style="font-size: 0.7rem"
            >
              +{{ act.delayMinutes }}m DELAYED
            </span>
            <span
              v-else
              class="badge badge-info"
              style="font-size: 0.7rem"
            >
              UPCOMING
            </span>
          </div>

          <h4 style="font-size: 1.1rem; color: white; margin-bottom: 8px">
            {{ act.activityName }}
          </h4>

          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.82rem; color: #94A3B8; margin-bottom: 12px">
            <div>📍 Location: <strong style="color: #E2E8F0">{{ act.location }}</strong></div>
            <div>👤 Lead: <strong style="color: #E2E8F0">{{ act.responsiblePerson }}</strong></div>
            <div v-if="act.notes" style="color: #CBD5E1; font-style: italic; margin-top: 4px">
              "{{ act.notes }}"
            </div>
          </div>

          <!-- Bottom Action Buttons: Call Lead + Quick Delay + Mark Complete -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap; border-top: 1px solid #334155; padding-top: 10px">
            <a
              :href="'tel:' + act.phone"
              class="btn btn-sm"
              style="background: #334155; color: white"
            >
              <Phone :size="14" style="color: #38BDF8" />
              <span>Call Lead</span>
            </a>

            <button
              v-if="act.status !== 'completed'"
              class="btn btn-sm"
              style="background: #451A03; color: #F59E0B; border: 1px solid #78350F"
              @click="handleDelay(act.id, 15)"
            >
              <FastForward :size="14" />
              <span>+15m Delay</span>
            </button>

            <button
              v-if="act.status !== 'completed'"
              class="btn btn-sm"
              style="background: #064E3B; color: #34D399; border: 1px solid #047857; margin-left: auto"
              @click="handleDone(act.id)"
            >
              <CheckCircle2 :size="14" />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Emergency Hotline Strip -->
      <div
        style="
          padding: 12px 20px;
          background: #1E293B;
          border-top: 1px solid #334155;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.78rem;
          color: #94A3B8;
        "
      >
        <div style="display: flex; align-items: center; gap: 6px">
          <ShieldAlert :size="16" style="color: #EF4444" />
          <span>Venue Emergency Desk: +91 80 6660 5678</span>
        </div>
        <button
          class="btn btn-secondary btn-sm"
          style="background: #334155; color: white"
          @click="actions.closeRunSheetLiveModal()"
        >
          Exit Run Sheet
        </button>
      </div>
    </div>
  </div>
</template>
