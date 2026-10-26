import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AgentChatModal from '../AgentChatModal.vue';
import { state, actions } from '../../../stores/eventStore';

describe('AgentChatModal Component Unit Tests', () => {
  beforeEach(() => {
    actions.setActiveEvent('evt-1');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'healthy', service: 'PlanCraft ADK' }),
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

  it('renders modal card when isAgentChatModalOpen is true', async () => {
    state.isAgentChatModalOpen = true;
    const wrapper = mount(AgentChatModal);

    expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    expect(wrapper.find('.agent-title').text()).toContain('PlanCraft ADK Assistant');
    expect(wrapper.find('.agent-input').exists()).toBe(true);
    expect(wrapper.find('.agent-send-btn').exists()).toBe(true);
  });

  it('displays quick prompt chips and context banner', () => {
    state.isAgentChatModalOpen = true;
    const wrapper = mount(AgentChatModal);

    const contextBanner = wrapper.find('.context-banner');
    expect(contextBanner.exists()).toBe(true);

    const promptChips = wrapper.findAll('.prompt-chip');
    expect(promptChips.length).toBeGreaterThanOrEqual(4);

    const chipTexts = promptChips.map((c) => c.text());
    expect(chipTexts.some((t) => t.includes('List All Events'))).toBe(true);
    expect(chipTexts.some((t) => t.includes('Budget Breakdown'))).toBe(true);
  });

  it('closes modal when close button is clicked', async () => {
    state.isAgentChatModalOpen = true;
    const wrapper = mount(AgentChatModal);

    const closeBtn = wrapper.find('button[title="Close assistant"]');
    expect(closeBtn.exists()).toBe(true);

    await closeBtn.trigger('click');
    expect(state.isAgentChatModalOpen).toBe(false);
  });

  it('disables send button when input query is empty', () => {
    state.isAgentChatModalOpen = true;
    const wrapper = mount(AgentChatModal);

    const sendBtn = wrapper.find('.agent-send-btn');
    expect(sendBtn.attributes('disabled')).toBeDefined();
  });
});
