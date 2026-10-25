<script setup lang="ts">
import {
  eventArrangements,
  actions,
} from '../../stores/eventStore';
import {
  Clock,
  User,
  Building,
  ShieldCheck,
} from 'lucide-vue-next';

function setStatus(arrId: string, status: 'ready' | 'in_progress' | 'pending') {
  actions.updateArrangementStatus(arrId, status);
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px">
      <div>
        <h2 style="font-size: 1.6rem">Arrangements & Logistics Readiness</h2>
        <p style="font-size: 0.88rem; color: var(--text-muted)">
          Section 6.8: Track physical setups, power backups, stage rigging, flower installations, and security desks.
        </p>
      </div>

      <div style="display: flex; align-items: center; gap: 10px">
        <span class="badge badge-success" style="font-size: 0.82rem; padding: 6px 14px">
          <ShieldCheck :size="15" />
          <span>{{ eventArrangements.filter(a => a.status === 'ready').length }} of {{ eventArrangements.length }} Setups Ready</span>
        </span>
      </div>
    </div>

    <!-- Arrangements Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 18px">
      <div
        v-for="arr in eventArrangements"
        :key="arr.id"
        class="card"
        style="display: flex; flex-direction: column; justify-content: space-between"
      >
        <div>
          <!-- Header: Category & Priority -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
            <span class="badge badge-neutral" style="font-size: 0.72rem">
              {{ arr.category }}
            </span>

            <span
              v-if="arr.status === 'ready'"
              class="badge badge-success"
            >
              ✓ READY ON SITE
            </span>
            <span
              v-else-if="arr.status === 'in_progress'"
              class="badge badge-warning"
            >
              ⏳ IN PROGRESS
            </span>
            <span
              v-else
              class="badge badge-danger"
            >
              PENDING SETUP
            </span>
          </div>

          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 10px">
            {{ arr.item }}
          </h3>

          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.82rem; color: var(--text-muted)">
            <div style="display: flex; align-items: center; gap: 8px">
              <User :size="14" style="color: var(--primary)" />
              <span>Owner: <strong>{{ arr.owner }}</strong></span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px">
              <Building :size="14" style="color: var(--primary)" />
              <span>Provider: {{ arr.vendorName }}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px">
              <Clock :size="14" style="color: var(--primary)" />
              <span>Due Inspection: <strong>{{ arr.dueTime }}</strong></span>
            </div>
          </div>

          <p v-if="arr.notes" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 10px; background: var(--surface-subtle); padding: 8px; border-radius: var(--radius-sm)">
            📋 {{ arr.notes }}
          </p>
        </div>

        <!-- Status Change Quick Buttons -->
        <div style="border-top: 1px solid var(--surface-border); padding-top: 14px; margin-top: 14px; display: flex; gap: 8px">
          <button
            class="btn btn-sm"
            style="flex: 1; font-size: 0.75rem"
            :class="arr.status === 'ready' ? 'btn-primary' : 'btn-secondary'"
            @click="setStatus(arr.id, 'ready')"
          >
            ✓ Ready
          </button>
          <button
            class="btn btn-sm"
            style="flex: 1; font-size: 0.75rem"
            :class="arr.status === 'in_progress' ? 'btn-primary' : 'btn-secondary'"
            @click="setStatus(arr.id, 'in_progress')"
          >
            In Progress
          </button>
          <button
            class="btn btn-sm"
            style="flex: 1; font-size: 0.75rem"
            :class="arr.status === 'pending' ? 'btn-primary' : 'btn-secondary'"
            @click="setStatus(arr.id, 'pending')"
          >
            Pending
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
