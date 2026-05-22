'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, CalendarDays, Moon, Sun, GripVertical } from 'lucide-react';
import { useTasks } from '@/lib/store';
import { DayOfWeek } from '@/lib/types';
import TaskCard from './task-card';
import AddTaskSheet from './add-task-sheet';
import WeeklyProgress from './weekly-progress';
import { requestNotificationPermission, sendLocalNotification } from '@/lib/notifications';
import { motion } from 'motion/react';
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
  const { tasks, addTask, toggleTaskCompletion, deleteTask, reorderTasks, isLoaded } = useTasks();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
      });
  }, [tasks, currentDayOfWeek, todayStr]);

  const completedCount = todaysTasks.filter(t => t.completedDates.includes(todayStr)).length;
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
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
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
    </div>
  );
}
