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

export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon.png', // Assuming we have or will have a default icon
      badge: '/icon.png',
      requireInteraction: true,
      ...options
    });
    
    // Play synthetic alarm sound
    playAlarmSound();
  }
}
