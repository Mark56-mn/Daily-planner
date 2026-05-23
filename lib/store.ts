'use client';

import { useState, useEffect } from 'react';
import { Task } from './types';
import { format } from 'date-fns';

const TASKS_STORAGE_KEY = 'planner_tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TASKS_STORAGE_KEY);
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const addTask = (task: Task) => setTasks((prev) => [...prev, task]);
  
  const updateTask = (updatedTask: Task) => 
    setTasks((prev) => prev.map(t => t.id === updatedTask.id ? updatedTask : t));

  const deleteTask = (id: string) => 
    setTasks((prev) => prev.filter(t => t.id !== id));

  const toggleTaskCompletion = (taskId: string, dateString: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const completedDates = t.completedDates || [];
      const isCompleted = completedDates.includes(dateString);
      return {
        ...t,
        completedDates: isCompleted 
          ? completedDates.filter(d => d !== dateString)
          : [...completedDates, dateString]
      };
    }));
  };

  const reorderTasks = (activeId: string, overId: string) => {
    setTasks((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === activeId);
      const newIndex = prev.findIndex((t) => t.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const next = [...prev];
        const [moved] = next.splice(oldIndex, 1);
        // Correct splice arithmetic when items shift
        next.splice(newIndex, 0, moved);
        return next;
      }
      return prev;
    });
  };

  return { tasks, addTask, updateTask, deleteTask, toggleTaskCompletion, reorderTasks, isLoaded };
}
