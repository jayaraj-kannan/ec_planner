import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  runSheetWsService,
  getRunSheetWebSocketUrl,
} from '../websocket.service';

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

  simulateError(err: any = new Error('Socket error')) {
    if (this.onerror) this.onerror(err);
  }

  simulateClose() {
    this.readyState = 3; // CLOSED
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

describe('RunSheet WebSocket Service Unit Tests', () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    (globalThis as any).WebSocket = MockWebSocket;
    (MockWebSocket as any).OPEN = 1;
    runSheetWsService.disconnect();
  });

  afterEach(() => {
    runSheetWsService.disconnect();
    (globalThis as any).WebSocket = originalWebSocket;
    vi.useRealTimers();
  });

  describe('getRunSheetWebSocketUrl', () => {
    it('builds standard ws URL for local development pointing to port 8000', () => {
      const url = getRunSheetWebSocketUrl('evt-1');
      expect(url).toContain('ws://');
      expect(url).toContain('/ws/runsheet/evt-1');
    });

    it('encodes special characters in room ID', () => {
      const url = getRunSheetWebSocketUrl('rs-wedding-&-reception');
      expect(url).toContain(encodeURIComponent('rs-wedding-&-reception'));
    });
  });

  describe('RunSheetWebSocketService Connection & Messaging', () => {
    it('returns null if roomId is empty', () => {
      const ws = runSheetWsService.connect('');
      expect(ws).toBeNull();
      expect(runSheetWsService.isConnected.value).toBe(false);
    });

    it('connects, triggers onopen, and sets isConnected to true', () => {
      const onConnectMock = vi.fn();
      runSheetWsService.connect('evt-1', { onConnect: onConnectMock });

      expect(runSheetWsService.isConnecting.value).toBe(true);
      expect(MockWebSocket.instances.length).toBe(1);

      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();

      expect(runSheetWsService.isConnected.value).toBe(true);
      expect(runSheetWsService.isConnecting.value).toBe(false);
      expect(onConnectMock).toHaveBeenCalled();
    });

    it('returns existing socket if already connected to the same room', () => {
      runSheetWsService.connect('evt-1');
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();

      const secondConnect = runSheetWsService.connect('evt-1');
      expect(secondConnect).toBe(mockWs);
      expect(MockWebSocket.instances.length).toBe(1);
    });

    it('handles connected welcome message and updates activeWatchers', () => {
      runSheetWsService.connect('evt-1');
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();

      mockWs.simulateMessage({
        type: 'connected',
        room_id: 'evt-1',
        active_watchers: 8,
      });

      expect(runSheetWsService.activeWatchers.value).toBe(8);
      expect(runSheetWsService.lastMessage.value).toEqual(expect.objectContaining({
        type: 'connected',
      }));
    });

    it('dispatches incoming delay_reported to onDelay callback', () => {
      const onDelayMock = vi.fn();
      runSheetWsService.connect('evt-1', { onDelay: onDelayMock });
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();

      mockWs.simulateMessage({
        type: 'delay_reported',
        activity_id: 'act-10',
        delay_minutes: 25,
      });

      expect(onDelayMock).toHaveBeenCalledWith(expect.objectContaining({
        activity_id: 'act-10',
        delay_minutes: 25,
      }));
    });

    it('dispatches incoming status_updated to onStatus callback', () => {
      const onStatusMock = vi.fn();
      runSheetWsService.connect('evt-1', { onStatus: onStatusMock });
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();

      mockWs.simulateMessage({
        type: 'status_updated',
        activity_id: 'act-20',
        status: 'completed',
      });

      expect(onStatusMock).toHaveBeenCalledWith(expect.objectContaining({
        activity_id: 'act-20',
        status: 'completed',
      }));
    });

    it('dispatches incoming runsheet_launched to onLaunch callback', () => {
      const onLaunchMock = vi.fn();
      runSheetWsService.connect('evt-1', { onLaunch: onLaunchMock });
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();

      mockWs.simulateMessage({
        type: 'runsheet_launched',
        is_launched: true,
        hash_code: 'rs-new-hash',
      });

      expect(onLaunchMock).toHaveBeenCalledWith(expect.objectContaining({
        is_launched: true,
        hash_code: 'rs-new-hash',
      }));
    });

    it('dispatches incoming activities_synced to onSync callback', () => {
      const onSyncMock = vi.fn();
      runSheetWsService.connect('evt-1', { onSync: onSyncMock });
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();

      mockWs.simulateMessage({
        type: 'activities_synced',
        schedule: [{ id: 's1', activityName: 'Varmala' }],
      });

      expect(onSyncMock).toHaveBeenCalledWith(expect.objectContaining({
        schedule: [{ id: 's1', activityName: 'Varmala' }],
      }));
    });

    it('dispatches generic message to onMessage callback', () => {
      const onMsgMock = vi.fn();
      runSheetWsService.connect('evt-1', { onMessage: onMsgMock });
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();

      mockWs.simulateMessage({ type: 'pong' });
      expect(onMsgMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'pong' }));
    });

    it('sends reportDelay, updateStatus, launchRunSheet, syncActivities, and ping payloads', () => {
      runSheetWsService.connect('evt-1');
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();

      const delaySent = runSheetWsService.reportDelay('act-1', 15);
      expect(delaySent).toBe(true);

      const statusSent = runSheetWsService.updateStatus('act-1', 'completed');
      expect(statusSent).toBe(true);

      const launchSent = runSheetWsService.launchRunSheet(true, 'rs-test');
      expect(launchSent).toBe(true);

      const syncSent = runSheetWsService.syncActivities([{ id: 'a1', activityName: 'Ritual' }] as any);
      expect(syncSent).toBe(true);

      const pingSent = runSheetWsService.ping();
      expect(pingSent).toBe(true);

      expect(mockWs.sentMessages.length).toBe(5);
      expect(mockWs.sentMessages[0]).toContain('report_delay');
      expect(mockWs.sentMessages[1]).toContain('update_status');
      expect(mockWs.sentMessages[2]).toContain('launch_runsheet');
      expect(mockWs.sentMessages[3]).toContain('sync_activities');
      expect(mockWs.sentMessages[4]).toContain('ping');
    });

    it('returns false when send is called on closed or non-existent socket', () => {
      runSheetWsService.disconnect();
      expect(runSheetWsService.reportDelay('a', 5)).toBe(false);
      expect(runSheetWsService.send({ type: 'test' })).toBe(false);
    });

    it('handles socket error and sets connectionError', () => {
      runSheetWsService.connect('evt-1');
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateError(new Error('Network error'));

      expect(runSheetWsService.connectionError.value).toBe('WebSocket connection error');
      expect(runSheetWsService.isConnected.value).toBe(false);
    });

    it('handles unexpected close and attempts reconnection after delay', () => {
      const onDisconnectMock = vi.fn();
      runSheetWsService.connect('evt-1', { onDisconnect: onDisconnectMock });
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();

      // Unexpected close (e.g. server restart)
      mockWs.simulateClose();

      expect(runSheetWsService.isConnected.value).toBe(false);
      expect(onDisconnectMock).toHaveBeenCalled();

      // Advance timers to trigger reconnect
      vi.advanceTimersByTime(3500);

      // A second WebSocket instance is created for reconnect
      expect(MockWebSocket.instances.length).toBe(2);
    });

    it('disconnect stops active socket and cancels reconnection', () => {
      runSheetWsService.connect('evt-1');
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();

      runSheetWsService.disconnect();
      expect(runSheetWsService.isConnected.value).toBe(false);
      expect(runSheetWsService.activeRoomId.value).toBeNull();

      vi.advanceTimersByTime(5000);
      expect(MockWebSocket.instances.length).toBe(1); // No new instance created
    });
  });
});

