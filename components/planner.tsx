'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, CalendarDays } from 'lucide-react';
import { useTasks } from '@/lib/store';
import { DayOfWeek } from '@/lib/types';
import TaskCard from './task-card';
import AddTaskSheet from './add-task-sheet';
import WeeklyProgress from './weekly-progress';
import { requestNotificationPermission, sendLocalNotification } from '@/lib/notifications';
import { motion } from 'motion/react';

export default function Planner() {
  const { tasks, addTask, toggleTaskCompletion, deleteTask, isLoaded } = useTasks();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Update current time every 10 seconds for notifications and dates
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 10000); // 10s check
    return () => clearInterval(interval);
  }, []);

  // Notification engine
  useEffect(() => {
    if (!isLoaded) return;
    
    const checkNotifications = () => {
      const currentDay = now.getDay() as DayOfWeek;
      const currentFormattedTime = format(now, 'HH:mm');
      const time5MinFromNow = format(new Date(now.getTime() + 5 * 60000), 'HH:mm');
      const todayStr = format(now, 'yyyy-MM-dd');

      tasks.forEach(task => {
        // Only run for tasks that happen today
        if (task.repeatDays.length > 0 && !task.repeatDays.includes(currentDay)) return;
        if (task.repeatDays.length === 0 && format(new Date(task.createdAt), 'yyyy-MM-dd') !== todayStr) return;
        
        // Prevent notifying if already completed today
        if (task.completedDates.includes(todayStr)) return;

        // Note: In a real app we'd track 'notifiedFor' to avoid spamming every 10 seconds within the same minute.
        // For simplicity in UI store, we use session storage so a tab refresh resets it but it doesn't spam while open.
        const notifyKey = `notified-${task.id}-${todayStr}-`;
        
        if (task.time === currentFormattedTime) {
          if (!sessionStorage.getItem(notifyKey + 'now')) {
            sendLocalNotification(`Task due: ${task.title}`, { body: "It's time!" });
            sessionStorage.setItem(notifyKey + 'now', 'true');
          }
        } else if (task.hasReminder && task.time === time5MinFromNow) {
          if (!sessionStorage.getItem(notifyKey + '5m')) {
            sendLocalNotification(`Upcoming: ${task.title}`, { body: "Starts in 5 minutes" });
            sessionStorage.setItem(notifyKey + '5m', 'true');
          }
        }
      });
    };

    checkNotifications();
  }, [now, tasks, isLoaded]);

  const handleOpenSheet = async () => {
    await requestNotificationPermission();
    setIsSheetOpen(true);
  };

  const todayStr = format(now, 'yyyy-MM-dd');
  const currentDayOfWeek = now.getDay() as DayOfWeek;

  const todaysTasks = useMemo(() => {
    return tasks
      .filter(task => {
        // If it has repeat days, check if today is one of them
        if (task.repeatDays.length > 0) {
          return task.repeatDays.includes(currentDayOfWeek);
        }
        // If it's a one-off task (no repeat days), check if it was created today
        return format(new Date(task.createdAt), 'yyyy-MM-dd') === todayStr;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [tasks, currentDayOfWeek, todayStr]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  const completedCount = todaysTasks.filter(t => t.completedDates.includes(todayStr)).length;
  const progressPercent = todaysTasks.length > 0 ? (completedCount / todaysTasks.length) * 100 : 0;

  return (
    <div className="min-h-screen pb-28 md:pb-6 md:pt-6 max-w-[400px] mx-auto relative bg-[#F8F9FA] md:bg-white md:shadow-2xl md:border-[8px] md:border-neutral-900 md:rounded-[48px] overflow-hidden md:h-[800px] md:min-h-0 md:my-auto flex flex-col">
      <header className="px-6 pt-12 pb-6 bg-transparent shrink-0">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
              {format(now, 'EEEE, MMM d')}
            </p>
            <h1 className="text-3xl font-bold text-neutral-900 mt-1">Today</h1>
          </div>
        </div>
        
        <WeeklyProgress tasks={tasks} today={now} />
      </header>

      <main className="flex-1 px-6 space-y-5 overflow-y-auto no-scrollbar pb-24 md:pb-32">
        {todaysTasks.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
            <CalendarDays size={48} className="mb-4 text-neutral-400 stroke-[1.5]" />
            <p className="text-neutral-500 font-medium text-lg">No tasks for today</p>
            <p className="text-sm mt-1">Tap the button below to schedule</p>
          </div>
        ) : (
          todaysTasks.map(task => (
            <TaskCard 
              key={task.id}
              task={task}
              todayString={todayStr}
              onToggleCompletion={toggleTaskCompletion}
              onDelete={deleteTask}
            />
          ))
        )}
      </main>

      {/* FAB */}
      <div className="fixed bottom-0 left-0 right-0 p-6 md:absolute md:bottom-0 z-30 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA] to-transparent md:from-white md:via-white">
        <button
          onClick={handleOpenSheet}
          className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <Plus size={20} className="stroke-2" />
          New Task
        </button>
      </div>

      <AddTaskSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSave={(task) => addTask(task)}
      />
    </div>
  );
}
