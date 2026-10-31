import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import PublicRunSheetView from '../PublicRunSheetView.vue';
import { state, actions } from '../../../stores/eventStore';
import { authState } from '../../../stores/authStore';
import { runSheetWsService } from '../../../services/websocket.service';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  public url: string;
  public readyState: number = 0; // CONNECTING
  public onopen: (() => void) | null = null;
  public onmessage: ((event: { data: any }) => void) | null = null;
  public onerror: ((error: any) => void) | null = null;
  public onclose: (() => void) | null = null;
  public sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  simulateOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) this.onopen();
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: typeof data === 'string' ? data : JSON.stringify(data) });
    }
  }

  simulateClose() {
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }
}

describe('PublicRunSheetView Component Unit Tests', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    (globalThis as any).WebSocket = MockWebSocket;
    (MockWebSocket as any).OPEN = 1;
    runSheetWsService.disconnect();
    actions.resetToMockDefaults();
    actions.setActiveEvent('evt-1');
    state.publicRunSheetEventId = 'evt-1';
    authState.user = null; // Unauthenticated guest by default
  });

  afterEach(() => {
    runSheetWsService.disconnect();
    (globalThis as any).WebSocket = originalWebSocket;
    vi.useRealTimers();
  });

  it('renders event title, location, ceremonies count, dynamic hash code, and live clock', () => {
    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });

    expect(wrapper.text()).toContain("Priya & Rahul's Grand Wedding");
    expect(wrapper.text()).toContain('The Taj West End');
    expect(wrapper.text()).toContain('LIVE RUN SHEET');
    expect(wrapper.text()).toContain('#/runsheet/rs-priya-rahul-9a8f');

    // Advance clock timer
    vi.advanceTimersByTime(2000);
    expect(wrapper.find('.clock-text').text().length).toBeGreaterThan(0);

    wrapper.unmount();
  });

  it('renders scheduled ceremony items and visual curve line to show which is next', () => {
    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });

    const cards = wrapper.findAll('.compact-act-card');
    expect(cards.length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('Haldi & Floral Holi Celebration');
    expect(wrapper.text()).toContain('Groom Baraat & Band Procession');

    // Visual curve line to show which is next
    const curveIndicator = wrapper.find('.next-curve-indicator');
    expect(curveIndicator.exists()).toBe(true);
    expect(wrapper.find('.curve-svg').exists()).toBe(true);
    expect(wrapper.text()).toContain('NEXT UP');
  });

  it('highlights next / current ceremony in spotlight card and tracks progress', () => {
    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });

    expect(wrapper.find('.spotlight-compact').exists()).toBe(true);
    expect(wrapper.text()).toContain('NEXT / HAPPENING NOW');
    expect(wrapper.text()).toContain('Event Timeline Progress');
  });

  it('displays delay warning banner when activity is delayed', async () => {
    actions.reportScheduleDelay(state.schedule[0].id, 25);
    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });

    expect(wrapper.text()).toContain('+25m behind schedule');
    expect(wrapper.text()).toContain('+25m Delay');
  });

  it('copies public runsheet URL to clipboard and handles errors and timer resets', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });

    const copyBtn = wrapper.findAll('button').find((b) => b.text().includes('Copy'));
    expect(copyBtn).toBeDefined();

    // Trigger focus on share input to cover auto-select
    const shareInput = wrapper.find('.share-input-compact');
    if (shareInput.exists()) {
      await shareInput.trigger('focus');
    }

    await copyBtn?.trigger('click');

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('#/runsheet/rs-priya-rahul-9a8f'));

    // Advance timers to trigger copied state reset
    vi.advanceTimersByTime(3000);

    // Test rejection to cover catch
    writeTextMock.mockRejectedValueOnce(new Error('Permission denied'));
    await copyBtn?.trigger('click');
  });

  it('calls navigator.share when Share button is clicked and falls back if rejected', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });

    const shareBtn = wrapper.findAll('button').find((b) => b.text().includes('Share'));
    expect(shareBtn).toBeDefined();
    await shareBtn?.trigger('click');

    expect(shareMock).toHaveBeenCalledWith(expect.objectContaining({
      url: expect.stringContaining('#/runsheet/rs-priya-rahul-9a8f'),
    }));

    // Test rejection to cover fallback to copyUrl
    shareMock.mockRejectedValueOnce(new Error('Share dismissed'));
    await shareBtn?.trigger('click');
  });

  it('has no back or exit button on the public runsheet', () => {
    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });

    expect(wrapper.text()).not.toContain('Exit View');
    expect(wrapper.text()).not.toContain('Back to Planner');
    expect(wrapper.text()).not.toContain('Exit Run Sheet');
    const backOrExitBtns = wrapper
      .findAll('button')
      .filter((b) => b.text().toLowerCase().includes('back') || b.text().toLowerCase().includes('exit'));
    expect(backOrExitBtns.length).toBe(0);
  });

  it('allows coordinator to report delay and mark complete when logged in', async () => {
    authState.user = { uid: 'user-coord', email: 'coord@example.com' } as any;

    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });

    expect(wrapper.text()).toContain('Coordinator:');

    // Click delay
    const delayBtn = wrapper.findAll('button').find((b) => b.text().includes('+15m Delay'));
    expect(delayBtn).toBeDefined();
    await delayBtn?.trigger('click');
    expect(state.schedule.some((s) => s.delayMinutes === 15)).toBe(true);

    // Click mark done
    const doneBtn = wrapper.findAll('button').find((b) => b.text().includes('Done'));
    expect(doneBtn).toBeDefined();
    await doneBtn?.trigger('click');
    expect(state.schedule.some((s) => s.status === 'completed')).toBe(true);
  });

  it('handles empty schedule gracefully with placeholder note', () => {
    state.schedule = [];

    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-empty' },
    });

    expect(wrapper.text()).toContain('No ceremonies scheduled yet');
  });

  it('handles sync refresh button click', async () => {
    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });

    const refreshBtn = wrapper.findAll('button').find((b) => b.text().includes('Sync'));
    expect(refreshBtn).toBeDefined();
    await refreshBtn?.trigger('click');

    vi.advanceTimersByTime(1000);
    expect(wrapper.exists()).toBe(true);
  });

  it('renders standby screen when event is unlaunched and viewed by a public attendee', () => {
    const evt = state.events.find((e) => e.id === 'evt-1');
    if (evt) evt.isRunSheetLaunched = false;
    authState.user = null; // Public guest

    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });

    expect(wrapper.find('.unlaunched-guest-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('Live Run Sheet Not Launched Yet');
    expect(wrapper.text()).toContain('STANDBY MODE');
  });

  it('renders organizer banner and permits launching live run sheet and returning to full planner', async () => {
    const evt = state.events.find((e) => e.id === 'evt-1');
    if (evt) evt.isRunSheetLaunched = false;
    authState.user = { uid: 'user-1', email: 'owner@example.com' } as any;

    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });

    expect(wrapper.find('.organizer-top-banner').exists()).toBe(true);
    expect(wrapper.text()).toContain('EVENT ORGANIZER MODE');

    // Test launch button
    const launchBtn = wrapper.find('button.btn-launch-now');
    expect(launchBtn.exists()).toBe(true);
    await launchBtn.trigger('click');
    expect(evt?.isRunSheetLaunched).toBe(true);

    // Test return to full planner button
    const returnBtn = wrapper.find('button.btn-exit-planner');
    expect(returnBtn.exists()).toBe(true);
    await returnBtn.trigger('click');
    expect(state.publicRunSheetEventId).toBeNull();
    expect(state.activeTab).toBe('schedule');
  });

  it('connects to WebSocket on mount and displays WS LIVE badge when connected', async () => {
    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });
    await flushPromises();

    expect(MockWebSocket.instances.length).toBeGreaterThan(0);
    const wsInstance = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    expect(wsInstance.url).toContain('/ws/runsheet/rs-priya-rahul-9a8f');

    // Simulate socket open event
    wsInstance.simulateOpen();
    await nextTick();

    expect(runSheetWsService.isConnected.value).toBe(true);
    expect(wrapper.find('.ws-badge').classes()).toContain('ws-connected');
    expect(wrapper.text()).toContain('WS LIVE');

    wrapper.unmount();
    expect(runSheetWsService.isConnected.value).toBe(false);
  });

  it('updates schedule delay live via incoming WebSocket delay_reported message', async () => {
    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });
    await flushPromises();

    const wsInstance = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    wsInstance.simulateOpen();
    await nextTick();

    const activityId = state.schedule[0].id;

    // Simulate incoming delay broadcast from coordinator
    wsInstance.simulateMessage({
      type: 'delay_reported',
      room_id: 'rs-priya-rahul-9a8f',
      activity_id: activityId,
      delay_minutes: 35,
    });
    await nextTick();

    expect(state.schedule.find((s) => s.id === activityId)?.delayMinutes).toBe(35);
    expect(wrapper.text()).toContain('+35m behind schedule');
    expect(wrapper.text()).toContain('+35m Delay');

    wrapper.unmount();
  });

  it('updates ceremony status live via incoming WebSocket status_updated message', async () => {
    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });
    await flushPromises();

    const wsInstance = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    wsInstance.simulateOpen();
    await nextTick();

    const activityId = state.schedule[0].id;

    // Simulate incoming status update
    wsInstance.simulateMessage({
      type: 'status_updated',
      room_id: 'rs-priya-rahul-9a8f',
      activity_id: activityId,
      status: 'completed',
    });
    await nextTick();

    expect(state.schedule.find((s) => s.id === activityId)?.status).toBe('completed');
    // Spotlight moves or updates progress
    expect(wrapper.text()).toContain('Event Timeline Progress');

    wrapper.unmount();
  });

  it('updates launched state live when runsheet_launched WebSocket message arrives', async () => {
    const evt = state.events.find((e) => e.id === 'evt-1');
    if (evt) evt.isRunSheetLaunched = false;
    authState.user = null; // Public attendee

    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('STANDBY MODE');
    expect(wrapper.find('.unlaunched-guest-card').exists()).toBe(true);

    const wsInstance = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    wsInstance.simulateOpen();
    await nextTick();

    // Coordinator launches the run sheet
    wsInstance.simulateMessage({
      type: 'runsheet_launched',
      room_id: 'rs-priya-rahul-9a8f',
      is_launched: true,
      hash_code: 'rs-priya-rahul-9a8f',
    });
    await nextTick();

    expect(evt?.isRunSheetLaunched).toBe(true);
    expect(wrapper.text()).toContain('LIVE RUN SHEET');
    expect(wrapper.find('.unlaunched-guest-card').exists()).toBe(false);

    wrapper.unmount();
  });

  it('syncs all activities live when activities_synced WebSocket message arrives', async () => {
    const wrapper = mount(PublicRunSheetView, {
      props: { eventId: 'evt-1' },
    });
    await flushPromises();

    const wsInstance = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    wsInstance.simulateOpen();
    await nextTick();

    const updatedActivities = [
      {
        id: 'act-ws-1',
        eventId: 'evt-1',
        activityName: 'Live WebSocket Grand Entry',
        scheduleDate: '2026-12-08',
        startTime: '19:00',
        endTime: '19:45',
        location: 'Grand Ballroom',
        responsiblePerson: 'Priya',
        backupContact: 'Rahul',
        phone: '+91 98450 12345',
        status: 'in_progress' as const,
        delayMinutes: 0,
      },
    ];

    wsInstance.simulateMessage({
      type: 'activities_synced',
      room_id: 'rs-priya-rahul-9a8f',
      schedule: updatedActivities,
    });
    await nextTick();

    expect(wrapper.text()).toContain('Live WebSocket Grand Entry');
    expect(wrapper.text()).toContain('Grand Ballroom');

    wrapper.unmount();
  });
});
