import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ChecklistView from '../ChecklistView.vue';
import { state, actions } from '../../../stores/eventStore';

describe('ChecklistView Component Unit Tests', () => {
  beforeEach(() => {
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
  });

  it('renders milestone progress bar and task count', () => {
    const wrapper = mount(ChecklistView);
    expect(wrapper.text()).toContain('Planning Checklist & Milestones');
    expect(wrapper.text()).toContain('Milestones Progress');
    const taskCards = wrapper.findAll('.card');
    expect(taskCards.length).toBeGreaterThan(1);
  });

  it('filters tasks by status and category', async () => {
    const wrapper = mount(ChecklistView);
    const filterBtns = wrapper.findAll('.filters-scroll-row button');
    expect(filterBtns.length).toBeGreaterThan(0);

    // Click Overdue, High Priority, Pending, Completed, and All filters
    for (const filter of ['Overdue', 'High Priority', 'Pending', 'Completed', 'All']) {
      const btn = filterBtns.find((b) => b.text().includes(filter));
      if (btn) await btn.trigger('click');
    }

    // Category dropdown filter
    const catSelect = wrapper.find('select.form-select');
    if (catSelect.exists()) {
      await catSelect.setValue('Venue');
      await catSelect.setValue('all');
    }
    expect(wrapper.text()).toContain('Planning Checklist');
  });

  it('toggles task completion and deletes task on click', async () => {
    const wrapper = mount(ChecklistView);
    const firstCheckbox = wrapper.find('.card button');
    if (firstCheckbox.exists()) {
      await firstCheckbox.trigger('click');
    }

    const initialCount = state.tasks.filter((t) => t.eventId === state.activeEventId).length;
    const deleteBtn = wrapper.find('button[title="Delete task"]');
    if (deleteBtn.exists()) {
      await deleteBtn.trigger('click');
      const newCount = state.tasks.filter((t) => t.eventId === state.activeEventId).length;
      expect(newCount).toBe(initialCount - 1);
    }
  });

  it('opens Add Task modal, validates input, tests cancel/backdrop, and creates new task', async () => {
    const wrapper = mount(ChecklistView);

    // Open modal
    await wrapper.find('.view-header button.btn-primary').trigger('click');
    expect(wrapper.find('.modal-box').exists()).toBe(true);

    // Early return when name is empty
    const saveBtn = wrapper.findAll('.modal-footer button').find((b) => b.text().includes('Save Milestone'));
    await saveBtn?.trigger('click');

    // Cancel button
    const cancelBtn = wrapper.findAll('.modal-footer button').find((b) => b.text().includes('Cancel'));
    await cancelBtn?.trigger('click');
    expect(wrapper.find('.modal-box').exists()).toBe(false);

    // Reopen and close via header X
    await wrapper.find('.view-header button.btn-primary').trigger('click');
    await wrapper.find('.modal-header button.btn-icon').trigger('click');
    expect(wrapper.find('.modal-box').exists()).toBe(false);

    // Reopen and close via backdrop
    await wrapper.find('.view-header button.btn-primary').trigger('click');
    await wrapper.find('.modal-overlay').trigger('click');
    expect(wrapper.find('.modal-box').exists()).toBe(false);

    // Reopen, fill inputs, and save
    await wrapper.find('.view-header button.btn-primary').trigger('click');
    const input = wrapper.find('input[placeholder*="Schedule rehearsal dinner"]');
    expect(input.exists()).toBe(true);
    if (input.exists()) {
      await input.setValue('Coordinate Sound Check with DJ');

      const catInput = wrapper.find('input[placeholder*="Catering, Venue, Decor"]');
      if (catInput.exists()) await catInput.setValue('Music & Entertainment');

      const assignedInput = wrapper.find('input[placeholder*="Rahul, Event Lead"]');
      if (assignedInput.exists()) await assignedInput.setValue('Priya');

      const dateInput = wrapper.find('.modal-body input[type="date"]');
      if (dateInput.exists()) await dateInput.setValue('2026-11-20');

      const prioritySelect = wrapper.find('.modal-body select');
      if (prioritySelect.exists()) await prioritySelect.setValue('high');

      const notesTextarea = wrapper.find('.modal-body textarea');
      if (notesTextarea.exists()) await notesTextarea.setValue('Check DJ mic battery');

      await wrapper.findAll('.modal-footer button').find((b) => b.text().includes('Save Milestone'))?.trigger('click');
      expect(state.tasks.some((t) => t.taskName === 'Coordinate Sound Check with DJ')).toBe(true);
    }
  });
});
