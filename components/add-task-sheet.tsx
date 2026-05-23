'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';
import { X, Check } from 'lucide-react';
import { Task } from '@/lib/types';
import { format } from 'date-fns';

interface AddTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
}

export default function AddTaskSheet({ isOpen, onClose, onSave }: AddTaskSheetProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('09:00');
  const [hasReminder, setHasReminder] = useState(false);
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!title.trim() || !date || !time) return;

    const newTask: Task = {
      id: uuidv4(),
      title: title.trim(),
      date,
      time,
      completed: false,
      createdAt: new Date().toISOString(),
      hasReminder,
      description: description.trim()
    };

    onSave(newTask);
    
    // reset form
    setTitle('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setTime('09:00');
    setHasReminder(false);
    setDescription('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 md:absolute md:inset-0 md:top-auto z-50 bg-white dark:bg-black md:rounded-[40px] rounded-t-[40px] shadow-2xl max-h-[90vh] md:max-h-full overflow-y-auto flex flex-col"
          >
            <div className="pt-12 px-6 flex flex-shrink-0 items-center justify-between">
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-start text-neutral-900 dark:text-neutral-100 active:scale-95 transition-transform">
                <X size={24} />
              </button>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Create Task</h2>
              <div className="w-8"></div>
            </div>

            <div className="p-8 flex-1 space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Morning workout"
                  className="w-full text-xl font-medium border-b border-neutral-200 dark:border-neutral-800 pb-2 bg-transparent outline-none focus:border-neutral-900 dark:focus:border-neutral-100 dark:text-neutral-100 transition-colors"
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <div className="space-y-2 flex flex-col flex-1">
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xl font-medium border-b border-neutral-200 dark:border-neutral-800 pb-2 bg-transparent outline-none focus:border-neutral-900 dark:focus:border-neutral-100 dark:text-neutral-100 transition-colors"
                  />
                </div>
                
                <div className="space-y-2 flex flex-col flex-1">
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full text-xl font-medium border-b border-neutral-200 dark:border-neutral-800 pb-2 bg-transparent outline-none focus:border-neutral-900 dark:focus:border-neutral-100 dark:text-neutral-100 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context..."
                  rows={2}
                  className="w-full text-base font-medium border-b border-neutral-200 dark:border-neutral-800 pb-2 bg-transparent outline-none focus:border-neutral-900 dark:focus:border-neutral-100 dark:text-neutral-100 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-between cursor-pointer" onClick={() => setHasReminder(!hasReminder)}>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Early Reminder</p>
                  <p className="text-xs text-neutral-400">5 minutes before task</p>
                </div>
                <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${hasReminder ? 'bg-neutral-900 dark:bg-neutral-100' : 'bg-neutral-200 dark:bg-neutral-800'}`}>
                   <motion.div 
                     className="w-4 h-4 bg-white dark:bg-black rounded-full shadow-sm"
                     animate={{ x: hasReminder ? 16 : 0 }}
                   />
                </div>
              </div>
            </div>

            <div className="p-6 flex-shrink-0 mb-4 md:mb-0">
              <button
                onClick={handleSave}
                disabled={!title.trim() || !date || !time}
                className="w-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 py-4 rounded-2xl font-semibold disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                Save Task
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
