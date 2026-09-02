import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, CircleDashed, Loader2, Plus, X } from 'lucide-react';
import { PageHeading } from '@/components/PageHeading';
import { addCourse, deleteCourse, loadCourses, updateCourse } from '@/lib/courses';
import type { Course, CourseStatus } from '@/types';

const COLUMNS: { key: CourseStatus; label: string; icon: typeof CheckCircle2 }[] = [
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  { key: 'in-progress', label: 'In progress', icon: Loader2 },
  { key: 'needed', label: 'Still need', icon: CircleDashed },
];

const STATUS_OPTIONS: { value: CourseStatus; label: string }[] = [
  { value: 'completed', label: 'Completed' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'needed', label: 'Still need' },
];

export function CoursesView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newStatus, setNewStatus] = useState<CourseStatus>('needed');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadCourses().then((data) => {
      setCourses(data);
      setLoading(false);
    });
  }, []);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    const created = await addCourse(name, newStatus);
    setAdding(false);
    if (created) {
      setCourses((prev) => [...prev, created]);
    } else {
      setCourses((prev) => [...prev, { id: crypto.randomUUID(), name, status: newStatus, notes: '' }]);
    }
    setNewName('');
  };

  const handleStatusChange = async (course: Course, status: CourseStatus) => {
    const updated = { ...course, status };
    setCourses((prev) => prev.map((c) => (c.id === course.id ? updated : c)));
    await updateCourse(updated);
  };

  const handleDelete = async (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    await deleteCourse(id);
  };

  return (
    <>
      <PageHeading
        eyebrow="Personal"
        title="Course planning"
        description="Prerequisite coursework — completed, in progress, and still needed."
      />

      <div className="mt-8 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-card dark:border-navy-700 dark:bg-navy-800">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add a course…"
          className="min-w-[180px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-800 outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-navy-600 dark:bg-navy-900 dark:text-white"
        />
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as CourseStatus)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy-800 outline-none dark:border-navy-600 dark:bg-navy-900 dark:text-white"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((column, colIndex) => {
            const items = courses.filter((c) => c.status === column.key);
            const Icon = column.icon;
            return (
              <motion.div
                key={column.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: colIndex * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-slate-200 bg-white shadow-card dark:border-navy-700 dark:bg-navy-800"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 p-4 dark:border-navy-700">
                  <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <h2 className="font-display text-sm font-semibold text-navy-800 dark:text-white">
                    {column.label}
                  </h2>
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-navy-500 dark:bg-navy-700 dark:text-navy-300">
                    {items.length}
                  </span>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-navy-700/60">
                  {items.length === 0 && (
                    <li className="px-4 py-6 text-center text-[13px] text-navy-400 dark:text-navy-400">
                      Nothing here yet.
                    </li>
                  )}
                  {items.map((course) => (
                    <li key={course.id} className="group flex items-start gap-2 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-navy-800 dark:text-white">{course.name}</p>
                        {course.notes && (
                          <p className="mt-0.5 text-[12px] leading-relaxed text-navy-400 dark:text-navy-300">
                            {course.notes}
                          </p>
                        )}
                        <select
                          value={course.status}
                          onChange={(e) => handleStatusChange(course, e.target.value as CourseStatus)}
                          className="mt-1.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-navy-500 outline-none dark:border-navy-600 dark:bg-navy-900 dark:text-navy-300"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="shrink-0 rounded-md p-1 text-navy-300 opacity-0 transition-opacity hover:bg-slate-100 hover:text-rose-600 group-hover:opacity-100 dark:text-navy-500 dark:hover:bg-navy-700 dark:hover:text-rose-400"
                        aria-label={`Remove ${course.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
