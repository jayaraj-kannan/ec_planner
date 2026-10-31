import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ScheduleView from '../ScheduleView.vue';
import RunSheetLiveModal from '../RunSheetLiveModal.vue';
import { state, actions } from '../../../stores/eventStore';

describe('Schedule Components Unit Tests (ScheduleView & RunSheetLiveModal)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ScheduleView Component', () => {
    it('renders schedule timeline activities and live coordinator banner', () => {
      const wrapper = mount(ScheduleView);
      expect(wrapper.text()).toContain('Event Schedule & Itinerary Timeline');
      const timelineCards = wrapper.findAll('.card');
      expect(timelineCards.length).toBeGreaterThan(0);
      expect(wrapper.text()).toContain('Launch Live Event-Day Run Sheet');
    });

    it('reports schedule delay and updates status on click', async () => {
      const wrapper = mount(ScheduleView);
      const delayBtn = wrapper.findAll('button').find((b) => b.text().includes('+15m') || b.text().includes('Delay'));
      if (delayBtn) {
        await delayBtn.trigger('click');
        expect(state.schedule.some((s) => s.delayMinutes && s.delayMinutes > 0)).toBe(true);
      }
    });

    it('marks activity completed when complete button is clicked', async () => {
      const wrapper = mount(ScheduleView);
      const doneBtn = wrapper.findAll('button').find((b) => b.text().includes('Mark Done') || b.text().includes('Done'));
      expect(doneBtn).toBeDefined();
      await doneBtn?.trigger('click');
      expect(state.schedule.some((s) => s.status === 'completed')).toBe(true);
    });

    it('opens Add Activity modal, sets inputs, tests early return, cancel, and adds activity', async () => {
      const wrapper = mount(ScheduleView);
      const openAddModal = () => wrapper.findAll('button').find((b) => b.text().includes('Add Activity'));
      const addBtn = openAddModal();
      expect(addBtn).toBeDefined();
      await addBtn?.trigger('click');
      expect(wrapper.find('.modal-box').exists()).toBe(true);

      // Click Save without filling name (early return)
      const saveBtn = wrapper.findAll('.modal-footer button').find((b) => b.text().includes('Save Activity'));
      await saveBtn?.trigger('click');

      // Cancel modal
      const cancelBtn = wrapper.findAll('.modal-footer button').find((b) => b.text().includes('Cancel'));
      await cancelBtn?.trigger('click');
      expect(wrapper.find('.modal-box').exists()).toBe(false);

      // Reopen, fill all fields, and save
      await openAddModal()?.trigger('click');
      const nameInput = wrapper.find('input[placeholder*="Grand Entrance & Varmala"]');
      expect(nameInput.exists()).toBe(true);
      if (nameInput.exists()) {
        await nameInput.setValue('Cake Cutting & Fireworks');

        const timeInputs = wrapper.findAll('input[type="time"]');
        if (timeInputs.length >= 2) {
          await timeInputs[0].setValue('18:00');
          await timeInputs[1].setValue('19:00');
        }

        const locationInput = wrapper.find('input[placeholder*="Lawn Garden Pavilion"]');
        if (locationInput.exists()) {
          await locationInput.setValue('Poolside Lawn');
        }

        const leadInput = wrapper.find('input[placeholder*="Ananya (Sister)"]');
        if (leadInput.exists()) {
          await leadInput.setValue('Karan (Brother)');
        }

        const phoneInput = wrapper.find('input[placeholder="+91 98450 00000"]');
        if (phoneInput.exists()) {
          await phoneInput.setValue('+91 99999 88888');
        }

        const notesTextarea = wrapper.find('textarea');
        if (notesTextarea.exists()) {
          await notesTextarea.setValue('Coordinate fireworks timing');
        }

        await wrapper.findAll('.modal-footer button').find((b) => b.text().includes('Save Activity'))?.trigger('click');
        expect(state.schedule.some((s) => s.activityName === 'Cake Cutting & Fireworks')).toBe(true);
      }

      // Test close icon and backdrop click
      await openAddModal()?.trigger('click');
      const modalCloseIcon = wrapper.find('.modal-header button.btn-icon');
      if (modalCloseIcon.exists()) {
        await modalCloseIcon.trigger('click');
        expect(wrapper.find('.modal-box').exists()).toBe(false);
      }

      await openAddModal()?.trigger('click');
      await wrapper.find('.modal-overlay').trigger('click');
      expect(wrapper.find('.modal-box').exists()).toBe(false);
    });

    it('renders delayed activity timeline indicator', () => {
      state.schedule.push({
        id: 'sch-delayed',
        eventId: state.activeEventId,
        activityName: 'Delayed Baraat Entrance',
        scheduleDate: '2026-12-18',
        startTime: '19:00',
        endTime: '20:00',
        status: 'upcoming',
        delayMinutes: 20,
        location: 'North Gate',
        responsiblePerson: 'Lead',
        backupContact: 'Co-Lead',
        phone: '9876543210',
      });
      const wrapper = mount(ScheduleView);
      expect(wrapper.text()).toContain('Delayed Baraat Entrance');
      expect(wrapper.text()).toContain('+20m Delay');
    });

    it('opens live run sheet modal from view header button and banner button', async () => {
      const wrapper = mount(ScheduleView);
      const liveBtn = wrapper.findAll('button').find((b) => b.text().includes('Launch Live Event-Day Run Sheet'));
      if (liveBtn) {
        await liveBtn.trigger('click');
        expect(state.isRunSheetLiveModalOpen).toBe(true);
      }

      state.isRunSheetLiveModalOpen = false;
      const mobileBtn = wrapper.findAll('button').find((b) => b.text().includes('Coordinator View') || b.text().includes('Open Mobile View'));
      if (mobileBtn) {
        await mobileBtn.trigger('click');
        expect(state.isRunSheetLiveModalOpen).toBe(true);
      }
    });

    it('copies public runsheet URL and opens public view from ScheduleView', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
        writable: true,
      });

      const wrapper = mount(ScheduleView);
      const copyBtn = wrapper.findAll('button').find((b) => b.text().includes('Copy Public URL'));
      expect(copyBtn).toBeDefined();
      await copyBtn?.trigger('click');
      expect(writeTextMock).toHaveBeenCalled();

      // Advance timers to trigger copied reset
      vi.advanceTimersByTime(3000);

      // Trigger clipboard error to cover catch block
      writeTextMock.mockRejectedValueOnce(new Error('Permission denied'));
      await copyBtn?.trigger('click');

      const publicPageBtn = wrapper.findAll('button').find((b) => b.text().includes('View Public Page'));
      expect(publicPageBtn).toBeDefined();
      await publicPageBtn?.trigger('click');
      expect(state.publicRunSheetEventId).toBe(state.activeEventId);
    });

    it('toggles launching and unpublishing runsheet from ScheduleView banner', async () => {
      const evt = state.events.find((e) => e.id === 'evt-1');
      const wrapper = mount(ScheduleView);

      // Currently launched, click Pause Live
      const pauseBtn = wrapper.findAll('button').find((b) => b.text().includes('Pause Live'));
      if (pauseBtn) {
        await pauseBtn.trigger('click');
        expect(evt?.isRunSheetLaunched).toBe(false);
      }

      // Now unlaunched, click Launch Live Run Sheet
      const launchBtn = wrapper.findAll('button').find((b) => b.text().includes('Launch Live Run Sheet'));
      if (launchBtn) {
        await launchBtn.trigger('click');
        expect(evt?.isRunSheetLaunched).toBe(true);
      }
    });
  });

  describe('RunSheetLiveModal Component', () => {
    it('renders live coordinator run sheet, advances clock, and cleans up on unmount', () => {
      const wrapper = mount(RunSheetLiveModal);
      expect(wrapper.text()).toContain('LIVE COORDINATOR RUN SHEET');
      expect(wrapper.text()).toContain("Priya & Rahul's Grand Wedding");

      // Advance clock timer
      vi.advanceTimersByTime(2000);
      expect(wrapper.find('.modal-box').exists()).toBe(true);

      // Trigger unmount to verify clearInterval
      wrapper.unmount();
    });

    it('triggers delay and done actions on live activities', async () => {
      const wrapper = mount(RunSheetLiveModal);
      const delayBtn = wrapper.findAll('button').find((b) => b.text().includes('+15m'));
      if (delayBtn) {
        await delayBtn.trigger('click');
        expect(state.schedule.some((s) => s.delayMinutes === 15)).toBe(true);
      }

      const markDoneBtn = wrapper.findAll('button').find((b) => b.text().includes('Done'));
      if (markDoneBtn) {
        await markDoneBtn.trigger('click');
        expect(state.schedule.some((s) => s.status === 'completed')).toBe(true);
      }
    });

    it('displays public attendee share URL with copy, share, and view buttons', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
        writable: true,
      });
      Object.defineProperty(navigator, 'share', {
        value: shareMock,
        configurable: true,
        writable: true,
      });

      const wrapper = mount(RunSheetLiveModal);
      expect(wrapper.text()).toContain('Public Attendee Share URL');
      const input = wrapper.find('input[readonly]');
      expect(input.exists()).toBe(true);
      expect((input.element as HTMLInputElement).value).toContain('#/runsheet/');
      await input.trigger('focus');

      // Test copy
      const copyBtn = wrapper.findAll('button').find((b) => b.text().includes('Copy'));
      expect(copyBtn).toBeDefined();
      await copyBtn?.trigger('click');
      expect(writeTextMock).toHaveBeenCalled();

      // Reset copied state after timer
      vi.advanceTimersByTime(3000);

      // Trigger copy rejection to cover catch
      writeTextMock.mockRejectedValueOnce(new Error('Copy failed'));
      await copyBtn?.trigger('click');

      // Test share
      const shareBtn = wrapper.findAll('button').find((b) => b.text().includes('Share'));
      expect(shareBtn).toBeDefined();
      await shareBtn?.trigger('click');
      expect(shareMock).toHaveBeenCalled();

      // Test share rejection/fallback
      shareMock.mockRejectedValueOnce(new Error('Share dismissed'));
      await shareBtn?.trigger('click');

      // Test view
      const viewBtn = wrapper.findAll('button').find((b) => b.text().includes('View'));
      expect(viewBtn).toBeDefined();
      await viewBtn?.trigger('click');
      expect(state.publicRunSheetEventId).toBe(state.activeEventId);

      // Test pause and launch toggle
      const evt = state.events.find((e) => e.id === 'evt-1');
      const pauseBtn = wrapper.findAll('button').find((b) => b.text().includes('Pause Live'));
      if (pauseBtn) {
        await pauseBtn.trigger('click');
        expect(evt?.isRunSheetLaunched).toBe(false);
      }

      const launchModalBtn = wrapper.findAll('button').find((b) => b.text().includes('Launch Live Run Sheet'));
      if (launchModalBtn) {
        await launchModalBtn.trigger('click');
        expect(evt?.isRunSheetLaunched).toBe(true);
      }
    });

    it('closes run sheet modal on close button, Exit Run Sheet, or backdrop click', async () => {
      state.isRunSheetLiveModalOpen = true;
      const wrapper = mount(RunSheetLiveModal);
      const closeBtn = wrapper.find('.btn-icon');
      if (closeBtn.exists()) {
        await closeBtn.trigger('click');
        expect(state.isRunSheetLiveModalOpen).toBe(false);
      }

      state.isRunSheetLiveModalOpen = true;
      const exitBtn = wrapper.findAll('button').find((b) => b.text().includes('Exit Run Sheet'));
      if (exitBtn) {
        await exitBtn.trigger('click');
        expect(state.isRunSheetLiveModalOpen).toBe(false);
      }

      state.isRunSheetLiveModalOpen = true;
      await wrapper.find('.modal-overlay').trigger('click');
      expect(state.isRunSheetLiveModalOpen).toBe(false);
    });
  });
});
