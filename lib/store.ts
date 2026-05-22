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
      const isCompleted = t.completedDates.includes(dateString);
      return {
        ...t,
        completedDates: isCompleted 
          ? t.completedDates.filter(d => d !== dateString)
          : [...t.completedDates, dateString]
      };
    }));
  };

  return { tasks, addTask, updateTask, deleteTask, toggleTaskCompletion, isLoaded };
}
