import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle color theme"
      className="relative flex h-9 w-16 items-center rounded-full border border-navy-200 bg-white px-1 transition-colors hover:border-navy-300 dark:border-navy-700 dark:bg-navy-800 dark:hover:border-navy-600"
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className={`flex h-7 w-7 items-center justify-center rounded-full shadow-sm ${
          theme === 'dark' ? 'ml-auto bg-navy-600' : 'bg-teal-500'
        }`}
      >
        {theme === 'dark' ? (
          <Moon className="h-4 w-4 text-navy-100" />
        ) : (
          <Sun className="h-4 w-4 text-white" />
        )}
      </motion.div>
    </button>
  );
}
