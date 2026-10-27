import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import HomeGuestDashboardView from '../HomeGuestDashboardView.vue';
import { authActions } from '../../../stores/authStore';
import { actions } from '../../../stores/eventStore';

describe('HomeGuestDashboardView Component Unit Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders hero section, badges, titles, and highlight items', () => {
    const wrapper = mount(HomeGuestDashboardView);
    expect(wrapper.text()).toContain('Plan Every Celebration With');
    expect(wrapper.text()).toContain('Absolute Confidence');
    expect(wrapper.find('.hero-badge-pill').text()).toContain('PLANNING OPERATING SYSTEM');
    const highlights = wrapper.findAll('.highlight-item');
    expect(highlights.length).toBe(4);
  });

  it('triggers hero CTA buttons correctly', async () => {
    const authSpy = vi.spyOn(authActions, 'openAuthModal');
    const copilotSpy = vi.spyOn(actions, 'openAgentChatModal');

    const wrapper = mount(HomeGuestDashboardView);
    const heroPrimary = wrapper.find('.btn-hero-primary');
    await heroPrimary.trigger('click');
    expect(authSpy).toHaveBeenCalledWith('signup');

    const heroSecondary = wrapper.find('.btn-hero-secondary');
    await heroSecondary.trigger('click');
    expect(copilotSpy).toHaveBeenCalled();
  });

  it('navigates carousel slides via next, prev, and dot buttons', async () => {
    const wrapper = mount(HomeGuestDashboardView);

    // Initial slide
    expect(wrapper.text()).toContain('Priya & Rahul’s Grand Royal Wedding');

    // Next slide
    const nextBtn = wrapper.find('.carousel-nav-arrows button[aria-label="Next slide"]');
    await nextBtn.trigger('click');
    expect(wrapper.text()).toContain('Prompt-to-Plan with Interactive A2UI Cards');

    // Next slide again
    await nextBtn.trigger('click');
    expect(wrapper.text()).toContain('Real-Time Schedule with Dynamic Delay Detection');

    // Prev slide
    const prevBtn = wrapper.find('.carousel-nav-arrows button[aria-label="Previous slide"]');
    await prevBtn.trigger('click');
    expect(wrapper.text()).toContain('Prompt-to-Plan with Interactive A2UI Cards');

    // Prev wrap around
    await prevBtn.trigger('click'); // slide 0
    await prevBtn.trigger('click'); // slide 3 (last)
    expect(wrapper.text()).toContain('Precision Expense Ledger with Minor-Unit Math');

    // Dot navigation
    const dots = wrapper.findAll('.dot-indicator');
    expect(dots.length).toBe(4);
    await dots[1].trigger('click');
    expect(wrapper.text()).toContain('Prompt-to-Plan with Interactive A2UI Cards');
  });

  it('auto-advances carousel on interval and pauses on hover', async () => {
    const wrapper = mount(HomeGuestDashboardView);
    expect(wrapper.text()).toContain('Priya & Rahul’s Grand Royal Wedding');

    // Advance 5 seconds
    vi.advanceTimersByTime(5100);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Prompt-to-Plan with Interactive A2UI Cards');

    // Hover pauses auto-advance
    const carouselSec = wrapper.find('.carousel-section');
    await carouselSec.trigger('mouseenter');
    vi.advanceTimersByTime(10000);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Prompt-to-Plan with Interactive A2UI Cards');

    // Mouseleave resumes auto-advance
    await carouselSec.trigger('mouseleave');
    vi.advanceTimersByTime(5100);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Real-Time Schedule with Dynamic Delay Detection');
  });

  it('handles carousel CTA actions for copilot and auth slides', async () => {
    const copilotSpy = vi.spyOn(actions, 'openAgentChatModal');
    const authSpy = vi.spyOn(authActions, 'openAuthModal');

    const wrapper = mount(HomeGuestDashboardView);

    // Slide 1 is auth CTA
    const slide1Cta = wrapper.findAll('.btn-slide-action')[0];
    await slide1Cta.trigger('click');
    expect(authSpy).toHaveBeenCalledWith('signup');

    // Switch to slide 2 (copilot CTA)
    const nextBtn = wrapper.find('.carousel-nav-arrows button[aria-label="Next slide"]');
    await nextBtn.trigger('click');
    await wrapper.vm.$nextTick();

    const slide2Cta = wrapper.findAll('.btn-slide-action')[1];
    await slide2Cta.trigger('click');
    expect(copilotSpy).toHaveBeenCalled();
  });

  it('renders all 9 feature cards and triggers their CTAs', async () => {
    const authSpy = vi.spyOn(authActions, 'openAuthModal');
    const copilotSpy = vi.spyOn(actions, 'openAgentChatModal');

    const wrapper = mount(HomeGuestDashboardView);
    const featureCards = wrapper.findAll('.feature-card');
    expect(featureCards.length).toBe(9);

    const ctaBtns = wrapper.findAll('.btn-feature-cta');
    expect(ctaBtns.length).toBe(9);

    // Trigger every feature card's CTA to cover all action callbacks
    for (let i = 0; i < ctaBtns.length; i++) {
      await ctaBtns[i].trigger('click');
    }

    expect(copilotSpy).toHaveBeenCalled();
    expect(authSpy).toHaveBeenCalled();

    // Trigger unmount to cover onUnmounted stopTimer
    wrapper.unmount();
  });

  it('handles bottom CTA banner buttons', async () => {
    const authSpy = vi.spyOn(authActions, 'openAuthModal');

    const wrapper = mount(HomeGuestDashboardView);
    const signinBtn = wrapper.find('.btn-cta-large');
    await signinBtn.trigger('click');
    expect(authSpy).toHaveBeenCalledWith('signin');

    const registerBtn = wrapper.find('.btn-cta-secondary');
    await registerBtn.trigger('click');
    expect(authSpy).toHaveBeenCalledWith('signup');
  });
});
