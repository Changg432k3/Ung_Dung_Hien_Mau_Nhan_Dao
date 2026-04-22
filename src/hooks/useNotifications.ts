import { useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { toast } from 'sonner';
import { isToday, isTomorrow, parseISO } from 'date-fns';

export const useNotifications = () => {
  const { currentUser, events, records, notifications, addNotification } = useApp();
  const prevEventsLength = useRef(events.length);
  const prevNotificationsLength = useRef(notifications.length);
  const notifiedEvents = useRef<Set<string>>(new Set());
  const processedNotificationIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser) return;

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const sendNotification = (title: string, body: string, type: string = 'info') => {
      // Automatic notifications (toast/browser push) are disabled per user request.
      // Notifications are now only visible in the NotificationCenter dropdown.
    };

    // 1. Monitor the notifications array for NEW items added to the user's inbox
    if (notifications.length > prevNotificationsLength.current) {
      const newNotifs = notifications.slice(0, notifications.length - prevNotificationsLength.current);
      newNotifs.forEach(notif => {
        if (notif.userId === currentUser.id && !processedNotificationIds.current.has(notif.id)) {
          sendNotification(notif.title, notif.message, notif.type);
          processedNotificationIds.current.add(notif.id);
        }
      });
    }
    prevNotificationsLength.current = notifications.length;

    // 2. Check for newly created events (for donors) - Client-side detection for immediate feedback
    if (currentUser.role === 'donor' && events.length > prevEventsLength.current) {
      const newEvents = events.slice(prevEventsLength.current);
      newEvents.forEach(event => {
        const title = 'Sự kiện hiến máu mới!';
        const body = `Sự kiện "${event.title}" vừa được tạo. Hãy đăng ký ngay!`;
        // We don't call sendNotification here if we expect an addNotification to be called elsewhere,
        // but since event creation doesn't automatically add notifications to all users (too many),
        // we keep this client-side check for the active user.
        sendNotification(title, body, 'event_new');
        addNotification({
          userId: currentUser.id,
          title,
          message: body,
          type: 'event_new',
          link: `/events/${event.id}`
        });
      });
    }
    prevEventsLength.current = events.length;

    // 3. Check for registered events starting soon (today or tomorrow)
    if (currentUser.role === 'donor') {
      const userRecords = records.filter(r => r.userId === currentUser.id && r.status === 'registered');
      
      userRecords.forEach(record => {
        const event = events.find(e => e.id === record.eventId);
        if (event && !notifiedEvents.current.has(event.id)) {
          const eventDate = parseISO(event.date);
          if (isToday(eventDate) || isTomorrow(eventDate)) {
            const title = 'Sự kiện sắp diễn ra';
            const body = `Sự kiện "${event.title}" mà bạn đã đăng ký sẽ diễn ra vào ${event.date}. Đừng quên nhé!`;
            sendNotification(title, body, 'reminder');
            addNotification({
              userId: currentUser.id,
              title,
              message: body,
              type: 'reminder',
              link: `/events/${event.id}`
            });
            notifiedEvents.current.add(event.id);
          }
        }
      });

      // 3. Check for admin reminders
      if (currentUser.lastReminderDate) {
        const lastReminder = new Date(currentUser.lastReminderDate).getTime();
        const lastSeenReminder = parseInt(localStorage.getItem(`lastSeenReminder_${currentUser.id}`) || '0');
        
        if (lastReminder > lastSeenReminder) {
          sendNotification(
            'Nhắc nhở hiến máu',
            'Bạn đã đủ điều kiện để tiếp tục hiến máu. Hãy tham gia các sự kiện sắp tới nhé!'
          );
          localStorage.setItem(`lastSeenReminder_${currentUser.id}`, lastReminder.toString());
        }
      }

      // 4. Automatic eligibility reminder
      if (currentUser.lastDonationDate) {
        const lastDate = new Date(currentUser.lastDonationDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const waitPeriod = 84; // 12 weeks
        
        if (diffDays >= waitPeriod) {
          const autoReminderKey = `autoReminder_${currentUser.id}_${lastDate.getTime()}`;
          if (!localStorage.getItem(autoReminderKey)) {
            sendNotification(
              'Đã đến lúc hiến máu!',
              'Bạn đã đủ thời gian nghỉ ngơi (12 tuần) kể từ lần hiến cuối. Hãy tiếp tục hành trình nhân ái nhé!'
            );
            localStorage.setItem(autoReminderKey, 'true');
          }
        }
      }
    }
  }, [currentUser, events, records, notifications]);
};
