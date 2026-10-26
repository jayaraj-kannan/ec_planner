import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DocumentsView from '../DocumentsView.vue';
import { actions } from '../../../stores/eventStore';

describe('DocumentsView Component Unit Tests', () => {
  beforeEach(() => {
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
  });

  it('renders document vault cards with categories and authorized status', () => {
    const wrapper = mount(DocumentsView);
    expect(wrapper.text()).toContain('Document Vault & Attachments');
    const docCards = wrapper.findAll('.card');
    expect(docCards.length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('Authorized Cloud File');
  });

  it('opens and closes document preview modal', async () => {
    const wrapper = mount(DocumentsView);

    // Click Preview button
    const previewBtn = wrapper.findAll('.card button').find((b) => b.text().includes('Preview'));
    if (previewBtn) {
      await previewBtn.trigger('click');
      expect(wrapper.find('.modal-box').exists()).toBe(true);

      // Close modal using close icon button
      const closeBtn = wrapper.find('.modal-header button.btn-icon');
      if (closeBtn.exists()) {
        await closeBtn.trigger('click');
        expect(wrapper.find('.modal-box').exists()).toBe(false);
      }
    }

    // Click Download button
    const downloadBtn = wrapper.findAll('.card button').find((b) => b.text().includes('Download'));
    if (downloadBtn) {
      await downloadBtn.trigger('click');
      expect(wrapper.find('.modal-box').exists()).toBe(true);

      // Close modal using backdrop
      await wrapper.find('.modal-overlay').trigger('click');
      expect(wrapper.find('.modal-box').exists()).toBe(false);
    }
  });

  it('opens preview on upload document button click', async () => {
    const wrapper = mount(DocumentsView);
    const uploadBtn = wrapper.find('button.btn-primary');
    await uploadBtn.trigger('click');
    expect(wrapper.find('.modal-box').exists()).toBe(true);
  });
});
