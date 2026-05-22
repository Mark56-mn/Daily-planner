import Planner from '@/components/planner';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black md:flex md:items-center md:justify-center transition-colors duration-300">
      <Planner />
    </div>
  );
}
