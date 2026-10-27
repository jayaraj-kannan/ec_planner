<script setup lang="ts">
import { ref } from 'vue';
import { authState, authActions } from '../../stores/authStore';
import { actions } from '../../stores/eventStore';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-vue-next';

const email = ref('');
const password = ref('');
const name = ref('');
const showPassword = ref(false);

async function handleGoogleSignIn() {
  try {
    const user = await authActions.signInWithGoogle();
    if (user) {
      await actions.syncAllToFirestore(user.uid);
    }
  } catch {
    // Error is set in authState.error
  }
}

async function handleEmailAuth() {
  if (!email.value || !password.value) return;

  try {
    if (authState.authMode === 'signup') {
      const user = await authActions.signUpWithEmailPassword(email.value, password.value, name.value);
      if (user) {
        await actions.syncAllToFirestore(user.uid);
      }
    } else {
      const user = await authActions.signInWithEmailPassword(email.value, password.value);
      if (user) {
        await actions.loadFromFirestore(user.uid);
      }
    }
  } catch {
    // Error is set in authState.error
  }
}
</script>

<template>
  <div v-if="authState.isAuthModalOpen" class="modal-overlay" @click.self="authActions.closeAuthModal()">
    <div class="modal-box auth-modal-box">
      <!-- Modal Header -->
      <div class="modal-header">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main)">
            {{ authState.authMode === 'signup' ? 'Create Your Account' : 'Welcome to PlanCraft' }}
          </h3>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px">
            {{
              authState.authMode === 'signup'
                ? 'Sign up to sync celebrations, guests, and budgets securely.'
                : 'Sign in to access your saved events and collaborative plans.'
            }}
          </p>
        </div>

        <button class="btn-icon" @click="authActions.closeAuthModal()" title="Close dialog">
          <X :size="18" />
        </button>
      </div>

      <!-- Mode Switcher Tabs -->
      <div class="auth-tabs">
        <button
          type="button"
          class="auth-tab-btn"
          :class="{ active: authState.authMode === 'signin' }"
          @click="authActions.setAuthMode('signin')"
        >
          Sign In
        </button>
        <button
          type="button"
          class="auth-tab-btn"
          :class="{ active: authState.authMode === 'signup' }"
          @click="authActions.setAuthMode('signup')"
        >
          Create Account
        </button>
      </div>

      <div class="modal-body auth-modal-body">
        <!-- Error Alert Banner -->
        <div v-if="authState.error" class="auth-error-banner">
          <AlertCircle :size="16" style="flex-shrink: 0" />
          <span>{{ authState.error }}</span>
        </div>

        <!-- Google One-Click Sign-In -->
        <button
          type="button"
          class="btn-google"
          :disabled="authState.isLoading"
          @click="handleGoogleSignIn"
        >
          <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <!-- Divider -->
        <div class="auth-divider">
          <span>or with email & password</span>
        </div>

        <!-- Email & Password Form -->
        <form @submit.prevent="handleEmailAuth" class="auth-form">
          <div v-if="authState.authMode === 'signup'" class="form-group">
            <label class="form-label">Full Name</label>
            <div class="input-with-icon">
              <User :size="16" class="field-icon" />
              <input
                v-model="name"
                type="text"
                class="form-input"
                placeholder="e.g. Maya Sharma"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email Address</label>
            <div class="input-with-icon">
              <Mail :size="16" class="field-icon" />
              <input
                v-model="email"
                type="email"
                class="form-input"
                placeholder="host@celebrations.com"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-with-icon">
              <Lock :size="16" class="field-icon" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="••••••••"
                required
                minlength="6"
              />
              <button
                type="button"
                class="btn-toggle-eye"
                @click="showPassword = !showPassword"
                title="Toggle password view"
              >
                <EyeOff v-if="showPassword" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-submit-auth"
            :disabled="authState.isLoading || !email || !password"
          >
            <Loader2 v-if="authState.isLoading" :size="16" class="spin-icon" />
            <span>{{ authState.authMode === 'signup' ? 'Create Account' : 'Sign In' }}</span>
          </button>
        </form>

        <!-- Switch Footer Link -->
        <div class="auth-switch-text">
          <span v-if="authState.authMode === 'signin'">
            Don't have an account yet?
            <button class="link-btn" @click="authActions.setAuthMode('signup')">Create one now</button>
          </span>
          <span v-else>
            Already have an account?
            <button class="link-btn" @click="authActions.setAuthMode('signin')">Sign in instead</button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-modal-box {
  max-width: 440px;
  width: 95%;
}

.auth-tabs {
  display: flex;
  background: var(--surface-subtle);
  border-bottom: 1px solid var(--surface-border);
  padding: 4px 6px;
  gap: 6px;
}

.auth-tab-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.auth-tab-btn.active {
  background: white;
  color: var(--primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.auth-modal-body {
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 0.82rem;
  border-radius: var(--radius-md);
}

.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  background: white;
  border: 1px solid var(--surface-border-strong);
  border-radius: var(--radius-md);
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.btn-google:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 4px 0;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--surface-border);
}

.auth-divider span {
  padding: 0 12px;
  font-size: 0.76rem;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 12px;
  color: var(--text-light);
  pointer-events: none;
}

.input-with-icon .form-input {
  padding-left: 36px;
  padding-right: 36px;
  width: 100%;
}

.btn-toggle-eye {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
}

.btn-submit-auth {
  width: 100%;
  margin-top: 6px;
  padding: 10px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.auth-switch-text {
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.link-btn {
  background: transparent;
  border: none;
  color: var(--primary);
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  margin-left: 4px;
}
</style>
