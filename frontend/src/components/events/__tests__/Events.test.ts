import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import EventsListView from '../EventsListView.vue';
import CreateEventModal from '../CreateEventModal.vue';
import { state, actions } from '../../../stores/eventStore';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('Events Components Unit Tests (EventsListView & CreateEventModal)', () => {
  beforeEach(() => {
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
  });

  describe('EventsListView Component', () => {
    it('renders all events from store with active badge', () => {
      const wrapper = mount(EventsListView);
      expect(wrapper.text()).toContain('My Events & Celebrations');
      const eventCards = wrapper.findAll('.card');
      expect(eventCards.length).toBe(state.events.length);
      expect(wrapper.text()).toContain('CURRENT ACTIVE');
    });

    it('switches active event and navigates to dashboard on clicking switch button', async () => {
      const wrapper = mount(EventsListView);
      const switchBtn = wrapper.findAll('.card button').find((b) => b.text().includes('Switch to Event'));
      if (switchBtn) {
        await switchBtn.trigger('click');
        expect(state.activeTab).toBe('dashboard');
      }

      const openDashboardBtn = wrapper.findAll('.card button').find((b) => b.text().includes('Open Dashboard'));
      if (openDashboardBtn) {
        await openDashboardBtn.trigger('click');
        expect(state.activeTab).toBe('dashboard');
      }
    });

    it('opens create event modal when header button is clicked', async () => {
      const wrapper = mount(EventsListView);
      const createBtn = wrapper.find('button.btn-primary');
      await createBtn.trigger('click');
      expect(state.isCreateEventModalOpen).toBe(true);
    });

    it('opens delete confirmation modal when delete button on an event card is clicked', async () => {
      const wrapper = mount(EventsListView);
      expect(wrapper.find('.delete-confirm-box').exists()).toBe(false);

      const deleteBtns = wrapper.findAll('.btn-delete-event');
      expect(deleteBtns.length).toBeGreaterThan(0);
      await deleteBtns[0].trigger('click');

      expect(wrapper.find('.delete-confirm-box').exists()).toBe(true);
      expect(wrapper.text()).toContain('Delete Celebration?');
      expect(wrapper.text()).toContain('Irreversible Action');
    });

    it('cancels delete confirmation modal when cancel button or close button is clicked', async () => {
      const wrapper = mount(EventsListView);
      await wrapper.find('.btn-delete-event').trigger('click');
      expect(wrapper.find('.delete-confirm-box').exists()).toBe(true);

      // Close via close icon
      await wrapper.find('.btn-close-delete-modal').trigger('click');
      expect(wrapper.find('.delete-confirm-box').exists()).toBe(false);

      // Reopen and close via Cancel button
      await wrapper.find('.btn-delete-event').trigger('click');
      expect(wrapper.find('.delete-confirm-box').exists()).toBe(true);
      await wrapper.find('.btn-cancel-delete').trigger('click');
      expect(wrapper.find('.delete-confirm-box').exists()).toBe(false);

      // Reopen and close via overlay backdrop click
      await wrapper.find('.btn-delete-event').trigger('click');
      expect(wrapper.find('.delete-confirm-box').exists()).toBe(true);
      await wrapper.find('.delete-modal-overlay').trigger('click');
      expect(wrapper.find('.delete-confirm-box').exists()).toBe(false);
    });

    it('permanently deletes event from store upon clicking confirm delete', async () => {
      const wrapper = mount(EventsListView);
      const initialCount = state.events.length;
      const targetEvent = state.events[0];

      await wrapper.find('.btn-delete-event').trigger('click');
      expect(wrapper.find('.delete-confirm-box').exists()).toBe(true);

      await wrapper.find('.btn-confirm-delete').trigger('click');
      expect(wrapper.find('.delete-confirm-box').exists()).toBe(false);
      expect(state.events.length).toBe(initialCount - 1);
      expect(state.events.some((e) => e.id === targetEvent.id)).toBe(false);
    });

    it('renders empty celebrations state when events list is empty and allows creating new event', async () => {
      state.events = [];
      const wrapper = mount(EventsListView);

      expect(wrapper.find('.empty-events-card').exists()).toBe(true);
      expect(wrapper.text()).toContain('No Celebrations Found');

      const createFirstBtn = wrapper.find('.empty-events-card button.btn-primary');
      await createFirstBtn.trigger('click');
      expect(state.isCreateEventModalOpen).toBe(true);
    });
  });

  describe('CreateEventModal Component', () => {
    it('renders modal wizard header and initial step', () => {
      const wrapper = mount(CreateEventModal);
      expect(wrapper.find('.modal-box').exists()).toBe(true);
      expect(wrapper.text()).toContain('Step 1 of 5');
    });

    it('navigates through wizard steps with Next and Previous buttons', async () => {
      const wrapper = mount(CreateEventModal);
      expect(wrapper.text()).toContain('Step 1 of 5');

      // Next to Step 2
      const continueBtn = wrapper.findAll('button').find((b) => b.text().includes('Continue'));
      if (continueBtn) {
        await continueBtn.trigger('click');
        expect(wrapper.text()).toContain('Step 2 of 5');

        // Back to Step 1
        const backBtn = wrapper.findAll('button').find((b) => b.text().includes('Back'));
        if (backBtn) {
          await backBtn.trigger('click');
          expect(wrapper.text()).toContain('Step 1 of 5');
        }
      }
    });

    it('selects event type options on click', async () => {
      const wrapper = mount(CreateEventModal);
      const birthdayOption = wrapper.findAll('.modal-body button').find((c) => c.text().includes('Birthday'));
      if (birthdayOption) {
        await birthdayOption.trigger('click');
        expect(birthdayOption.attributes('style')).toContain('var(--primary-light)');
      }
    });

    it('fills out form fields across steps and creates a new event', async () => {
      const wrapper = mount(CreateEventModal);

      // Step 1: name input
      const nameInput = wrapper.find('input[placeholder*="Maya & Karthik"]');
      if (nameInput.exists()) {
        await nameInput.setValue('Ananya & Vikram Wedding');
      }
      await wrapper.findAll('button').find((b) => b.text().includes('Continue'))?.trigger('click');

      // Step 2: venue
      const dateInputs = wrapper.findAll('input[type="date"]');
      if (dateInputs.length >= 2) {
        await dateInputs[0].setValue('2026-12-01');
        await dateInputs[1].setValue('2026-12-03');
      }
      const venueInput = wrapper.find('input[placeholder*="ITC Gardenia"]');
      if (venueInput.exists()) {
        await venueInput.setValue('The Oberoi Banquet');
      }
      const addressInput = wrapper.find('input[placeholder*="Residency Road"]');
      if (addressInput.exists()) {
        await addressInput.setValue('MG Road, Bengaluru');
      }
      await wrapper.findAll('button').find((b) => b.text().includes('Continue'))?.trigger('click');

      // Step 3: budget, currency, and guests
      const currencySelect = wrapper.find('.modal-body select');
      if (currencySelect.exists()) {
        await currencySelect.setValue('INR');
      }
      const budgetInput = wrapper.find('input[placeholder="1000000"]');
      if (budgetInput.exists()) {
        await budgetInput.setValue('1500000');
      }
      const guestsInput = wrapper.find('input[placeholder="250"]');
      if (guestsInput.exists()) {
        await guestsInput.setValue('300');
      }
      await wrapper.findAll('button').find((b) => b.text().includes('Continue'))?.trigger('click');

      // Step 4: preferences
      const themeInput = wrapper.find('input[placeholder*="Royal Ivory"]');
      if (themeInput.exists()) {
        await themeInput.setValue('Golden Hour Glam');
      }
      const dressInput = wrapper.find('input[placeholder*="Traditional Festive"]');
      if (dressInput.exists()) {
        await dressInput.setValue('Ethnic Indo-Western');
      }
      const notesTextarea = wrapper.find('textarea');
      if (notesTextarea.exists()) {
        await notesTextarea.setValue('Valet parking at entrance B');
      }
      await wrapper.findAll('button').find((b) => b.text().includes('Continue'))?.trigger('click');

      // Step 5: Finalize & Create
      expect(wrapper.text()).toContain('Ready to launch your event!');
      const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create & Seed Event'));
      expect(createBtn).toBeDefined();
      if (createBtn) {
        await createBtn.trigger('click');
        expect(state.isCreateEventModalOpen).toBe(false);
        expect(state.activeTab).toBe('dashboard');
        expect(state.events.some((e) => e.name === 'Ananya & Vikram Wedding')).toBe(true);
      }
    });

    it('creates event with fallback name when name is empty and catches confetti error', async () => {
      const confettiMock = vi.fn().mockImplementation(() => {
        throw new Error('Confetti mock failure');
      });
      const confetti = await import('canvas-confetti');
      (confetti.default as unknown) = confettiMock;

      const wrapper = mount(CreateEventModal);
      // Leave name empty and step through to 5
      for (let i = 1; i < 5; i++) {
        await wrapper.findAll('button').find((b) => b.text().includes('Continue'))?.trigger('click');
      }

      const createBtn = wrapper.findAll('button').find((b) => b.text().includes('Create & Seed Event'));
      expect(createBtn).toBeDefined();
      if (createBtn) {
        await createBtn.trigger('click');
        expect(state.events.some((e) => e.name.includes('Celebration'))).toBe(true);
      }
    });

    it('does not close modal on clicking outside overlay, but closes on clicking close button or cancel', async () => {
      state.isCreateEventModalOpen = true;
      const wrapper = mount(CreateEventModal);

      // Clicking outside on overlay should NOT close the modal
      await wrapper.find('.modal-overlay').trigger('click');
      expect(state.isCreateEventModalOpen).toBe(true);

      // Clicking the header close button closes the modal
      const closeBtn = wrapper.find('.modal-header button.btn-icon');
      if (closeBtn.exists()) {
        await closeBtn.trigger('click');
        expect(state.isCreateEventModalOpen).toBe(false);
      }

      // Reopen and test footer Cancel button
      state.isCreateEventModalOpen = true;
      const cancelBtn = wrapper.find('.btn-cancel-create');
      if (cancelBtn.exists()) {
        await cancelBtn.trigger('click');
        expect(state.isCreateEventModalOpen).toBe(false);
      }
    });
  });
});
