import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  EventItem,
  CategoryItem,
  TaskItem,
  ExpenseItem,
  GuestItem,
  VendorItem,
  ScheduleActivity,
  ArrangementItem,
  DocumentItem,
  NotificationItem,
} from '../types/event';

/**
 * PlanCraft Firestore Data Model (Hierarchical Document & Subcollection Architecture):
 *
 * users/{userId}
 * events/{eventId}
 *   ├── categories/{categoryId}
 *   ├── tasks/{taskId}
 *   ├── expenses/{expenseId}
 *   ├── guests/{guestId}
 *   ├── vendors/{vendorId}
 *   ├── schedule/{activityId}
 *   ├── arrangements/{arrangementId}
 *   ├── documents/{documentId}
 *   └── notifications/{notificationId}
 */

/**
 * Strips undefined properties from objects to satisfy Firestore SDK constraints
 */
export function cleanDocData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

// 1. Events Collection Operations
export async function saveEventDoc(event: EventItem, userId?: string): Promise<void> {
  try {
    const eventRef = doc(db, 'events', event.id);
    await setDoc(
      eventRef,
      cleanDocData({
        ...event,
        ownerId: userId || event.ownerId || 'anonymous',
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore saveEventDoc notice (offline or local fallback):', err);
  }
}

export async function deleteEventDoc(eventId: string): Promise<void> {
  try {
    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
  } catch (err) {
    console.warn('Firestore deleteEventDoc notice:', err);
  }
}

export async function fetchUserEvents(userId: string): Promise<EventItem[]> {
  try {
    const q = query(collection(db, 'events'), where('ownerId', '==', userId));
    const snapshot = await getDocs(q);
    const list: EventItem[] = [];
    if (snapshot && typeof snapshot.forEach === 'function') {
      snapshot.forEach((d) => {
        list.push(d.data() as EventItem);
      });
    }
    return list;
  } catch (err) {
    console.warn('Firestore fetchUserEvents fallback:', err);
    return [];
  }
}

export interface EventSubcollectionsData {
  categories: CategoryItem[];
  tasks: TaskItem[];
  expenses: ExpenseItem[];
  guests: GuestItem[];
  vendors: VendorItem[];
  schedule: ScheduleActivity[];
  arrangements: ArrangementItem[];
  documents: DocumentItem[];
}

export async function fetchEventSubcollections(eventId: string): Promise<EventSubcollectionsData | null> {
  try {
    const [catsSnap, tasksSnap, expsSnap, guestsSnap, vendorsSnap, scheduleSnap, arrsSnap, docsSnap] = await Promise.all([
      getDocs(collection(db, 'events', eventId, 'categories')),
      getDocs(collection(db, 'events', eventId, 'tasks')),
      getDocs(collection(db, 'events', eventId, 'expenses')),
      getDocs(collection(db, 'events', eventId, 'guests')),
      getDocs(collection(db, 'events', eventId, 'vendors')),
      getDocs(collection(db, 'events', eventId, 'schedule')),
      getDocs(collection(db, 'events', eventId, 'arrangements')),
      getDocs(collection(db, 'events', eventId, 'documents')),
    ]);

    const categories: CategoryItem[] = [];
    if (catsSnap && typeof catsSnap.forEach === 'function') {
      catsSnap.forEach((d) => categories.push(d.data() as CategoryItem));
    }

    const tasks: TaskItem[] = [];
    if (tasksSnap && typeof tasksSnap.forEach === 'function') {
      tasksSnap.forEach((d) => tasks.push(d.data() as TaskItem));
    }

    const expenses: ExpenseItem[] = [];
    if (expsSnap && typeof expsSnap.forEach === 'function') {
      expsSnap.forEach((d) => expenses.push(d.data() as ExpenseItem));
    }

    const guests: GuestItem[] = [];
    if (guestsSnap && typeof guestsSnap.forEach === 'function') {
      guestsSnap.forEach((d) => guests.push(d.data() as GuestItem));
    }

    const vendors: VendorItem[] = [];
    if (vendorsSnap && typeof vendorsSnap.forEach === 'function') {
      vendorsSnap.forEach((d) => vendors.push(d.data() as VendorItem));
    }

    const schedule: ScheduleActivity[] = [];
    if (scheduleSnap && typeof scheduleSnap.forEach === 'function') {
      scheduleSnap.forEach((d) => schedule.push(d.data() as ScheduleActivity));
    }

    const arrangements: ArrangementItem[] = [];
    if (arrsSnap && typeof arrsSnap.forEach === 'function') {
      arrsSnap.forEach((d) => arrangements.push(d.data() as ArrangementItem));
    }

    const documents: DocumentItem[] = [];
    if (docsSnap && typeof docsSnap.forEach === 'function') {
      docsSnap.forEach((d) => documents.push(d.data() as DocumentItem));
    }

    return {
      categories,
      tasks,
      expenses,
      guests,
      vendors,
      schedule,
      arrangements,
      documents,
    };
  } catch (err) {
    console.warn('Firestore fetchEventSubcollections fallback:', err);
    return null;
  }
}

// 2. Subcollection: Tasks
export async function saveTaskDoc(task: TaskItem): Promise<void> {
  try {
    const taskRef = doc(db, 'events', task.eventId, 'tasks', task.id);
    await setDoc(taskRef, cleanDocData({ ...task, updatedAt: serverTimestamp() }), { merge: true });
  } catch (err) {
    console.warn('Firestore saveTaskDoc notice:', err);
  }
}

export async function deleteTaskDoc(eventId: string, taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'events', eventId, 'tasks', taskId));
  } catch (err) {
    console.warn('Firestore deleteTaskDoc notice:', err);
  }
}

// 3. Subcollection: Expenses
export async function saveExpenseDoc(expense: ExpenseItem): Promise<void> {
  try {
    const ref = doc(db, 'events', expense.eventId, 'expenses', expense.id);
    await setDoc(ref, cleanDocData({ ...expense, updatedAt: serverTimestamp() }), { merge: true });
  } catch (err) {
    console.warn('Firestore saveExpenseDoc notice:', err);
  }
}

export async function deleteExpenseDoc(eventId: string, expenseId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'events', eventId, 'expenses', expenseId));
  } catch (err) {
    console.warn('Firestore deleteExpenseDoc notice:', err);
  }
}

// 4. Subcollection: Guests
export async function saveGuestDoc(guest: GuestItem): Promise<void> {
  try {
    const ref = doc(db, 'events', guest.eventId, 'guests', guest.id);
    await setDoc(ref, cleanDocData({ ...guest, updatedAt: serverTimestamp() }), { merge: true });
  } catch (err) {
    console.warn('Firestore saveGuestDoc notice:', err);
  }
}

export async function deleteGuestDoc(eventId: string, guestId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'events', eventId, 'guests', guestId));
  } catch (err) {
    console.warn('Firestore deleteGuestDoc notice:', err);
  }
}

// 5. Subcollection: Vendors
export async function saveVendorDoc(vendor: VendorItem): Promise<void> {
  try {
    const ref = doc(db, 'events', vendor.eventId, 'vendors', vendor.id);
    await setDoc(ref, cleanDocData({ ...vendor, updatedAt: serverTimestamp() }), { merge: true });
  } catch (err) {
    console.warn('Firestore saveVendorDoc notice:', err);
  }
}

// 6. Subcollection: Schedule
export async function saveScheduleDoc(activity: ScheduleActivity): Promise<void> {
  try {
    const ref = doc(db, 'events', activity.eventId, 'schedule', activity.id);
    await setDoc(ref, cleanDocData({ ...activity, updatedAt: serverTimestamp() }), { merge: true });
  } catch (err) {
    console.warn('Firestore saveScheduleDoc notice:', err);
  }
}

// 7. Subcollection: Arrangements
export async function saveArrangementDoc(arrangement: ArrangementItem): Promise<void> {
  try {
    const ref = doc(db, 'events', arrangement.eventId, 'arrangements', arrangement.id);
    await setDoc(ref, cleanDocData({ ...arrangement, updatedAt: serverTimestamp() }), { merge: true });
  } catch (err) {
    console.warn('Firestore saveArrangementDoc notice:', err);
  }
}

// 8. Subcollection: Categories
export async function saveCategoryDoc(category: CategoryItem): Promise<void> {
  try {
    const ref = doc(db, 'events', category.eventId, 'categories', category.id);
    await setDoc(ref, cleanDocData({ ...category, updatedAt: serverTimestamp() }), { merge: true });
  } catch (err) {
    console.warn('Firestore saveCategoryDoc notice:', err);
  }
}

// 9. Batch Seeding Entire Event Data Hierarchy into Firestore
export async function seedCompleteEventToFirestore(
  event: EventItem,
  categories: CategoryItem[],
  tasks: TaskItem[],
  expenses: ExpenseItem[],
  guests: GuestItem[],
  vendors: VendorItem[],
  schedule: ScheduleActivity[],
  arrangements: ArrangementItem[],
  documents: DocumentItem[],
  userId?: string
): Promise<boolean> {
  try {
    const batch = writeBatch(db);

    // Main Event document
    const eventRef = doc(db, 'events', event.id);
    batch.set(
      eventRef,
      cleanDocData({
        ...event,
        ownerId: userId || event.ownerId || 'host',
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );

    // Subcollections
    categories.forEach((cat) => {
      const ref = doc(db, 'events', event.id, 'categories', cat.id);
      batch.set(ref, cleanDocData(cat), { merge: true });
    });

    tasks.forEach((tsk) => {
      const ref = doc(db, 'events', event.id, 'tasks', tsk.id);
      batch.set(ref, cleanDocData(tsk), { merge: true });
    });

    expenses.forEach((exp) => {
      const ref = doc(db, 'events', event.id, 'expenses', exp.id);
      batch.set(ref, cleanDocData(exp), { merge: true });
    });

    guests.forEach((gst) => {
      const ref = doc(db, 'events', event.id, 'guests', gst.id);
      batch.set(ref, cleanDocData(gst), { merge: true });
    });

    vendors.forEach((vnd) => {
      const ref = doc(db, 'events', event.id, 'vendors', vnd.id);
      batch.set(ref, cleanDocData(vnd), { merge: true });
    });

    schedule.forEach((sch) => {
      const ref = doc(db, 'events', event.id, 'schedule', sch.id);
      batch.set(ref, cleanDocData(sch), { merge: true });
    });

    arrangements.forEach((arr) => {
      const ref = doc(db, 'events', event.id, 'arrangements', arr.id);
      batch.set(ref, cleanDocData(arr), { merge: true });
    });

    documents.forEach((docItem) => {
      const ref = doc(db, 'events', event.id, 'documents', docItem.id);
      batch.set(ref, cleanDocData(docItem), { merge: true });
    });

    await batch.commit();
    return true;
  } catch (err) {
    console.warn('Batch seed to Firestore warning:', err);
    return false;
  }
}

// 10. Realtime Event Listener
export function subscribeToEventSubcollections(
  eventId: string,
  callbacks: {
    onTasks?: (tasks: TaskItem[]) => void;
    onExpenses?: (expenses: ExpenseItem[]) => void;
    onGuests?: (guests: GuestItem[]) => void;
    onVendors?: (vendors: VendorItem[]) => void;
    onSchedule?: (schedule: ScheduleActivity[]) => void;
    onArrangements?: (arrangements: ArrangementItem[]) => void;
  }
): Unsubscribe {
  const unsubs: Unsubscribe[] = [];

  try {
    if (callbacks.onTasks) {
      unsubs.push(
        onSnapshot(collection(db, 'events', eventId, 'tasks'), (snap) => {
          const items: TaskItem[] = [];
          snap.forEach((d) => items.push(d.data() as TaskItem));
          callbacks.onTasks!(items);
        })
      );
    }
    if (callbacks.onExpenses) {
      unsubs.push(
        onSnapshot(collection(db, 'events', eventId, 'expenses'), (snap) => {
          const items: ExpenseItem[] = [];
          snap.forEach((d) => items.push(d.data() as ExpenseItem));
          callbacks.onExpenses!(items);
        })
      );
    }
    if (callbacks.onGuests) {
      unsubs.push(
        onSnapshot(collection(db, 'events', eventId, 'guests'), (snap) => {
          const items: GuestItem[] = [];
          snap.forEach((d) => items.push(d.data() as GuestItem));
          callbacks.onGuests!(items);
        })
      );
    }
    if (callbacks.onVendors) {
      unsubs.push(
        onSnapshot(collection(db, 'events', eventId, 'vendors'), (snap) => {
          const items: VendorItem[] = [];
          snap.forEach((d) => items.push(d.data() as VendorItem));
          callbacks.onVendors!(items);
        })
      );
    }
    if (callbacks.onSchedule) {
      unsubs.push(
        onSnapshot(collection(db, 'events', eventId, 'schedule'), (snap) => {
          const items: ScheduleActivity[] = [];
          snap.forEach((d) => items.push(d.data() as ScheduleActivity));
          callbacks.onSchedule!(items);
        })
      );
    }
    if (callbacks.onArrangements) {
      unsubs.push(
        onSnapshot(collection(db, 'events', eventId, 'arrangements'), (snap) => {
          const items: ArrangementItem[] = [];
          snap.forEach((d) => items.push(d.data() as ArrangementItem));
          callbacks.onArrangements!(items);
        })
      );
    }
  } catch (err) {
    console.warn('Firestore subscription fallback:', err);
  }

  return () => {
    unsubs.forEach((u) => {
      try {
        u();
      } catch {
        // ignore
      }
    });
  };
}
