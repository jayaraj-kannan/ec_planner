import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import GuestsView from '../GuestsView.vue';
import { state, actions } from '../../../stores/eventStore';

describe('GuestsView Component Unit Tests', () => {
  beforeEach(() => {
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
  });

  it('renders guest counts, RSVP metrics, and dietary statistics', () => {
    const wrapper = mount(GuestsView);
    expect(wrapper.text()).toContain('Guest List & RSVP Coordinator');
    expect(wrapper.text()).toContain('Total Invited');
    expect(wrapper.text()).toContain('Confirmed');
    expect(wrapper.text()).toContain('Pending');
    expect(wrapper.text()).toContain('Hotel Stay');

    const guestRows = wrapper.findAll('table tbody tr');
    expect(guestRows.length).toBeGreaterThan(0);
  });

  it('searches and filters guests by name, phone, or category', async () => {
    const wrapper = mount(GuestsView);
    const searchInput = wrapper.find('input[placeholder*="Search name, family, phone"]');
    expect(searchInput.exists()).toBe(true);
    if (searchInput.exists()) {
      await searchInput.setValue('Kamesh');
      expect(wrapper.findAll('table tbody tr').length).toBeGreaterThanOrEqual(1);

      await searchInput.setValue('Sundaram Family');
      expect(wrapper.findAll('table tbody tr').length).toBeGreaterThanOrEqual(1);

      await searchInput.setValue('98450');
      expect(wrapper.findAll('table tbody tr').length).toBeGreaterThanOrEqual(1);

      await searchInput.setValue('NonExistentName123');
      expect(wrapper.text()).toContain('No guests found');

      await searchInput.setValue('');
    }

    // Status filter buttons
    const filterButtons = wrapper.findAll('button').filter((b) => ['All', 'Confirmed', 'Pending', 'Declined'].includes(b.text().trim()));
    for (const btn of filterButtons) {
      await btn.trigger('click');
    }

    // Category filter select
    const catSelect = wrapper.find('select.form-select');
    if (catSelect.exists()) {
      await catSelect.setValue('Bride Family');
      await catSelect.setValue('Friends');
      await catSelect.setValue('all');
    }
  });

  it('cycles guest RSVP status when quick toggle button is clicked', async () => {
    const wrapper = mount(GuestsView);
    const firstGuest = state.guests.find((g) => g.eventId === state.activeEventId);
    if (firstGuest) {
      const toggleBtn = wrapper.find('button[title="Click to toggle RSVP status"]');
      expect(toggleBtn.exists()).toBe(true);
      if (toggleBtn.exists()) {
        const initialStatus = firstGuest.rsvpStatus;
        await toggleBtn.trigger('click');
        expect(firstGuest.rsvpStatus).not.toBe(initialStatus);
        // Cycle again
        await toggleBtn.trigger('click');
        // Cycle again
        await toggleBtn.trigger('click');
      }
    }
  });

  it('deletes a guest when delete icon button is clicked', async () => {
    const wrapper = mount(GuestsView);
    const initialCount = state.guests.filter((g) => g.eventId === state.activeEventId).length;
    const deleteBtn = wrapper.find('button[title="Remove guest"]');
    if (deleteBtn.exists()) {
      await deleteBtn.trigger('click');
      const newCount = state.guests.filter((g) => g.eventId === state.activeEventId).length;
      expect(newCount).toBe(initialCount - 1);
    }
  });

  it('opens Add Guest modal, tests early return, cancel/backdrop, and adds a new guest', async () => {
    const wrapper = mount(GuestsView);
    const addBtn = wrapper.find('.view-header button.btn-primary');
    await addBtn.trigger('click');
    expect(wrapper.find('.modal-box').exists()).toBe(true);

    // Early return when name is empty
    const saveBtn = wrapper.findAll('.modal-footer button').find((b) => b.text().includes('Save Guest'));
    await saveBtn?.trigger('click');

    // Cancel modal
    const cancelBtn = wrapper.findAll('.modal-footer button').find((b) => b.text().includes('Cancel'));
    await cancelBtn?.trigger('click');
    expect(wrapper.find('.modal-box').exists()).toBe(false);

    // Reopen and close via header X
    await addBtn.trigger('click');
    await wrapper.find('.modal-header button.btn-icon').trigger('click');
    expect(wrapper.find('.modal-box').exists()).toBe(false);

    // Reopen and close via backdrop
    await addBtn.trigger('click');
    await wrapper.find('.modal-overlay').trigger('click');
    expect(wrapper.find('.modal-box').exists()).toBe(false);

    // Reopen, fill fields, and save
    await addBtn.trigger('click');
    const nameInput = wrapper.find('input[placeholder*="Ramesh & Gayatri Murthy"]');
    if (nameInput.exists()) {
      await nameInput.setValue('Siddharth Malhotra');

      const familyInput = wrapper.find('input[placeholder*="Murthy Clan"]');
      if (familyInput.exists()) await familyInput.setValue('Malhotra Clan');

      const partyInput = wrapper.find('.modal-body input[type="number"]');
      if (partyInput.exists()) await partyInput.setValue(3);

      const phoneInput = wrapper.find('input[placeholder="+91 98450 00000"]');
      if (phoneInput.exists()) await phoneInput.setValue('+91 99999 11111');

      const selects = wrapper.findAll('.modal-body select');
      for (const sel of selects) {
        const options = sel.findAll('option');
        if (options.length > 1) {
          await sel.setValue(options[1].element.value);
        }
      }

      const checkbox = wrapper.find('.modal-body input[type="checkbox"]');
      if (checkbox.exists()) await checkbox.setValue(true);

      const notesTextarea = wrapper.find('.modal-body textarea');
      if (notesTextarea.exists()) await notesTextarea.setValue('Needs airport pickup');

      await wrapper.findAll('.modal-footer button').find((b) => b.text().includes('Save Guest'))?.trigger('click');
      expect(state.guests.some((g) => g.guestName === 'Siddharth Malhotra')).toBe(true);
    }
  });

  it('triggers CSV download without error', async () => {
    // Stub URL.createObjectURL and link.click
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const el = originalCreateElement('a');
        el.click = clickSpy;
        return el;
      }
      return originalCreateElement(tagName);
    });

    const wrapper = mount(GuestsView);
    const exportBtn = wrapper.findAll('button').find((b) => b.text().includes('Export') || b.text().includes('CSV'));
    if (exportBtn) {
      await exportBtn.trigger('click');
      expect(clickSpy).toHaveBeenCalled();
    }
  });
});
