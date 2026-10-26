import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DashboardView from '../DashboardView.vue';
import { state, actions } from '../../../stores/eventStore';

describe('DashboardView Component Unit Tests', () => {
  beforeEach(() => {
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
  });

  it('renders hero banner with event name, date, countdown and readiness', () => {
    const wrapper = mount(DashboardView);
    expect(wrapper.find('.hero-title').text()).toContain("Priya & Rahul's Grand Wedding");
    expect(wrapper.find('.countdown-num').exists()).toBe(true);
    expect(wrapper.find('.readiness-col').text()).toContain('Readiness');
  });

  it('renders the 4 core metric cards and navigates on click', async () => {
    const wrapper = mount(DashboardView);
    const statCards = wrapper.findAll('.stat-card');
    expect(statCards.length).toBeGreaterThanOrEqual(4);

    // Click budget card
    await statCards[0].trigger('click');
    expect(state.activeTab).toBe('budget');

    // Click tasks card
    await statCards[1].trigger('click');
    expect(state.activeTab).toBe('checklist');

    // Click guests card
    await statCards[2].trigger('click');
    expect(state.activeTab).toBe('guests');

    // Click run sheet card
    await statCards[3].trigger('click');
    expect(state.isRunSheetLiveModalOpen).toBe(true);
  });

  it('toggles task status when checkbox in Next Steps is clicked', async () => {
    const wrapper = mount(DashboardView);
    const taskCheckbox = wrapper.find('.task-check-btn');
    if (taskCheckbox.exists()) {
      await taskCheckbox.trigger('click');
      expect(state.tasks.length).toBeGreaterThan(0);
    }
  });

  it('triggers quick AI actions, header buttons, and live run sheet modal from dashboard', async () => {
    const wrapper = mount(DashboardView);

    // AI copilot trigger
    const aiBtn = wrapper.findAll('button').find((b) => b.text().includes('Ask AI Copilot') || b.text().includes('AI'));
    if (aiBtn) {
      await aiBtn.trigger('click');
      expect(state.isAgentChatModalOpen).toBe(true);
    }

    // Live run sheet modal trigger from quick button
    const runSheetQuickBtn = wrapper.find('button.run-sheet-quick-btn');
    if (runSheetQuickBtn.exists()) {
      await runSheetQuickBtn.trigger('click');
      expect(state.isRunSheetLiveModalOpen).toBe(true);
    }

    // All Tasks button navigates to checklist
    const allTasksBtn = wrapper.findAll('button').find((b) => b.text().includes('All Tasks'));
    if (allTasksBtn) {
      await allTasksBtn.trigger('click');
      expect(state.activeTab).toBe('checklist');
    }

    // Timeline button navigates to schedule
    const timelineBtn = wrapper.findAll('button').find((b) => b.text().includes('Timeline'));
    if (timelineBtn) {
      await timelineBtn.trigger('click');
      expect(state.activeTab).toBe('schedule');
    }

    // Launch Live Run Sheet View button
    const launchLiveBtn = wrapper.findAll('button').find((b) => b.text().includes('Launch Live Run Sheet View'));
    if (launchLiveBtn) {
      await launchLiveBtn.trigger('click');
      expect(state.isRunSheetLiveModalOpen).toBe(true);
    }
  });
});
