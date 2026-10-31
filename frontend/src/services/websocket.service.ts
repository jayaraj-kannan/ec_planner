import { ref } from 'vue';
import type { ScheduleActivity } from '../types/event';

export interface RunSheetWsCallbacks {
  onDelay?: (data: { activity_id: string; delay_minutes: number; timestamp?: string }) => void;
  onStatus?: (data: { activity_id: string; status: string; timestamp?: string }) => void;
  onLaunch?: (data: { is_launched: boolean; hash_code?: string; timestamp?: string }) => void;
  onSync?: (data: { schedule: ScheduleActivity[]; timestamp?: string }) => void;
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function getRunSheetWebSocketUrl(roomId: string): string {
  if (typeof window === 'undefined') {
    return `ws://localhost:8000/ws/runsheet/${encodeURIComponent(roomId)}`;
  }
  const envUrl = (import.meta as any).env?.VITE_WS_URL;
  if (envUrl) {
    const cleanEnv = envUrl.replace(/\/+$/, '');
    return `${cleanEnv}/ws/runsheet/${encodeURIComponent(roomId)}`;
  }
  const isHttps = window.location.protocol === 'https:';
  const protocol = isHttps ? 'wss:' : 'ws:';
  const isLocalDev =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  const host = isLocalDev ? `${window.location.hostname}:8000` : window.location.host;
  return `${protocol}//${host}/ws/runsheet/${encodeURIComponent(roomId)}`;
}

class RunSheetWebSocketService {
  private socket: WebSocket | null = null;
  private callbacks: RunSheetWsCallbacks | null = null;
  private reconnectTimer: any = null;
  private explicitClose = false;

  public isConnected = ref(false);
  public isConnecting = ref(false);
  public connectionError = ref<string | null>(null);
  public activeRoomId = ref<string | null>(null);
  public lastMessage = ref<any>(null);
  public activeWatchers = ref<number>(1);

  /**
   * Connects to the WebSocket room for a given eventId or runSheetHashCode.
   */
  public connect(roomId: string, callbacks?: RunSheetWsCallbacks): WebSocket | null {
    if (!roomId) return null;

    // If already connected to the same room, simply update callbacks and return
    if (this.socket && this.activeRoomId.value === roomId && this.isConnected.value) {
      if (callbacks) this.callbacks = callbacks;
      return this.socket;
    }

    // Clean up previous connection if switching rooms
    this.disconnect();
    this.explicitClose = false;
    this.activeRoomId.value = roomId;
    this.callbacks = callbacks || null;
    this.isConnecting.value = true;
    this.connectionError.value = null;

    if (typeof WebSocket === 'undefined') {
      console.warn('WebSocket API not supported in this runtime environment.');
      this.isConnecting.value = false;
      return null;
    }

    try {
      const url = getRunSheetWebSocketUrl(roomId);
      const ws = new WebSocket(url);
      this.socket = ws;

      ws.onopen = () => {
        this.isConnected.value = true;
        this.isConnecting.value = false;
        this.connectionError.value = null;
        if (this.callbacks?.onConnect) {
          this.callbacks.onConnect();
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          this.lastMessage.value = data;

          if (data.type === 'connected') {
            if (data.active_watchers !== undefined) {
              this.activeWatchers.value = data.active_watchers;
            }
          } else if (data.type === 'delay_reported' && this.callbacks?.onDelay) {
            this.callbacks.onDelay(data);
          } else if (data.type === 'status_updated' && this.callbacks?.onStatus) {
            this.callbacks.onStatus(data);
          } else if (data.type === 'runsheet_launched' && this.callbacks?.onLaunch) {
            this.callbacks.onLaunch(data);
          } else if (data.type === 'activities_synced' && this.callbacks?.onSync) {
            this.callbacks.onSync(data);
          }

          if (this.callbacks?.onMessage) {
            this.callbacks.onMessage(data);
          }
        } catch (err) {
          console.warn('Error parsing incoming WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error notice:', err);
        this.connectionError.value = 'WebSocket connection error';
        this.isConnected.value = false;
        this.isConnecting.value = false;
      };

      ws.onclose = () => {
        this.isConnected.value = false;
        this.isConnecting.value = false;
        if (this.callbacks?.onDisconnect) {
          this.callbacks.onDisconnect();
        }

        // Automatic reconnection attempt if not explicitly closed
        if (!this.explicitClose && this.activeRoomId.value === roomId) {
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            if (!this.explicitClose && this.activeRoomId.value === roomId) {
              this.connect(roomId, this.callbacks || undefined);
            }
          }, 3000);
        }
      };

      return ws;
    } catch (err: any) {
      console.warn('Failed to initialize WebSocket client:', err);
      this.isConnecting.value = false;
      this.connectionError.value = err?.message || 'WebSocket init failed';
      return null;
    }
  }

  /**
   * Closes active WebSocket connection cleanly.
   */
  public disconnect() {
    this.explicitClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.isConnected.value = false;
    this.isConnecting.value = false;
    this.activeRoomId.value = null;
  }

  /**
   * Sends raw JSON payload across active WebSocket.
   */
  public send(payload: any): boolean {
    if (!this.socket || this.socket.readyState !== (WebSocket as any).OPEN) {
      return false;
    }
    try {
      this.socket.send(JSON.stringify(payload));
      return true;
    } catch (err) {
      console.warn('Failed to send WebSocket payload:', err);
      return false;
    }
  }

  public reportDelay(activityId: string, delayMinutes: number): boolean {
    return this.send({
      type: 'report_delay',
      activity_id: activityId,
      delay_minutes: delayMinutes,
    });
  }

  public updateStatus(activityId: string, status: ScheduleActivity['status']): boolean {
    return this.send({
      type: 'update_status',
      activity_id: activityId,
      status,
    });
  }

  public launchRunSheet(isLaunched: boolean, hashCode?: string): boolean {
    return this.send({
      type: 'launch_runsheet',
      is_launched: isLaunched,
      hash_code: hashCode,
    });
  }

  public syncActivities(schedule: ScheduleActivity[]): boolean {
    return this.send({
      type: 'sync_activities',
      schedule,
    });
  }

  public ping(): boolean {
    return this.send({
      type: 'ping',
    });
  }
}

export const runSheetWsService = new RunSheetWebSocketService();

