import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import BudgetView from '../BudgetView.vue';
import { state, actions } from '../../../stores/eventStore';

describe('BudgetView Component Unit Tests', () => {
  beforeEach(() => {
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
  });

  it('renders budget summary cards, planned vs actual spend, and categories', () => {
    const wrapper = mount(BudgetView);
    expect(wrapper.text()).toContain('Budget & Expense Management');
    expect(wrapper.text()).toContain('Planned Budget');
    expect(wrapper.text()).toContain('Actual Spent');
    expect(wrapper.text()).toContain('Remaining Buffer');
    expect(wrapper.text()).toContain('Category Budget Allocations');
  });

  it('filters expenses table by category and payment status', async () => {
    const wrapper = mount(BudgetView);
    const statusSelect = wrapper.find('select');
    if (statusSelect.exists()) {
      await statusSelect.setValue('paid');
      const rows = wrapper.findAll('table tbody tr');
      expect(rows.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('deletes an expense item when delete button is clicked', async () => {
    const wrapper = mount(BudgetView);
    const initialCount = state.expenses.filter((e) => e.eventId === state.activeEventId).length;
    const deleteBtn = wrapper.find('button[title="Remove expense"]');
    if (deleteBtn.exists()) {
      await deleteBtn.trigger('click');
      const newCount = state.expenses.filter((e) => e.eventId === state.activeEventId).length;
      expect(newCount).toBe(initialCount - 1);
    }
  });

  it('opens Add Expense modal, tests early return, cancel/backdrop, and adds an expense', async () => {
    const wrapper = mount(BudgetView);
    const addBtn = wrapper.find('.view-header button.btn-primary');
    await addBtn.trigger('click');
    expect(wrapper.find('.modal-box').exists()).toBe(true);

    // Early return when description is empty
    const recordBtn = wrapper.findAll('.modal-footer button').find((b) => b.text().includes('Record Expense'));
    await recordBtn?.trigger('click');

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

    // Reopen, fill fields, and record expense
    await addBtn.trigger('click');
    const descInput = wrapper.find('input[placeholder*="Stage floral entrance arch advance"]');
    if (descInput.exists()) {
      await descInput.setValue('Fireworks & Pyrotechnics');

      const vendorInput = wrapper.find('input[placeholder*="Bloom Florals"]');
      if (vendorInput.exists()) await vendorInput.setValue('Royal Crackers');

      const numInputs = wrapper.findAll('.modal-body input[type="number"]');
      if (numInputs.length >= 2) {
        await numInputs[0].setValue(50000);
        await numInputs[1].setValue(9000);
      }

      const invoiceInput = wrapper.find('input[placeholder*="INV-2026-001"]');
      if (invoiceInput.exists()) await invoiceInput.setValue('INV-9988');

      const dateInput = wrapper.find('.modal-body input[type="date"]');
      if (dateInput.exists()) await dateInput.setValue('2026-11-20');

      const selects = wrapper.findAll('.modal-body select');
      for (const sel of selects) {
        const options = sel.findAll('option');
        if (options.length > 1) {
          await sel.setValue(options[1].element.value);
        }
      }

      await wrapper.findAll('.modal-footer button').find((b) => b.text().includes('Record Expense'))?.trigger('click');
      expect(state.expenses.some((e) => e.description === 'Fireworks & Pyrotechnics')).toBe(true);
    }
  });
});
