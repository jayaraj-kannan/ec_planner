import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import AuthModal from '../AuthModal.vue';
import { authState, authActions } from '../../../stores/authStore';
import { actions } from '../../../stores/eventStore';

describe('AuthModal Component Unit Tests', () => {
  beforeEach(() => {
    authState.isAuthModalOpen = true;
    authState.authMode = 'signin';
    authState.isLoading = false;
    authState.error = null;
    authState.user = null;
    vi.restoreAllMocks();
  });

  it('renders modal when isAuthModalOpen is true and closes on close button click', async () => {
    const wrapper = mount(AuthModal);
    expect(wrapper.find('.auth-modal-box').exists()).toBe(true);
    expect(wrapper.text()).toContain('Welcome to PlanCraft');

    const closeBtn = wrapper.find('.modal-header button.btn-icon');
    await closeBtn.trigger('click');
    expect(authState.isAuthModalOpen).toBe(false);
  });

  it('does not render modal when isAuthModalOpen is false', () => {
    authState.isAuthModalOpen = false;
    const wrapper = mount(AuthModal);
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('closes modal on backdrop click with click.self', async () => {
    const wrapper = mount(AuthModal);
    const overlay = wrapper.find('.modal-overlay');
    await overlay.trigger('click');
    expect(authState.isAuthModalOpen).toBe(false);
  });

  it('switches between Sign In and Create Account modes via tabs and footer links', async () => {
    const wrapper = mount(AuthModal);
    const tabs = wrapper.findAll('.auth-tab-btn');

    // Switch to signup via tab
    await tabs[1].trigger('click');
    expect(authState.authMode).toBe('signup');
    expect(wrapper.text()).toContain('Create Your Account');
    expect(wrapper.find('input[placeholder="e.g. Maya Sharma"]').exists()).toBe(true);

    // Switch to signin via tab
    await tabs[0].trigger('click');
    expect(authState.authMode).toBe('signin');
    expect(wrapper.text()).toContain('Welcome to PlanCraft');

    // Switch back via footer link
    const switchLinkSignup = wrapper.find('.auth-switch-text button.link-btn');
    await switchLinkSignup.trigger('click');
    expect(authState.authMode).toBe('signup');

    // Switch back via footer link
    const switchLinkSignin = wrapper.find('.auth-switch-text button.link-btn');
    await switchLinkSignin.trigger('click');
    expect(authState.authMode).toBe('signin');
  });

  it('toggles password visibility on eye button click', async () => {
    const wrapper = mount(AuthModal);
    const passwordInput = wrapper.find('input[placeholder="••••••••"]');
    expect(passwordInput.attributes('type')).toBe('password');

    const toggleBtn = wrapper.find('.btn-toggle-eye');
    await toggleBtn.trigger('click');
    expect(passwordInput.attributes('type')).toBe('text');

    await toggleBtn.trigger('click');
    expect(passwordInput.attributes('type')).toBe('password');
  });

  it('displays error alert banner when authState.error is present', () => {
    authState.error = 'Invalid email or password';
    const wrapper = mount(AuthModal);
    expect(wrapper.find('.auth-error-banner').exists()).toBe(true);
    expect(wrapper.find('.auth-error-banner').text()).toContain('Invalid email or password');
  });

  it('handles Google Sign-In successfully and synchronizes Firestore', async () => {
    const googleSpy = vi.spyOn(authActions, 'signInWithGoogle').mockResolvedValue({
      uid: 'google-usr-123',
      email: 'google@test.com',
    } as any);
    const syncSpy = vi.spyOn(actions, 'syncAllToFirestore').mockResolvedValue(true);

    const wrapper = mount(AuthModal);
    const googleBtn = wrapper.find('button.btn-google');
    await googleBtn.trigger('click');

    expect(googleSpy).toHaveBeenCalled();
    expect(syncSpy).toHaveBeenCalledWith('google-usr-123');
  });

  it('handles Google Sign-In failure gracefully without uncaught rejection', async () => {
    vi.spyOn(authActions, 'signInWithGoogle').mockRejectedValue(new Error('Popup closed by user'));
    const wrapper = mount(AuthModal);
    const googleBtn = wrapper.find('button.btn-google');
    await googleBtn.trigger('click');
    // Function catches error safely
  });

  it('handles Email Sign-In submission and loads user data from Firestore', async () => {
    const signInSpy = vi.spyOn(authActions, 'signInWithEmailPassword').mockResolvedValue({
      uid: 'user-456',
      email: 'host@test.com',
    } as any);
    const loadSpy = vi.spyOn(actions, 'loadFromFirestore').mockResolvedValue(undefined);

    const wrapper = mount(AuthModal);
    const inputs = wrapper.findAll('input');
    // inputs[0]: email, inputs[1]: password
    await inputs[0].setValue('host@test.com');
    await inputs[1].setValue('Secret123');

    const form = wrapper.find('form.auth-form');
    await form.trigger('submit.prevent');

    expect(signInSpy).toHaveBeenCalledWith('host@test.com', 'Secret123');
    expect(loadSpy).toHaveBeenCalledWith('user-456');
  });

  it('handles Email Sign-Up submission and synchronizes data to Firestore', async () => {
    authState.authMode = 'signup';
    const signUpSpy = vi.spyOn(authActions, 'signUpWithEmailPassword').mockResolvedValue({
      uid: 'new-user-789',
      email: 'newuser@test.com',
    } as any);
    const syncSpy = vi.spyOn(actions, 'syncAllToFirestore').mockResolvedValue(true);

    const wrapper = mount(AuthModal);
    const nameInput = wrapper.find('input[placeholder="e.g. Maya Sharma"]');
    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[placeholder="••••••••"]');

    await nameInput.setValue('Maya Sharma');
    await emailInput.setValue('newuser@test.com');
    await passwordInput.setValue('NewPassword123');

    const form = wrapper.find('form.auth-form');
    await form.trigger('submit.prevent');

    expect(signUpSpy).toHaveBeenCalledWith('newuser@test.com', 'NewPassword123', 'Maya Sharma');
    expect(syncSpy).toHaveBeenCalledWith('new-user-789');
  });

  it('prevents submission if email or password are missing', async () => {
    const signInSpy = vi.spyOn(authActions, 'signInWithEmailPassword');
    const wrapper = mount(AuthModal);
    const form = wrapper.find('form.auth-form');
    await form.trigger('submit.prevent');
    expect(signInSpy).not.toHaveBeenCalled();
  });
});
