<script setup lang="ts">
import { ref, reactive } from 'vue';
import { actions, formatCurrency } from '../../stores/eventStore';
import type { EventType } from '../../types/event';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  PartyPopper,
} from 'lucide-vue-next';

const currentStep = ref(1);

const form = reactive({
  name: '',
  eventType: 'wedding' as EventType,
  startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  timeZone: 'Asia/Kolkata',
  venueName: '',
  venueAddress: '',
  expectedGuestCount: 200,
  currency: 'INR',
  plannedBudgetMajor: 1000000, // ₹10,00,000
  theme: 'Pastel Garden Elegance',
  dressCode: 'Semi-Formal / Traditional Festive',
  specialInstructions: 'Valet parking at entrance.',
});

const eventTypeOptions: { value: EventType; label: string; icon: string }[] = [
  { value: 'wedding', label: 'Wedding & Pheras', icon: '💍' },
  { value: 'reception', label: 'Reception Gala', icon: '✨' },
  { value: 'birthday', label: 'Birthday Celebration', icon: '🎂' },
  { value: 'anniversary', label: 'Anniversary Party', icon: '🥂' },
  { value: 'engagement', label: 'Ring Engagement', icon: '💎' },
  { value: 'baby_shower', label: 'Baby Shower', icon: '🍼' },
  { value: 'corporate', label: 'Corporate Gala / Summit', icon: '💼' },
  { value: 'festival', label: 'Festival Gathering', icon: '🪔' },
  { value: 'custom', label: 'Custom Celebration', icon: '🎉' },
];

function nextStep() {
  if (currentStep.value < 5) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

function handleCreate() {
  if (!form.name.trim()) {
    form.name = `${form.eventType.toUpperCase()} Celebration`;
  }

  // Convert major to minor
  const plannedBudgetMinor = Math.round(Number(form.plannedBudgetMajor) * 100);

  actions.createEvent({
    name: form.name,
    eventType: form.eventType,
    startDate: form.startDate,
    endDate: form.endDate,
    timeZone: form.timeZone,
    venueName: form.venueName || 'To Be Finalized',
    venueAddress: form.venueAddress || 'City Center',
    expectedGuestCount: Number(form.expectedGuestCount) || 100,
    currency: form.currency,
    plannedBudgetMinor,
    theme: form.theme,
    dressCode: form.dressCode,
    specialInstructions: form.specialInstructions,
  });

  // Confetti explosion
  try {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  } catch (e) {
    console.log(e);
  }

  actions.closeCreateEventModal();
  actions.setActiveTab('dashboard');
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-box large">
      <!-- Modal Header -->
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px">
          <div
            style="
              width: 36px;
              height: 36px;
              border-radius: var(--radius-md);
              background: var(--primary-light);
              color: var(--primary);
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <Sparkles :size="20" />
          </div>
          <div>
            <h3 style="font-size: 1.2rem">New Event Guided Wizard</h3>
            <div style="font-size: 0.78rem; color: var(--text-muted)">
              Step {{ currentStep }} of 5:
              {{
                currentStep === 1
                  ? 'Event Basics'
                  : currentStep === 2
                  ? 'Date & Location'
                  : currentStep === 3
                  ? 'Budget & Guests'
                  : currentStep === 4
                  ? 'Preferences & Theme'
                  : 'Review & Initialize'
              }}
            </div>
          </div>
        </div>

        <button class="btn-icon" @click="actions.closeCreateEventModal()">
          <X :size="20" />
        </button>
      </div>

      <!-- Step Indicator Tracker -->
      <div style="padding: 14px 24px 0; background: #FAFAFA; border-bottom: 1px solid var(--surface-border)">
        <div style="display: flex; align-items: center; justify-content: space-between">
          <div
            v-for="step in 5"
            :key="step"
            style="display: flex; align-items: center; gap: 8px; flex: 1"
          >
            <div
              style="
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                font-weight: 700;
                transition: all 0.2s ease;
              "
              :style="{
                background: currentStep >= step ? 'var(--primary)' : 'var(--surface-subtle)',
                color: currentStep >= step ? 'white' : 'var(--text-muted)',
              }"
            >
              {{ currentStep > step ? '✓' : step }}
            </div>
            <div
              v-if="step < 5"
              style="flex: 1; height: 3px; background: var(--surface-border); border-radius: 99px; margin-right: 8px"
            >
              <div
                style="height: 100%; background: var(--primary); transition: width 0.2s ease"
                :style="{ width: currentStep > step ? '100%' : '0%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Body (Steps) -->
      <div class="modal-body">
        <!-- Step 1: Basics -->
        <div v-if="currentStep === 1" style="display: flex; flex-direction: column; gap: 18px">
          <div>
            <h4 style="font-size: 1.1rem; margin-bottom: 4px">What are you planning?</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted)">
              Select an event type so we can suggest checklist tasks and realistic budget allocations.
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">Event Name</label>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="e.g. Maya & Karthik's Sangeet & Reception"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Event Type</label>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px">
              <button
                v-for="opt in eventTypeOptions"
                :key="opt.value"
                type="button"
                style="
                  padding: 12px;
                  border-radius: var(--radius-md);
                  border: 1px solid;
                  text-align: left;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  transition: all 0.15s ease;
                "
                :style="{
                  borderColor: form.eventType === opt.value ? 'var(--primary)' : 'var(--surface-border)',
                  backgroundColor: form.eventType === opt.value ? 'var(--primary-light)' : 'white',
                }"
                @click="form.eventType = opt.value"
              >
                <span style="font-size: 1.3rem">{{ opt.icon }}</span>
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-main)">{{ opt.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Date & Location -->
        <div v-if="currentStep === 2" style="display: flex; flex-direction: column; gap: 18px">
          <div>
            <h4 style="font-size: 1.1rem; margin-bottom: 4px">When and where is it happening?</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted)">
              Dates help us calculate task deadlines and live countdown schedules.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input v-model="form.startDate" type="date" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">End Date (Optional)</label>
              <input v-model="form.endDate" type="date" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Venue / Banquet Name</label>
            <input
              v-model="form.venueName"
              type="text"
              class="form-input"
              placeholder="e.g. ITC Gardenia / Grand Lawn"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Venue Address & City</label>
            <input
              v-model="form.venueAddress"
              type="text"
              class="form-input"
              placeholder="e.g. Residency Road, Bengaluru"
            />
          </div>
        </div>

        <!-- Step 3: Budget & Guests -->
        <div v-if="currentStep === 3" style="display: flex; flex-direction: column; gap: 18px">
          <div>
            <h4 style="font-size: 1.1rem; margin-bottom: 4px">Estimate your budget & guest size</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted)">
              Set your target financial baseline. We will automatically generate category limits.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="form-group">
              <label class="form-label">Currency</label>
              <select v-model="form.currency" class="form-select">
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Target Planned Budget</label>
              <input
                v-model.number="form.plannedBudgetMajor"
                type="number"
                class="form-input"
                placeholder="1000000"
              />
              <span style="font-size: 0.75rem; color: var(--primary); font-weight: 600; margin-top: 4px">
                Equivalent: {{ formatCurrency(form.plannedBudgetMajor * 100, form.currency) }}
              </span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Expected Total Guests (Pax)</label>
            <input
              v-model.number="form.expectedGuestCount"
              type="number"
              class="form-input"
              placeholder="250"
            />
            <span style="font-size: 0.75rem; color: var(--text-muted)">
              Average cost per guest will be approximately
              {{ formatCurrency(Math.round((form.plannedBudgetMajor / (form.expectedGuestCount || 1)) * 100), form.currency) }}
            </span>
          </div>
        </div>

        <!-- Step 4: Preferences -->
        <div v-if="currentStep === 4" style="display: flex; flex-direction: column; gap: 18px">
          <div>
            <h4 style="font-size: 1.1rem; margin-bottom: 4px">Aesthetics & Preferences</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted)">
              Style details to share with vendors, decorators, and guests.
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">Color Theme / Mood</label>
            <input
              v-model="form.theme"
              type="text"
              class="form-input"
              placeholder="e.g. Royal Ivory & Blushing Rose Gold"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Guest Dress Code</label>
            <input
              v-model="form.dressCode"
              type="text"
              class="form-input"
              placeholder="e.g. Traditional Festive / Indo-Western"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Special Notes / Run Sheet Instructions</label>
            <textarea
              v-model="form.specialInstructions"
              rows="3"
              class="form-textarea"
              placeholder="Any critical notes, entrance gate guidelines, special dietary focus..."
            ></textarea>
          </div>
        </div>

        <!-- Step 5: Review & Initialize -->
        <div v-if="currentStep === 5" style="display: flex; flex-direction: column; gap: 18px">
          <div>
            <h4 style="font-size: 1.1rem; margin-bottom: 4px">Ready to launch your event!</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted)">
              Confirm the details below. We'll pre-populate suggested task checklists and category budgets.
            </p>
          </div>

          <div
            style="
              background: var(--surface-subtle);
              border-radius: var(--radius-md);
              padding: 16px;
              border: 1px solid var(--surface-border);
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px;
            "
          >
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted)">EVENT NAME</div>
              <div style="font-weight: 700; font-size: 0.95rem">{{ form.name || 'Untitled Event' }}</div>
            </div>

            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted)">EVENT TYPE</div>
              <div style="font-weight: 700; font-size: 0.95rem; text-transform: uppercase; color: var(--primary)">
                {{ form.eventType }}
              </div>
            </div>

            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted)">TARGET DATE</div>
              <div style="font-weight: 600; font-size: 0.9rem">📅 {{ form.startDate }}</div>
            </div>

            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted)">LOCATION / VENUE</div>
              <div style="font-weight: 600; font-size: 0.9rem">📍 {{ form.venueName || 'City Center' }}</div>
            </div>

            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted)">BUDGET CEILING</div>
              <div style="font-weight: 800; font-size: 1.1rem; color: var(--primary)">
                {{ formatCurrency(form.plannedBudgetMajor * 100, form.currency) }}
              </div>
            </div>

            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted)">EXPECTED GUESTS</div>
              <div style="font-weight: 700; font-size: 1rem">👥 {{ form.expectedGuestCount }} Pax</div>
            </div>
          </div>

          <div
            style="
              padding: 12px 14px;
              border-radius: var(--radius-md);
              background: var(--primary-light);
              border: 1px solid #99F6E4;
              font-size: 0.82rem;
              color: var(--primary);
              display: flex;
              align-items: center;
              gap: 10px;
            "
          >
            <PartyPopper :size="18" />
            <span>
              <strong>Smart Auto-seeding:</strong> Relevant checklist items (venue booking, menu tasting, invitations) and budget categories will be automatically initialized for you!
            </span>
          </div>
        </div>
      </div>

      <!-- Modal Footer Navigation -->
      <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center">
        <button
          v-if="currentStep === 1"
          class="btn btn-secondary btn-cancel-create"
          @click="actions.closeCreateEventModal()"
        >
          Cancel
        </button>
        <button
          v-else-if="currentStep > 1"
          class="btn btn-secondary"
          @click="prevStep"
        >
          <ArrowLeft :size="16" />
          <span>Back</span>
        </button>
        <div v-else></div>

        <button
          v-if="currentStep < 5"
          class="btn btn-primary"
          @click="nextStep"
        >
          <span>Continue</span>
          <ArrowRight :size="16" />
        </button>

        <button
          v-else
          class="btn btn-primary"
          @click="handleCreate"
        >
          <Sparkles :size="16" />
          <span>Create & Seed Event</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 540px) {
  div[style*="grid-template-columns: 1fr 1fr"] {
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }
  div[style*="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))"] {
    grid-template-columns: 1fr 1fr !important;
    gap: 6px !important;
  }
}
</style>
