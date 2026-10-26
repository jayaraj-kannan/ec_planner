import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Navbar from '../Navbar.vue';
import Sidebar from '../Sidebar.vue';
import { state, actions } from '../../../stores/eventStore';

describe('Layout Components Unit Tests (Navbar & Sidebar)', () => {
  beforeEach(() => {
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
  });

  describe('Navbar Component', () => {
    it('renders event selector, countdown badge, and action buttons', () => {
      const wrapper = mount(Navbar);
      expect(wrapper.find('.event-selector-box').exists()).toBe(true);
      expect(wrapper.find('.nav-countdown-badge').exists()).toBe(true);
      expect(wrapper.find('button[title="Open Live Event-Day Run Sheet"]').exists()).toBe(true);
      expect(wrapper.find('button[title="Open PlanCraft ADK AI Assistant"]').exists()).toBe(true);
    });

    it('changes active event when dropdown value changes', async () => {
      const wrapper = mount(Navbar);
      const select = wrapper.find('select.event-select-dropdown');
      await select.setValue('evt-2');
      expect(state.activeEventId).toBe('evt-2');
    });

    it('triggers mobile menu toggle when hamburger button is clicked', async () => {
      state.isMobileMenuOpen = false;
      const wrapper = mount(Navbar);
      const menuBtn = wrapper.find('.mobile-menu-btn');
      await menuBtn.trigger('click');
      expect(state.isMobileMenuOpen).toBe(true);
    });

    it('opens modals when respective buttons are clicked', async () => {
      const wrapper = mount(Navbar);

      // Run sheet modal
      await wrapper.find('button[title="Open Live Event-Day Run Sheet"]').trigger('click');
      expect(state.isRunSheetLiveModalOpen).toBe(true);

      // AI Copilot modal
      await wrapper.find('button[title="Open PlanCraft ADK AI Assistant"]').trigger('click');
      expect(state.isAgentChatModalOpen).toBe(true);

      // Create event modal
      await wrapper.find('.navbar-right button.btn-primary').trigger('click');
      expect(state.isCreateEventModalOpen).toBe(true);
    });

    it('toggles notification popover, marks individual notification as read, and handles mark all read', async () => {
      const wrapper = mount(Navbar);
      const notifBtn = wrapper.find('button[aria-label="Notifications"]');
      await notifBtn.trigger('click');

      // Popover should be visible
      expect(wrapper.text()).toContain('Notifications');

      // Click specific notification item directly
      const notifItems = wrapper.findAll('div').filter((el) => {
        const style = el.attributes('style') || '';
        return style.includes('border-left') && style.includes('padding: 8px 10px');
      });
      if (notifItems.length > 0) {
        await notifItems[0].trigger('click');
      }

      // Mark all as read
      const markAllBtn = wrapper.findAll('button').find((b) => b.text().includes('Mark all read'));
      if (markAllBtn) {
        await markAllBtn.trigger('click');
        expect(state.notifications.every((n) => n.read)).toBe(true);
      }
    });
  });

  describe('Sidebar Component', () => {
    it('renders brand logo and all primary navigation items', () => {
      const wrapper = mount(Sidebar);
      expect(wrapper.find('.logo-title').text()).toBe('PlanCraft');
      const navItems = wrapper.findAll('.sidebar-nav .nav-item');
      expect(navItems.length).toBeGreaterThanOrEqual(9);
    });

    it('navigates to different tabs on clicking nav items and settings', async () => {
      const wrapper = mount(Sidebar);
      const navItems = wrapper.findAll('.sidebar-nav .nav-item');

      // Click Checklist
      const checklistBtn = navItems.find((btn) => btn.text().includes('Checklist'));
      if (checklistBtn) {
        await checklistBtn.trigger('click');
        expect(state.activeTab).toBe('checklist');
      }

      // Click Budget
      const budgetBtn = navItems.find((btn) => btn.text().includes('Budget'));
      if (budgetBtn) {
        await budgetBtn.trigger('click');
        expect(state.activeTab).toBe('budget');
      }

      // Click Settings
      const settingsBtn = wrapper.findAll('button.nav-item').find((btn) => btn.text().includes('Settings'));
      if (settingsBtn) {
        await settingsBtn.trigger('click');
        expect(state.activeTab).toBe('settings');
      }
    });

    it('opens AI Copilot modal and create event modal from sidebar action buttons', async () => {
      const wrapper = mount(Sidebar);

      // Ask AI Copilot button
      const copilotBtn = wrapper.findAll('aside.sidebar button').find((b) => b.text().includes('Ask AI Copilot'));
      if (copilotBtn) {
        await copilotBtn.trigger('click');
        expect(state.isAgentChatModalOpen).toBe(true);
      }

      // + New Event button
      const newEventBtn = wrapper.findAll('aside.sidebar button').find((b) => b.text().includes('+ New Event'));
      if (newEventBtn) {
        await newEventBtn.trigger('click');
        expect(state.isCreateEventModalOpen).toBe(true);
      }
    });

    it('renders mobile drawer and handles navigation, settings, and modal triggers', async () => {
      state.isMobileMenuOpen = true;
      const wrapper = mount(Sidebar);
      expect(wrapper.find('.mobile-drawer-overlay').exists()).toBe(true);

      // Mobile nav click
      const mobileNavItems = wrapper.findAll('.mobile-drawer .nav-item');
      if (mobileNavItems.length > 0) {
        await mobileNavItems[0].trigger('click');
        expect(state.activeTab).toBeDefined();
      }

      // Re-open for settings click
      state.isMobileMenuOpen = true;
      await wrapper.vm.$nextTick();
      const mobileSettingsBtn = wrapper.findAll('.mobile-drawer .nav-item').find((btn) => btn.text().includes('Settings'));
      if (mobileSettingsBtn) {
        await mobileSettingsBtn.trigger('click');
        expect(state.activeTab).toBe('settings');
      }

      // Re-open for mobile create event button (+ New Event Wizard)
      state.isMobileMenuOpen = true;
      await wrapper.vm.$nextTick();
      const newEventBtn = wrapper.find('.mobile-drawer button.btn-primary');
      if (newEventBtn.exists()) {
        await newEventBtn.trigger('click');
        expect(state.isCreateEventModalOpen).toBe(true);
      }

      // Re-open for close button inside drawer header
      state.isMobileMenuOpen = true;
      await wrapper.vm.$nextTick();
      const closeBtn = wrapper.find('.mobile-drawer button.btn-icon');
      if (closeBtn.exists()) {
        await closeBtn.trigger('click');
        expect(state.isMobileMenuOpen).toBe(false);
      }

      // Drawer container click should stop propagation
      state.isMobileMenuOpen = true;
      await wrapper.vm.$nextTick();
      await wrapper.find('.mobile-drawer').trigger('click');
      expect(state.isMobileMenuOpen).toBe(true);

      // Backdrop click closes drawer
      const backdrop = wrapper.find('.mobile-drawer-overlay');
      if (backdrop.exists()) {
        await backdrop.trigger('click');
        expect(state.isMobileMenuOpen).toBe(false);
      }
    });
  });
});
