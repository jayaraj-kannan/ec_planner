import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/firestore', () => {
  const mockBatch = {
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };
  return {
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn((_db, ...parts) => ({ path: parts.join('/') })),
    setDoc: vi.fn().mockResolvedValue(undefined),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    collection: vi.fn((_db, ...parts) => ({ path: parts.join('/') })),
    query: vi.fn(() => ({})),
    where: vi.fn(() => ({})),
    getDocs: vi.fn().mockResolvedValue({
      forEach: (cb: any) => {
        cb({ data: () => ({ id: 'evt-10', title: 'Fetched Event' }) });
      },
    }),
    onSnapshot: vi.fn((_ref, cb) => {
      cb({
        forEach: (docCb: any) => {
          docCb({ data: () => ({ id: 'item-1', name: 'Item 1' }) });
        },
      });
      return vi.fn(); // unsubscribe mock
    }),
    writeBatch: vi.fn(() => mockBatch),
    serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
  };
});

import {
  cleanDocData,
  saveEventDoc,
  deleteEventDoc,
  fetchUserEvents,
  fetchEventSubcollections,
  saveTaskDoc,
  deleteTaskDoc,
  saveExpenseDoc,
  deleteExpenseDoc,
  saveGuestDoc,
  deleteGuestDoc,
  saveVendorDoc,
  saveScheduleDoc,
  saveArrangementDoc,
  saveCategoryDoc,
  seedCompleteEventToFirestore,
  subscribeToEventSubcollections,
} from '../firestore.service';

describe('firestore.service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cleanDocData', () => {
    it('removes undefined fields while preserving null, 0, false, and empty string', () => {
      const input = {
        title: 'Gala',
        notes: undefined,
        count: 0,
        active: false,
        extra: null,
        empty: '',
      };
      const cleaned = cleanDocData(input);
      expect(cleaned).toEqual({
        title: 'Gala',
        count: 0,
        active: false,
        extra: null,
        empty: '',
      });
      expect('notes' in cleaned).toBe(false);
    });
  });

  describe('Events CRUD Operations', () => {
    it('saves event doc with sanitized data and server timestamp', async () => {
      const event: any = { id: 'evt-1', title: 'Grand Gala', notes: undefined };
      await saveEventDoc(event, 'user-123');

      expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'events', 'evt-1');
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: 'evt-1',
          title: 'Grand Gala',
          ownerId: 'user-123',
        }),
        { merge: true }
      );
    });

    it('catches and logs errors gracefully when saveEventDoc fails', async () => {
      vi.mocked(firestore.setDoc).mockRejectedValueOnce(new Error('Quota exceeded'));
      await expect(saveEventDoc({ id: 'evt-1' } as any)).resolves.not.toThrow();
    });

    it('deletes event doc by eventId', async () => {
      await deleteEventDoc('evt-99');
      expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'events', 'evt-99');
      expect(firestore.deleteDoc).toHaveBeenCalled();
    });

    it('catches and logs errors gracefully when deleteEventDoc fails', async () => {
      vi.mocked(firestore.deleteDoc).mockRejectedValueOnce(new Error('Network error'));
      await expect(deleteEventDoc('evt-99')).resolves.not.toThrow();
    });

    it('fetches user events matching ownerId query', async () => {
      const events = await fetchUserEvents('user-123');
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('evt-10');
    });

    it('returns empty array when fetchUserEvents fails', async () => {
      vi.mocked(firestore.getDocs).mockRejectedValueOnce(new Error('Offline'));
      const events = await fetchUserEvents('user-123');
      expect(events).toEqual([]);
    });

    it('fetches event subcollections for all subcollections', async () => {
      const result = await fetchEventSubcollections('evt-1');
      expect(result).toBeDefined();
      expect(result?.categories).toBeDefined();
      expect(result?.tasks).toBeDefined();
      expect(result?.expenses).toBeDefined();
      expect(result?.guests).toBeDefined();
      expect(result?.vendors).toBeDefined();
      expect(result?.schedule).toBeDefined();
      expect(result?.arrangements).toBeDefined();
      expect(result?.documents).toBeDefined();
    });

    it('returns null and catches gracefully when fetchEventSubcollections fails', async () => {
      vi.mocked(firestore.getDocs).mockRejectedValueOnce(new Error('Subcollection fail'));
      const result = await fetchEventSubcollections('evt-1');
      expect(result).toBeNull();
    });
  });

  describe('Subcollections CRUD Operations', () => {
    it('saves and deletes task docs', async () => {
      const task: any = { id: 'tsk-1', eventId: 'evt-1', title: 'Book DJ' };
      await saveTaskDoc(task);
      expect(firestore.setDoc).toHaveBeenCalled();

      await deleteTaskDoc('evt-1', 'tsk-1');
      expect(firestore.deleteDoc).toHaveBeenCalled();

      // Error branches
      vi.mocked(firestore.setDoc).mockRejectedValueOnce(new Error('err'));
      await expect(saveTaskDoc(task)).resolves.not.toThrow();

      vi.mocked(firestore.deleteDoc).mockRejectedValueOnce(new Error('err'));
      await expect(deleteTaskDoc('evt-1', 'tsk-1')).resolves.not.toThrow();
    });

    it('saves and deletes expense docs', async () => {
      const expense: any = { id: 'exp-1', eventId: 'evt-1', title: 'Catering', amount: 500 };
      await saveExpenseDoc(expense);
      expect(firestore.setDoc).toHaveBeenCalled();

      await deleteExpenseDoc('evt-1', 'exp-1');
      expect(firestore.deleteDoc).toHaveBeenCalled();

      // Error branches
      vi.mocked(firestore.setDoc).mockRejectedValueOnce(new Error('err'));
      await expect(saveExpenseDoc(expense)).resolves.not.toThrow();

      vi.mocked(firestore.deleteDoc).mockRejectedValueOnce(new Error('err'));
      await expect(deleteExpenseDoc('evt-1', 'exp-1')).resolves.not.toThrow();
    });

    it('saves and deletes guest docs', async () => {
      const guest: any = { id: 'gst-1', eventId: 'evt-1', name: 'John Doe' };
      await saveGuestDoc(guest);
      expect(firestore.setDoc).toHaveBeenCalled();

      await deleteGuestDoc('evt-1', 'gst-1');
      expect(firestore.deleteDoc).toHaveBeenCalled();

      // Error branches
      vi.mocked(firestore.setDoc).mockRejectedValueOnce(new Error('err'));
      await expect(saveGuestDoc(guest)).resolves.not.toThrow();

      vi.mocked(firestore.deleteDoc).mockRejectedValueOnce(new Error('err'));
      await expect(deleteGuestDoc('evt-1', 'gst-1')).resolves.not.toThrow();
    });

    it('saves vendor doc and handles errors', async () => {
      const vendor: any = { id: 'vnd-1', eventId: 'evt-1', name: 'Elite Sounds' };
      await saveVendorDoc(vendor);
      expect(firestore.setDoc).toHaveBeenCalled();

      vi.mocked(firestore.setDoc).mockRejectedValueOnce(new Error('err'));
      await expect(saveVendorDoc(vendor)).resolves.not.toThrow();
    });

    it('saves schedule activity doc and handles errors', async () => {
      const activity: any = { id: 'act-1', eventId: 'evt-1', title: 'Welcome Speech' };
      await saveScheduleDoc(activity);
      expect(firestore.setDoc).toHaveBeenCalled();

      vi.mocked(firestore.setDoc).mockRejectedValueOnce(new Error('err'));
      await expect(saveScheduleDoc(activity)).resolves.not.toThrow();
    });

    it('saves arrangement doc and handles errors', async () => {
      const arr: any = { id: 'arr-1', eventId: 'evt-1', title: 'Main Hall Lighting' };
      await saveArrangementDoc(arr);
      expect(firestore.setDoc).toHaveBeenCalled();

      vi.mocked(firestore.setDoc).mockRejectedValueOnce(new Error('err'));
      await expect(saveArrangementDoc(arr)).resolves.not.toThrow();
    });

    it('saves category doc and handles errors', async () => {
      const cat: any = { id: 'cat-1', eventId: 'evt-1', name: 'Catering' };
      await saveCategoryDoc(cat);
      expect(firestore.setDoc).toHaveBeenCalled();

      vi.mocked(firestore.setDoc).mockRejectedValueOnce(new Error('err'));
      await expect(saveCategoryDoc(cat)).resolves.not.toThrow();
    });
  });

  describe('seedCompleteEventToFirestore', () => {
    it('executes batch write with event and all subcollections', async () => {
      const event: any = { id: 'evt-1', title: 'Wedding' };
      const categories: any[] = [{ id: 'cat-1', eventId: 'evt-1' }];
      const tasks: any[] = [{ id: 'tsk-1', eventId: 'evt-1' }];
      const expenses: any[] = [{ id: 'exp-1', eventId: 'evt-1' }];
      const guests: any[] = [{ id: 'gst-1', eventId: 'evt-1' }];
      const vendors: any[] = [{ id: 'vnd-1', eventId: 'evt-1' }];
      const schedule: any[] = [{ id: 'sch-1', eventId: 'evt-1' }];
      const arrangements: any[] = [{ id: 'arr-1', eventId: 'evt-1' }];
      const documents: any[] = [{ id: 'doc-1', eventId: 'evt-1' }];

      const result = await seedCompleteEventToFirestore(
        event,
        categories,
        tasks,
        expenses,
        guests,
        vendors,
        schedule,
        arrangements,
        documents,
        'user-abc'
      );

      expect(result).toBe(true);
      expect(firestore.writeBatch).toHaveBeenCalled();
    });

    it('catches batch commit error and returns false', async () => {
      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockRejectedValueOnce(new Error('Batch failed')),
      };
      vi.mocked(firestore.writeBatch).mockReturnValueOnce(mockBatch as any);

      const result = await seedCompleteEventToFirestore(
        { id: 'evt-1' } as any,
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
      );
      expect(result).toBe(false);
    });
  });

  describe('subscribeToEventSubcollections', () => {
    it('subscribes to all active subcollections and returns unsubscribe callback', () => {
      const onTasks = vi.fn();
      const onExpenses = vi.fn();
      const onGuests = vi.fn();
      const onVendors = vi.fn();
      const onSchedule = vi.fn();
      const onArrangements = vi.fn();

      const unsub = subscribeToEventSubcollections('evt-1', {
        onTasks,
        onExpenses,
        onGuests,
        onVendors,
        onSchedule,
        onArrangements,
      });

      expect(firestore.onSnapshot).toHaveBeenCalledTimes(6);
      expect(typeof unsub).toBe('function');
      unsub();
    });
  });
});
