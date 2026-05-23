'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, CalendarDays, Moon, Sun, GripVertical, BellRing, X, Clock } from 'lucide-react';
import { useTasks } from '@/lib/store';
import { DayOfWeek, Task } from '@/lib/types';
import TaskCard from './task-card';
import AddTaskSheet from './add-task-sheet';
import WeeklyProgress from './weekly-progress';
import { requestNotificationPermission, sendLocalNotification } from '@/lib/notifications';
import { stopAlarmSound } from '@/lib/audio';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableTaskCard(props: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute left-[-20px] top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-neutral-300 dark:text-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-300 transition-opacity z-10"
      >
        <GripVertical size={16} />
      </div>
      <div className="pl-4">
        <TaskCard {...props} />
      </div>
    </div>
  );
}

export default function Planner() {
  const { tasks, addTask, updateTask, toggleTaskCompletion, deleteTask, reorderTasks, isLoaded } = useTasks();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [ringingTask, setRingingTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTasks(active.id as string, over.id as string);
    }
  };

  const dismissAlarm = () => {
    stopAlarmSound();
    
    if (ringingTask) {
      // Mark as completed or just dismiss so it doesn't ring again today?
      // Best to add it to a dismissed state, but for this exercise we rely on session tracking.
      setRingingTask(null);
    }
  };

  const snoozeAlarm = () => {
    stopAlarmSound();
    if (ringingTask) {
      const snoozeTime = new Date(now.getTime() + 5 * 60000); // 5 minutes
      const updated = {
        ...ringingTask,
        snoozedUntil: snoozeTime.toISOString()
      };
      updateTask(updated);
      setRingingTask(null);
    }
  };

  // Update current time every 10 seconds for notifications and dates
  useEffect(() => {
    setMounted(true);
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
        // Prevent notifying if already completed today
        const completedDates = task.completedDates || [];
        if (completedDates.includes(todayStr)) return;
        
        let shouldRing = false;

        // Check if task applies to today
        const belongsToToday = (task.repeatDays && task.repeatDays.length > 0)
          ? task.repeatDays.includes(currentDay)
          : task.date === todayStr;

        // Standard time check
        if (belongsToToday && task.time === currentFormattedTime) {
          shouldRing = true;
        }

        // Snoozed check
        if (task.snoozedUntil) {
           const snoozeDate = new Date(task.snoozedUntil);
           if (now >= snoozeDate) {
             shouldRing = true;
             // Clear snooze after ringing
             updateTask({ ...task, snoozedUntil: undefined });
           }
        }

        const notifyKey = `notified-${task.id}-${todayStr}-`;
        
        if (shouldRing) {
          if (!sessionStorage.getItem(notifyKey + 'now')) {
            sendLocalNotification(`Alarm: ${task.title}`, { body: "It's time!" });
            sessionStorage.setItem(notifyKey + 'now', 'true');
            setRingingTask(task);
          }
        } else if (belongsToToday && task.hasReminder && task.time === time5MinFromNow) {
          if (!sessionStorage.getItem(notifyKey + '5m')) {
            sendLocalNotification(`Upcoming: ${task.title}`, { body: "Starts in 5 minutes" });
            sessionStorage.setItem(notifyKey + '5m', 'true');
          }
        }
      });
    };

    checkNotifications();
  }, [now, tasks, isLoaded, updateTask]);

  const handleOpenSheet = async () => {
    await requestNotificationPermission();
    setIsSheetOpen(true);
  };

  const todayStr = format(now, 'yyyy-MM-dd');
  const currentDayOfWeek = now.getDay() as DayOfWeek;

  const todaysTasks = useMemo(() => {
    return tasks.filter(task => {
      if (task.repeatDays && task.repeatDays.length > 0) {
        return task.repeatDays.includes(currentDayOfWeek);
      }
      return task.date === todayStr;
    });
  }, [tasks, todayStr, currentDayOfWeek]);

  const completedCount = todaysTasks.filter(t => (t.completedDates || []).includes(todayStr)).length;
  const progressPercent = todaysTasks.length > 0 ? (completedCount / todaysTasks.length) * 100 : 0;
  const uncompletedCount = todaysTasks.length - completedCount;

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      if (uncompletedCount > 0) {
        (navigator as any).setAppBadge(uncompletedCount).catch(console.error);
      } else {
        (navigator as any).clearAppBadge().catch(console.error);
      }
    }
  }, [uncompletedCount]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-black w-full">
        <div className="w-8 h-8 border-4 border-neutral-200 dark:border-neutral-800 border-t-neutral-900 dark:border-t-neutral-100 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full pb-28 md:pb-6 md:pt-6 md:max-w-[400px] md:mx-auto relative bg-white dark:bg-black md:shadow-2xl md:border-[8px] md:border-neutral-900 dark:md:border-neutral-800 md:rounded-[48px] overflow-hidden md:h-[800px] md:min-h-0 md:my-auto flex flex-col transition-colors duration-300">
      <header className="px-6 pt-12 pb-6 bg-transparent shrink-0">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
              {format(now, 'EEEE, MMM d')}
            </p>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">Today</h1>
          </div>
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
        </div>
        
        <WeeklyProgress tasks={tasks} today={now} />
      </header>

      <main className="flex-1 px-6 space-y-5 overflow-y-auto no-scrollbar pb-24 md:pb-32">
        {todaysTasks.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
            <CalendarDays size={48} className="mb-4 text-neutral-400 dark:text-neutral-600 stroke-[1.5]" />
            <p className="text-neutral-500 dark:text-neutral-400 font-medium text-lg">No tasks for today</p>
            <p className="text-sm mt-1 text-neutral-400 dark:text-neutral-500">Tap the button below to schedule</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={todaysTasks} strategy={verticalListSortingStrategy}>
              {todaysTasks.map(task => (
                <SortableTaskCard 
                  key={task.id}
                  task={task}
                  todayString={todayStr}
                  onToggleCompletion={toggleTaskCompletion}
                  onDelete={deleteTask}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* FAB */}
      <div className="fixed bottom-0 left-0 right-0 p-6 md:absolute md:bottom-0 z-30 bg-gradient-to-t from-white dark:from-black via-white dark:via-black to-transparent">
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

      {/* Full Screen Alarm Ringing Overlay */}
      <AnimatePresence>
        {ringingTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-[#1A1A1A] w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col items-center relative overflow-hidden"
            >
              {/* Pulsing ring background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div 
                  animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  className="w-32 h-32 rounded-full bg-blue-500/20"
                />
              </div>

              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 relative z-10">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  <BellRing size={40} className="stroke-[1.5]" />
                </motion.div>
              </div>
              
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 relative z-10">
                {ringingTask.time}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 font-medium mb-8 relative z-10">
                {ringingTask.title}
              </p>

              <div className="flex gap-4 w-full relative z-10">
                <button
                  onClick={dismissAlarm}
                  className="flex-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <X size={24} />
                  Dismiss
                </button>
                <button
                  onClick={snoozeAlarm}
                  className="flex-1 bg-neutral-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Clock size={24} />
                  Snooze
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
