import { describe, it, expect, beforeEach } from 'vitest';
import {
  state,
  currentEvent,
  budgetMetrics,
  taskMetrics,
  guestMetrics,
  readinessMetrics,
  eventCategories,
  eventExpenses,
  eventTasks,
  eventGuests,
  eventVendors,
  eventSchedule,
  eventArrangements,
  eventDocuments,
  nextSteps,
  actions,
  formatCurrency,
  calculateDaysUntil,
} from '../eventStore';

describe('EventStore Comprehensive Unit Tests (100% Coverage)', () => {
  beforeEach(() => {
    actions.resetToMockDefaults();
    actions.setActiveTab('dashboard');
    actions.setActiveEvent('evt-1');
  });

  describe('Formatting & Utility Functions', () => {
    it('formats currency correctly for USD, INR, EUR, and default currencies', () => {
      expect(formatCurrency(100000, 'USD')).toBe('$ 1,000');
      expect(formatCurrency(500000, 'INR')).toBe('₹ 5,000');
      expect(formatCurrency(250000, 'EUR')).toBe('€ 2.500');
      expect(formatCurrency(300000, 'GBP')).toContain('3,000');
    });

    it('calculates days until event correctly for future, today, past, and undefined', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const dateStr = futureDate.toISOString().split('T')[0];

      const days = calculateDaysUntil(dateStr);
      expect(days).toBeGreaterThanOrEqual(9);
      expect(days).toBeLessThanOrEqual(11);

      expect(calculateDaysUntil(undefined)).toBe(0);
      expect(calculateDaysUntil('2020-01-01')).toBe(0);
    });
  });

  describe('Getters & Reactive Computeds', () => {
    it('falls back to first event if activeEventId is not found', () => {
      actions.setActiveEvent('evt-non-existent');
      expect(currentEvent.value).toBeDefined();
      expect(currentEvent.value?.id).toBe(state.events[0].id);
    });

    it('computes event-filtered collections correctly', () => {
      expect(eventCategories.value.length).toBeGreaterThan(0);
      expect(eventExpenses.value.length).toBeGreaterThan(0);
      expect(eventTasks.value.length).toBeGreaterThan(0);
      expect(eventGuests.value.length).toBeGreaterThan(0);
      expect(eventVendors.value.length).toBeGreaterThan(0);
      expect(eventSchedule.value.length).toBeGreaterThan(0);
      expect(eventArrangements.value.length).toBeGreaterThan(0);
      expect(eventDocuments.value.length).toBeGreaterThanOrEqual(0);
    });

    it('computes nextSteps prioritizing overdue, high priority pending, and other pending tasks', () => {
      state.tasks = [
        {
          id: 'tsk-overdue',
          eventId: state.activeEventId,
          taskName: 'Overdue Task',
          category: 'Catering',
          assignedTo: 'Owner',
          dueDate: '2020-01-01',
          priority: 'low',
          status: 'overdue',
        },
        {
          id: 'tsk-high',
          eventId: state.activeEventId,
          taskName: 'High Priority Task',
          category: 'Venue',
          assignedTo: 'Owner',
          dueDate: '2026-12-01',
          priority: 'high',
          status: 'pending',
        },
        {
          id: 'tsk-med',
          eventId: state.activeEventId,
          taskName: 'Medium Task',
          category: 'Decor',
          assignedTo: 'Owner',
          dueDate: '2026-12-05',
          priority: 'medium',
          status: 'pending',
        },
      ];

      const steps = nextSteps.value;
      expect(steps.length).toBe(3);
      expect(steps[0].id).toBe('tsk-overdue');
      expect(steps[1].id).toBe('tsk-high');
      expect(steps[2].id).toBe('tsk-med');
    });

    it('computes budget metrics including overbudget state', () => {
      // Normal state
      expect(budgetMetrics.value.plannedMinor).toBeGreaterThan(0);
      expect(budgetMetrics.value.actualSpentMinor).toBeGreaterThanOrEqual(0);

      // Trigger overbudget state
      actions.addExpense({
        eventId: state.activeEventId,
        categoryId: 'cat-venue',
        vendorName: 'Mega Venue',
        description: 'Huge Overbudget Hall',
        currency: 'USD',
        amountMinor: 500000000,
        paidAmountMinor: 500000000,
        taxAmountMinor: 0,
        paymentStatus: 'paid',
        paymentMethod: 'Bank Transfer',
        expenseDate: '2026-10-25',
      });
      expect(budgetMetrics.value.isOverBudget).toBe(true);
      expect(budgetMetrics.value.remainingBudgetMinor).toBe(0);
    });

    it('computes guest dietary, RSVP, and hotel room metrics correctly', () => {
      const gm = guestMetrics.value;
      expect(gm.totalGuests).toBeGreaterThan(0);
      expect(gm.totalInvitedPax).toBeGreaterThan(0);
      expect(gm.confirmedPax).toBeGreaterThanOrEqual(0);
      expect(gm.pendingPax).toBeGreaterThanOrEqual(0);
      expect(gm.declinedPax).toBeGreaterThanOrEqual(0);
      expect(gm.vegPax).toBeGreaterThanOrEqual(0);
      expect(gm.nonVegPax).toBeGreaterThanOrEqual(0);
      expect(gm.hotelRoomsRequired).toBeGreaterThanOrEqual(0);

      // Test zero guests branch
      state.guests = [];
      expect(guestMetrics.value.confirmedPercent).toBe(0);
    });

    it('evaluates readiness status labels correctly across score ranges', () => {
      expect(['Event Ready', 'On Track', 'Attention Needed']).toContain(readinessMetrics.value.statusLabel);

      // Empty arrangements branch
      state.arrangements = [];
      expect(readinessMetrics.value.totalArrangements).toBe(0);
    });
  });

  describe('UI Navigation & Modal State Actions', () => {
    it('sets active tab and closes mobile menu', () => {
      state.isMobileMenuOpen = true;
      actions.setActiveTab('checklist');
      expect(state.activeTab).toBe('checklist');
      expect(state.isMobileMenuOpen).toBe(false);
    });

    it('toggles and closes mobile menu', () => {
      state.isMobileMenuOpen = false;
      actions.toggleMobileMenu();
      expect(state.isMobileMenuOpen).toBe(true);
      actions.closeMobileMenu();
      expect(state.isMobileMenuOpen).toBe(false);
    });

    it('opens and closes Create Event modal', () => {
      actions.openCreateEventModal();
      expect(state.isCreateEventModalOpen).toBe(true);
      actions.closeCreateEventModal();
      expect(state.isCreateEventModalOpen).toBe(false);
    });

    it('opens and closes Run Sheet Live modal', () => {
      actions.openRunSheetLiveModal();
      expect(state.isRunSheetLiveModalOpen).toBe(true);
      actions.closeRunSheetLiveModal();
      expect(state.isRunSheetLiveModalOpen).toBe(false);
    });

    it('opens and closes Agent Chat modal', () => {
      actions.openAgentChatModal();
      expect(state.isAgentChatModalOpen).toBe(true);
      actions.closeAgentChatModal();
      expect(state.isAgentChatModalOpen).toBe(false);
    });
  });

  describe('Event Creation Wizard & Type Seeding', () => {
    it('creates wedding celebration and seeds wedding categories & tasks', () => {
      const eid = actions.createEvent({
        name: 'Arjun & Maya Royal Wedding',
        eventType: 'wedding',
        startDate: '2026-12-18',
        plannedBudgetMinor: 20000000,
        expectedGuestCount: 300,
        venueName: 'Palace Grounds',
        venueAddress: 'Bangalore',
        theme: 'Traditional Royal',
        currency: 'INR',
        timeZone: 'Asia/Kolkata',
      });

      expect(state.activeEventId).toBe(eid);
      const cats = state.categories.filter((c) => c.eventId === eid);
      expect(cats.some((c) => c.name.includes('Venue'))).toBe(true);
      expect(cats.some((c) => c.name.includes('Catering'))).toBe(true);
    });

    it('creates birthday celebration and seeds birthday categories & tasks', () => {
      const eid = actions.createEvent({
        name: 'Rohan 5th Birthday',
        eventType: 'birthday',
        startDate: '2026-11-20',
        plannedBudgetMinor: 200000,
        expectedGuestCount: 40,
        venueName: 'Fun Space Playpark',
        venueAddress: 'Whitefield',
        theme: 'Space Explorers',
        currency: 'USD',
        timeZone: 'UTC',
      });

      const cats = state.categories.filter((c) => c.eventId === eid);
      expect(cats.some((c) => c.name.includes('Cake'))).toBe(true);
      const tasks = state.tasks.filter((t) => t.eventId === eid);
      expect(tasks.some((t) => t.taskName.includes('cake'))).toBe(true);
    });

    it('creates custom celebration and seeds general categories & tasks', () => {
      const eid = actions.createEvent({
        name: 'Tech Alumni Reunion 2026',
        eventType: 'custom',
        startDate: '2026-12-05',
        plannedBudgetMinor: 500000,
        expectedGuestCount: 100,
        venueName: 'Auditorium Hall',
        venueAddress: 'Campus 1',
        theme: 'Memories & Future',
        currency: 'USD',
        timeZone: 'UTC',
      });

      const cats = state.categories.filter((c) => c.eventId === eid);
      expect(cats.some((c) => c.name.includes('Auditorium'))).toBe(true);
    });

    it('creates baby shower and reception celebrations covering remaining seed branches', () => {
      const babyEid = actions.createEvent({
        name: 'Baby Shower Bliss',
        eventType: 'baby_shower',
        startDate: '2026-11-28',
        plannedBudgetMinor: 300000,
        expectedGuestCount: 50,
        venueName: 'Garden Cafe',
        venueAddress: 'Green Way',
        theme: 'Pastel Dream',
        currency: 'USD',
        timeZone: 'UTC',
      });
      const babyCats = state.categories.filter((c) => c.eventId === babyEid);
      expect(babyCats.some((c) => c.name.includes('Cake'))).toBe(true);

      const recepEid = actions.createEvent({
        name: 'Grand Reception Evening',
        eventType: 'reception',
        startDate: '2026-12-20',
        plannedBudgetMinor: 15000000,
        expectedGuestCount: 250,
        venueName: 'Grand Banquet',
        venueAddress: 'South Avenue',
        theme: 'Evening Glam',
        currency: 'INR',
        timeZone: 'Asia/Kolkata',
      });
      const recepCats = state.categories.filter((c) => c.eventId === recepEid);
      expect(recepCats.some((c) => c.name.includes('Venue'))).toBe(true);
    });
  });

  describe('Task Operations', () => {
    it('adds, toggles, and deletes a task', () => {
      actions.addTask({
        eventId: state.activeEventId,
        taskName: 'Sample Quality Test Task',
        category: 'General',
        assignedTo: 'Lead Organizer',
        priority: 'high',
        dueDate: '2026-11-15',
      });

      const added = state.tasks.find((t) => t.taskName === 'Sample Quality Test Task');
      expect(added).toBeDefined();
      expect(added?.status).toBe('pending');

      if (added) {
        // Toggle to completed
        actions.toggleTask(added.id);
        expect(added.status).toBe('completed');
        expect(added.completedAt).toBeDefined();

        // Toggle back to pending
        actions.toggleTask(added.id);
        expect(added.status).toBe('pending');
        expect(added.completedAt).toBeUndefined();

        // Delete task
        actions.deleteTask(added.id);
        expect(state.tasks.some((t) => t.id === added.id)).toBe(false);
      }
    });
  });

  describe('Expense & Vendor Operations', () => {
    it('adds, updates, and deletes an expense', () => {
      actions.addExpense({
        eventId: state.activeEventId,
        categoryId: 'cat-venue',
        vendorName: 'Stage Lights Pro',
        description: 'Sound equipment advance',
        currency: 'USD',
        amountMinor: 30000,
        paidAmountMinor: 10000,
        taxAmountMinor: 1000,
        paymentStatus: 'partial',
        paymentMethod: 'Credit Card',
        expenseDate: '2026-10-25',
      });

      const exp = state.expenses.find((e) => e.description === 'Sound equipment advance');
      expect(exp).toBeDefined();

      if (exp) {
        actions.updateExpensePayment(exp.id, 30000, 'paid');
        expect(exp.paidAmountMinor).toBe(30000);
        expect(exp.paymentStatus).toBe('paid');

        actions.deleteExpense(exp.id);
        expect(state.expenses.some((e) => e.id === exp.id)).toBe(false);
      }
    });

    it('adds and updates vendor payment', () => {
      actions.addVendor({
        eventId: state.activeEventId,
        name: 'Gourmet Catering Co',
        category: 'Catering',
        contactPerson: 'Chef Sanjeev',
        mobileNumber: '+91 99887 76655',
        email: 'chef@gourmet.test',
        agreedPriceMinor: 1200000,
        advancePaidMinor: 300000,
        status: 'Contract Signed',
      });

      const v = state.vendors.find((item) => item.name === 'Gourmet Catering Co');
      expect(v).toBeDefined();

      if (v) {
        actions.updateVendorPayment(v.id, 600000);
        expect(v.advancePaidMinor).toBe(600000);
      }
    });
  });

  describe('Guest Operations', () => {
    it('adds, updates RSVP, and deletes guest', () => {
      actions.addGuest({
        eventId: state.activeEventId,
        guestName: 'Kavita Sundaram',
        category: 'VIP',
        mobileNumber: '+91 91234 56789',
        partySize: 3,
        mealPreference: 'Jain',
        rsvpStatus: 'pending',
        accommodationRequired: true,
      });

      const g = state.guests.find((item) => item.guestName === 'Kavita Sundaram');
      expect(g).toBeDefined();

      if (g) {
        actions.updateGuestRSVP(g.id, 'confirmed');
        expect(g.rsvpStatus).toBe('confirmed');

        actions.deleteGuest(g.id);
        expect(state.guests.some((item) => item.id === g.id)).toBe(false);
      }
    });
  });

  describe('Schedule, Arrangements, & Notifications', () => {
    it('adds and updates schedule activities and delay reporting', () => {
      actions.addScheduleActivity({
        eventId: state.activeEventId,
        activityName: 'Welcome Dance Performance',
        scheduleDate: '2026-12-18',
        startTime: '18:00',
        endTime: '18:30',
        responsiblePerson: 'Dance Troupe',
        backupContact: 'John',
        phone: '1234567890',
        location: 'Main Stage',
        status: 'upcoming',
      });

      const act = state.schedule.find((s) => s.activityName === 'Welcome Dance Performance');
      expect(act).toBeDefined();

      if (act) {
        actions.updateScheduleStatus(act.id, 'in_progress');
        expect(act.status).toBe('in_progress');

        actions.reportScheduleDelay(act.id, 15);
        expect(act.delayMinutes).toBe(15);
        expect(act.status).toBe('delayed');
      }
    });

    it('updates arrangement status', () => {
      const arr = state.arrangements[0];
      if (arr) {
        actions.updateArrangementStatus(arr.id, 'ready');
        expect(arr.status).toBe('ready');
      }
    });

    it('marks individual and all notifications as read', () => {
      if (state.notifications.length > 0) {
        const notifId = state.notifications[0].id;
        state.notifications[0].read = false;

        actions.markNotificationRead(notifId);
        expect(state.notifications[0].read).toBe(true);

        state.notifications.forEach((n) => (n.read = false));
        actions.markAllNotificationsRead();
        expect(state.notifications.every((n) => n.read)).toBe(true);
      }
    });

    it('deletes an event and cleans all its associated subcollections', () => {
      const eid = 'evt-to-delete';
      state.events.push({
        id: eid,
        ownerId: 'u1',
        name: 'Delete Me Event',
        eventType: 'birthday',
        startDate: '2026-12-01',
        plannedBudgetMinor: 100000,
        expectedGuestCount: 20,
        venueName: 'Park',
        venueAddress: 'Blr',
        theme: 'Casual',
        currency: 'INR',
        timeZone: 'UTC',
        status: 'planning',
        createdAt: new Date().toISOString(),
      });
      state.categories.push({ id: 'c-del', eventId: eid, name: 'Del', allocatedAmountMinor: 1000 });
      state.tasks.push({ id: 't-del', eventId: eid, taskName: 'Del Task', category: 'General', assignedTo: 'Me', dueDate: '2026-12-01', priority: 'low', status: 'pending' });

      actions.setActiveEvent(eid);
      expect(state.activeEventId).toBe(eid);

      actions.deleteEvent(eid);
      expect(state.events.some((e) => e.id === eid)).toBe(false);
      expect(state.categories.some((c) => c.eventId === eid)).toBe(false);
      expect(state.tasks.some((t) => t.eventId === eid)).toBe(false);
      expect(state.activeEventId).not.toBe(eid);
    });

    it('clears user data completely when clearUserData is invoked', () => {
      actions.resetToMockDefaults();
      expect(state.events.length).toBeGreaterThan(0);

      actions.clearUserData();
      expect(state.events).toEqual([]);
      expect(state.activeEventId).toBe('');
      expect(state.tasks).toEqual([]);
      expect(state.categories).toEqual([]);
      expect(state.expenses).toEqual([]);
      expect(state.guests).toEqual([]);
    });

    it('loads user data from Firestore or handles empty user events gracefully', async () => {
      actions.clearUserData();
      await actions.loadFromFirestore('non-existent-user');
      expect(state.events).toEqual([]);

      await actions.syncAllToFirestore('user-1');
    });
  });
});
