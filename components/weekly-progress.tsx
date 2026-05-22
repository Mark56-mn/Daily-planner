'use client';

import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { Task, DayOfWeek } from '@/lib/types';

interface WeeklyProgressProps {
  tasks: Task[];
  today: Date;
}

export default function WeeklyProgress({ tasks, today }: WeeklyProgressProps) {
  const chartData = useMemo(() => {
    // past 7 days, ending with today
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayOfWeek = d.getDay() as DayOfWeek;
      const label = format(d, 'EEEE').substring(0, 1); // 'S', 'M', 'T', 'W', etc.
      
      const dayTasks = tasks.filter(task => {
        if (task.repeatDays.length > 0) {
          return task.repeatDays.includes(dayOfWeek);
        }
        return format(new Date(task.createdAt), 'yyyy-MM-dd') === dateStr;
      });

      const total = dayTasks.length;
      let completed = 0;
      if (total > 0) {
        completed = dayTasks.filter(t => t.completedDates.includes(dateStr)).length;
      }
      
      let percent = total > 0 ? (completed / total) * 100 : 0;
      
      days.push({
        date: dateStr,
        label,
        percent,
        total,
        isToday: i === 0,
        // Hack for recharts to show a minimal bar if percent is 0 to make it consistent 
        // with the empty days pattern, or just let it be empty
        displayValue: percent === 0 ? 5 : percent, 
        actualPercent: percent
      });
    }
    return days;
  }, [tasks, today]);

  const hasAnyTasks = chartData.some(d => d.total > 0);

  if (!hasAnyTasks) return null;

  return (
    <div className="mt-8 pt-6 border-t border-neutral-200/50">
      <div className="flex justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
        <span>Completion</span>
        <span>7 Days</span>
      </div>
      <div className="h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Bar dataKey="displayValue" radius={[4, 4, 4, 4]} barSize={16}>
              {chartData.map((entry, index) => {
                let fill = '#F5F5F5'; // default/empty
                if (entry.total > 0) {
                  if (entry.actualPercent === 100) fill = '#171717'; // fully completed
                  else if (entry.actualPercent > 0) fill = '#A3A3A3'; // partially completed
                  else fill = '#E5E5E5'; // 0% but has tasks
                }
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between mt-2 px-[10px]">
        {chartData.map((d, i) => (
          <span 
            key={i} 
            className={`text-[10px] font-semibold w-4 text-center ${d.isToday ? 'text-neutral-900' : 'text-neutral-300'}`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
