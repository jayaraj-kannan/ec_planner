import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import SettingsView from '../SettingsView.vue';
import { state, actions, currentEvent } from '../../../stores/eventStore';

describe('SettingsView Component Unit Tests', () => {
  beforeEach(() => {
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
  });

  it('renders user profile and regional currency options', () => {
    const wrapper = mount(SettingsView);
    expect(wrapper.text()).toContain('Settings & Preferences');
    expect(wrapper.text()).toContain('Jayaraj Kannan');
    expect(wrapper.text()).toContain('Currency & Regional Format');
  });

  it('changes active event currency via select dropdown', async () => {
    const wrapper = mount(SettingsView);
    const currencySelect = wrapper.find('select.form-select');
    await currencySelect.setValue('USD');
    expect(currentEvent.value?.currency).toBe('USD');
  });

  it('resets demo mock defaults when confirm is accepted', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    vi.stubGlobal('alert', vi.fn());

    const wrapper = mount(SettingsView);
    const resetBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset All Mock Data'));
    if (resetBtn) {
      await resetBtn.trigger('click');
      expect(window.confirm).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalled();
    }

    vi.unstubAllGlobals();
  });

  it('does not reset demo mock defaults when confirm is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));
    vi.stubGlobal('alert', vi.fn());

    const wrapper = mount(SettingsView);
    const resetBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset All Mock Data'));
    if (resetBtn) {
      await resetBtn.trigger('click');
      expect(window.confirm).toHaveBeenCalled();
      expect(window.alert).not.toHaveBeenCalled();
    }

    vi.unstubAllGlobals();
  });
});
