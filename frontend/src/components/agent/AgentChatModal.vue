<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { state, actions, currentEvent, calculateDaysUntil } from '../../stores/eventStore';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Clock,
  ListTodo,
  ExternalLink,
} from 'lucide-vue-next';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  a2uiData?: any;
  timestamp: string;
}

const inputQuery = ref('');
const isLoading = ref(false);
const isConnected = ref(false);
const chatContainer = ref<HTMLElement | null>(null);

const messages = ref<ChatMessage[]>([
  {
    id: 'msg-welcome',
    role: 'assistant',
    content:
      "Hello! I'm **PlanCraft AI**, your Google ADK-powered event assistant. Ask me to calculate custom budgets, generate milestone checklists, vet vendors, or draft your wedding/celebration run sheet!",
    timestamp: 'Just now',
  },
]);

const quickPrompts = [
  { label: '🎉 Create New Event', query: 'Create a new anniversary celebration called Sarah & John Silver Jubilee on 2026-11-20 with budget $20,000 and 150 guests at Grand Palace' },
  { label: '📋 Generate Checklist', query: 'Generate a personalized milestone checklist for my active celebration' },
  { label: '✏️ Update Event Details', query: 'Update my active event: set expected guests to 200 and increase budget to $25,000' },
  { label: '📅 List All Events', query: 'List all events currently in my planner' },
  { label: '💰 Budget Breakdown', query: 'Calculate budget breakdown for a $15,000 celebration with 120 guests' },
  { label: '⏱️ Day-Of Run Sheet', query: 'Generate an hourly day-of run sheet starting at 10:00 AM' },
  { label: '🎯 Readiness Score', query: 'Analyze my event readiness score and identify urgent risks' },
];

const AGENT_API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? window.location.origin
    : 'http://localhost:8000');

async function checkHealth() {
  try {
    const res = await fetch(`${AGENT_API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      isConnected.value = true;
    } else {
      isConnected.value = false;
    }
  } catch {
    isConnected.value = false;
  }
}

onMounted(() => {
  checkHealth();
  if (state.agentPendingQuery && state.isAgentChatModalOpen) {
    const q = state.agentPendingQuery;
    state.agentPendingQuery = '';
    sendQuickPrompt(q);
  }
});

watch(
  () => state.agentPendingQuery,
  (newQuery) => {
    if (newQuery && state.isAgentChatModalOpen) {
      state.agentPendingQuery = '';
      sendQuickPrompt(newQuery);
    }
  }
);

watch(
  () => state.isAgentChatModalOpen,
  (isOpen) => {
    if (isOpen && state.agentPendingQuery) {
      const q = state.agentPendingQuery;
      state.agentPendingQuery = '';
      sendQuickPrompt(q);
    }
  }
);

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

const chatInputRef = ref<HTMLInputElement | null>(null);

function selectIntoChat(promptText: string, autoFocus = true) {
  inputQuery.value = promptText;
  if (autoFocus) {
    nextTick(() => {
      chatInputRef.value?.focus();
    });
  }
}

function selectEventIntoChat(
  eventItem: any,
  action: 'select' | 'details' | 'edit' | 'budget' | 'runsheet' | 'checklist' = 'select'
) {
  if (!eventItem) return;
  actions.setActiveEvent(eventItem.id);

  if (action === 'select') {
    selectIntoChat(`Show details and planning next steps for ${eventItem.name}`);
  } else if (action === 'details') {
    selectIntoChat(`Show complete event details for ${eventItem.name}`);
  } else if (action === 'checklist') {
    selectIntoChat(`Generate milestone checklist tasks for ${eventItem.name}`);
  } else if (action === 'edit') {
    selectIntoChat(`Update ${eventItem.name}: change budget to $ and guests to `);
  } else if (action === 'budget') {
    selectIntoChat(`Calculate budget breakdown for ${eventItem.name}`);
  } else if (action === 'runsheet') {
    selectIntoChat(`Generate day-of run sheet timeline for ${eventItem.name}`);
  }
}

function getCardTitle(a2uiData: any): string {
  if (!a2uiData) return '';
  const type = a2uiData.type;
  const p = a2uiData.payload || {};
  switch (type) {
    case 'list_events':
      return 'Managed Events & Celebrations';
    case 'create_event':
      return `🎉 Event Created: ${p.event?.name || 'New Event'}`;
    case 'update_event':
      return `✏️ Event Updated: ${p.event?.name || 'Event'}`;
    case 'get_event_details':
      return `📋 Event Details: ${p.event?.name || 'Event'}`;
    case 'delete_event':
      return '🗑️ Event Removed';
    case 'calculate_budget_breakdown':
      return `💰 Budget Plan: ${p.event_type?.toUpperCase() || 'EVENT'}`;
    case 'generate_day_of_run_sheet':
      return `⏱️ Day-Of Run Sheet: ${p.event_type?.toUpperCase() || 'TIMELINE'}`;
    case 'generate_checklist_tasks':
      return p.event_name
        ? `📋 Planning Checklist: ${p.event_name}`
        : `📋 Planning Checklist: ${p.event_type?.toUpperCase() || 'TASKS'}`;
    case 'recommend_vendors':
      return `🤝 Vendor Guidance: ${p.category?.toUpperCase() || 'VENDORS'}`;
    case 'analyze_event_readiness':
      return `🎯 Event Readiness: ${p.readiness_score || 0}/100`;
    default:
      return type ? type.replace(/_/g, ' ').toUpperCase() : 'PLANNING INTELLIGENCE';
  }
}

function getCardDescription(a2uiData: any): string {
  if (!a2uiData) return '';
  const type = a2uiData.type;
  const p = a2uiData.payload || {};
  switch (type) {
    case 'list_events':
      return `Found ${p.count || p.events?.length || 0} active celebrations in system. Click any event below to select it into chat.`;
    case 'create_event':
      return p.message || `Event scheduled for ${p.event?.start_date} with a planned budget of $${p.event?.planned_budget?.toLocaleString()}.`;
    case 'update_event':
      return p.message || `Updated details for ${p.event?.name}.`;
    case 'get_event_details':
      return `Planning for ${p.event?.expected_guest_count} guests at ${p.event?.venue_name || 'TBD'}.`;
    case 'delete_event':
      return p.message || 'Event has been successfully removed.';
    case 'calculate_budget_breakdown':
      return p.advice || `Allocated across essential event categories based on $${p.total_budget?.toLocaleString()} budget.`;
    case 'generate_day_of_run_sheet':
      return 'Structured hour-by-hour operational run sheet with activity assignments and notes.';
    case 'generate_checklist_tasks':
      return p.suggested_immediate_action ? `Immediate Focus: ${p.suggested_immediate_action}` : 'Prioritized milestone tasks for your celebration.';
    case 'recommend_vendors':
      return p.expert_tip || `Standard deposit: ${p.payment_schedule}. Ask these key questions before signing.`;
    case 'analyze_event_readiness':
      return `Status: ${p.status_label}. Calculated by ADK Risk Evaluation Engine.`;
    default:
      return '';
  }
}

function sendQuickPrompt(promptText: string) {
  inputQuery.value = promptText;
  sendMessage();
}

async function sendMessage() {
  const query = inputQuery.value.trim();
  if (!query || isLoading.value) return;

  const userMsg: ChatMessage = {
    id: 'user-' + Date.now(),
    role: 'user',
    content: query,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  messages.value.push(userMsg);
  inputQuery.value = '';
  isLoading.value = true;
  scrollToBottom();

  const eventContext = currentEvent.value
    ? {
        eventId: currentEvent.value.id,
        eventName: currentEvent.value.name,
        eventType: currentEvent.value.eventType,
        budget: currentEvent.value.plannedBudgetMinor / 100,
        guestCount: currentEvent.value.expectedGuestCount,
        startDate: currentEvent.value.startDate,
        daysUntil: calculateDaysUntil(currentEvent.value.startDate),
      }
    : null;

  try {
    const response = await fetch(`${AGENT_API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        user_id: 'web-user',
        event_context: eventContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent service responded with status ${response.status}`);
    }

    const data = await response.json();
    isConnected.value = true;

    let textContent = '';
    let a2uiPayload: any = null;

    if (data.parts && Array.isArray(data.parts)) {
      for (const part of data.parts) {
        if (part.kind === 'text') {
          textContent += (textContent ? '\n\n' : '') + part.text;
        } else if (part.kind === 'a2ui' && part.data) {
          a2uiPayload = part.data;
          // Synchronize created or updated event with the frontend store in real time
          if (a2uiPayload?.payload?.event) {
            const e = a2uiPayload.payload.event;
            const existing = state.events.find((ev) => ev.id === e.id);
            const formatted = {
              id: e.id,
              name: e.name,
              eventType: e.event_type || 'custom',
              ownerId: e.owner_id || 'user-1',
              startDate: e.start_date,
              endDate: e.end_date || e.start_date,
              timeZone: e.time_zone || 'UTC',
              venueName: e.venue_name || '',
              venueAddress: e.venue_address || '',
              expectedGuestCount: e.expected_guest_count || 100,
              currency: e.currency || 'USD',
              plannedBudgetMinor: e.planned_budget_minor || (e.planned_budget * 100) || 1000000,
              status: e.status || 'planning',
              theme: e.theme || '',
              dressCode: e.dress_code || '',
              specialInstructions: e.special_instructions || '',
              createdAt: e.created_at || new Date().toISOString(),
            };
            if (existing) {
              Object.assign(existing, formatted);
            } else {
              state.events.unshift(formatted as any);
              state.activeEventId = e.id;
            }

            // Synchronize launch checklist tasks into store
            if (a2uiPayload?.payload?.checklist?.milestone_phases) {
              actions.applyMilestoneChecklist(
                e.id,
                e.name,
                e.start_date,
                a2uiPayload.payload.checklist.milestone_phases
              );
            }
          }

          // Synchronize generated checklist tasks directly to active selected event in store
          if (
            a2uiPayload?.type === 'generate_checklist_tasks' &&
            a2uiPayload?.payload?.milestone_phases
          ) {
            const targetEventId = a2uiPayload.payload.event_id || currentEvent.value?.id;
            const targetEvent =
              state.events.find((ev) => ev.id === targetEventId) || currentEvent.value;
            if (targetEvent) {
              actions.applyMilestoneChecklist(
                targetEvent.id,
                targetEvent.name,
                targetEvent.startDate,
                a2uiPayload.payload.milestone_phases
              );
            }
          }
        }
      }
    }

    messages.value.push({
      id: 'assistant-' + Date.now(),
      role: 'assistant',
      content: textContent || 'Received response from agent.',
      a2uiData: a2uiPayload,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    messages.value.push({
      id: 'err-' + Date.now(),
      role: 'assistant',
      content:
        `⚠️ Could not reach ADK Agent Service at \`${AGENT_API_BASE}\`.\n\n` +
        `Make sure the service is running: \`npm run dev:agent\` (in a separate terminal) or start it at \`services/agent/\`.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
}

function clearChat() {
  messages.value = [
    {
      id: 'msg-welcome-new',
      role: 'assistant',
      content: 'Chat history cleared. How can I assist with your celebration plans now?',
      timestamp: 'Just now',
    },
  ];
}

function renderTableHtml(headers: string[], rows: string[][]): string {
  let h = '<div class="a2ui-table-wrap md-table-wrapper"><table class="a2ui-table"><thead><tr>';
  for (const th of headers) {
    h += `<th>${th}</th>`;
  }
  h += '</tr></thead><tbody>';
  for (const row of rows) {
    h += '<tr>';
    for (const cell of row) {
      h += `<td>${cell}</td>`;
    }
    h += '</tr>';
  }
  h += '</tbody></table></div>';
  return h;
}

function parseMarkdownTables(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inTable = false;
  let headers: string[] = [];
  let rows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.every((c) => /^[-:\s]+$/.test(c))) {
        continue;
      }
      if (!inTable) {
        inTable = true;
        headers = cells;
      } else {
        rows.push(cells);
      }
    } else {
      if (inTable) {
        result.push(renderTableHtml(headers, rows));
        inTable = false;
        headers = [];
        rows = [];
      }
      result.push(lines[i]);
    }
  }

  if (inTable) {
    result.push(renderTableHtml(headers, rows));
  }

  return result.join('\n');
}

function formatMarkdown(text: string): string {
  if (!text) return '';

  const textWithTables = parseMarkdownTables(text);
  let html = textWithTables;

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h4 class="md-heading-3"><span class="heading-accent"></span>$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="md-heading-2"><span class="heading-accent"></span>$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="md-heading-1"><span class="heading-accent"></span>$1</h2>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+)\*/gim, '<em>$1</em>');

  // Inline Code
  html = html.replace(/`([^`\n]+)`/gim, '<code class="md-code">$1</code>');

  // Callouts
  html = html.replace(/^([💡⚠️⚡⭐ℹ️]\s*.*$)/gim, '<div class="md-callout">$1</div>');

  // Bullet items
  html = html.replace(/^[-*]\s+(.*$)/gim, '<li class="md-list-item"><span class="bullet-dot">•</span><span>$1</span></li>');

  // Numbered step lists
  html = html.replace(/^(\d+)\.\s+(.*$)/gim, '<div class="md-step-item"><span class="md-step-num">$1</span><span class="md-step-body">$2</span></div>');

  // Wrap list items
  html = html.replace(/((?:<li class="md-list-item">.*?<\/li>\s*)+)/gim, '<ul class="md-list">$1</ul>');

  // Spacing
  html = html.replace(/\n\n+/g, '<div class="md-spacer"></div>');

  return html;
}

function getFollowUpActions(msg: ChatMessage): string[] {
  if (msg.role !== 'assistant') return [];
  const text = (msg.content || '').toLowerCase();
  const a2uiType = msg.a2uiData?.type;

  if (a2uiType === 'create_event' || text.includes('event created')) {
    return [
      '💰 Calculate budget breakdown for this celebration',
      '📋 Generate milestone checklist tasks',
      '⏱️ Build day-of run sheet timeline',
    ];
  }
  if (a2uiType === 'calculate_budget_breakdown' || text.includes('budget')) {
    return [
      '🤝 Recommend vendors and vetting tips',
      '📋 Create tasks for high-spend categories',
      '✏️ Adjust total budget or guest count',
    ];
  }
  if (a2uiType === 'generate_day_of_run_sheet' || text.includes('run sheet') || text.includes('timeline')) {
    return [
      '⚡ Add 30-min buffer for catering delay',
      '🔍 Check event readiness score',
      '📋 Who is lead for venue coordination?',
    ];
  }
  if (a2uiType === 'analyze_event_readiness' || text.includes('readiness')) {
    return [
      '⚠️ How do I resolve critical risks?',
      '👥 Send reminder to pending RSVPs',
      '📋 Check overdue milestone tasks',
    ];
  }
  if (a2uiType === 'generate_checklist_tasks' || text.includes('checklist')) {
    return [
      '⚡ Prioritize immediate actions first',
      '💰 Check budget for upcoming tasks',
      '⏱️ Align tasks with run sheet',
    ];
  }
  if (a2uiType === 'list_events' || text.includes('managed events')) {
    return [
      '🎉 Create a new celebration',
      '🔍 Inspect details of active event',
      '🎯 Calculate readiness score',
    ];
  }

  return [
    '💰 Show budget breakdown',
    '⏱️ Draft run sheet schedule',
    '📋 Suggest key planning tasks',
  ];
}

function isTaskInChecklist(taskTitle: string): boolean {
  const targetId = currentEvent.value?.id;
  if (!targetId || !taskTitle) return false;
  return state.tasks.some(
    (t) => t.eventId === targetId && t.taskName.trim().toLowerCase() === taskTitle.trim().toLowerCase()
  );
}

function handleAddSingleTask(task: any, timeline?: string) {
  if (!currentEvent.value || !task?.title) return;
  const category = timeline?.includes('Early')
    ? 'Planning'
    : timeline?.includes('Mid')
    ? 'Vendor Management'
    : timeline?.includes('Countdown')
    ? 'Final Preparations'
    : 'Day-of Execution';

  const rawPriority = (task.priority || 'medium').toLowerCase();
  const priority =
    rawPriority === 'urgent' || rawPriority === 'high' ? 'high' : rawPriority === 'low' ? 'low' : 'medium';

  actions.addTask({
    eventId: currentEvent.value.id,
    taskName: task.title,
    assignedTo: 'Event Organizer',
    dueDate: currentEvent.value.startDate || new Date().toISOString().split('T')[0],
    priority: priority as any,
    category,
    notes: `Auto-generated by PlanCraft AI for ${currentEvent.value.name}`,
  });
}

function handleSyncChecklist(msg: ChatMessage) {
  const p = msg.a2uiData?.payload;
  if (!p?.milestone_phases) return;
  const targetEventId = p.event_id || currentEvent.value?.id;
  const targetEvent = state.events.find((e) => e.id === targetEventId) || currentEvent.value;
  if (targetEvent) {
    actions.applyMilestoneChecklist(
      targetEvent.id,
      targetEvent.name,
      targetEvent.startDate,
      p.milestone_phases
    );
  }
}

function navigateToTasksTab() {
  actions.setActiveTab('checklist');
  actions.closeAgentChatModal();
}
</script>

<template>
  <div v-if="state.isAgentChatModalOpen" class="modal-overlay" @click="actions.closeAgentChatModal()">
    <div class="agent-modal-card" @click.stop>
      <!-- Modal Header -->
      <div class="agent-header">
        <div class="agent-header-left">
          <div class="agent-badge-icon">
            <Sparkles :size="18" />
          </div>
          <div>
            <div class="agent-title-row">
              <span class="agent-title">PlanCraft ADK Assistant</span>
              <span class="status-indicator" :class="{ online: isConnected }">
                <span class="dot"></span>
                {{ isConnected ? 'AI Agent Online' : 'Connecting to agent...' }}
              </span>
            </div>
            <div class="agent-subtext">
              Powered by Google ADK & Gemini 2.5 • Function Tools Enabled
            </div>
          </div>
        </div>

        <div class="agent-header-actions">
          <button class="btn-icon" @click="clearChat" title="Reset chat conversation">
            <RotateCcw :size="16" />
          </button>
          <button class="btn-icon" @click="actions.closeAgentChatModal()" title="Close assistant">
            <X :size="18" />
          </button>
        </div>
      </div>

      <!-- Active Event Context Banner -->
      <div v-if="currentEvent" class="context-banner">
        <Calendar :size="14" style="color: var(--primary); flex-shrink: 0" />
        <span>
          Planning Context: <strong>{{ currentEvent.name }}</strong> ({{ currentEvent.eventType.toUpperCase() }}) •
          Budget: <strong>${{ (currentEvent.plannedBudgetMinor / 100).toLocaleString() }}</strong> •
          Guests: <strong>{{ currentEvent.expectedGuestCount }}</strong>
        </span>
      </div>

      <!-- Quick Suggestion Chips -->
      <div class="chips-container">
        <button
          v-for="(chip, idx) in quickPrompts"
          :key="idx"
          class="prompt-chip"
          @click="sendQuickPrompt(chip.query)"
        >
          {{ chip.label }}
        </button>
      </div>

      <!-- Chat History Stream -->
      <div ref="chatContainer" class="agent-chat-stream">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="chat-bubble-row"
          :class="msg.role"
        >
          <div class="bubble-avatar">
            <component :is="msg.role === 'assistant' ? Bot : User" :size="14" />
          </div>

          <div class="bubble-wrapper">
            <div class="bubble-content" :class="{ 'a2ui-only-bubble': !!msg.a2uiData }">
              <!-- User Message Bubble -->
              <div v-if="msg.role === 'user'" class="bubble-text" style="white-space: pre-wrap">{{ msg.content }}</div>

              <!-- Assistant Message: Rich UI Output Card -->
              <div v-else class="ai-ui-output-card" :class="{ 'with-a2ui': !!msg.a2uiData }">
                <!-- AI Agent Meta Bar -->
                <div class="ai-agent-meta-bar">
                  <div class="ai-meta-identity">
                    <div class="ai-pulse-badge">
                      <Sparkles :size="12" />
                    </div>
                    <span class="ai-agent-name">PlanCraft ADK Intelligence</span>
                    <span class="ai-model-tag">Gemini 2.5</span>
                  </div>
                  <span class="ai-timestamp">{{ msg.timestamp }}</span>
                </div>

                <!-- Structured Formatted Output (Headings, Tables, Lists, Steps, Callouts) -->
                <div
                  v-if="msg.content"
                  class="ai-parsed-markdown"
                  v-html="formatMarkdown(msg.content)"
                ></div>

                <!-- A2UI Interactive Card Presentation -->
                <div v-if="msg.a2uiData" class="a2ui-card">
                  <div class="a2ui-card-header">
                    <div class="a2ui-card-header-left">
                      <span class="a2ui-tag">ADK A2UI Card</span>
                      <h4 class="a2ui-card-title">{{ getCardTitle(msg.a2uiData) }}</h4>
                    </div>
                    <span class="a2ui-type">{{ msg.a2uiData.type }}</span>
                  </div>

                  <!-- Direct Description Banner (whever required show direct text details as title or description) -->
                  <div v-if="getCardDescription(msg.a2uiData)" class="a2ui-card-description">
                    {{ getCardDescription(msg.a2uiData) }}
                  </div>

                <!-- Event Lifecycle Card (Created / Updated / Details) -->
                <div v-if="msg.a2uiData.type === 'create_event' || msg.a2uiData.type === 'update_event' || msg.a2uiData.type === 'get_event_details'" class="a2ui-body">
                  <div class="event-lifecycle-card">
                    <div class="event-lifecycle-top">
                      <div>
                        <div class="event-lifecycle-title">{{ msg.a2uiData.payload.event?.name }}</div>
                        <div class="event-lifecycle-sub">
                          {{ msg.a2uiData.payload.event?.event_type?.toUpperCase() }} • {{ msg.a2uiData.payload.event?.start_date }} ({{ msg.a2uiData.payload.event?.days_until }}d away)
                        </div>
                      </div>
                      <span class="badge badge-success">{{ msg.a2uiData.payload.event?.status?.toUpperCase() }}</span>
                    </div>

                    <div class="a2ui-metric-grid" style="margin-top: 10px">
                      <div class="a2ui-metric">
                        <span class="lbl">Planned Budget</span>
                        <span class="val">${{ msg.a2uiData.payload.event?.planned_budget?.toLocaleString() }}</span>
                      </div>
                      <div class="a2ui-metric">
                        <span class="lbl">Expected Guests</span>
                        <span class="val">{{ msg.a2uiData.payload.event?.expected_guest_count }} guests</span>
                      </div>
                    </div>

                    <div v-if="msg.a2uiData.payload.event?.venue_name" class="event-lifecycle-venue">
                      📍 <strong>{{ msg.a2uiData.payload.event?.venue_name }}</strong>
                      <span v-if="msg.a2uiData.payload.event?.venue_address"> — {{ msg.a2uiData.payload.event?.venue_address }}</span>
                    </div>

                    <!-- Food & Special Instructions -->
                    <div v-if="msg.a2uiData.payload.event?.special_instructions" class="event-lifecycle-notes" style="font-size: 0.78rem; color: var(--text-muted); margin-top: 6px">
                      🍽️ {{ msg.a2uiData.payload.event?.special_instructions }}
                    </div>

                    <!-- Embedded Launch Checklist -->
                    <div v-if="msg.a2uiData.payload.checklist?.milestone_phases" class="event-lifecycle-checklist" style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--surface-border)">
                      <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px">
                        📋 Initialized Launch Checklist:
                      </div>
                      <div
                        v-for="phase in msg.a2uiData.payload.checklist.milestone_phases"
                        :key="phase.timeline"
                        style="margin-bottom: 6px"
                      >
                        <div style="font-size: 0.72rem; font-weight: 700; color: var(--primary); text-transform: uppercase">
                          {{ phase.timeline }}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 3px; margin-top: 2px">
                          <div
                            v-for="task in phase.tasks"
                            :key="task.title"
                            style="font-size: 0.76rem; display: flex; align-items: center; gap: 6px; color: var(--text-muted)"
                          >
                            <span class="badge" :class="task.priority === 'Urgent' ? 'badge-danger' : task.priority === 'High' ? 'badge-warning' : 'badge-neutral'" style="font-size: 0.65rem; padding: 1px 5px">
                              {{ task.priority }}
                            </span>
                            <span>{{ task.title }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Quick Action Chips for Chat Input -->
                    <div class="item-actions-row" style="margin-top: 10px">
                      <button
                        class="btn btn-primary btn-sm"
                        style="font-size: 0.74rem"
                        @click="selectEventIntoChat(msg.a2uiData.payload.event, 'select')"
                      >
                        ✓ Select into Chat
                      </button>
                      <button
                        class="action-pill"
                        @click="selectEventIntoChat(msg.a2uiData.payload.event, 'edit')"
                      >
                        ✏️ Edit in Chat
                      </button>
                      <button
                        class="action-pill"
                        @click="selectEventIntoChat(msg.a2uiData.payload.event, 'budget')"
                      >
                        💰 Plan Budget
                      </button>
                      <button
                        class="action-pill"
                        @click="selectEventIntoChat(msg.a2uiData.payload.event, 'runsheet')"
                      >
                        ⏱️ Run Sheet
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Event Deletion Card -->
                <div v-else-if="msg.a2uiData.type === 'delete_event'" class="a2ui-body">
                  <div class="delete-card-banner">
                    🗑️ <strong>{{ msg.a2uiData.payload.message || 'Event removed successfully.' }}</strong>
                  </div>
                </div>

                <!-- Event List Card -->
                <div v-else-if="msg.a2uiData.type === 'list_events'" class="a2ui-body">
                  <div class="card-instruction-hint">
                    💡 Click any event below to select it into the chat input:
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 10px">
                    <div
                      v-for="e in msg.a2uiData.payload.events"
                      :key="e.id"
                      class="interactive-list-item"
                      :class="{ 'is-selected': state.activeEventId === e.id }"
                      @click="selectEventIntoChat(e, 'select')"
                    >
                      <div class="item-header-row">
                        <div>
                          <strong class="item-title">{{ e.name }}</strong>
                          <span v-if="state.activeEventId === e.id" class="badge badge-success" style="margin-left: 8px; font-size: 0.68rem">
                            ACTIVE
                          </span>
                          <div class="owner-tag">
                            📅 {{ e.start_date }} • 💰 ${{ e.planned_budget?.toLocaleString() }} • 👥 {{ e.expected_guest_count }} guests
                          </div>
                        </div>
                        <button
                          class="btn btn-primary btn-sm"
                          style="font-size: 0.72rem"
                          @click.stop="selectEventIntoChat(e, 'select')"
                          title="Select this event into chat input"
                        >
                          Select Into Chat ↗
                        </button>
                      </div>

                      <!-- Sub-action Chips -->
                      <div class="item-actions-row">
                        <button
                          class="action-pill"
                          @click.stop="selectEventIntoChat(e, 'details')"
                        >
                          🔍 Inspect Details
                        </button>
                        <button
                          class="action-pill"
                          @click.stop="selectEventIntoChat(e, 'edit')"
                        >
                          ✏️ Update Details
                        </button>
                        <button
                          class="action-pill"
                          @click.stop="selectEventIntoChat(e, 'budget')"
                        >
                          💰 Plan Budget
                        </button>
                        <button
                          class="action-pill"
                          @click.stop="selectEventIntoChat(e, 'checklist')"
                        >
                          📋 Milestone Checklist
                        </button>
                        <button
                          class="action-pill"
                          @click.stop="selectEventIntoChat(e, 'runsheet')"
                        >
                          ⏱️ Day-Of Run Sheet
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Budget Card -->
                <div v-else-if="msg.a2uiData.type === 'calculate_budget_breakdown'" class="a2ui-body">
                  <div class="card-instruction-hint">
                    💡 Click any category below to select it into chat:
                  </div>
                  <div class="a2ui-metric-grid">
                    <div class="a2ui-metric">
                      <span class="lbl">Total Budget</span>
                      <span class="val">${{ msg.a2uiData.payload.total_budget?.toLocaleString() }}</span>
                    </div>
                    <div class="a2ui-metric">
                      <span class="lbl">Per Guest</span>
                      <span class="val">${{ msg.a2uiData.payload.per_guest_budget }}</span>
                    </div>
                  </div>
                  <div class="a2ui-table-wrap">
                    <table class="a2ui-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Allocation</th>
                          <th>Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(item, i) in msg.a2uiData.payload.breakdown"
                          :key="i"
                          class="clickable-table-row"
                          @click="selectIntoChat(`Tell me vendor options and cost tips for ${item.category}`)"
                        >
                          <td><strong>{{ item.category }}</strong></td>
                          <td><span class="badge badge-info">{{ item.percentage }}</span></td>
                          <td><strong>${{ item.recommended_amount.toLocaleString() }}</strong></td>
                          <td>
                            <button
                              class="btn-select-chip"
                              @click.stop="selectIntoChat(`Find top vendors and questions to ask for ${item.category}`)"
                            >
                              Select into Chat ↗
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Run Sheet Card -->
                <div v-else-if="msg.a2uiData.type === 'generate_day_of_run_sheet'" class="a2ui-body">
                  <div class="card-instruction-hint">
                    💡 Click any schedule slot below to select it into chat:
                  </div>
                  <div class="runsheet-list">
                    <div
                      v-for="(slot, i) in msg.a2uiData.payload.timeline"
                      :key="i"
                      class="runsheet-item clickable-slot"
                      @click="selectIntoChat(`Can we adjust timing or details for: ${slot.activity}?`)"
                    >
                      <span class="time-badge">{{ slot.time }}</span>
                      <div class="runsheet-detail" style="flex: 1">
                        <strong>{{ slot.activity }}</strong>
                        <div class="owner-tag">Owner: {{ slot.owner }}</div>
                        <div class="notes">{{ slot.notes }}</div>
                      </div>
                      <button
                        class="btn-select-chip"
                        @click.stop="selectIntoChat(`Adjust schedule instructions for ${slot.time} - ${slot.activity}`)"
                      >
                        Select ↗
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Readiness Card -->
                <div v-else-if="msg.a2uiData.type === 'analyze_event_readiness'" class="a2ui-body">
                  <div class="readiness-banner" :class="msg.a2uiData.payload.status_color">
                    <div class="score-circle">{{ msg.a2uiData.payload.readiness_score }}</div>
                    <div>
                      <div class="score-title">{{ msg.a2uiData.payload.status_label }}</div>
                      <div class="score-sub">Calculated by ADK Risk Evaluation Engine</div>
                    </div>
                  </div>
                  <div v-if="msg.a2uiData.payload.critical_risks?.length" style="margin-top: 10px">
                    <div class="card-instruction-hint">⚠️ Click risk to ask agent for resolution:</div>
                    <div
                      v-for="(risk, ri) in msg.a2uiData.payload.critical_risks"
                      :key="ri"
                      class="interactive-list-item"
                      style="border-left: 3px solid #ef4444"
                      @click="selectIntoChat(`How can I mitigate this risk: ${risk}?`)"
                    >
                      <div class="item-header-row">
                        <span style="font-size: 0.76rem; color: #b91c1c">⚠️ {{ risk }}</span>
                        <button class="btn-select-chip" @click.stop="selectIntoChat(`How can I mitigate this risk: ${risk}?`)">
                          Fix in Chat ↗
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Vendor Recommendation Card -->
                <div v-else-if="msg.a2uiData.type === 'recommend_vendors'" class="a2ui-body">
                  <div class="card-instruction-hint">
                    💡 Click any question below to select it into chat:
                  </div>
                  <div class="vendor-card-header">
                    <span class="badge badge-info">{{ msg.a2uiData.payload.category?.toUpperCase() }}</span>
                    <span class="vendor-deposit">Deposit: {{ msg.a2uiData.payload.payment_schedule }}</span>
                  </div>
                  <div v-if="msg.a2uiData.payload.expert_tip" class="vendor-tip-box">
                    ⭐ <em>{{ msg.a2uiData.payload.expert_tip }}</em>
                  </div>
                  <div class="vendor-questions-list" style="margin-top: 8px">
                    <div
                      v-for="(q, i) in msg.a2uiData.payload.vetting_questions"
                      :key="i"
                      class="vendor-question-item interactive-list-item"
                      @click="selectIntoChat(`Ask vendor about: ${q}`)"
                    >
                      <div class="item-header-row">
                        <span style="font-size: 0.78rem">❓ {{ q }}</span>
                        <button
                          class="btn-select-chip"
                          @click.stop="selectIntoChat(`Ask vendor about: ${q}`)"
                        >
                          Select into Chat ↗
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Checklist Card -->
                <div v-else-if="msg.a2uiData.type === 'generate_checklist_tasks'" class="a2ui-body">
                  <!-- Event Context & Sync Status Banner -->
                  <div
                    class="checklist-sync-header-banner"
                    style="
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      flex-wrap: wrap;
                      gap: 8px;
                      background: rgba(99, 102, 241, 0.08);
                      border: 1px solid rgba(99, 102, 241, 0.22);
                      padding: 8px 12px;
                      border-radius: 8px;
                      margin-bottom: 10px;
                    "
                  >
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem">
                      <CheckCircle2 :size="15" style="color: var(--success); flex-shrink: 0" />
                      <span>
                        Updated for: <strong>{{ msg.a2uiData.payload.event_name || currentEvent?.name || 'Selected Event' }}</strong>
                        <span v-if="msg.a2uiData.payload.days_remaining !== undefined" style="color: var(--text-muted); font-size: 0.74rem">
                          ({{ msg.a2uiData.payload.days_remaining }} days away)
                        </span>
                      </span>
                    </div>

                    <div style="display: flex; align-items: center; gap: 6px">
                      <button
                        class="btn btn-sm btn-primary"
                        style="font-size: 0.7rem; padding: 3px 8px"
                        @click.stop="handleSyncChecklist(msg)"
                        title="Synchronize all generated tasks with event checklist"
                      >
                        📥 Re-sync All Tasks
                      </button>
                      <button
                        class="btn btn-sm btn-secondary"
                        style="font-size: 0.7rem; padding: 3px 8px"
                        @click.stop="navigateToTasksTab"
                        title="Switch to checklist view"
                      >
                        View Checklist →
                      </button>
                    </div>
                  </div>

                  <div class="card-instruction-hint">
                    💡 Tasks are synchronized to your event. Click any task below to ask PlanCraft AI for execution advice:
                  </div>
                  <div v-if="msg.a2uiData.payload.suggested_immediate_action" class="immediate-action-alert">
                    ⚡ <strong>Immediate Focus:</strong> {{ msg.a2uiData.payload.suggested_immediate_action }}
                  </div>
                  <div
                    v-for="(phase, pi) in msg.a2uiData.payload.milestone_phases"
                    :key="pi"
                    class="checklist-phase-block"
                  >
                    <div class="phase-timeline-title">📍 {{ phase.timeline }}</div>
                    <div
                      v-for="(task, ti) in phase.tasks"
                      :key="ti"
                      class="checklist-task-item interactive-list-item"
                      @click="selectIntoChat(`How do I complete task: '${task.title}' for my celebration?`)"
                    >
                      <div class="item-header-row">
                        <div style="display: flex; align-items: center; gap: 8px">
                          <span
                            class="badge"
                            :class="task.priority === 'High' ? 'badge-danger' : 'badge-warning'"
                            style="font-size: 0.65rem"
                          >
                            {{ task.priority }}
                          </span>
                          <span style="font-size: 0.8rem; font-weight: 500">{{ task.title }}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px">
                          <span
                            v-if="isTaskInChecklist(task.title)"
                            class="badge badge-success"
                            style="font-size: 0.65rem"
                          >
                            ✓ In Checklist
                          </span>
                          <button
                            v-else
                            class="btn-add-task-chip"
                            style="background: var(--surface-bg); color: var(--primary); font-weight: 600; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--surface-border); font-size: 0.72rem; cursor: pointer"
                            @click.stop="handleAddSingleTask(task, phase.timeline)"
                            title="Add this task to checklist"
                          >
                            + Add to Event
                          </button>
                          <button
                            class="btn-select-chip"
                            @click.stop="selectIntoChat(`How do I complete task: '${task.title}' for my celebration?`)"
                          >
                            Select ↗
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Contextual Quick Follow-Up Actions Row -->
              <div v-if="getFollowUpActions(msg).length > 0" class="ai-followup-row">
                <span class="followup-title">⚡ Quick Next Actions:</span>
                <div class="followup-chips-wrap">
                  <button
                    v-for="(act, ai) in getFollowUpActions(msg)"
                    :key="ai"
                    class="followup-chip-btn"
                    @click="selectIntoChat(act)"
                    :title="'Select: ' + act"
                  >
                    <span>{{ act }}</span>
                    <span class="chip-arrow">↗</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <span class="bubble-time">{{ msg.timestamp }}</span>
        </div>
      </div>

        <div v-if="isLoading" class="chat-bubble-row assistant">
          <div class="bubble-avatar">
            <Bot :size="14" />
          </div>
          <div class="bubble-wrapper">
            <div class="bubble-content typing-indicator">
              <span></span><span></span><span></span>
              <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 8px">
                PlanCraft Agent reasoning & calling tools...
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Bar -->
      <form class="agent-input-form" @submit.prevent="sendMessage">
        <input
          ref="chatInputRef"
          v-model="inputQuery"
          type="text"
          class="agent-input"
          placeholder="Ask PlanCraft AI (e.g. 'Break down my wedding budget', 'Create run sheet')..."
          :disabled="isLoading"
        />
        <button
          type="submit"
          class="btn btn-primary agent-send-btn"
          :disabled="isLoading || !inputQuery.trim()"
        >
          <Send :size="15" />
          <span>Send</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.agent-modal-card {
  width: 100%;
  max-width: 760px;
  height: 85vh;
  max-height: 820px;
  background: #ffffff;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
}

.agent-header {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
}

.agent-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-badge-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary) 0%, #0d9488 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.agent-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.agent-title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-main);
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 20px;
}

.status-indicator.online {
  background: #dcfce7;
  color: #15803d;
}

.status-indicator .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.agent-subtext {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.agent-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.context-banner {
  padding: 8px 18px;
  background: #f0fdfa;
  border-bottom: 1px solid #ccfbf1;
  font-size: 0.78rem;
  color: #0f766e;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chips-container {
  display: flex;
  gap: 8px;
  padding: 10px 18px;
  background: #ffffff;
  overflow-x: auto;
  border-bottom: 1px solid var(--border);
  scrollbar-width: none;
}

.chips-container::-webkit-scrollbar {
  display: none;
}

.prompt-chip {
  padding: 5px 11px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.prompt-chip:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.agent-chat-stream {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fbfcfe;
}

.chat-bubble-row {
  display: flex;
  gap: 10px;
  max-width: 88%;
}

.chat-bubble-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.chat-bubble-row.assistant {
  align-self: flex-start;
}

.bubble-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user .bubble-avatar {
  background: var(--primary);
  color: white;
}

.assistant .bubble-avatar {
  background: #e0f2fe;
  color: #0284c7;
}

.bubble-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user .bubble-wrapper {
  align-items: flex-end;
}

.bubble-content {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.86rem;
  line-height: 1.5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.user .bubble-content {
  background: var(--primary);
  color: white;
  border-bottom-right-radius: 2px;
}

.assistant .bubble-content {
  background: #ffffff;
  color: var(--text-main);
  border: 1px solid var(--border);
  border-bottom-left-radius: 2px;
}

.assistant .bubble-content.a2ui-only-bubble {
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid var(--border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

/* AI UI Output Card */
.ai-ui-output-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.ai-agent-meta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(15, 118, 110, 0.12);
  margin-bottom: 4px;
}

.ai-meta-identity {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-pulse-badge {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-agent-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary);
}

.ai-model-tag {
  font-size: 0.65rem;
  font-weight: 600;
  background: #f0fdfa;
  color: var(--primary);
  border: 1px solid #ccfbf1;
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.ai-timestamp {
  font-size: 0.68rem;
  color: var(--text-light);
}

/* Parsed Markdown UI Blocks */
.ai-parsed-markdown {
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--text-main);
}

.md-heading-1, .md-heading-2, .md-heading-3 {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--text-main);
  margin: 10px 0 6px 0;
}

.md-heading-1 {
  font-size: 1.05rem;
}

.md-heading-2 {
  font-size: 0.95rem;
}

.md-heading-3 {
  font-size: 0.88rem;
}

.heading-accent {
  width: 3px;
  height: 14px;
  background: var(--primary);
  border-radius: var(--radius-full);
  display: inline-block;
}

.md-code {
  font-family: monospace;
  font-size: 0.82rem;
  background: var(--surface-subtle);
  border: 1px solid var(--surface-border);
  padding: 2px 5px;
  border-radius: var(--radius-sm);
  color: var(--primary);
}

.md-callout {
  background: #f0fdfa;
  border-left: 3px solid var(--primary);
  padding: 8px 12px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  margin: 8px 0;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--text-main);
}

.md-list {
  margin: 6px 0;
  padding-left: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.md-list-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.86rem;
  color: var(--text-main);
}

.bullet-dot {
  color: var(--primary);
  font-size: 1.1rem;
  line-height: 1;
}

.md-step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-subtle);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  margin: 4px 0;
  font-size: 0.84rem;
}

.md-step-num {
  background: var(--primary);
  color: white;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

.md-spacer {
  height: 8px;
}

/* Quick Follow-Up Actions Row */
.ai-followup-row {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--surface-border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.followup-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.followup-chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.followup-chip-btn {
  background: #f8fafc;
  border: 1px solid var(--surface-border);
  color: var(--text-main);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.followup-chip-btn:hover {
  background: #f0fdfa;
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
}

.chip-arrow {
  color: var(--primary);
  font-size: 0.7rem;
}

.bubble-time {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.a2ui-card {
  margin-top: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
}

.a2ui-only-bubble .a2ui-card {
  margin-top: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.a2ui-card-header {
  padding: 8px 12px;
  background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 600;
}

.a2ui-card-header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.a2ui-card-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #ffffff;
}

.a2ui-card-description {
  padding: 8px 12px;
  background: #f1f5f9;
  border-bottom: 1px solid var(--border);
  font-size: 0.78rem;
  color: #334155;
  line-height: 1.45;
}

.delete-card-banner {
  padding: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 6px;
  font-size: 0.82rem;
}

.a2ui-tag {
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.a2ui-body {
  padding: 12px;
}

.a2ui-metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.a2ui-metric {
  background: white;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.a2ui-metric .lbl {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.a2ui-metric .val {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
}

.a2ui-table-wrap {
  overflow-x: auto;
}

.a2ui-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
  background: white;
  border-radius: 6px;
  overflow: hidden;
}

.a2ui-table th,
.a2ui-table td {
  padding: 6px 10px;
  border: 1px solid var(--border);
  text-align: left;
}

.a2ui-table th {
  background: #f1f5f9;
  font-weight: 600;
}

.runsheet-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.runsheet-item {
  display: flex;
  gap: 10px;
  background: white;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.time-badge {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--primary);
  background: #f0fdfa;
  padding: 3px 6px;
  border-radius: 4px;
  height: fit-content;
  white-space: nowrap;
}

.runsheet-detail {
  font-size: 0.78rem;
}

.owner-tag {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 2px;
}

.readiness-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border-radius: 8px;
  background: white;
  border: 1px solid var(--border);
}

.readiness-banner.green {
  border-left: 4px solid #22c55e;
}

.readiness-banner.amber {
  border-left: 4px solid #f59e0b;
}

.score-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  font-weight: 800;
}

.score-title {
  font-weight: 700;
  font-size: 0.9rem;
}

.score-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.typing-indicator {
  display: flex;
  align-items: center;
  padding: 10px 14px;
}

.typing-indicator span:nth-child(1),
.typing-indicator span:nth-child(2),
.typing-indicator span:nth-child(3) {
  width: 6px;
  height: 6px;
  background: var(--text-muted);
  border-radius: 50%;
  margin-right: 4px;
  animation: typing 1s infinite alternate;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  from {
    opacity: 0.3;
    transform: translateY(0);
  }
  to {
    opacity: 1;
    transform: translateY(-4px);
  }
}

.agent-input-form {
  padding: 14px 18px;
  background: #ffffff;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 10px;
  align-items: center;
}

.agent-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.88rem;
  outline: none;
  transition: border-color 0.15s ease;
}

.agent-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(15, 118, 110, 0.12);
}

.agent-send-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  font-weight: 600;
}

.event-lifecycle-card {
  display: flex;
  flex-direction: column;
}

.event-lifecycle-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.event-lifecycle-title {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-main);
}

.event-lifecycle-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.event-lifecycle-venue {
  font-size: 0.78rem;
  color: #334155;
  background: white;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  margin-top: 6px;
}

.card-instruction-hint {
  font-size: 0.74rem;
  font-weight: 600;
  color: #0f766e;
  background: #f0fdfa;
  border: 1px dashed #99f6e4;
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.interactive-list-item {
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 9px 12px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.interactive-list-item:hover {
  background: #f8fafc;
  border-color: var(--primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(15, 118, 110, 0.08);
}

.interactive-list-item.is-selected {
  border-color: var(--primary);
  background: #f0fdfa;
}

.item-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.item-title {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--text-main);
}

.item-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.action-pill {
  padding: 3px 8px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  transition: all 0.12s ease;
}

.action-pill:hover {
  background: var(--primary);
  color: #ffffff;
  border-color: var(--primary);
  transform: translateY(-1px);
}

.btn-select-chip {
  padding: 3px 8px;
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  color: #0f766e;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s ease;
}

.btn-select-chip:hover {
  background: #0f766e;
  color: #ffffff;
  border-color: #0f766e;
}

.clickable-table-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.clickable-table-row:hover {
  background-color: #f0fdfa;
}

.clickable-slot {
  cursor: pointer;
  transition: all 0.15s ease;
}

.clickable-slot:hover {
  border-color: var(--primary);
  background-color: #f0fdfa;
}

.vendor-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.vendor-deposit {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.vendor-tip-box {
  font-size: 0.75rem;
  color: #475569;
  background: #fefce8;
  border: 1px solid #fef08a;
  border-radius: 6px;
  padding: 6px 10px;
}

.immediate-action-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.78rem;
  margin-bottom: 10px;
}

.checklist-phase-block {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.phase-timeline-title {
  font-size: 0.76rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
