/**
 * Notification Service
 *
 * Manages browser push notifications for reminders and events.
 * Uses the Notification API and service worker for background delivery.
 */

import { Reminder, SharedEvent } from '../types/events';
import { storageService } from './storageService';

const MONDAY_NOTIF_KEY = 'ytt-monday-picks-notified';

class NotificationService {
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  /** Check if browser supports notifications */
  get isSupported(): boolean {
    return 'Notification' in window;
  }

  /** Current permission state */
  get permission(): NotificationPermission {
    if (!this.isSupported) return 'denied';
    return Notification.permission;
  }

  /** Request notification permission from user */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) return false;
    if (this.permission === 'granted') return true;
    if (this.permission === 'denied') return false;

    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  /** Send a browser notification */
  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (this.permission !== 'granted') return;

    // Try service worker first (works in background)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options,
      } as NotificationOptions);
      return;
    }

    // Fallback to direct notification
    new Notification(title, options);
  }

  /** Check reminders and send due notifications */
  checkReminders(
    reminders: Reminder[],
    onSent: (reminderId: string) => void,
  ): void {
    const now = new Date();

    reminders
      .filter((r) => !r.sent)
      .forEach((reminder) => {
        const triggerTime = new Date(reminder.triggerAt);
        if (now >= triggerTime) {
          this.sendNotification(reminder.title, {
            body: reminder.description,
            tag: `reminder-${reminder.id}`,
          });
          onSent(reminder.id);
        }
      });
  }

  /** Check event reminders and send due notifications */
  checkEventReminders(
    events: SharedEvent[],
    onEventReminderSent: (eventId: string, reminderId: string) => void,
  ): void {
    const now = new Date();

    events.forEach((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : null;

      event.reminders
        .filter((r) => !r.sent)
        .forEach((reminder) => {
          let triggerTime: Date;

          switch (reminder.type) {
            case 'week-before':
              triggerTime = new Date(eventStart.getTime() - reminder.offsetMinutes * 60 * 1000);
              break;
            case 'day-of':
              // Trigger at 9 AM on the day of the event
              triggerTime = new Date(eventStart);
              triggerTime.setHours(9, 0, 0, 0);
              break;
            case 'before-start':
              triggerTime = new Date(eventStart.getTime() - reminder.offsetMinutes * 60 * 1000);
              break;
            case 'before-end':
              if (!eventEnd) return;
              triggerTime = new Date(eventEnd.getTime() - reminder.offsetMinutes * 60 * 1000);
              break;
            default:
              return;
          }

          if (now >= triggerTime) {
            const typeLabel = {
              'week-before': '7 days before',
              'day-of': 'Today',
              'before-start': '1 hour before',
              'before-end': '2 hours before it ends',
            }[reminder.type];

            this.sendNotification(`${typeLabel}: ${event.name}`, {
              body: event.description || `${event.name} starts at ${eventStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              tag: `event-${event.id}-${reminder.id}`,
            });
            onEventReminderSent(event.id, reminder.id);
          }
        });
    });
  }

  /** Fire Monday morning "here are your picks for the week" notification */
  checkMondayPicksNotification(getPickNames: () => string[]): void {
    if (this.permission !== 'granted') return;

    const now = new Date();
    const isMonday = now.getDay() === 1;
    const isMorning = now.getHours() >= 8 && now.getHours() < 11;
    if (!isMonday || !isMorning) return;

    // Only fire once per Monday
    const lastFired = storageService.get<string>(MONDAY_NOTIF_KEY);
    if (lastFired) {
      const lastDate = new Date(lastFired);
      if (
        lastDate.getFullYear() === now.getFullYear() &&
        lastDate.getMonth() === now.getMonth() &&
        lastDate.getDate() === now.getDate()
      ) {
        return;
      }
    }

    const picks = getPickNames();
    if (picks.length === 0) return;

    const body =
      picks.length === 1
        ? `Try ${picks[0]} this week!`
        : `How about ${picks.slice(0, 3).join(', ')}${picks.length > 3 ? '…' : ''}?`;

    this.sendNotification('🍽️ Where should you eat this week?', { body, tag: 'weekly-picks' });
    storageService.set(MONDAY_NOTIF_KEY, now.toISOString());
  }

  /** Start periodic reminder checking (every 60 seconds) */
  startChecking(
    getReminders: () => Reminder[],
    getEvents: () => SharedEvent[],
    onReminderSent: (reminderId: string) => void,
    onEventReminderSent: (eventId: string, reminderId: string) => void,
    getMondayPickNames?: () => string[],
  ): void {
    this.stopChecking();

    const check = () => {
      this.checkReminders(getReminders(), onReminderSent);
      this.checkEventReminders(getEvents(), onEventReminderSent);
      if (getMondayPickNames) {
        this.checkMondayPicksNotification(getMondayPickNames);
      }
    };

    // Check immediately
    check();

    // Then check every 60 seconds
    this.checkInterval = setInterval(check, 60 * 1000);
  }

  /** Stop periodic checking */
  stopChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const notificationService = new NotificationService();
