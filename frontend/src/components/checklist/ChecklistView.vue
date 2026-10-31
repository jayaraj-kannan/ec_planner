<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import {
  eventTasks,
  taskMetrics,
  actions,
  currentEvent,
} from '../../stores/eventStore';
import type { TaskPriority } from '../../types/event';
import {
  CheckSquare,
  Plus,
  Check,
  Trash2,
  X,
  Sparkles,
} from 'lucide-vue-next';

const selectedFilter = ref<'all' | 'pending' | 'overdue' | 'completed' | 'high'>('all');
const selectedCategory = ref<string>('all');
const isAddTaskModalOpen = ref(false);

const newTask = reactive({
  taskName: '',
  category: 'General',
  assignedTo: 'Owner',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  priority: 'medium' as TaskPriority,
  notes: '',
});

const categories = computed(() => {
  const set = new Set<string>();
  eventTasks.value.forEach((t) => set.add(t.category));
  return Array.from(set);
});

const filteredTasks = computed(() => {
  return eventTasks.value.filter((t) => {
    // Status/Priority Filter
    if (selectedFilter.value === 'pending' && t.status !== 'pending') return false;
    if (selectedFilter.value === 'overdue' && t.status !== 'overdue') return false;
    if (selectedFilter.value === 'completed' && t.status !== 'completed') return false;
    if (selectedFilter.value === 'high' && t.priority !== 'high') return false;

    // Category Filter
    if (selectedCategory.value !== 'all' && t.category !== selectedCategory.value) return false;

    return true;
  });
});

function handleAddTask() {
  if (!currentEvent.value || !newTask.taskName.trim()) return;

  actions.addTask({
    eventId: currentEvent.value.id,
    taskName: newTask.taskName,
    category: newTask.category,
    assignedTo: newTask.assignedTo || 'Owner',
    dueDate: newTask.dueDate,
    priority: newTask.priority,
    notes: newTask.notes,
  });

  newTask.taskName = '';
  newTask.notes = '';
  isAddTaskModalOpen.value = false;
}
</script>

<template>
  <div class="view-wrap">
    <!-- Header with Stats -->
    <div class="view-header">
      <div>
        <h2 class="view-title">Planning Checklist & Milestones</h2>
        <p class="view-subtitle">
          Track what needs to be done, who is responsible, and never miss a deadline.
        </p>
      </div>

      <div style="display: flex; gap: 8px">
        <button
          class="btn btn-secondary btn-sm"
          @click="actions.openAgentChatModal(`Generate a personalized milestone checklist for ${currentEvent?.name || 'my celebration'}`)"
          title="Use PlanCraft AI Agent to generate tailored milestone tasks"
        >
          <Sparkles :size="15" style="color: var(--primary)" />
          <span>Generate with AI</span>
        </button>

        <button
          class="btn btn-primary btn-sm"
          @click="isAddTaskModalOpen = true"
        >
          <Plus :size="15" />
          <span>Add Task</span>
        </button>
      </div>
    </div>

    <!-- Progress Card -->
    <div class="card" style="padding: 10px 14px">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px">
        <div style="display: flex; align-items: center; gap: 6px">
          <CheckSquare :size="16" style="color: var(--primary)" />
          <span style="font-weight: 700; font-size: 0.88rem">Milestones Progress</span>
        </div>
        <span style="font-weight: 800; font-size: 0.9rem; color: var(--primary)">
          {{ taskMetrics.completed }} / {{ taskMetrics.total }} ({{ taskMetrics.completionPercent }}%)
        </span>
      </div>
      <div class="progress-track">
        <div class="progress-fill primary" :style="{ width: taskMetrics.completionPercent + '%' }"></div>
      </div>
    </div>

    <!-- Filters Bar (Horizontal scrollable on mobile) -->
    <div class="filters-bar-wrap">
      <!-- Status Tabs -->
      <div class="filters-scroll-row">
        <button
          class="btn btn-sm"
          :class="selectedFilter === 'all' ? 'btn-primary' : 'btn-secondary'"
          @click="selectedFilter = 'all'"
        >
          All ({{ taskMetrics.total }})
        </button>
        <button
          class="btn btn-sm"
          :class="selectedFilter === 'overdue' ? 'btn-primary' : 'btn-secondary'"
          @click="selectedFilter = 'overdue'"
        >
          ⚠️ Overdue ({{ taskMetrics.overdue }})
        </button>
        <button
          class="btn btn-sm"
          :class="selectedFilter === 'pending' ? 'btn-primary' : 'btn-secondary'"
          @click="selectedFilter = 'pending'"
        >
          Pending ({{ taskMetrics.pending }})
        </button>
        <button
          class="btn btn-sm"
          :class="selectedFilter === 'completed' ? 'btn-primary' : 'btn-secondary'"
          @click="selectedFilter = 'completed'"
        >
          ✓ Completed ({{ taskMetrics.completed }})
        </button>
        <button
          class="btn btn-sm"
          :class="selectedFilter === 'high' ? 'btn-primary' : 'btn-secondary'"
          @click="selectedFilter = 'high'"
        >
          🔥 High Priority
        </button>
      </div>

      <!-- Category Selector -->
      <div style="display: flex; align-items: center; gap: 8px">
        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600">Category:</span>
        <select v-model="selectedCategory" class="form-select" style="padding: 6px 12px; font-size: 0.82rem; width: auto">
          <option value="all">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
    </div>

    <!-- Task Items List -->
    <div style="display: flex; flex-direction: column; gap: 10px">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="card"
        style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px"
        :style="{
          opacity: task.status === 'completed' ? 0.7 : 1,
          borderLeft: task.status === 'overdue' ? '4px solid var(--danger)' : '1px solid var(--surface-border)',
        }"
      >
        <div style="display: flex; align-items: flex-start; gap: 14px; flex: 1">
          <!-- Checkbox -->
          <button
            @click="actions.toggleTask(task.id)"
            style="
              width: 24px;
              height: 24px;
              border-radius: 6px;
              border: 2px solid;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-top: 2px;
              flex-shrink: 0;
              transition: all 0.15s ease;
            "
            :style="{
              borderColor: task.status === 'completed' ? 'var(--success)' : 'var(--surface-border-strong)',
              backgroundColor: task.status === 'completed' ? 'var(--success)' : 'white',
              color: 'white',
            }"
          >
            <Check v-if="task.status === 'completed'" :size="16" />
          </button>

          <div>
            <div
              style="font-weight: 700; font-size: 0.98rem; color: var(--text-main)"
              :style="{ textDecoration: task.status === 'completed' ? 'line-through' : 'none' }"
            >
              {{ task.taskName }}
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.78rem; color: var(--text-muted); margin-top: 5px">
              <span>👤 Assigned to: <strong>{{ task.assignedTo }}</strong></span>
              <span>•</span>
              <span :style="{ color: task.status === 'overdue' ? 'var(--danger)' : 'inherit', fontWeight: task.status === 'overdue' ? '700' : 'normal' }">
                📅 Due: {{ task.dueDate }}
              </span>
              <span>•</span>
              <span class="badge badge-neutral" style="font-size: 0.7rem">{{ task.category }}</span>
            </div>

            <p v-if="task.notes" style="font-size: 0.78rem; color: var(--text-muted); margin-top: 6px; font-style: italic">
              "{{ task.notes }}"
            </p>
          </div>
        </div>

        <!-- Badges & Action -->
        <div style="display: flex; align-items: center; gap: 12px">
          <span v-if="task.status === 'overdue'" class="badge badge-danger">
            OVERDUE
          </span>
          <span v-else-if="task.priority === 'high'" class="badge badge-warning">
            HIGH PRIORITY
          </span>
          <span v-else class="badge badge-neutral">
            {{ task.priority.toUpperCase() }}
          </span>

          <button
            class="btn-icon"
            @click="actions.deleteTask(task.id)"
            title="Delete task"
            style="color: var(--text-light)"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </div>

      <div
        v-if="filteredTasks.length === 0"
        class="card"
        style="text-align: center; padding: 40px; color: var(--text-muted)"
      >
        <Sparkles :size="28" style="color: var(--primary); margin-bottom: 8px" />
        <div style="font-weight: 700; font-size: 1rem">No tasks in this view</div>
        <div style="font-size: 0.85rem">Try switching filters or add a new milestone task.</div>
        <button
          class="btn btn-primary btn-sm"
          style="margin-top: 14px; margin-left: auto; margin-right: auto"
          @click="actions.openAgentChatModal(`Generate a personalized milestone checklist for ${currentEvent?.name || 'my celebration'}`)"
        >
          <Sparkles :size="15" />
          <span>Generate Checklist with AI</span>
        </button>
      </div>
    </div>

    <!-- Add Task Modal -->
    <div v-if="isAddTaskModalOpen" class="modal-overlay" @click.self="isAddTaskModalOpen = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3 style="font-size: 1.15rem">Add New Checklist Milestone</h3>
          <button class="btn-icon" @click="isAddTaskModalOpen = false">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Task Description</label>
            <input
              v-model="newTask.taskName"
              type="text"
              class="form-input"
              placeholder="e.g. Schedule rehearsal dinner with wedding party"
            />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Category</label>
              <input
                v-model="newTask.category"
                type="text"
                class="form-input"
                placeholder="e.g. Catering, Venue, Decor..."
              />
            </div>

            <div class="form-group">
              <label class="form-label">Assigned Person</label>
              <input
                v-model="newTask.assignedTo"
                type="text"
                class="form-input"
                placeholder="e.g. Rahul, Event Lead..."
              />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px">
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input v-model="newTask.dueDate" type="date" class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">Priority</label>
              <select v-model="newTask.priority" class="form-select">
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notes or Vendor Instructions</label>
            <textarea
              v-model="newTask.notes"
              rows="2"
              class="form-textarea"
              placeholder="Optional specifics, contact numbers, or reminders..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="isAddTaskModalOpen = false">Cancel</button>
          <button class="btn btn-primary" @click="handleAddTask">Save Milestone</button>
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

.filters-bar-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filters-scroll-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  max-width: 100%;
  padding-bottom: 2px;
  -webkit-overflow-scrolling: touch;
}

.filters-scroll-row::-webkit-scrollbar {
  display: none;
}
</style>
