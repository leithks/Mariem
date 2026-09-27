import { Student, LessonSession, TutorProfile } from '../types';

export const INITIAL_TUTOR_PROFILE: TutorProfile = {
  name: 'Mariem',
  tagline: 'Good morning habibi <3 this is leith to day you have 2 cours good luck',
  currency: 'DT',
  defaultHourlyRate: 30,
  avatarUrl: '',
};

export const AVAILABLE_SUBJECTS = [
  { name: 'Info', color: 'blue' as const },
  { name: 'Français', color: 'pink' as const },
  { name: 'Anglais', color: 'yellow' as const },
];

export const AVAILABLE_GRADES = [
  '3ème Primaire',
  '4ème Primaire',
  '5ème Primaire',
  '6ème Primaire',
  '7ème Base',
  '8ème Base',
  '9ème Base',
  '1ère Secondaire',
  '2ème Secondaire',
  '3ème Secondaire',
  'Bac',
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's-mariem',
    handle: '@mariem',
    name: 'Mariem Bouaziz',
    grade: 'Bac',
    defaultSubject: 'Info',
    ratePerHour: 45,
    paid: true,
    monthlyFee: 90,
    color: 'blue',
    phone: '+216 22 100 200',
    notes: 'Algorithmique & Programmation Python.',
    joinedDate: '2026-09-01',
  },
  {
    id: 's-mehrez',
    handle: '@mehrez',
    name: 'Mehrez Trabelsi',
    grade: '3ème Secondaire',
    defaultSubject: 'Français',
    ratePerHour: 30,
    paid: false,
    monthlyFee: 60,
    color: 'yellow',
    phone: '+216 55 345 678',
    notes: 'Production écrite & Analyse littéraire.',
    joinedDate: '2026-09-02',
  },
  {
    id: 's-hiba',
    handle: '@hiba',
    name: 'Hiba Riahi',
    grade: 'Bac',
    defaultSubject: 'Anglais',
    ratePerHour: 35,
    paid: false,
    monthlyFee: 70,
    color: 'green',
    phone: '+216 98 765 432',
    notes: 'Grammaire & Expression orale.',
    joinedDate: '2026-09-05',
  },
  {
    id: 's-esmahen',
    handle: '@esmahen',
    name: 'Esmahen Guesmi',
    grade: '2ème Secondaire',
    defaultSubject: 'Info',
    ratePerHour: 30,
    paid: false,
    monthlyFee: 60,
    color: 'pink',
    phone: '+216 29 112 233',
    notes: 'Bases de données & Algorithmes.',
    joinedDate: '2026-09-10',
  },
  {
    id: 's-leith',
    handle: '@leith',
    name: 'Leith Cousseni',
    grade: 'Bac',
    defaultSubject: 'Info',
    ratePerHour: 30,
    paid: false,
    monthlyFee: 60,
    color: 'blue',
    phone: '+216 50 998 877',
    notes: 'Info & Programmation.',
    joinedDate: '2026-09-15',
  },
];

// Initial lessons starts empty as requested ("the callendar should contain no cards")
export const INITIAL_LESSONS: LessonSession[] = [];

export const DEMO_SAMPLE_LESSONS: LessonSession[] = [
  {
    id: 'lesson-1',
    title: 'Info',
    date: '2026-09-20', // Dimanche
    startTime: '14:00',
    endTime: '16:00',
    studentIds: ['s-leith', 's-mariem'],
    color: 'blue',
    topic: 'Structures de données & Fonctions',
    attendance: {
      's-leith': 'present',
      's-mariem': 'present',
    },
    paidStudents: {
      's-leith': false,
      's-mariem': true,
    },
    notes: 'Préparation devoir de synthèse',
  },
  {
    id: 'lesson-2',
    title: 'Anglais',
    date: '2026-09-21', // Lundi
    startTime: '14:00',
    endTime: '16:00',
    studentIds: ['s-mehrez', 's-mariem'],
    color: 'yellow',
    topic: 'Reading comprehension & Essay writing',
    attendance: {
      's-mehrez': 'present',
      's-mariem': 'present',
    },
    paidStudents: {
      's-mehrez': false,
      's-mariem': true,
    },
    notes: 'Vocabulaire thématique',
  },
  {
    id: 'lesson-3',
    title: 'Français',
    date: '2026-09-22', // Mardi
    startTime: '14:00',
    endTime: '16:00',
    studentIds: ['s-esmahen', 's-mariem'],
    color: 'pink',
    topic: 'Méthodologie du commentaire de texte',
    attendance: {
      's-esmahen': 'present',
      's-mariem': 'present',
    },
    paidStudents: {
      's-esmahen': false,
      's-mariem': true,
    },
    notes: 'Exercices d’argumentation',
  },
];
