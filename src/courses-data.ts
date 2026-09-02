import type { Course } from '@/types';

export const courses: Course[] = [
  { id: '1', name: 'General Biology I', status: 'completed', notes: '' },
  {
    id: '2',
    name: 'General Biology II',
    status: 'completed',
    notes: 'Two-part sequence — Part B completed. Technically Anatomy & Physiology.',
  },
  { id: '3', name: 'General Chemistry I', status: 'completed', notes: '' },
  { id: '4', name: 'General Chemistry II', status: 'completed', notes: '' },
  { id: '5', name: 'Physics I', status: 'in-progress', notes: '' },
  { id: '6', name: 'Organic Chemistry I', status: 'needed', notes: '' },
  { id: '7', name: 'Organic Chemistry II', status: 'needed', notes: '' },
  { id: '8', name: 'Biochemistry', status: 'needed', notes: '' },
  { id: '9', name: 'Physics II', status: 'needed', notes: '' },
];
