import { playAlarmSound } from './audio';

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    const notificationOptions = {
      icon: '/icon.png', 
      badge: '/icon.png',
      requireInteraction: true,
      ...options
    };

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, notificationOptions);
      } catch (error) {
        new Notification(title, notificationOptions);
      }
    } else {
      new Notification(title, notificationOptions);
    }
    
    // Play synthetic alarm sound
    playAlarmSound();
  }
}
