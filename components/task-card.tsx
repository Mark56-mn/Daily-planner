'use client';

import { Task } from '@/lib/types';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Clock, Trash2, FileText } from 'lucide-react';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  todayString: string;
  onToggleCompletion: (id: string, dateStr: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, todayString, onToggleCompletion, onDelete }: TaskCardProps) {
  const isCompleted = task.completedDates.includes(todayString);
  const [showDelete, setShowDelete] = useState(false);
  const [showNote, setShowNote] = useState(false);

  // Quick format HH:mm to 12 hour
  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative overflow-hidden transition-colors py-1`}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowDelete(!showDelete);
      }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => onToggleCompletion(task.id, todayString)}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 ${
            isCompleted 
              ? 'bg-neutral-900 border-neutral-900 text-white' 
              : 'border-neutral-900 bg-transparent'
          }`}
        >
          {isCompleted && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium truncate transition-colors duration-300 ${
            isCompleted ? 'text-neutral-300 line-through' : 'text-neutral-900'
          }`}>
            {task.title}
          </h3>
          <div className="flex items-center mt-1 gap-1.5 text-xs transition-colors duration-300">
            <span className={isCompleted ? 'text-neutral-300' : 'text-neutral-500'}>{formatTime(task.time)}</span>
            {task.repeatDays.length > 0 && (
              <>
                <span className={isCompleted ? 'text-neutral-300' : 'text-neutral-500'}>• Daily</span>
              </>
            )}
            {task.notes && (
              <>
                <span className={isCompleted ? 'text-neutral-300' : 'text-neutral-500'}>•</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowNote(!showNote); }}
                  className={`flex items-center hover:text-neutral-900 transition-colors ${
                    isCompleted ? 'text-neutral-300' : (showNote ? 'text-neutral-900' : 'text-neutral-500')
                  }`}
                >
                  <FileText className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {showDelete && (
          <button 
            onClick={() => onDelete(task.id)}
            className="px-4 py-2 ml-2 text-white bg-neutral-900 rounded-xl whitespace-nowrap font-semibold text-xs tracking-wide transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      <AnimatePresence>
        {task.notes && showNote && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`mt-3 ml-9 pl-3 border-l-2 text-xs leading-relaxed whitespace-pre-wrap ${
              isCompleted ? 'border-neutral-200 text-neutral-400' : 'border-neutral-300 text-neutral-600'
            }`}>
              {task.notes}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!showDelete && (
        <button 
          onClick={(e) => { e.stopPropagation(); setShowDelete(true); }}
          className="absolute top-1/2 -translate-y-1/2 right-0 p-2 opacity-100 md:opacity-0 group-hover:opacity-100 flex flex-col gap-1 items-center justify-center text-neutral-300 hover:text-neutral-900 transition-colors"
        >
           <div className="w-1 h-1 bg-current rounded-full" />
           <div className="w-1 h-1 bg-current rounded-full" />
           <div className="w-1 h-1 bg-current rounded-full" />
        </button>
      )}
    </motion.div>
  );
}
