import { supabase } from '@/lib/supabase';
import { courses as seedCourses } from '@/courses-data';
import type { Course } from '@/types';

interface CourseRow {
  id: string;
  name: string;
  status: Course['status'];
  notes: string;
}

function fromRow(row: CourseRow): Course {
  return { id: row.id, name: row.name, status: row.status, notes: row.notes };
}

/** Falls back to the baked-in seed when Supabase isn't configured or fails. */
export async function loadCourses(): Promise<Course[]> {
  if (!supabase) return seedCourses;
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) return seedCourses;
  return (data as CourseRow[]).map(fromRow);
}

export async function addCourse(name: string, status: Course['status']): Promise<Course | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('courses')
    .insert({ name, status, notes: '' })
    .select()
    .single();
  if (error || !data) return null;
  return fromRow(data as CourseRow);
}

export async function updateCourse(course: Course): Promise<Course | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('courses')
    .update({ name: course.name, status: course.status, notes: course.notes })
    .eq('id', course.id)
    .select()
    .single();
  if (error || !data) return null;
  return fromRow(data as CourseRow);
}

export async function deleteCourse(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('courses').delete().eq('id', id);
  return !error;
}
