<script setup lang="ts">
import { ref, reactive } from 'vue';
import {
  currentEvent,
  eventVendors,
  formatCurrency,
  actions,
} from '../../stores/eventStore';
import type { VendorStatus } from '../../types/event';
import {
  Plus,
  Phone,
  Mail,
  Star,
  X,
} from 'lucide-vue-next';

const isAddVendorModalOpen = ref(false);

const newVendor = reactive({
  name: '',
  category: 'Catering',
  contactPerson: '',
  mobileNumber: '',
  email: '',
  agreedPriceMajor: 50000,
  advancePaidMajor: 15000,
  status: 'Contract Signed' as VendorStatus,
  rating: 5,
  notes: '',
});

function handleAddVendor() {
  if (!currentEvent.value || !newVendor.name.trim()) return;

  actions.addVendor({
    eventId: currentEvent.value.id,
    name: newVendor.name,
    category: newVendor.category,
    contactPerson: newVendor.contactPerson || newVendor.name,
    mobileNumber: newVendor.mobileNumber,
    email: newVendor.email,
    agreedPriceMinor: Math.round(Number(newVendor.agreedPriceMajor) * 100),
    advancePaidMinor: Math.round(Number(newVendor.advancePaidMajor) * 100),
    status: newVendor.status,
    rating: Number(newVendor.rating) || 5,
    notes: newVendor.notes,
  });

  newVendor.name = '';
  newVendor.contactPerson = '';
  newVendor.mobileNumber = '';
  isAddVendorModalOpen.value = false;
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px">
      <div>
        <h2 style="font-size: 1.6rem">Vendor Directory & Contracts</h2>
        <p style="font-size: 0.88rem; color: var(--text-muted)">
          Manage partner agreements, committed contract values, advance disbursements, and outstanding balances.
        </p>
      </div>

      <button class="btn btn-primary" @click="isAddVendorModalOpen = true">
        <Plus :size="16" />
        <span>Add Partner Vendor</span>
      </button>
    </div>

    <!-- Vendor Cards Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px">
      <div v-for="v in eventVendors" :key="v.id" class="card"
        style="display: flex; flex-direction: column; justify-content: space-between">
        <div>
          <!-- Top Row: Category & Status -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
            <span class="badge badge-neutral" style="font-size: 0.75rem">
              {{ v.category }}
            </span>
            <span class="badge" :class="{
              'badge-success': v.status === 'Contract Signed',
              'badge-warning': v.status === 'Quoted',
              'badge-info': v.status === 'In Discussion',
            }">
              {{ v.status }}
            </span>
          </div>

          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px; color: var(--text-main)">
            {{ v.name }}
          </h3>

          <div
            style="display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: #D97706; margin-bottom: 12px">
            <Star :size="14" fill="#D97706" />
            <span style="font-weight: 700">{{ v.rating || '4.8' }} / 5.0</span>
            <span style="color: var(--text-muted)">• Primary Contact: {{ v.contactPerson }}</span>
          </div>

          <!-- Financial summary box -->
          <div style="
              background: var(--surface-subtle);
              border-radius: var(--radius-md);
              padding: 12px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 14px;
            ">
            <div>
              <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase">Agreed Contract</div>
              <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main)">
                {{ formatCurrency(v.agreedPriceMinor, currentEvent?.currency) }}
              </div>
            </div>

            <div>
              <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase">Advance Paid</div>
              <div style="font-weight: 700; font-size: 0.95rem; color: var(--success)">
                {{ formatCurrency(v.advancePaidMinor, currentEvent?.currency) }}
              </div>
            </div>

            <div
              style="grid-column: span 2; border-top: 1px solid var(--surface-border); padding-top: 6px; display: flex; justify-content: space-between; font-size: 0.75rem">
              <span style="color: var(--text-muted)">Outstanding Balance:</span>
              <span style="font-weight: 800; color: var(--warning)">
                {{ formatCurrency(Math.max(0, v.agreedPriceMinor - v.advancePaidMinor), currentEvent?.currency) }}
              </span>
            </div>
          </div>

          <!-- Contact details -->
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: var(--text-muted)">
            <div style="display: flex; align-items: center; gap: 8px">
              <Phone :size="14" style="color: var(--primary)" />
              <a :href="'tel:' + v.mobileNumber" style="color: inherit">{{ v.mobileNumber }}</a>
            </div>
            <div style="display: flex; align-items: center; gap: 8px">
              <Mail :size="14" style="color: var(--primary)" />
              <a :href="'mailto:' + v.email" style="color: inherit">{{ v.email }}</a>
            </div>
          </div>

          <p v-if="v.notes" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 10px; font-style: italic">
            "{{ v.notes }}"
          </p>
        </div>

        <div
          style="padding-top: 14px; border-top: 1px solid var(--surface-border); margin-top: 14px; display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 0.75rem; color: var(--text-light)">
            Verified Vendor Partner
          </span>

          <a :href="'tel:' + v.mobileNumber" class="btn btn-outline btn-sm">
            <Phone :size="14" />
            <span>Call Partner</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Add Vendor Modal -->
    <div v-if="isAddVendorModalOpen" class="modal-overlay" @click.self="isAddVendorModalOpen = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3 style="font-size: 1.15rem">Add Vendor Partner</h3>
          <button class="btn-icon" @click="isAddVendorModalOpen = false">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Vendor Company / Business Name</label>
            <input v-model="newVendor.name" type="text" class="form-input"
              placeholder="e.g. Royal Stage Lights & Trussing" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Service Category</label>
              <input v-model="newVendor.category" type="text" class="form-input"
                placeholder="e.g. Floral, Stage, Photography..." />
            </div>

            <div class="form-group">
              <label class="form-label">Contact Person Name</label>
              <input v-model="newVendor.contactPerson" type="text" class="form-input" placeholder="e.g. Sandeep Roy" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Mobile Number</label>
              <input v-model="newVendor.mobileNumber" type="text" class="form-input" placeholder="+91 98450 11223" />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input v-model="newVendor.email" type="email" class="form-input" placeholder="partner@vendor.com" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Total Agreed Price (₹)</label>
              <input v-model.number="newVendor.agreedPriceMajor" type="number" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Advance Paid (₹)</label>
              <input v-model.number="newVendor.advancePaidMajor" type="number" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Contract Status</label>
            <select v-model="newVendor.status" class="form-select">
              <option value="Contract Signed">Contract Signed</option>
              <option value="Quoted">Quoted</option>
              <option value="In Discussion">In Discussion</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Deliverables & Deliverable Notes</label>
            <textarea v-model="newVendor.notes" rows="2" class="form-textarea"
              placeholder="e.g. Includes 4 photographers, 2 drone pilots, same-day teaser..."></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="isAddVendorModalOpen = false">Cancel</button>
          <button class="btn btn-primary" @click="handleAddVendor">Save Vendor</button>
        </div>
      </div>
    </div>
  </div>
</template>
