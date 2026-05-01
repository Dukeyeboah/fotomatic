/** Mock data for photographer dashboard UI — replace with API later. */

export type MockPhotographerRequest = {
  id: string;
  clientName: string;
  clientImage: string;
  shootType: string;
  location: string;
  date: string;
  duration: string;
};

export type MockPhotographerUpcomingBooking = {
  id: string;
  clientName: string;
  shootType: string;
  dateTime: string;
  status: 'awaiting_payment' | 'confirmed' | 'paid';
  totalLabel?: string;
};

export type MockActivityItem = {
  id: string;
  message: string;
  timeLabel: string;
  icon: 'inbox' | 'calendar' | 'credit' | 'star' | 'message';
};

export const MOCK_PHOTOGRAPHER_STATS = {
  newRequests: 2,
  upcomingBookings: 5,
  earningsThisMonth: 1250,
  earningsDeltaPct: 12,
  rating: 4.9,
  reviewCount: 38,
  upcomingPayout: 600,
  completedBookingsTotal: 3400,
  lifetimeEarnings: 8750,
} as const;

export const MOCK_REQUESTS: MockPhotographerRequest[] = [
  {
    id: 'r1',
    clientName: 'Emily Thomas',
    clientImage: '/photographerImages/3.jpg',
    shootType: 'Graduation Shoot',
    location: 'Phoenix, AZ',
    date: 'Jun 14, 2026',
    duration: '2 hrs',
  },
  {
    id: 'r2',
    clientName: 'Jordan Williams',
    clientImage: '/photographerImages/7.jpg',
    shootType: 'Portrait Session',
    location: 'Scottsdale, AZ',
    date: 'Jun 18, 2026',
    duration: '1.5 hrs',
  },
];

export const MOCK_UPCOMING_BOOKINGS: MockPhotographerUpcomingBooking[] = [
  {
    id: 'b1',
    clientName: 'Michael Lee',
    shootType: 'Event coverage',
    dateTime: 'Sat, Jun 7 · 4:00 PM',
    status: 'awaiting_payment',
    totalLabel: '$285',
  },
  {
    id: 'b2',
    clientName: 'Sarah Johnson',
    shootType: 'Graduation Shoot',
    dateTime: 'Sun, Jun 8 · 10:00 AM',
    status: 'confirmed',
    totalLabel: '$320',
  },
  {
    id: 'b3',
    clientName: 'David Brown',
    shootType: 'Family portraits',
    dateTime: 'Wed, Jun 11 · 2:00 PM',
    status: 'paid',
    totalLabel: '$240',
  },
  {
    id: 'b4',
    clientName: 'Olivia Martinez',
    shootType: 'Engagement',
    dateTime: 'Fri, Jun 13 · 5:30 PM',
    status: 'confirmed',
    totalLabel: '$450',
  },
];

export const MOCK_ACTIVITY: MockActivityItem[] = [
  {
    id: 'a1',
    message: 'Emily Thomas requested a booking',
    timeLabel: '10m ago',
    icon: 'inbox',
  },
  {
    id: 'a2',
    message: 'Sarah Johnson accepted your suggested time',
    timeLabel: '1h ago',
    icon: 'calendar',
  },
  {
    id: 'a3',
    message: 'Payment is pending for Michael Lee',
    timeLabel: '3h ago',
    icon: 'credit',
  },
  {
    id: 'a4',
    message: 'New review received — 5 stars',
    timeLabel: 'Yesterday',
    icon: 'star',
  },
  {
    id: 'a5',
    message: 'Jordan Williams sent a message',
    timeLabel: 'Yesterday',
    icon: 'message',
  },
];

/** Normalized 0–1 points for a simple line chart (May). */
export const MOCK_EARNINGS_CHART_POINTS: number[] = [
  0.2, 0.35, 0.28, 0.45, 0.5, 0.62, 0.58, 0.72, 0.68, 0.85, 0.8, 0.92,
];

export const MOCK_SIDEBAR_BADGES = {
  requests: 2,
  messages: 1,
} as const;
