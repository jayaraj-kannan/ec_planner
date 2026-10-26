import { describe, it, expect, beforeEach } from 'vitest';
import {
  state,
  currentEvent,
  budgetMetrics,
  taskMetrics,
  guestMetrics,
  readinessMetrics,
  actions,
  formatCurrency,
  calculateDaysUntil,
} from '../eventStore';

describe('EventStore Unit Tests', () => {
  beforeEach(() => {
    // Reset state to a known baseline
    actions.setActiveTab('dashboard');
    actions.setActiveEvent('evt-1');
  });

  describe('Utility & Formatting Functions', () => {
    it('formats currency correctly for USD, INR, and EUR', () => {
      expect(formatCurrency(100000, 'USD')).toBe('$ 1,000');
      expect(formatCurrency(500000, 'INR')).toBe('₹ 5,000');
      expect(formatCurrency(250000, 'EUR')).toBe('€ 2.500');
    });

    it('calculates days until event correctly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const dateStr = futureDate.toISOString().split('T')[0];

      const days = calculateDaysUntil(dateStr);
      expect(days).toBeGreaterThanOrEqual(9);
      expect(days).toBeLessThanOrEqual(11);

      // Undefined or past date
      expect(calculateDaysUntil(undefined)).toBe(0);
      expect(calculateDaysUntil('2020-01-01')).toBe(0);
    });
  });

  describe('Active Event and Navigation', () => {
    it('switches active event successfully', () => {
      actions.setActiveEvent('evt-2');
      expect(state.activeEventId).toBe('evt-2');
      expect(currentEvent.value?.id).toBe('evt-2');
    });

    it('switches navigation tab and closes mobile menu', () => {
      state.isMobileMenuOpen = true;
      actions.setActiveTab('budget');
      expect(state.activeTab).toBe('budget');
      expect(state.isMobileMenuOpen).toBe(false);
    });

    it('opens and closes agent chat modal', () => {
      actions.openAgentChatModal();
      expect(state.isAgentChatModalOpen).toBe(true);

      actions.closeAgentChatModal();
      expect(state.isAgentChatModalOpen).toBe(false);
    });
  });

  describe('Event CRUD Operations', () => {
    it('creates a new event and sets it as active', () => {
      const initialCount = state.events.length;
      actions.createEvent({
        name: 'Grand New Year Gala 2027',
        eventType: 'custom',
        startDate: '2026-12-31',
        plannedBudgetMinor: 5000000,
        expectedGuestCount: 200,
        venueName: 'The Leela Palace Ballroom',
        venueAddress: 'Old Airport Road, Bangalore',
        theme: 'Gilded Glamour',
        endDate: '2027-01-01',
        timeZone: 'UTC',
        currency: 'USD',
      });

      expect(state.events.length).toBe(initialCount + 1);
      const newlyCreated = state.events.find((e) => e.name === 'Grand New Year Gala 2027');
      expect(newlyCreated).toBeDefined();
      expect(state.activeEventId).toBe(newlyCreated?.id);
      expect(newlyCreated?.expectedGuestCount).toBe(200);
    });

    it('updates an existing event directly in store', () => {
      const evt = state.events.find((e) => e.id === 'evt-1');
      expect(evt).toBeDefined();
      if (evt) {
        evt.theme = 'Royal Heritage Modern';
        evt.expectedGuestCount = 380;
        expect(evt.theme).toBe('Royal Heritage Modern');
        expect(evt.expectedGuestCount).toBe(380);
      }
    });

    it('supports deleting an event and falling back gracefully', () => {
      const testEventId = 'evt-temp-test';
      state.events.push({
        id: testEventId,
        name: 'Disposable Event',
        eventType: 'custom',
        ownerId: 'user-1',
        startDate: '2026-11-01',
        endDate: '2026-11-01',
        timeZone: 'UTC',
        venueName: 'Test Hall',
        venueAddress: '123 Test St',
        expectedGuestCount: 50,
        currency: 'USD',
        plannedBudgetMinor: 100000,
        status: 'planning',
        createdAt: new Date().toISOString(),
      });

      actions.setActiveEvent(testEventId);
      expect(state.activeEventId).toBe(testEventId);

      state.events = state.events.filter((e) => e.id !== testEventId);
      actions.setActiveEvent('evt-1');
      expect(state.events.some((e) => e.id === testEventId)).toBe(false);
      expect(state.activeEventId).toBe('evt-1');
    });
  });

  describe('Tasks & Checklists', () => {
    it('toggles task completion status', () => {
      const task = state.tasks.find((t) => t.eventId === state.activeEventId);
      if (task) {
        const initialStatus = task.status;
        actions.toggleTask(task.id);
        expect(task.status).toBe(initialStatus === 'completed' ? 'pending' : 'completed');
      }
    });

    it('adds a new checklist task for the active event', () => {
      const initialTaskCount = state.tasks.filter((t) => t.eventId === state.activeEventId).length;
      actions.addTask({
        eventId: state.activeEventId,
        taskName: 'Confirm cake delivery window with baker',
        category: 'Food & Beverage',
        priority: 'high',
        assignedTo: 'Lead Planner',
        dueDate: '2026-11-14',
      });

      const newTaskCount = state.tasks.filter((t) => t.eventId === state.activeEventId).length;
      expect(newTaskCount).toBe(initialTaskCount + 1);
    });
  });

  describe('Budget & Expense Management', () => {
    it('adds an expense and updates budget metrics', () => {
      const initialPaid = budgetMetrics.value.paidAmountMinor;
      actions.addExpense({
        eventId: state.activeEventId,
        categoryId: 'cat-venue',
        vendorName: 'Royal Lighting Co',
        description: 'Advance Deposit for Lighting Rig',
        currency: 'USD',
        amountMinor: 50000,
        paidAmountMinor: 25000,
        taxAmountMinor: 0,
        paymentStatus: 'paid',
        paymentMethod: 'UPI',
        expenseDate: '2026-10-25',
      });

      expect(budgetMetrics.value.paidAmountMinor).toBe(initialPaid + 25000);
    });
  });

  describe('Guest Management', () => {
    it('adds guest and updates RSVP status', () => {
      actions.addGuest({
        eventId: state.activeEventId,
        guestName: 'Vikram & Ananya Sharma',
        category: 'Friends',
        mobileNumber: '+91 98765 43210',
        partySize: 2,
        mealPreference: 'Veg',
        rsvpStatus: 'pending',
        accommodationRequired: true,
      });

      const guest = state.guests.find((g) => g.guestName === 'Vikram & Ananya Sharma');
      expect(guest).toBeDefined();

      if (guest) {
        actions.updateGuestRSVP(guest.id, 'confirmed');
        expect(guest.rsvpStatus).toBe('confirmed');
      }
    });
  });

  describe('Readiness Evaluation', () => {
    it('computes a valid composite readiness score between 0 and 100', () => {
      const readiness = readinessMetrics.value;
      expect(readiness.readinessScore).toBeGreaterThanOrEqual(0);
      expect(readiness.readinessScore).toBeLessThanOrEqual(100);
      expect(['Event Ready', 'On Track', 'Attention Needed']).toContain(readiness.statusLabel);
    });
  });
});
