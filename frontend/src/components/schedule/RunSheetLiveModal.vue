<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  currentEvent,
  eventSchedule,
  actions,
  getPublicRunSheetUrl,
} from '../../stores/eventStore';
import {
  X,
  Phone,
  FastForward,
  CheckCircle2,
  PlayCircle,
  ShieldAlert,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Globe,
  Zap,
} from 'lucide-vue-next';
import { runSheetWsService } from '../../services/websocket.service';

const currentTime = ref('');
const copied = ref(false);

const isRunSheetLaunched = computed(() => !!currentEvent.value?.isRunSheetLaunched);

const publicRunSheetUrl = computed(() => {
  return currentEvent.value ? getPublicRunSheetUrl(currentEvent.value.id) : '';
});

function toggleLaunch() {
  if (!currentEvent.value) return;
  if (isRunSheetLaunched.value) {
    actions.unpublishRunSheet(currentEvent.value.id);
  } else {
    actions.launchRunSheet(currentEvent.value.id);
  }
}

async function copyShareUrl() {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(publicRunSheetUrl.value);
    }
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2500);
  } catch (err) {
    console.warn('Copy failed:', err);
  }
}

async function shareRunSheet() {
  if (!currentEvent.value) return;
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `${currentEvent.value.name} — Live Run Sheet`,
        text: `Watch the live itinerary and schedule updates for ${currentEvent.value.name}:`,
        url: publicRunSheetUrl.value,
      });
      return;
    } catch {
      // Fallback
    }
  }
  await copyShareUrl();
}

function openPublicView() {
  if (currentEvent.value) {
    actions.openPublicRunSheet(currentEvent.value.id);
  }
}

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
        background: #0F081D;
        color: #F8FAFC;
        border: 1px solid rgba(178, 108, 255, 0.3);
        box-shadow: 0 20px 40px rgba(15, 8, 29, 0.8), 0 0 24px rgba(178, 108, 255, 0.15);
      "
    >
      <!-- Mobile Run Sheet Header -->
      <div
        style="
          padding: 16px 20px;
          border-bottom: 1px solid rgba(178, 108, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(135deg, #1C0F2B 0%, #2A123D 100%);
        "
      >
        <div style="display: flex; align-items: center; gap: 10px">
          <div
            style="
              width: 34px;
              height: 34px;
              border-radius: 50%;
              background: linear-gradient(135deg, #FF6082 0%, #B26CFF 100%);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(255, 96, 130, 0.4);
            "
          >
            <PlayCircle :size="20" />
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #B26CFF; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em">
              LIVE COORDINATOR RUN SHEET
            </div>
            <div style="font-weight: 800; font-size: 1.05rem; color: #FFFFFF">
              {{ currentEvent?.name }}
            </div>
          </div>
        </div>

        <button
          class="btn-icon"
          style="color: #FFE4F6"
          @click="actions.closeRunSheetLiveModal()"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Live Clock & Status Bar -->
      <div
        style="
          padding: 14px 20px;
          background: #140A22;
          border-bottom: 1px solid rgba(178, 108, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <div>
          <div style="font-size: 0.72rem; color: #9C8EAE; text-transform: uppercase; font-weight: 600">CURRENT TIME (IST)</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: #FFE4F6; font-family: monospace; text-shadow: 0 0 10px rgba(255, 228, 246, 0.3)">
            {{ currentTime }}
          </div>
        </div>

        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px">
          <div style="display: flex; gap: 6px; align-items: center">
            <span class="badge badge-success" style="font-size: 0.72rem">
              ● SYSTEM ONLINE
            </span>
            <span
              class="badge"
              style="font-size: 0.7rem; background: rgba(178, 108, 255, 0.15); color: #FFE4F6; border: 1px solid rgba(178, 108, 255, 0.35); display: inline-flex; align-items: center; gap: 3px"
            >
              <Zap :size="10" />
              <span>WS SYNC</span>
            </span>
          </div>
          <div style="font-size: 0.72rem; color: #C3B4D2">
            {{ currentEvent?.startDate }}
          </div>
        </div>
      </div>

      <!-- Public Shareable Run Sheet URL -->
      <div
        style="
          padding: 12px 20px;
          background: #180D2B;
          border-bottom: 1px solid rgba(178, 108, 255, 0.2);
          display: flex;
          flex-direction: column;
          gap: 8px;
        "
      >
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 0.74rem; font-weight: 700; color: #FF6082; letter-spacing: 0.05em; text-transform: uppercase">
            <Globe :size="14" />
            <span>Public Attendee Share URL</span>
            <span
              class="badge"
              :style="{
                fontSize: '0.68rem',
                background: isRunSheetLaunched ? 'rgba(255, 96, 130, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isRunSheetLaunched ? '#FF6082' : '#FBBF24',
                border: isRunSheetLaunched ? '1px solid rgba(255, 96, 130, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
              }"
            >
              {{ isRunSheetLaunched ? '● LIVE LAUNCHED' : '○ UNPUBLISHED' }}
            </span>
          </div>
          <span style="font-size: 0.7rem; color: #9C8EAE">
            {{ isRunSheetLaunched ? 'Guests & family watch schedule without signing in' : 'Attendees see Standby screen until launched' }}
          </span>
        </div>

        <div v-if="isRunSheetLaunched" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap">
          <input
            type="text"
            readonly
            :value="publicRunSheetUrl"
            style="
              flex: 1;
              min-width: 200px;
              background: #140A22;
              border: 1px solid rgba(178, 108, 255, 0.3);
              border-radius: 6px;
              color: #FFE4F6;
              font-family: monospace;
              font-size: 0.78rem;
              padding: 6px 10px;
            "
            @focus="($event.target as HTMLInputElement)?.select()"
          />

          <button
            class="btn btn-sm"
            style="background: #FF6082; color: white; display: flex; align-items: center; gap: 5px; flex-shrink: 0; font-weight: 700; border: none"
            @click="copyShareUrl"
          >
            <component :is="copied ? Check : Copy" :size="14" />
            <span>{{ copied ? 'Copied' : 'Copy' }}</span>
          </button>

          <button
            class="btn btn-sm"
            style="background: rgba(178, 108, 255, 0.2); color: #FFE4F6; border: 1px solid rgba(178, 108, 255, 0.35); display: flex; align-items: center; gap: 5px; flex-shrink: 0"
            @click="shareRunSheet"
            title="Share with attendees"
          >
            <Share2 :size="14" />
            <span>Share</span>
          </button>

          <button
            class="btn btn-sm"
            style="background: linear-gradient(135deg, #705EFF 0%, #B26CFF 100%); color: white; border: none; font-weight: 700; display: flex; align-items: center; gap: 5px; flex-shrink: 0"
            @click="openPublicView"
            title="Open public attendee view"
          >
            <ExternalLink :size="14" />
            <span>View</span>
          </button>

          <button
            class="btn btn-sm btn-secondary"
            style="border-color: rgba(178, 108, 255, 0.35); color: #C3B4D2; font-size: 0.75rem; background: transparent"
            @click="toggleLaunch"
            title="Pause live access for attendees"
          >
            Pause Live
          </button>
        </div>

        <div v-else style="display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 6px 0; flex-wrap: wrap">
          <span style="font-size: 0.8rem; color: #FBBF24">
            ⚠️ Live run sheet is currently offline. No public URL generated for guests.
          </span>
          <button
            class="btn btn-sm btn-primary"
            style="background: linear-gradient(135deg, #FF6082 0%, #B26CFF 100%); border: none; color: white; font-weight: 700; box-shadow: 0 4px 12px rgba(255, 96, 130, 0.3)"
            @click="toggleLaunch"
          >
            🚀 Launch Live Run Sheet & Generate URL
          </button>
        </div>
      </div>

      <!-- Run Sheet Activities List -->
      <div class="modal-body" style="padding: 16px; display: flex; flex-direction: column; gap: 14px; background: #0F081D">
        <div
          v-for="(act, idx) in eventSchedule"
          :key="act.id"
          style="
            background: #180D2B;
            border-radius: var(--radius-md);
            border: 1px solid rgba(178, 108, 255, 0.2);
            padding: 16px;
            position: relative;
          "
          :style="{
            borderLeft: act.status === 'completed' ? '4px solid #10B981' : act.delayMinutes > 0 ? '4px solid #EF4444' : '4px solid #FF6082',
            boxShadow: act.status !== 'completed' && act.delayMinutes === 0 ? '0 2px 12px rgba(255, 96, 130, 0.15)' : 'none',
          }"
        >
          <!-- Sequence Badge -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px">
            <div style="display: flex; align-items: center; gap: 8px">
              <span
                style="
                  background: rgba(178, 108, 255, 0.25);
                  color: #FFE4F6;
                  font-size: 0.75rem;
                  font-weight: 700;
                  padding: 2px 8px;
                  border-radius: 4px;
                "
              >
                #{{ idx + 1 }}
              </span>
              <span style="font-family: monospace; font-size: 0.95rem; font-weight: 800; color: #FFE4F6">
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
              class="badge"
              style="font-size: 0.7rem; background: rgba(112, 94, 255, 0.15); color: #B26CFF; border: 1px solid rgba(112, 94, 255, 0.3)"
            >
              UPCOMING
            </span>
          </div>

          <h4 style="font-size: 1.1rem; color: #FFFFFF; margin-bottom: 8px; font-weight: 700">
            {{ act.activityName }}
          </h4>

          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.82rem; color: #C3B4D2; margin-bottom: 12px">
            <div>📍 Location: <strong style="color: #FFFFFF">{{ act.location }}</strong></div>
            <div>👤 Lead: <strong style="color: #FFFFFF">{{ act.responsiblePerson }}</strong></div>
            <div v-if="act.notes" style="color: #E2CFE9; font-style: italic; margin-top: 4px; background: rgba(28, 15, 43, 0.7); border-left: 2px solid #B26CFF; padding: 4px 8px; border-radius: 4px">
              💡 "{{ act.notes }}"
            </div>
          </div>

          <!-- Bottom Action Buttons: Call Lead + Quick Delay + Mark Complete -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap; border-top: 1px solid rgba(178, 108, 255, 0.2); padding-top: 10px">
            <a
              :href="'tel:' + act.phone"
              class="btn btn-sm"
              style="background: rgba(178, 108, 255, 0.2); color: #FFE4F6; border: 1px solid rgba(178, 108, 255, 0.35); text-decoration: none; font-weight: 600"
            >
              <Phone :size="14" style="color: #FF6082" />
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
          background: #140A22;
          border-top: 1px solid rgba(178, 108, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.78rem;
          color: #C3B4D2;
        "
      >
        <div style="display: flex; align-items: center; gap: 6px">
          <ShieldAlert :size="16" style="color: #FF6082" />
          <span>Venue Emergency Desk: +91 80 6660 5678</span>
        </div>
        <button
          class="btn btn-secondary btn-sm"
          style="background: rgba(178, 108, 255, 0.2); color: #FFE4F6; border: 1px solid rgba(178, 108, 255, 0.35)"
          @click="actions.closeRunSheetLiveModal()"
        >
          Exit Run Sheet
        </button>
      </div>
    </div>
  </div>
</template>
