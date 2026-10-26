import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import AgentChatModal from '../AgentChatModal.vue';
import { state, actions } from '../../../stores/eventStore';

describe('AgentChatModal Component Unit Tests (Comprehensive Coverage)', () => {
  beforeEach(() => {
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
    state.isAgentChatModalOpen = true;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.endsWith('/health')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ status: 'healthy', service: 'PlanCraft ADK' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            parts: [
              { kind: 'text', text: 'Calculated breakdown successfully.' },
              {
                kind: 'a2ui',
                data: {
                  type: 'calculate_budget_breakdown',
                  payload: {
                    event_type: 'wedding',
                    total_budget: 20000,
                    per_guest_budget: 150,
                    breakdown: [
                      { category: 'Venue', percentage: '35%', recommended_amount: 7000 },
                      { category: 'Catering', percentage: '28%', recommended_amount: 5600 },
                    ],
                    contingency_fund: 1000,
                    advice: 'Allocate 5% reserve for unexpected expenses.',
                  },
                },
              },
            ],
          }),
        });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not render modal when isAgentChatModalOpen is false', () => {
    state.isAgentChatModalOpen = false;
    const wrapper = mount(AgentChatModal);
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('renders modal card when isAgentChatModalOpen is true', () => {
    const wrapper = mount(AgentChatModal);
    expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    expect(wrapper.find('.agent-title').text()).toContain('PlanCraft ADK Assistant');
    expect(wrapper.find('.agent-input').exists()).toBe(true);
    expect(wrapper.find('.agent-send-btn').exists()).toBe(true);
  });

  it('displays quick prompt chips and context banner', () => {
    const wrapper = mount(AgentChatModal);
    const contextBanner = wrapper.find('.context-banner');
    expect(contextBanner.exists()).toBe(true);

    const promptChips = wrapper.findAll('.prompt-chip');
    expect(promptChips.length).toBeGreaterThanOrEqual(4);
  });

  it('closes modal when close button is clicked or backdrop is clicked', async () => {
    const wrapper = mount(AgentChatModal);
    const closeBtn = wrapper.find('button[title="Close assistant"]');
    await closeBtn.trigger('click');
    expect(state.isAgentChatModalOpen).toBe(false);

    state.isAgentChatModalOpen = true;
    await wrapper.vm.$nextTick();
    await wrapper.find('.modal-overlay').trigger('click');
    expect(state.isAgentChatModalOpen).toBe(false);
  });

  it('clears chat history when reset chat button is clicked', async () => {
    const wrapper = mount(AgentChatModal);
    const resetBtn = wrapper.find('button[title="Reset chat conversation"]');
    expect(resetBtn.exists()).toBe(true);
    await resetBtn.trigger('click');

    expect(wrapper.text()).toContain('Chat history cleared');
  });

  it('submits a user message and receives an A2UI card response', async () => {
    const wrapper = mount(AgentChatModal);
    const input = wrapper.find('.agent-input');
    await input.setValue('Calculate budget breakdown for wedding');
    await wrapper.find('form.agent-input-form').trigger('submit');
    await flushPromises();

    expect(wrapper.text()).toContain('ADK A2UI Card');
    expect(wrapper.text()).toContain('Budget Plan: WEDDING');
    expect(wrapper.text()).toContain('Venue');
    expect(wrapper.text()).toContain('$7,000');

    // Click table row to select category into chat
    const row = wrapper.find('.clickable-table-row');
    if (row.exists()) {
      await row.trigger('click');
      await wrapper.vm.$nextTick();
      expect((wrapper.find('.agent-input').element as HTMLInputElement).value).toContain('Tell me vendor options');
    }
  });

  it('triggers sendQuickPrompt when a quick suggestion chip is clicked', async () => {
    const wrapper = mount(AgentChatModal);
    const firstChip = wrapper.findAll('.prompt-chip')[0];
    await firstChip.trigger('click');
    await flushPromises();

    expect(wrapper.findAll('.chat-bubble-row').length).toBeGreaterThan(1);
  });

  it('renders create_event A2UI card and synchronizes into eventStore', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.endsWith('/health')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            parts: [
              {
                kind: 'a2ui',
                data: {
                  type: 'create_event',
                  payload: {
                    event: {
                      id: 'evt-new-test',
                      name: 'Galactic Gala Celebration',
                      event_type: 'custom',
                      start_date: '2026-12-31',
                      planned_budget: 35000,
                      expected_guest_count: 220,
                      venue_name: 'Starlight Ballroom',
                      venue_address: '99 Astro Way',
                      days_until: 60,
                      status: 'planning',
                    },
                    message: 'Event Galactic Gala Celebration has been successfully created!',
                  },
                },
              },
            ],
          }),
        });
      })
    );

    const wrapper = mount(AgentChatModal);
    const input = wrapper.find('.agent-input');
    await input.setValue('Create Galactic Gala');
    await wrapper.find('form.agent-input-form').trigger('submit');
    await flushPromises();

    expect(wrapper.text()).toContain('Event Created: Galactic Gala Celebration');
    expect(state.events.some((e) => e.id === 'evt-new-test')).toBe(true);

    // Test clicking action pills inside the card
    const selectBtn = wrapper.find('.item-actions-row button.btn-primary');
    if (selectBtn.exists()) {
      await selectBtn.trigger('click');
      await wrapper.vm.$nextTick();
      expect((wrapper.find('.agent-input').element as HTMLInputElement).value).toContain('Show details');
    }

    const pills = wrapper.findAll('.item-actions-row .action-pill');
    if (pills[0]) {
      await pills[0].trigger('click');
      await wrapper.vm.$nextTick();
      expect((wrapper.find('.agent-input').element as HTMLInputElement).value).toContain('Update');
    }
    if (pills[1]) {
      await pills[1].trigger('click');
      await wrapper.vm.$nextTick();
      expect((wrapper.find('.agent-input').element as HTMLInputElement).value).toContain('Calculate budget');
    }
    if (pills[2]) {
      await pills[2].trigger('click');
      await wrapper.vm.$nextTick();
      expect((wrapper.find('.agent-input').element as HTMLInputElement).value).toContain('run sheet');
    }
  });

  it('renders list_events, checklist, vendor, and readiness A2UI cards', async () => {
    const cardTypes = [
      {
        type: 'list_events',
        payload: {
          count: 1,
          events: [
            {
              id: 'evt-1',
              name: 'Maya & Rohan Wedding',
              event_type: 'wedding',
              start_date: '2026-11-15',
              days_until: 20,
              planned_budget: 45000,
              expected_guest_count: 200,
              venue_name: 'Lakeview Resort',
            },
          ],
        },
      },
      {
        type: 'generate_checklist_tasks',
        payload: {
          event_type: 'wedding',
          total_tasks: 2,
          suggested_immediate_action: 'Lock down catering menu',
          milestone_phases: [
            {
              timeline: '3 weeks before',
              tasks: [{ title: 'Order theme cake', priority: 'High' }],
            },
          ],
        },
      },
      {
        type: 'recommend_vendors',
        payload: {
          category: 'Catering',
          expert_tip: 'Always schedule tasting before signing.',
          payment_schedule: '20% deposit',
          selection_criteria: ['Food hygiene', 'Tasting review'],
          vetting_questions: ['Can you accommodate vegan options?'],
        },
      },
      {
        type: 'analyze_event_readiness',
        payload: {
          readiness_score: 88,
          status_label: 'Event Ready',
          critical_flags: ['Sign photographer contract'],
          strengths: ['Venue confirmed', 'Budget on track'],
        },
      },
      {
        type: 'delete_event',
        payload: {
          message: 'Celebration removed successfully.',
        },
      },
      {
        type: 'generate_day_of_run_sheet',
        payload: {
          event_type: 'wedding',
          total_milestones: 2,
          schedule: [
            { time: '10:00 AM', activity: 'Setup & soundcheck', owner: 'DJ', location: 'Hall', notes: 'Verify mic' },
          ],
        },
      },
    ];

    for (const card of cardTypes) {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.endsWith('/health')) {
            return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
          }
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              parts: [{ kind: 'a2ui', data: card }],
            }),
          });
        })
      );

      const wrapper = mount(AgentChatModal);
      const input = wrapper.find('.agent-input');
      await input.setValue(`Test ${card.type}`);
      await wrapper.find('form.agent-input-form').trigger('submit');
      await flushPromises();
      expect(wrapper.find('.a2ui-card').exists()).toBe(true);

      if (card.type === 'recommend_vendors') {
        const questionItem = wrapper.find('.vendor-question-item');
        if (questionItem.exists()) {
          await questionItem.trigger('click');
          await wrapper.vm.$nextTick();
          expect((wrapper.find('.agent-input').element as HTMLInputElement).value).toContain('Ask vendor');
        }
        const chipBtn = wrapper.find('.vendor-question-item .btn-select-chip');
        if (chipBtn.exists()) {
          await chipBtn.trigger('click');
          await wrapper.vm.$nextTick();
          expect((wrapper.find('.agent-input').element as HTMLInputElement).value).toContain('Ask vendor');
        }
      }

      if (card.type === 'generate_checklist_tasks') {
        const taskItem = wrapper.find('.checklist-task-item');
        if (taskItem.exists()) {
          await taskItem.trigger('click');
          await wrapper.vm.$nextTick();
          expect((wrapper.find('.agent-input').element as HTMLInputElement).value).toContain('How do I complete task');
        }
        const selectBtn = wrapper.find('.checklist-task-item .btn-select-chip');
        if (selectBtn.exists()) {
          await selectBtn.trigger('click');
          await wrapper.vm.$nextTick();
          expect((wrapper.find('.agent-input').element as HTMLInputElement).value).toContain('How do I complete task');
        }
      }
    }
  });

  it('handles network error gracefully and displays alert bubble', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.endsWith('/health')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
        }
        return Promise.reject(new Error('Agent offline'));
      })
    );

    const wrapper = mount(AgentChatModal);
    const input = wrapper.find('.agent-input');
    await input.setValue('Are you online?');
    await wrapper.find('form.agent-input-form').trigger('submit');
    await flushPromises();

    expect(wrapper.text()).toContain('Could not reach ADK Agent Service');
  });
});
