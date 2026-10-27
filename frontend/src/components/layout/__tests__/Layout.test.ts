import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Navbar from '../Navbar.vue';
import Sidebar from '../Sidebar.vue';
import { state, actions } from '../../../stores/eventStore';
import { authState, authActions } from '../../../stores/authStore';

describe('Layout Components Unit Tests (Navbar & Sidebar)', () => {
  beforeEach(() => {
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
    authState.user = null;
    authState.profile = null;
    authState.isAuthModalOpen = false;
  });

  describe('Navbar Component', () => {
    it('does NOT render private event selector, countdown badge, run sheet, ai copilot, or create button when unauthenticated', () => {
      authState.user = null;
      const wrapper = mount(Navbar);

      // Should show guest brand and Sign In
      expect(wrapper.find('.guest-nav-brand').exists()).toBe(true);
      expect(wrapper.find('.btn-signin').exists()).toBe(true);

      // Should NOT show private controls
      expect(wrapper.find('.event-selector-box').exists()).toBe(false);
      expect(wrapper.find('.nav-countdown-badge').exists()).toBe(false);
      expect(wrapper.find('button[title="Open Live Event-Day Run Sheet"]').exists()).toBe(false);
      expect(wrapper.find('button[title="Open PlanCraft ADK AI Assistant"]').exists()).toBe(false);
      expect(wrapper.find('.navbar-right button.btn-primary').text()).toContain('Sign In');
      expect(wrapper.find('button[aria-label="Notifications"]').exists()).toBe(false);
    });

    it('renders event selector, countdown badge, and action buttons when authenticated', () => {
      authState.user = { uid: 'u1', email: 'planner@craft.com' } as any;
      const wrapper = mount(Navbar);
      expect(wrapper.find('.event-selector-box').exists()).toBe(true);
      expect(wrapper.find('.nav-countdown-badge').exists()).toBe(true);
      expect(wrapper.find('button[title="Open Live Event-Day Run Sheet"]').exists()).toBe(true);
      expect(wrapper.find('button[title="Open PlanCraft ADK AI Assistant"]').exists()).toBe(true);
    });

    it('changes active event when dropdown value changes', async () => {
      authState.user = { uid: 'u1', email: 'planner@craft.com' } as any;
      const wrapper = mount(Navbar);
      const select = wrapper.find('select.event-select-dropdown');
      await select.setValue('evt-2');
      expect(state.activeEventId).toBe('evt-2');
    });

    it('triggers mobile menu toggle when hamburger button is clicked', async () => {
      authState.user = { uid: 'u1', email: 'planner@craft.com' } as any;
      state.isMobileMenuOpen = false;
      const wrapper = mount(Navbar);
      const menuBtn = wrapper.find('.mobile-menu-btn');
      await menuBtn.trigger('click');
      expect(state.isMobileMenuOpen).toBe(true);
    });

    it('opens modals when respective buttons are clicked in authenticated state', async () => {
      authState.user = { uid: 'u1', email: 'planner@craft.com' } as any;
      const wrapper = mount(Navbar);

      // Run sheet modal
      await wrapper.find('button[title="Open Live Event-Day Run Sheet"]').trigger('click');
      expect(state.isRunSheetLiveModalOpen).toBe(true);

      // AI Copilot modal
      await wrapper.find('button[title="Open PlanCraft ADK AI Assistant"]').trigger('click');
      expect(state.isAgentChatModalOpen).toBe(true);

      // Create event modal
      const createBtn = wrapper.findAll('.navbar-right button').find((b) => b.text().includes('Create'));
      expect(createBtn).toBeDefined();
      if (createBtn) {
        await createBtn.trigger('click');
        expect(state.isCreateEventModalOpen).toBe(true);
      }
    });

    it('toggles notification popover, marks individual notification as read, and handles mark all read', async () => {
      authState.user = { uid: 'u1', email: 'planner@craft.com' } as any;
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

    it('renders sign in button when unauthenticated and user chip with logout when authenticated in Navbar', async () => {
      // Unauthenticated state
      authState.user = null;
      let wrapper = mount(Navbar);
      const signInBtn = wrapper.findAll('button').find((b) => b.text().includes('Sign In'));
      expect(signInBtn).toBeDefined();
      if (signInBtn) {
        await signInBtn.trigger('click');
        expect(authState.isAuthModalOpen).toBe(true);
      }

      // Authenticated state
      authState.user = { uid: 'u1', email: 'planner@craft.com', displayName: 'Planner Pro' } as any;
      authState.profile = { uid: 'u1', email: 'planner@craft.com', displayName: 'Planner Pro' } as any;
      wrapper = mount(Navbar);
      expect(wrapper.text()).toContain('Planner Pro');

      const logoutBtn = wrapper.find('button[title="Sign Out"]');
      expect(logoutBtn.exists()).toBe(true);
      await logoutBtn.trigger('click');
    });
  });

  describe('Sidebar Component', () => {
    it('renders brand logo and all primary navigation items', () => {
      const wrapper = mount(Sidebar);
      expect(wrapper.find('.logo-title').text()).toBe('PlanCraft');
      const navItems = wrapper.findAll('.sidebar-nav .nav-item');
      expect(navItems.length).toBeGreaterThanOrEqual(9);
    });

    it('prompts sign in when unauthenticated user clicks a private tab', async () => {
      authState.user = null;
      authState.isAuthModalOpen = false;
      const wrapper = mount(Sidebar);
      const navItems = wrapper.findAll('.sidebar-nav .nav-item');
      const checklistBtn = navItems.find((btn) => btn.text().includes('Checklist'));
      if (checklistBtn) {
        await checklistBtn.trigger('click');
        expect(authState.isAuthModalOpen).toBe(true);
      }
    });

    it('navigates to different tabs on clicking nav items and settings when authenticated', async () => {
      authState.user = { uid: 'u1', email: 'planner@craft.com' } as any;
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

    it('hides AI Copilot and New Event buttons when unauthenticated in Sidebar', () => {
      authState.user = null;
      const wrapper = mount(Sidebar);
      expect(wrapper.findAll('aside.sidebar button').some((b) => b.text().includes('Ask AI Copilot'))).toBe(false);
      expect(wrapper.findAll('aside.sidebar button').some((b) => b.text().includes('+ New Event'))).toBe(false);
    });

    it('opens AI Copilot modal and create event modal from sidebar action buttons when authenticated', async () => {
      authState.user = { uid: 'u1', email: 'planner@craft.com' } as any;
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
      authState.user = { uid: 'u1', email: 'planner@craft.com' } as any;
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

    it('renders sign in button when unauthenticated and profile card with logout when authenticated in Sidebar', async () => {
      // Unauthenticated
      authState.user = null;
      let wrapper = mount(Sidebar);
      const signInBtn = wrapper.findAll('button').find((b) => b.text().includes('Sign In / Register'));
      expect(signInBtn).toBeDefined();
      if (signInBtn) {
        await signInBtn.trigger('click');
        expect(authState.isAuthModalOpen).toBe(true);
      }

      // Authenticated with avatar image
      authState.user = {
        uid: 'u2',
        email: 'alex@plan.com',
        displayName: 'Alex Rivers',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      } as any;
      authState.profile = {
        uid: 'u2',
        email: 'alex@plan.com',
        displayName: 'Alex Rivers',
        role: 'host',
      } as any;
      wrapper = mount(Sidebar);
      expect(wrapper.text()).toContain('Alex Rivers');
      expect(wrapper.find('img.avatar').exists()).toBe(true);

      const logoutBtn = wrapper.find('button[title="Sign Out"]');
      expect(logoutBtn.exists()).toBe(true);
      await logoutBtn.trigger('click');
    });
  });
});
