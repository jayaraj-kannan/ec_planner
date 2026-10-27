import { reactive, computed } from 'vue';
import type {
  EventItem,
  ChecklistTask,
  BudgetCategory,
  ExpenseItem,
  GuestItem,
  VendorItem,
  ScheduleActivity,
  ArrangementItem,
  DocumentItem,
  NotificationItem,
  EventType,
} from '../types/event';
import {
  INITIAL_EVENTS,
  INITIAL_CATEGORIES,
  INITIAL_TASKS,
  INITIAL_EXPENSES,
  INITIAL_GUESTS,
  INITIAL_VENDORS,
  INITIAL_SCHEDULE,
  INITIAL_ARRANGEMENTS,
  INITIAL_DOCUMENTS,
  INITIAL_NOTIFICATIONS,
} from '../mockData/initialData';
import {
  saveEventDoc,
  deleteEventDoc,
  saveTaskDoc,
  deleteTaskDoc,
  saveExpenseDoc,
  deleteExpenseDoc,
  saveGuestDoc,
  deleteGuestDoc,
  saveVendorDoc,
  saveScheduleDoc,
  saveArrangementDoc,
  saveCategoryDoc,
  seedCompleteEventToFirestore,
  fetchUserEvents,
  fetchEventSubcollections,
} from '../services/firestore.service';
import { authState, registerAuthSyncHooks } from './authStore';

export type ActiveTab =
  | 'dashboard'
  | 'events'
  | 'checklist'
  | 'budget'
  | 'guests'
  | 'vendors'
  | 'schedule'
  | 'arrangements'
  | 'documents'
  | 'settings';

interface State {
  activeTab: ActiveTab;
  activeEventId: string;
  events: EventItem[];
  categories: BudgetCategory[];
  tasks: ChecklistTask[];
  expenses: ExpenseItem[];
  guests: GuestItem[];
  vendors: VendorItem[];
  schedule: ScheduleActivity[];
  arrangements: ArrangementItem[];
  documents: DocumentItem[];
  notifications: NotificationItem[];
  isCreateEventModalOpen: boolean;
  isRunSheetLiveModalOpen: boolean;
  isAgentChatModalOpen: boolean;
  isMobileMenuOpen: boolean;
  searchQuery: string;
}

// LocalStorage key for persistence
const STORAGE_KEY = 'ec_planner_user_state_v2';

function loadInitialState(): State {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          activeTab: parsed.activeTab || 'dashboard',
          activeEventId: parsed.activeEventId || '',
          events: parsed.events || [],
          categories: parsed.categories || [],
          tasks: parsed.tasks || [],
          expenses: parsed.expenses || [],
          guests: parsed.guests || [],
          vendors: parsed.vendors || [],
          schedule: parsed.schedule || [],
          arrangements: parsed.arrangements || [],
          documents: parsed.documents || [],
          notifications: parsed.notifications || [],
          isCreateEventModalOpen: false,
          isRunSheetLiveModalOpen: false,
          isAgentChatModalOpen: false,
          isMobileMenuOpen: false,
          searchQuery: '',
        };
      }
    }
  } catch (e) {
    console.warn('Could not load saved state from localStorage:', e);
  }

  return {
    activeTab: 'dashboard',
    activeEventId: '',
    events: [],
    categories: [],
    tasks: [],
    expenses: [],
    guests: [],
    vendors: [],
    schedule: [],
    arrangements: [],
    documents: [],
    notifications: [],
    isCreateEventModalOpen: false,
    isRunSheetLiveModalOpen: false,
    isAgentChatModalOpen: false,
    isMobileMenuOpen: false,
    searchQuery: '',
  };
}

export const state = reactive<State>(loadInitialState());

function persistState() {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activeTab: state.activeTab,
          activeEventId: state.activeEventId,
          events: state.events,
          categories: state.categories,
          tasks: state.tasks,
          expenses: state.expenses,
          guests: state.guests,
          vendors: state.vendors,
          schedule: state.schedule,
          arrangements: state.arrangements,
          documents: state.documents,
          notifications: state.notifications,
        })
      );
    }
  } catch (e) {
    // Graceful fallback for non-browser or test environments
  }
}

// Getters
export const currentEvent = computed(() => {
  return state.events.find((e) => e.id === state.activeEventId) || state.events[0];
});

export const eventTasks = computed(() => {
  return state.tasks.filter((t) => t.eventId === state.activeEventId);
});

export const eventExpenses = computed(() => {
  return state.expenses.filter((e) => e.eventId === state.activeEventId);
});

export const eventCategories = computed(() => {
  return state.categories.filter((c) => c.eventId === state.activeEventId);
});

export const eventGuests = computed(() => {
  return state.guests.filter((g) => g.eventId === state.activeEventId);
});

export const eventVendors = computed(() => {
  return state.vendors.filter((v) => v.eventId === state.activeEventId);
});

export const eventSchedule = computed(() => {
  return state.schedule.filter((s) => s.eventId === state.activeEventId);
});

export const eventArrangements = computed(() => {
  return state.arrangements.filter((a) => a.eventId === state.activeEventId);
});

export const eventDocuments = computed(() => {
  return state.documents.filter((d) => d.eventId === state.activeEventId);
});

// Computed Metrics to answer the 5 core questions:
// 1. What should I do next?
export const nextSteps = computed(() => {
  const tasks = eventTasks.value;
  const overdue = tasks.filter((t) => t.status === 'overdue');
  const highPriorityPending = tasks.filter(
    (t) => t.status === 'pending' && t.priority === 'high'
  );
  const remainingPending = tasks.filter(
    (t) => t.status === 'pending' && t.priority !== 'high'
  );

  return [...overdue, ...highPriorityPending, ...remainingPending].slice(0, 5);
});

// 2. How much have I spent, and how much budget remains?
export const budgetMetrics = computed(() => {
  const evt = currentEvent.value;
  const plannedMinor = evt ? evt.plannedBudgetMinor : 0;

  const expenses = eventExpenses.value;
  // Total actual expense (amountMinor + taxAmountMinor)
  const actualSpentMinor = expenses.reduce(
    (sum, exp) => (exp.paymentStatus !== 'cancelled' ? sum + exp.amountMinor + exp.taxAmountMinor : sum),
    0
  );

  // Paid amount
  const paidAmountMinor = expenses.reduce(
    (sum, exp) => (exp.paymentStatus !== 'cancelled' ? sum + exp.paidAmountMinor : sum),
    0
  );

  // Outstanding amount (committed expense minus paid)
  const outstandingAmountMinor = Math.max(0, actualSpentMinor - paidAmountMinor);

  // Remaining budget
  const remainingBudgetMinor = Math.max(0, plannedMinor - actualSpentMinor);

  // Spend percentage
  const spendPercent = plannedMinor > 0 ? Math.min(100, Math.round((actualSpentMinor / plannedMinor) * 100)) : 0;

  return {
    currency: evt ? evt.currency : 'INR',
    plannedMinor,
    actualSpentMinor,
    paidAmountMinor,
    outstandingAmountMinor,
    remainingBudgetMinor,
    spendPercent,
    isOverBudget: actualSpentMinor > plannedMinor,
  };
});

// 3. Which tasks are overdue or still pending?
export const taskMetrics = computed(() => {
  const tasks = eventTasks.value;
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const overdue = tasks.filter((t) => t.status === 'overdue').length;
  const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    overdue,
    pending,
    completionPercent,
  };
});

// 4. Who has confirmed attendance?
export const guestMetrics = computed(() => {
  const guests = eventGuests.value;
  const totalGuests = guests.length;
  const totalInvitedPax = guests.reduce((sum, g) => sum + g.partySize, 0);

  const confirmedGuests = guests.filter((g) => g.rsvpStatus === 'confirmed');
  const confirmedPax = confirmedGuests.reduce((sum, g) => sum + g.partySize, 0);

  const pendingGuests = guests.filter((g) => g.rsvpStatus === 'pending');
  const pendingPax = pendingGuests.reduce((sum, g) => sum + g.partySize, 0);

  const declinedGuests = guests.filter((g) => g.rsvpStatus === 'declined');
  const declinedPax = declinedGuests.reduce((sum, g) => sum + g.partySize, 0);

  const vegPax = guests
    .filter((g) => g.rsvpStatus === 'confirmed' && (g.mealPreference === 'Veg' || g.mealPreference === 'Jain' || g.mealPreference === 'Vegan'))
    .reduce((sum, g) => sum + g.partySize, 0);

  const nonVegPax = guests
    .filter((g) => g.rsvpStatus === 'confirmed' && g.mealPreference === 'Non-Veg')
    .reduce((sum, g) => sum + g.partySize, 0);

  const hotelRoomsRequired = guests
    .filter((g) => g.rsvpStatus === 'confirmed' && g.accommodationRequired)
    .reduce((sum, g) => sum + Math.ceil(g.partySize / 2), 0);

  return {
    totalGuests,
    totalInvitedPax,
    confirmedPax,
    pendingPax,
    declinedPax,
    vegPax,
    nonVegPax,
    hotelRoomsRequired,
    confirmedPercent: totalInvitedPax > 0 ? Math.round((confirmedPax / totalInvitedPax) * 100) : 0,
  };
});

// 5. Am I ready for the event day?
export const readinessMetrics = computed(() => {
  const daysUntil = calculateDaysUntil(currentEvent.value?.startDate);
  const tasksReady = taskMetrics.value.completionPercent >= 80;
  const runSheetReady = eventSchedule.value.length > 0;
  const arrangements = eventArrangements.value;
  const readyArrangements = arrangements.filter((a) => a.status === 'ready').length;
  const arrangementPercent = arrangements.length > 0 ? Math.round((readyArrangements / arrangements.length) * 100) : 0;

  // Composite Readiness Score (0 - 100)
  const taskWeight = taskMetrics.value.completionPercent * 0.45;
  const guestWeight = guestMetrics.value.confirmedPercent * 0.25;
  const arrangementWeight = arrangementPercent * 0.3;
  const score = Math.round(taskWeight + guestWeight + arrangementWeight);

  return {
    daysUntil,
    readinessScore: Math.min(100, Math.max(0, score)),
    tasksReady,
    runSheetReady,
    readyArrangements,
    totalArrangements: arrangements.length,
    statusLabel: score >= 85 ? 'Event Ready' : score >= 60 ? 'On Track' : 'Attention Needed',
  };
});

// Helper functions
export function calculateDaysUntil(dateStr?: string): number {
  if (!dateStr) return 0;
  const target = new Date(dateStr).getTime();
  const now = new Date().getTime();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function formatCurrency(minorAmount: number, currency: string = 'INR'): string {
  const majorAmount = minorAmount / 100;
  if (currency === 'INR') {
    return '₹ ' + majorAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  if (currency === 'USD') {
    return '$ ' + majorAmount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  if (currency === 'EUR') {
    return '€ ' + majorAmount.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  }
  return currency + ' ' + majorAmount.toLocaleString();
}

// Action Handlers
export const actions = {
  setActiveTab(tab: ActiveTab) {
    state.activeTab = tab;
    state.isMobileMenuOpen = false;
    persistState();
  },

  setActiveEvent(eventId: string) {
    state.activeEventId = eventId;
    persistState();
    if (typeof authState !== 'undefined' && authState.user) {
      fetchEventSubcollections(eventId)
        .then((subData) => {
          if (subData) {
            state.categories = subData.categories || [];
            state.tasks = subData.tasks || [];
            state.expenses = subData.expenses || [];
            state.guests = subData.guests || [];
            state.vendors = subData.vendors || [];
            state.schedule = subData.schedule || [];
            state.arrangements = subData.arrangements || [];
            state.documents = subData.documents || [];
            persistState();
          }
        })
        .catch((e) => console.warn('Subcollections switch notice:', e));
    }
  },

  toggleMobileMenu() {
    state.isMobileMenuOpen = !state.isMobileMenuOpen;
  },

  closeMobileMenu() {
    state.isMobileMenuOpen = false;
  },

  openCreateEventModal() {
    state.isCreateEventModalOpen = true;
    state.isMobileMenuOpen = false;
  },

  closeCreateEventModal() {
    state.isCreateEventModalOpen = false;
  },

  openRunSheetLiveModal() {
    state.isRunSheetLiveModalOpen = true;
  },

  closeRunSheetLiveModal() {
    state.isRunSheetLiveModalOpen = false;
  },

  openAgentChatModal() {
    state.isAgentChatModalOpen = true;
    state.isMobileMenuOpen = false;
  },

  closeAgentChatModal() {
    state.isAgentChatModalOpen = false;
  },

  // Tasks actions
  toggleTask(taskId: string) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (task) {
      if (task.status === 'completed') {
        task.status = 'pending';
        task.completedAt = undefined;
      } else {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
      }
      persistState();
      saveTaskDoc(task);
    }
  },

  addTask(task: Omit<ChecklistTask, 'id' | 'status' | 'completedAt'>) {
    const newTask: ChecklistTask = {
      ...task,
      id: 'tsk-' + Date.now(),
      status: 'pending',
    };
    state.tasks.unshift(newTask);
    persistState();
    saveTaskDoc(newTask);
  },

  deleteTask(taskId: string) {
    const eventId = state.activeEventId;
    state.tasks = state.tasks.filter((t) => t.id !== taskId);
    persistState();
    deleteTaskDoc(eventId, taskId);
  },

  // Expense actions
  addExpense(expense: Omit<ExpenseItem, 'id'>) {
    const newExp: ExpenseItem = {
      ...expense,
      id: 'exp-' + Date.now(),
    };
    state.expenses.unshift(newExp);
    persistState();
    saveExpenseDoc(newExp);
  },

  updateExpensePayment(expenseId: string, paidAmountMinor: number, status: ExpenseItem['paymentStatus']) {
    const exp = state.expenses.find((e) => e.id === expenseId);
    if (exp) {
      exp.paidAmountMinor = paidAmountMinor;
      exp.paymentStatus = status;
      persistState();
      saveExpenseDoc(exp);
    }
  },

  deleteExpense(expenseId: string) {
    const eventId = state.activeEventId;
    state.expenses = state.expenses.filter((e) => e.id !== expenseId);
    persistState();
    deleteExpenseDoc(eventId, expenseId);
  },

  // Guests actions
  addGuest(guest: Omit<GuestItem, 'id'>) {
    const newGuest: GuestItem = {
      ...guest,
      id: 'gst-' + Date.now(),
    };
    state.guests.unshift(newGuest);
    persistState();
    saveGuestDoc(newGuest);
  },

  updateGuestRSVP(guestId: string, rsvpStatus: GuestItem['rsvpStatus']) {
    const guest = state.guests.find((g) => g.id === guestId);
    if (guest) {
      guest.rsvpStatus = rsvpStatus;
      persistState();
      saveGuestDoc(guest);
    }
  },

  deleteGuest(guestId: string) {
    const eventId = state.activeEventId;
    state.guests = state.guests.filter((g) => g.id !== guestId);
    persistState();
    deleteGuestDoc(eventId, guestId);
  },

  // Vendors actions
  addVendor(vendor: Omit<VendorItem, 'id'>) {
    const newVendor: VendorItem = {
      ...vendor,
      id: 'vnd-' + Date.now(),
    };
    state.vendors.push(newVendor);
    persistState();
    saveVendorDoc(newVendor);
  },

  updateVendorPayment(vendorId: string, advancePaidMinor: number) {
    const v = state.vendors.find((item) => item.id === vendorId);
    if (v) {
      v.advancePaidMinor = advancePaidMinor;
      persistState();
      saveVendorDoc(v);
    }
  },

  // Schedule & Run Sheet actions
  updateScheduleStatus(activityId: string, status: ScheduleActivity['status']) {
    const act = state.schedule.find((s) => s.id === activityId);
    if (act) {
      act.status = status;
      persistState();
      saveScheduleDoc(act);
    }
  },

  reportScheduleDelay(activityId: string, additionalMinutes: number) {
    const act = state.schedule.find((s) => s.id === activityId);
    if (act) {
      act.delayMinutes = (act.delayMinutes || 0) + additionalMinutes;
      act.status = 'delayed';
      persistState();
      saveScheduleDoc(act);
    }
  },

  addScheduleActivity(activity: Omit<ScheduleActivity, 'id' | 'delayMinutes'>) {
    const newAct: ScheduleActivity = {
      ...activity,
      id: 'sch-' + Date.now(),
      delayMinutes: 0,
    };
    state.schedule.push(newAct);
    persistState();
    saveScheduleDoc(newAct);
  },

  // Arrangements actions
  updateArrangementStatus(arrId: string, status: ArrangementItem['status']) {
    const arr = state.arrangements.find((a) => a.id === arrId);
    if (arr) {
      arr.status = status;
      persistState();
      saveArrangementDoc(arr);
    }
  },

  // Create Event Wizard Completion
  createEvent(eventData: Omit<EventItem, 'id' | 'createdAt' | 'status' | 'ownerId'>, customOwnerId?: string) {
    const newEventId = 'evt-' + Date.now();
    const ownerId = customOwnerId || (typeof authState !== 'undefined' && authState.user?.uid) || 'user-1';
    const newEvent: EventItem = {
      ...eventData,
      id: newEventId,
      ownerId,
      status: 'planning',
      createdAt: new Date().toISOString(),
    };

    state.events.unshift(newEvent);
    state.activeEventId = newEventId;

    // Seed default categories and starter tasks based on event type!
    seedDefaultsForEventType(newEventId, eventData.eventType, eventData.plannedBudgetMinor);

    persistState();
    saveEventDoc(newEvent);
    return newEventId;
  },

  deleteEvent(eventId: string) {
    state.events = state.events.filter((e) => e.id !== eventId);
    state.categories = state.categories.filter((c) => c.eventId !== eventId);
    state.tasks = state.tasks.filter((t) => t.eventId !== eventId);
    state.expenses = state.expenses.filter((x) => x.eventId !== eventId);
    state.guests = state.guests.filter((g) => g.eventId !== eventId);
    state.vendors = state.vendors.filter((v) => v.eventId !== eventId);
    state.schedule = state.schedule.filter((s) => s.eventId !== eventId);
    state.arrangements = state.arrangements.filter((a) => a.eventId !== eventId);
    state.documents = state.documents.filter((d) => d.eventId !== eventId);
    if (state.activeEventId === eventId) {
      state.activeEventId = state.events[0]?.id || '';
    }
    persistState();
    deleteEventDoc(eventId);
  },

  async syncAllToFirestore(userId?: string) {
    const evt = state.events.find((e) => e.id === state.activeEventId) || state.events[0];
    if (evt) {
      const cats = state.categories.filter((c) => c.eventId === evt.id);
      const tsks = state.tasks.filter((t) => t.eventId === evt.id);
      const exps = state.expenses.filter((x) => x.eventId === evt.id);
      const gsts = state.guests.filter((g) => g.eventId === evt.id);
      const vnds = state.vendors.filter((v) => v.eventId === evt.id);
      const schs = state.schedule.filter((s) => s.eventId === evt.id);
      const arrs = state.arrangements.filter((a) => a.eventId === evt.id);
      const docs = state.documents.filter((d) => d.eventId === evt.id);
      return await seedCompleteEventToFirestore(
        evt,
        cats,
        tsks,
        exps,
        gsts,
        vnds,
        schs,
        arrs,
        docs,
        userId
      );
    }
    return false;
  },

  async loadFromFirestore(userId: string) {
    try {
      const events = await fetchUserEvents(userId);
      if (events && events.length > 0) {
        state.events = events;
        if (!events.some((e) => e.id === state.activeEventId)) {
          state.activeEventId = events[0].id;
        }
        const subData = await fetchEventSubcollections(state.activeEventId);
        if (subData) {
          state.categories = subData.categories || [];
          state.tasks = subData.tasks || [];
          state.expenses = subData.expenses || [];
          state.guests = subData.guests || [];
          state.vendors = subData.vendors || [];
          state.schedule = subData.schedule || [];
          state.arrangements = subData.arrangements || [];
          state.documents = subData.documents || [];
        }
      } else {
        state.events = [];
        state.activeEventId = '';
        state.categories = [];
        state.tasks = [];
        state.expenses = [];
        state.guests = [];
        state.vendors = [];
        state.schedule = [];
        state.arrangements = [];
        state.documents = [];
        state.notifications = [];
      }
      persistState();
    } catch (err) {
      console.warn('Error loading user data from Firestore:', err);
    }
  },

  clearUserData() {
    state.events = [];
    state.activeEventId = '';
    state.categories = [];
    state.tasks = [];
    state.expenses = [];
    state.guests = [];
    state.vendors = [];
    state.schedule = [];
    state.arrangements = [];
    state.documents = [];
    state.notifications = [];
    if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  // Notifications
  markNotificationRead(notifId: string) {
    const n = state.notifications.find((notif) => notif.id === notifId);
    if (n) {
      n.read = true;
      persistState();
    }
  },

  markAllNotificationsRead() {
    state.notifications.forEach((n) => (n.read = true));
    persistState();
  },

  // Reset to original mock data
  resetToMockDefaults() {
    if (typeof localStorage !== 'undefined' && typeof localStorage.removeItem === 'function') {
      localStorage.removeItem(STORAGE_KEY);
    }
    state.events = [...INITIAL_EVENTS];
    state.categories = [...INITIAL_CATEGORIES];
    state.tasks = [...INITIAL_TASKS];
    state.expenses = [...INITIAL_EXPENSES];
    state.guests = [...INITIAL_GUESTS];
    state.vendors = [...INITIAL_VENDORS];
    state.schedule = [...INITIAL_SCHEDULE];
    state.arrangements = [...INITIAL_ARRANGEMENTS];
    state.documents = [...INITIAL_DOCUMENTS];
    state.notifications = [...INITIAL_NOTIFICATIONS];
    state.activeEventId = 'evt-1';
    state.activeTab = 'dashboard';
    persistState();
  },
};

function seedDefaultsForEventType(eventId: string, type: EventType, budgetMinor: number) {
  if (type === 'wedding' || type === 'reception' || type === 'engagement') {
    state.categories.push(
      { id: 'cat-' + Date.now() + '-1', eventId, name: 'Venue & Lawns', allocatedAmountMinor: Math.round(budgetMinor * 0.35) },
      { id: 'cat-' + Date.now() + '-2', eventId, name: 'Catering & Dining', allocatedAmountMinor: Math.round(budgetMinor * 0.28) },
      { id: 'cat-' + Date.now() + '-3', eventId, name: 'Decor & Florals', allocatedAmountMinor: Math.round(budgetMinor * 0.15) },
      { id: 'cat-' + Date.now() + '-4', eventId, name: 'Photography & Film', allocatedAmountMinor: Math.round(budgetMinor * 0.12) },
      { id: 'cat-' + Date.now() + '-5', eventId, name: 'Music & Entertainment', allocatedAmountMinor: Math.round(budgetMinor * 0.05) },
      { id: 'cat-' + Date.now() + '-6', eventId, name: 'Favors & Misc', allocatedAmountMinor: Math.round(budgetMinor * 0.05) }
    );

    state.tasks.push(
      { id: 'tsk-' + Date.now() + '-1', eventId, taskName: 'Book and confirm wedding venue', category: 'Venue', assignedTo: 'Owner', dueDate: '2026-11-20', priority: 'high', status: 'pending' },
      { id: 'tsk-' + Date.now() + '-2', eventId, taskName: 'Schedule menu tasting with caterer', category: 'Catering', assignedTo: 'Owner', dueDate: '2026-11-25', priority: 'high', status: 'pending' },
      { id: 'tsk-' + Date.now() + '-3', eventId, taskName: 'Send digital save-the-date invitations', category: 'Invitations', assignedTo: 'Family', dueDate: '2026-11-30', priority: 'medium', status: 'pending' }
    );
  } else if (type === 'birthday' || type === 'baby_shower') {
    state.categories.push(
      { id: 'cat-' + Date.now() + '-1', eventId, name: 'Venue & Play Space', allocatedAmountMinor: Math.round(budgetMinor * 0.35) },
      { id: 'cat-' + Date.now() + '-2', eventId, name: 'Cake & Catering', allocatedAmountMinor: Math.round(budgetMinor * 0.4) },
      { id: 'cat-' + Date.now() + '-3', eventId, name: 'Theme Balloon Decor', allocatedAmountMinor: Math.round(budgetMinor * 0.15) },
      { id: 'cat-' + Date.now() + '-4', eventId, name: 'Party Favors & Games', allocatedAmountMinor: Math.round(budgetMinor * 0.1) }
    );

    state.tasks.push(
      { id: 'tsk-' + Date.now() + '-1', eventId, taskName: 'Design customized theme cake', category: 'Catering', assignedTo: 'Owner', dueDate: '2026-11-10', priority: 'high', status: 'pending' },
      { id: 'tsk-' + Date.now() + '-2', eventId, taskName: 'Hire kids magician / balloon artist', category: 'Entertainment', assignedTo: 'Owner', dueDate: '2026-11-12', priority: 'medium', status: 'pending' }
    );
  } else {
    state.categories.push(
      { id: 'cat-' + Date.now() + '-1', eventId, name: 'Auditorium & Stage', allocatedAmountMinor: Math.round(budgetMinor * 0.4) },
      { id: 'cat-' + Date.now() + '-2', eventId, name: 'Audio Visual & Stream', allocatedAmountMinor: Math.round(budgetMinor * 0.25) },
      { id: 'cat-' + Date.now() + '-3', eventId, name: 'Corporate Catering', allocatedAmountMinor: Math.round(budgetMinor * 0.25) },
      { id: 'cat-' + Date.now() + '-4', eventId, name: 'Badges & Swag', allocatedAmountMinor: Math.round(budgetMinor * 0.1) }
    );

    state.tasks.push(
      { id: 'tsk-' + Date.now() + '-1', eventId, taskName: 'Finalize keynote speakers and schedule', category: 'Agenda', assignedTo: 'Lead Organizer', dueDate: '2026-12-01', priority: 'high', status: 'pending' }
    );
  }
}

// Hook auth synchronization for Firestore data loading and cleanup
registerAuthSyncHooks(
  async (userId: string) => {
    await actions.loadFromFirestore(userId);
  },
  () => {
    actions.clearUserData();
  }
);

