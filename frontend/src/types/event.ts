export type EventType =
  | 'wedding'
  | 'reception'
  | 'birthday'
  | 'anniversary'
  | 'engagement'
  | 'baby_shower'
  | 'corporate'
  | 'festival'
  | 'custom';

export type EventStatus = 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'archived';

export interface EventItem {
  id: string;
  name: string;
  eventType: EventType;
  ownerId: string;
  startDate: string; // ISO string YYYY-MM-DD or datetime
  endDate?: string;
  timeZone: string;
  venueName: string;
  venueAddress: string;
  expectedGuestCount: number;
  currency: string;
  plannedBudgetMinor: number; // in minor units e.g. paise for INR
  status: EventStatus;
  theme?: string;
  dressCode?: string;
  specialInstructions?: string;
  createdAt: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface ChecklistTask {
  id: string;
  eventId: string;
  taskName: string;
  category: string;
  assignedTo: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: string;
  notes?: string;
}
export type TaskItem = ChecklistTask;

export interface BudgetCategory {
  id: string;
  eventId: string;
  name: string;
  allocatedAmountMinor: number;
  notes?: string;
}
export type CategoryItem = BudgetCategory;

export type PaymentStatus = 'paid' | 'pending' | 'partial' | 'cancelled';

export interface ExpenseItem {
  id: string;
  eventId: string;
  categoryId: string;
  vendorId?: string;
  vendorName: string;
  description: string;
  amountMinor: number;
  taxAmountMinor: number;
  currency: string;
  invoiceNumber?: string;
  paymentMethod: 'UPI' | 'Credit Card' | 'Bank Transfer' | 'Cash' | 'Cheque';
  paymentStatus: PaymentStatus;
  paidAmountMinor: number;
  expenseDate: string;
  receiptName?: string;
}

export type RSVPStatus = 'confirmed' | 'pending' | 'declined';
export type MealPreference = 'Veg' | 'Non-Veg' | 'Jain' | 'Vegan';

export interface GuestItem {
  id: string;
  eventId: string;
  guestName: string;
  familyName?: string;
  category: 'Bride Family' | 'Groom Family' | 'Friends' | 'Colleagues' | 'VIP' | 'Family';
  mobileNumber: string;
  email?: string;
  partySize: number;
  rsvpStatus: RSVPStatus;
  mealPreference: MealPreference;
  accommodationRequired: boolean;
  notes?: string;
}

export type VendorStatus = 'Contract Signed' | 'Quoted' | 'In Discussion' | 'Completed';

export interface VendorItem {
  id: string;
  eventId: string;
  name: string;
  category: string;
  contactPerson: string;
  mobileNumber: string;
  email: string;
  agreedPriceMinor: number;
  advancePaidMinor: number;
  status: VendorStatus;
  rating?: number;
  notes?: string;
}

export type ScheduleStatus = 'upcoming' | 'in_progress' | 'completed' | 'delayed';

export interface ScheduleActivity {
  id: string;
  eventId: string;
  activityName: string;
  scheduleDate: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  location: string;
  responsiblePerson: string;
  backupContact: string;
  phone: string;
  status: ScheduleStatus;
  delayMinutes: number;
  notes?: string;
}

export interface ArrangementItem {
  id: string;
  eventId: string;
  item: string;
  category: string;
  owner: string;
  vendorName: string;
  dueTime: string;
  status: 'ready' | 'in_progress' | 'pending';
  priority: TaskPriority;
  notes?: string;
}

export interface DocumentItem {
  id: string;
  eventId: string;
  title: string;
  category: 'Contract' | 'Invoice' | 'Receipt' | 'Floorplan' | 'Design' | 'Invite';
  fileSize: string;
  uploadDate: string;
  fileUrl: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'reminder' | 'success';
  timestamp: string;
  read: boolean;
}
