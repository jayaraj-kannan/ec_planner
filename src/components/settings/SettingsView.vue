<script setup lang="ts">
import {
  currentEvent,
  actions,
} from '../../stores/eventStore';
import {
  RotateCcw,
  User,
  Coins,
  Database,
} from 'lucide-vue-next';

function handleReset() {
  if (confirm('Reset all mock data back to hackathon defaults? Any custom events or tasks created will be restored.')) {
    actions.resetToMockDefaults();
    alert('Mock state successfully restored to initial demo seeds!');
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px; max-width: 900px">
    <div>
      <h2 style="font-size: 1.6rem">Settings & Preferences</h2>
      <p style="font-size: 0.88rem; color: var(--text-muted)">
        Configure mock user session, display preferences, and test data management.
      </p>
    </div>

    <!-- User Profile Card -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <User :size="18" style="color: var(--primary)" />
          <span>Active User Profile (Mock Identity)</span>
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
          JK
        </div>
        <div>
          <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-main)">
            Jayaraj Kannan
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted)">
            jayaraj.kannan@hackathon.dev • Event Owner (Super Admin)
          </div>
          <div style="display: flex; gap: 8px; margin-top: 6px">
            <span class="badge badge-success">Firebase Auth Mock Session</span>
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

    <!-- Data Controls / Demo Reset -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <Database :size="18" style="color: var(--primary)" />
          <span>Hackathon Demo Data Controls</span>
        </div>
      </div>

      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px">
        All changes (added tasks, guests, expenses, checked milestones, new events) persist in your browser's local storage.
        Use this button anytime during a demo presentation to quickly reset back to clean initial demo data.
      </p>

      <div>
        <button
          class="btn btn-secondary"
          style="border-color: var(--warning); color: var(--warning)"
          @click="handleReset"
        >
          <RotateCcw :size="16" />
          <span>Reset All Mock Data to Default</span>
        </button>
      </div>
    </div>
  </div>
</template>
