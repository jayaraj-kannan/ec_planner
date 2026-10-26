<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import {
  currentEvent,
  budgetMetrics,
  eventExpenses,
  eventCategories,
  formatCurrency,
  actions,
} from '../../stores/eventStore';
import type { PaymentStatus } from '../../types/event';
import {
  Plus,
  Receipt,
  Building,
  Trash2,
  X,
  FileUp,
} from 'lucide-vue-next';

const selectedCategory = ref<string>('all');
const selectedStatus = ref<string>('all');
const isAddExpenseModalOpen = ref(false);

const newExpense = reactive({
  description: '',
  categoryId: '',
  vendorName: '',
  amountMajor: 15000,
  taxMajor: 2700,
  paymentMethod: 'UPI' as const,
  paymentStatus: 'paid' as PaymentStatus,
  invoiceNumber: '',
  receiptName: 'Receipt_Mock.pdf',
  expenseDate: new Date().toISOString().split('T')[0],
});

// Calculate spending per category
const categorySpending = computed(() => {
  return eventCategories.value.map((cat) => {
    const expenses = eventExpenses.value.filter((e) => e.categoryId === cat.id);
    const spentMinor = expenses.reduce(
      (sum, e) => (e.paymentStatus !== 'cancelled' ? sum + e.amountMinor + e.taxAmountMinor : sum),
      0
    );
    const allocated = cat.allocatedAmountMinor;
    const percent = allocated > 0 ? Math.round((spentMinor / allocated) * 100) : 0;
    return {
      ...cat,
      spentMinor,
      percent,
      isOver: spentMinor > allocated,
    };
  });
});

const filteredExpenses = computed(() => {
  return eventExpenses.value.filter((e) => {
    if (selectedCategory.value !== 'all' && e.categoryId !== selectedCategory.value) return false;
    if (selectedStatus.value !== 'all' && e.paymentStatus !== selectedStatus.value) return false;
    return true;
  });
});

function handleAddExpense() {
  if (!newExpense.description.trim()) return;

  const totalAmountMinor = Math.round(Number(newExpense.amountMajor) * 100);
  const taxAmountMinor = Math.round(Number(newExpense.taxMajor) * 100);
  const fullTotal = totalAmountMinor + taxAmountMinor;
  const paidAmountMinor = newExpense.paymentStatus === 'paid' ? fullTotal : 0;

  actions.addExpense({
    eventId: currentEvent.value.id,
    categoryId: newExpense.categoryId || (eventCategories.value[0]?.id ?? 'cat-1'),
    vendorName: newExpense.vendorName || 'Independent Vendor',
    description: newExpense.description,
    amountMinor: totalAmountMinor,
    taxAmountMinor,
    currency: currentEvent.value.currency,
    invoiceNumber: newExpense.invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    paymentMethod: newExpense.paymentMethod,
    paymentStatus: newExpense.paymentStatus,
    paidAmountMinor,
    expenseDate: newExpense.expenseDate,
    receiptName: newExpense.receiptName,
  });

  newExpense.description = '';
  newExpense.vendorName = '';
  isAddExpenseModalOpen.value = false;
}
</script>

<template>
  <div class="view-wrap">
    <!-- Header with CTAs -->
    <div class="view-header">
      <div>
        <h2 class="view-title">Budget & Expense Management</h2>
        <p class="view-subtitle">
          Breakdown of planned, approved, actual spent, paid, and outstanding obligations.
        </p>
      </div>

      <button class="btn btn-primary btn-sm" @click="isAddExpenseModalOpen = true">
        <Plus :size="15" />
        <span>+ Record Expense</span>
      </button>
    </div>

    <!-- 5 Metric Cards Bar (Financial Clarity) -->
    <div class="budget-metrics-grid">
      <!-- 1: Planned Budget -->
      <div class="card metric-card">
        <div class="metric-label">Planned Budget</div>
        <div class="metric-val text-main">
          {{ formatCurrency(budgetMetrics.plannedMinor, budgetMetrics.currency) }}
        </div>
        <div class="metric-hint">Target baseline</div>
      </div>

      <!-- 2: Actual Spent -->
      <div class="card metric-card">
        <div class="metric-label">Actual Spent</div>
        <div class="metric-val text-primary">
          {{ formatCurrency(budgetMetrics.actualSpentMinor, budgetMetrics.currency) }}
        </div>
        <div class="metric-hint text-primary font-bold">
          {{ budgetMetrics.spendPercent }}% of total planned
        </div>
      </div>

      <!-- 3: Paid Amount -->
      <div class="card metric-card">
        <div class="metric-label">Paid Out</div>
        <div class="metric-val text-success">
          {{ formatCurrency(budgetMetrics.paidAmountMinor, budgetMetrics.currency) }}
        </div>
        <div class="metric-hint">Disbursed funds</div>
      </div>

      <!-- 4: Outstanding Due -->
      <div class="card metric-card">
        <div class="metric-label">Outstanding Due</div>
        <div class="metric-val text-warning">
          {{ formatCurrency(budgetMetrics.outstandingAmountMinor, budgetMetrics.currency) }}
        </div>
        <div class="metric-hint">Pending disbursement</div>
      </div>

      <!-- 5: Remaining Buffer -->
      <div class="card metric-card">
        <div class="metric-label">Remaining Buffer</div>
        <div
          class="metric-val"
          :class="budgetMetrics.isOverBudget ? 'text-danger' : 'text-main'"
        >
          {{ formatCurrency(budgetMetrics.remainingBudgetMinor, budgetMetrics.currency) }}
        </div>
        <div class="metric-hint" :class="budgetMetrics.isOverBudget ? 'text-danger' : 'text-success'">
          {{ budgetMetrics.isOverBudget ? '⚠️ Over Budget' : 'Under limit' }}
        </div>
      </div>
    </div>

    <!-- Category Allocation Gauges -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">
            <Building :size="18" style="color: var(--primary)" />
            <span>Category Budget Allocations</span>
          </div>
          <div class="card-subtitle">
            Monitor allocation caps and highlight overrun risks early
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px">
        <div
          v-for="cat in categorySpending"
          :key="cat.id"
          style="
            padding: 14px;
            background: var(--surface-subtle);
            border-radius: var(--radius-md);
            border: 1px solid var(--surface-border);
          "
        >
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px">
            <span style="font-weight: 700; font-size: 0.88rem">{{ cat.name }}</span>
            <span
              style="font-weight: 700; font-size: 0.8rem"
              :style="{ color: cat.isOver ? 'var(--danger)' : 'var(--primary)' }"
            >
              {{ cat.percent }}%
            </span>
          </div>

          <div class="progress-track" style="margin-bottom: 6px">
            <div
              class="progress-fill"
              :class="cat.isOver ? 'danger' : 'primary'"
              :style="{ width: Math.min(100, cat.percent) + '%' }"
            ></div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted)">
            <span>Spent: <strong>{{ formatCurrency(cat.spentMinor, currentEvent.currency) }}</strong></span>
            <span>Cap: {{ formatCurrency(cat.allocatedAmountMinor, currentEvent.currency) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Expenses Table & Filter Bar -->
    <div class="card">
      <div class="card-header" style="flex-wrap: wrap; gap: 12px">
        <div>
          <div class="card-title">
            <Receipt :size="18" style="color: var(--primary)" />
            <span>Recorded Expense Transactions</span>
          </div>
          <div class="card-subtitle">
            Itemized vendor bills, GST records, and payment confirmations
          </div>
        </div>

        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap">
          <!-- Status filter -->
          <select v-model="selectedStatus" class="form-select" style="width: auto; padding: 6px 12px; font-size: 0.82rem">
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partially Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <!-- Responsive Table -->
      <div style="overflow-x: auto">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left">
          <thead>
            <tr style="border-bottom: 2px solid var(--surface-border); color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase">
              <th style="padding: 10px 12px">Date</th>
              <th style="padding: 10px 12px">Description & Vendor</th>
              <th style="padding: 10px 12px">Amount + GST</th>
              <th style="padding: 10px 12px">Method</th>
              <th style="padding: 10px 12px">Invoice / Receipt</th>
              <th style="padding: 10px 12px">Status</th>
              <th style="padding: 10px 12px; text-align: right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="exp in filteredExpenses"
              :key="exp.id"
              style="border-bottom: 1px solid var(--surface-border); transition: background 0.15s ease"
            >
              <td style="padding: 12px; color: var(--text-muted); font-size: 0.82rem">
                {{ exp.expenseDate }}
              </td>
              <td style="padding: 12px">
                <div style="font-weight: 700; color: var(--text-main)">{{ exp.description }}</div>
                <div style="font-size: 0.78rem; color: var(--primary); font-weight: 600">{{ exp.vendorName }}</div>
              </td>
              <td style="padding: 12px">
                <div style="font-weight: 800; color: var(--text-main)">
                  {{ formatCurrency(exp.amountMinor + exp.taxAmountMinor, exp.currency) }}
                </div>
                <div style="font-size: 0.72rem; color: var(--text-light)">
                  Base: {{ formatCurrency(exp.amountMinor, exp.currency) }} + GST: {{ formatCurrency(exp.taxAmountMinor, exp.currency) }}
                </div>
              </td>
              <td style="padding: 12px">
                <span class="badge badge-neutral" style="font-size: 0.75rem">{{ exp.paymentMethod }}</span>
              </td>
              <td style="padding: 12px">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--primary)">
                  <Receipt :size="14" />
                  <span>{{ exp.invoiceNumber || 'No Invoice #' }}</span>
                </div>
              </td>
              <td style="padding: 12px">
                <span
                  v-if="exp.paymentStatus === 'paid'"
                  class="badge badge-success"
                >
                  PAID IN FULL
                </span>
                <span
                  v-else-if="exp.paymentStatus === 'partial'"
                  class="badge badge-warning"
                >
                  PARTIAL ({{ formatCurrency(exp.paidAmountMinor, exp.currency) }})
                </span>
                <span
                  v-else
                  class="badge badge-danger"
                >
                  PENDING
                </span>
              </td>
              <td style="padding: 12px; text-align: right">
                <button
                  class="btn-icon"
                  style="color: var(--text-light)"
                  @click="actions.deleteExpense(exp.id)"
                  title="Remove expense"
                >
                  <Trash2 :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredExpenses.length === 0" style="text-align: center; padding: 30px; color: var(--text-muted)">
          No expenses recorded yet under this filter.
        </div>
      </div>
    </div>

    <!-- Record New Expense Modal -->
    <div v-if="isAddExpenseModalOpen" class="modal-overlay" @click.self="isAddExpenseModalOpen = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3 style="font-size: 1.15rem">Record New Expense</h3>
          <button class="btn-icon" @click="isAddExpenseModalOpen = false">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Expense Description</label>
            <input
              v-model="newExpense.description"
              type="text"
              class="form-input"
              placeholder="e.g. Stage floral entrance arch advance"
            />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select v-model="newExpense.categoryId" class="form-select">
                <option v-for="c in eventCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Vendor / Service Provider</label>
              <input
                v-model="newExpense.vendorName"
                type="text"
                class="form-input"
                placeholder="e.g. Bloom Florals, Taj Banqueting..."
              />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Base Amount (₹)</label>
              <input v-model.number="newExpense.amountMajor" type="number" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">GST / Tax Amount (₹)</label>
              <input v-model.number="newExpense.taxMajor" type="number" class="form-input" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Payment Method</label>
              <select v-model="newExpense.paymentMethod" class="form-select">
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Payment Status</label>
              <select v-model="newExpense.paymentStatus" class="form-select">
                <option value="paid">Paid in Full</option>
                <option value="partial">Partially Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Invoice / Reference #</label>
              <input
                v-model="newExpense.invoiceNumber"
                type="text"
                class="form-input"
                placeholder="INV-2026-001"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Date of Expense</label>
              <input v-model="newExpense.expenseDate" type="date" class="form-input" />
            </div>
          </div>

          <!-- Mock Receipt Upload -->
          <div class="form-group">
            <label class="form-label">Receipt File Attachment</label>
            <div
              style="
                border: 2px dashed var(--surface-border-strong);
                border-radius: var(--radius-md);
                padding: 16px;
                text-align: center;
                background: var(--surface-subtle);
                cursor: pointer;
              "
            >
              <FileUp :size="20" style="color: var(--primary); margin-bottom: 4px" />
              <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-main)">
                {{ newExpense.receiptName || 'Click to select PDF or image' }}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-light)">Max file size 10MB (PDF, PNG, JPG)</div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="isAddExpenseModalOpen = false">Cancel</button>
          <button class="btn btn-primary" @click="handleAddExpense">Record Expense</button>
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

.budget-metrics-grid {
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
  font-size: 1.12rem;
  font-weight: 800;
  margin-top: 2px;
}

.metric-hint {
  font-size: 0.68rem;
  color: var(--text-light);
  margin-top: 1px;
}

.text-primary { color: var(--primary); }
.text-danger { color: var(--danger); }
.text-warning { color: var(--warning); }
.text-success { color: var(--success); }
.text-main { color: var(--text-main); }
.font-bold { font-weight: 700; }

@media (max-width: 640px) {
  .budget-metrics-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .metric-card {
    padding: 8px 10px;
  }
  .metric-val {
    font-size: 0.95rem;
  }
}
</style>
