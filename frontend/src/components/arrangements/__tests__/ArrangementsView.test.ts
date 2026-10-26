import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ArrangementsView from '../ArrangementsView.vue';
import { state, actions } from '../../../stores/eventStore';

describe('ArrangementsView Component Unit Tests', () => {
  beforeEach(() => {
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
  });

  it('renders arrangements readiness cards and logistics badge', () => {
    const wrapper = mount(ArrangementsView);
    expect(wrapper.text()).toContain('Arrangements & Logistics Readiness');
    expect(wrapper.text()).toContain('Setups Ready');
    const cards = wrapper.findAll('.card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('updates arrangement status when quick status buttons are clicked', async () => {
    const wrapper = mount(ArrangementsView);
    const readyBtn = wrapper.findAll('.card button').find((b) => b.text().includes('Ready'));
    if (readyBtn) {
      await readyBtn.trigger('click');
      expect(state.arrangements.some((a) => a.status === 'ready')).toBe(true);
    }

    const inProgressBtn = wrapper.findAll('.card button').find((b) => b.text().includes('In Progress'));
    if (inProgressBtn) {
      await inProgressBtn.trigger('click');
      expect(state.arrangements.some((a) => a.status === 'in_progress')).toBe(true);
    }

    const pendingBtn = wrapper.findAll('.card button').find((b) => b.text().includes('Pending'));
    if (pendingBtn) {
      await pendingBtn.trigger('click');
      expect(state.arrangements.some((a) => a.status === 'pending')).toBe(true);
    }
  });
});
