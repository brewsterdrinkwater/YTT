import React, { useState } from 'react';
import { useLists } from '../../contexts/ListsContext';
import { useApp } from '../../contexts/AppContext';
import { SharedEvent } from '../../types/events';
import { notificationService } from '../../services/notificationService';
import Button from '../common/Button';
import Modal from '../common/Modal';

const EventsPage: React.FC = () => {
  const { events, createEvent, updateEvent, deleteEvent, reminders, createReminder, deleteReminder } = useLists();
  const { showToast } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [showReminderForm, setShowReminderForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sharePhones, setSharePhones] = useState('');

  // Standalone reminder form
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDesc, setReminderDesc] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setLocation('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setSharePhones('');
  };

  const handleCreateEvent = async () => {
    if (!name.trim() || !startDate) return;

    // Request notification permission
    const granted = await notificationService.requestPermission();
    if (!granted) {
      showToast('Notifications are blocked. Enable them in browser settings for reminders.', 'warning');
    }

    const startISO = new Date(`${startDate}T${startTime || '00:00'}`).toISOString();
    const endISO = endDate ? new Date(`${endDate}T${endTime || '23:59'}`).toISOString() : null;

    let durationMinutes: number | null = null;
    if (endISO) {
      durationMinutes = Math.round((new Date(endISO).getTime() - new Date(startISO).getTime()) / 60000);
    }

    const phones = sharePhones
      .split(',')
      .map((p) => p.trim().replace(/\D/g, ''))
      .filter((p) => p.length >= 10);

    createEvent({
      name: name.trim(),
      description: description.trim(),
      location: location.trim() || null,
      startDate: startISO,
      endDate: endISO,
      durationMinutes,
      sharedBy: '', // Will be set by context
      sharedWithPhones: phones,
    });

    showToast('Event created with reminders!', 'success');
    resetForm();
    setShowCreate(false);
  };

  const handleCreateReminder = async () => {
    if (!reminderTitle.trim() || !reminderDate) return;

    const granted = await notificationService.requestPermission();
    if (!granted) {
      showToast('Notifications are blocked. Enable them in browser settings for reminders.', 'warning');
    }

    const triggerAt = new Date(`${reminderDate}T${reminderTime || '09:00'}`).toISOString();

    createReminder({
      title: reminderTitle.trim(),
      description: reminderDesc.trim(),
      triggerAt,
      listItemRef: null,
      eventRef: null,
      recurring: 'none',
    });

    showToast('Reminder set!', 'success');
    setReminderTitle('');
    setReminderDesc('');
    setReminderDate('');
    setReminderTime('');
    setShowReminderForm(false);
  };

  const upcomingEvents = events
    .filter((e) => new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const pastEvents = events
    .filter((e) => new Date(e.startDate) < new Date())
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const upcomingReminders = reminders
    .filter((r) => !r.sent)
    .sort((a, b) => new Date(a.triggerAt).getTime() - new Date(b.triggerAt).getTime());

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getReminderStatus = (event: SharedEvent) => {
    const total = event.reminders.length;
    const sent = event.reminders.filter((r) => r.sent).length;
    return `${sent}/${total} sent`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-black">Events & Reminders</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowReminderForm(true)}>
            + Reminder
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            + Event
          </Button>
        </div>
      </div>

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <section className="mb-8">
          <h2 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">Upcoming Reminders</h2>
          <div className="space-y-2">
            {upcomingReminders.map((reminder) => (
              <div key={reminder.id} className="p-3 border-2 border-concrete rounded-sm flex items-center gap-3 group hover:border-black transition-colors">
                <span className="text-lg">🔔</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{reminder.title}</p>
                  {reminder.description && <p className="text-xs text-slate">{reminder.description}</p>}
                  <p className="text-xs text-charcoal mt-1">{formatDateTime(reminder.triggerAt)}</p>
                </div>
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="p-1 text-slate hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="mb-8">
        <h2 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-steel rounded-sm">
            <span className="text-4xl">📅</span>
            <p className="mt-3 text-slate text-sm">No upcoming events. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="p-4 border-2 border-black rounded-sm space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-black">{event.name}</h3>
                    {event.description && <p className="text-sm text-slate mt-1">{event.description}</p>}
                  </div>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    className="p-1 text-slate hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1 text-charcoal">
                    📅 {formatDateTime(event.startDate)}
                  </span>
                  {event.endDate && (
                    <span className="flex items-center gap-1 text-charcoal">
                      → {formatDateTime(event.endDate)}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1 text-charcoal">
                      📍 {event.location}
                    </span>
                  )}
                </div>

                {/* Reminder timeline */}
                <div className="pt-2 border-t border-concrete">
                  <p className="text-xs font-semibold text-slate mb-1">
                    Reminders ({getReminderStatus(event)})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {event.reminders.map((r) => {
                      const labels: Record<string, string> = {
                        'week-before': '7 days before',
                        'day-of': 'Day of',
                        'before-start': '1hr before',
                        'before-end': '2hr before end',
                      };
                      return (
                        <span
                          key={r.id}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            r.sent ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {r.sent ? '✓ ' : '⏳ '}{labels[r.type] || r.type}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Shared with */}
                {event.sharedWithPhones.length > 0 && (
                  <div className="pt-2 border-t border-concrete">
                    <p className="text-xs text-slate">
                      Shared with {event.sharedWithPhones.length} contact{event.sharedWithPhones.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <section>
          <h2 className="text-tiny font-semibold text-slate uppercase tracking-wider mb-3">Past Events</h2>
          <div className="space-y-2">
            {pastEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="p-3 border border-steel rounded-sm opacity-60">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{event.name}</p>
                  <span className="text-xs text-slate">{formatDateTime(event.startDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Create Event Modal */}
      <Modal isOpen={showCreate} onClose={() => { resetForm(); setShowCreate(false); }} title="Create Event" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Event Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Concert at Ryman"
              className="w-full px-4 py-3 border-2 border-black rounded-sm text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details about the event..."
              rows={2}
              className="w-full px-4 py-3 border-2 border-steel rounded-sm text-sm resize-none focus:border-black focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., 116 5th Ave N, Nashville"
              className="w-full px-4 py-2 border-2 border-steel rounded-sm text-sm focus:border-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border-2 border-steel rounded-sm text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border-2 border-steel rounded-sm text-sm focus:border-black focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border-2 border-steel rounded-sm text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border-2 border-steel rounded-sm text-sm focus:border-black focus:outline-none"
              />
            </div>
          </div>

          {/* Notification preview */}
          <div className="p-3 bg-concrete rounded-sm">
            <p className="text-xs font-semibold text-charcoal mb-2">You'll get reminders:</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">7 days before</span>
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Day of (9 AM)</span>
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">1 hour before</span>
              {endDate && startDate && (() => {
                const start = new Date(`${startDate}T${startTime || '00:00'}`);
                const end = new Date(`${endDate}T${endTime || '23:59'}`);
                const hours = (end.getTime() - start.getTime()) / 3600000;
                return hours > 4 ? (
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">2hr before end</span>
                ) : null;
              })()}
            </div>
          </div>

          {/* Share */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Share with (phone numbers, comma-separated)</label>
            <input
              type="text"
              value={sharePhones}
              onChange={(e) => setSharePhones(e.target.value)}
              placeholder="(555) 123-4567, (555) 987-6543"
              className="w-full px-3 py-2 border-2 border-steel rounded-sm text-sm focus:border-black focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { resetForm(); setShowCreate(false); }} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} disabled={!name.trim() || !startDate} className="flex-1">
              Create Event
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Reminder Modal */}
      <Modal isOpen={showReminderForm} onClose={() => setShowReminderForm(false)} title="Set a Reminder" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">What to remember *</label>
            <input
              type="text"
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              placeholder="e.g., Buy flowers"
              className="w-full px-4 py-3 border-2 border-black rounded-sm text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Notes</label>
            <input
              type="text"
              value={reminderDesc}
              onChange={(e) => setReminderDesc(e.target.value)}
              placeholder="Optional details..."
              className="w-full px-3 py-2 border-2 border-steel rounded-sm text-sm focus:border-black focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Date *</label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full px-3 py-2 border-2 border-steel rounded-sm text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Time</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3 py-2 border-2 border-steel rounded-sm text-sm focus:border-black focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowReminderForm(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreateReminder} disabled={!reminderTitle.trim() || !reminderDate} className="flex-1">
              Set Reminder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventsPage;
