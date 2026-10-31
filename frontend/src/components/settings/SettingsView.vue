<script setup lang="ts">
import {
  currentEvent,
  actions,
} from '../../stores/eventStore';
import { authState } from '../../stores/authStore';
import {
  RotateCcw,
  User,
  Coins,
  Database,
  Trash2,
} from 'lucide-vue-next';

function handleReset() {
  if (confirm('Reset workspace back to initial celebration template data?')) {
    actions.resetToMockDefaults();
    alert('Workspace template data successfully reloaded!');
  }
}

function handleClearData() {
  if (confirm('Clear all local workspace events and plans? This will reset your active workspace to a clean state.')) {
    actions.clearUserData();
    alert('Local workspace cleared.');
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px; max-width: 900px">
    <div>
      <h2 style="font-size: 1.6rem">Settings & Preferences</h2>
      <p style="font-size: 0.88rem; color: var(--text-muted)">
        Configure user session, display preferences, and workspace storage management.
      </p>
    </div>

    <!-- User Profile Card -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <User :size="18" style="color: var(--primary)" />
          <span>Active User Profile</span>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px">
        <div
          style="
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0284C7, #0F766E);
            color: white;
            font-size: 1.3rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          {{ (authState.user?.displayName || 'Jayaraj Kannan').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() }}
        </div>
        <div>
          <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-main)">
            {{ authState.user?.displayName || 'Jayaraj Kannan' }}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted)">
            {{ authState.user?.email || 'jayaraj.kannan@plancraft.dev' }} • Event Organizer
          </div>
          <div style="display: flex; gap: 8px; margin-top: 6px">
            <span v-if="authState.user" class="badge badge-success">Firebase Auth Synced</span>
            <span v-else class="badge badge-success">Workspace Active</span>
            <span class="badge badge-info">Role: Event Owner</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Currency and Regional Settings -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <Coins :size="18" style="color: var(--primary)" />
          <span>Currency & Regional Format</span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px">
        <div class="form-group">
          <label class="form-label">Active Event Currency</label>
          <select
            class="form-select"
            :value="currentEvent.currency"
            @change="(e) => currentEvent.currency = (e.target as HTMLSelectElement).value"
          >
            <option value="INR">INR (₹ - Indian Rupee / Lakhs format)</option>
            <option value="USD">USD ($ - US Dollar)</option>
            <option value="EUR">EUR (€ - Euro)</option>
          </select>
          <span style="font-size: 0.75rem; color: var(--text-muted)">
            All budget metrics and expense breakdowns automatically adapt to this currency symbol and grouping.
          </span>
        </div>
      </div>
    </div>

    <!-- Data Controls / Workspace Management -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <Database :size="18" style="color: var(--primary)" />
          <span>Workspace Storage & Cache</span>
        </div>
      </div>

      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px">
        All changes (added tasks, guests, expenses, checked milestones, new events) persist securely in your browser's local storage and synchronize in real-time with Google Cloud.
      </p>

      <div style="display: flex; gap: 12px; flex-wrap: wrap">
        <button
          class="btn btn-secondary"
          @click="handleReset"
        >
          <RotateCcw :size="16" />
          <span>Reset Workspace Data</span>
        </button>
        <button
          class="btn btn-secondary"
          style="border-color: var(--danger); color: var(--danger)"
          @click="handleClearData"
        >
          <Trash2 :size="16" />
          <span>Clear Local Workspace</span>
        </button>
      </div>
    </div>
  </div>
</template>
