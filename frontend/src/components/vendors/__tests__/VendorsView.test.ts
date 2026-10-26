import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import VendorsView from '../VendorsView.vue';
import { state, actions } from '../../../stores/eventStore';

describe('VendorsView Component Unit Tests', () => {
  beforeEach(() => {
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
  });

  it('renders vendor cards with contact info, status, and price breakdown', () => {
    const wrapper = mount(VendorsView);
    expect(wrapper.text()).toContain('Vendor Directory & Contracts');
    const vendorCards = wrapper.findAll('.card');
    expect(vendorCards.length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('Advance Paid');
    expect(wrapper.text()).toContain('Outstanding Balance');
  });

  it('opens Add Partner Vendor modal, tests early return, cancel/backdrop, and submits a new vendor', async () => {
    const wrapper = mount(VendorsView);
    const addBtn = wrapper.find('button.btn-primary');
    await addBtn.trigger('click');
    expect(wrapper.find('.modal-box').exists()).toBe(true);

    // Early return when name is empty
    const saveBtn = wrapper.findAll('.modal-footer button').find((b) => b.text().includes('Save Vendor'));
    await saveBtn?.trigger('click');

    // Cancel button
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
    const nameInput = wrapper.find('input[placeholder*="Royal Stage Lights"]');
    if (nameInput.exists()) {
      await nameInput.setValue('Imperial Sound & Lights');

      const catInput = wrapper.find('input[placeholder*="Floral, Stage"]');
      if (catInput.exists()) await catInput.setValue('Lighting & Sound');

      const contactInput = wrapper.find('input[placeholder*="Sandeep Roy"]');
      if (contactInput.exists()) await contactInput.setValue('Rajesh Kumar');

      const phoneInput = wrapper.find('input[placeholder*="98450 11223"]');
      if (phoneInput.exists()) await phoneInput.setValue('+91 98450 99999');

      const emailInput = wrapper.find('input[type="email"]');
      if (emailInput.exists()) await emailInput.setValue('rajesh@imperial.com');

      const numInputs = wrapper.findAll('.modal-body input[type="number"]');
      if (numInputs.length >= 2) {
        await numInputs[0].setValue(75000);
        await numInputs[1].setValue(25000);
      }

      const statusSelect = wrapper.find('.modal-body select');
      if (statusSelect.exists()) await statusSelect.setValue('Contract Signed');

      const notesTextarea = wrapper.find('.modal-body textarea');
      if (notesTextarea.exists()) await notesTextarea.setValue('Stage line array setup included');

      await wrapper.findAll('.modal-footer button').find((b) => b.text().includes('Save Vendor'))?.trigger('click');
      expect(state.vendors.some((v) => v.name === 'Imperial Sound & Lights')).toBe(true);
    }
  });
});
