// tutti i numeri in un posto (90 minuti, 40 €, 25%, 2, 24 ore…

import type { Court, User } from './types.ts';

export const RULES = {
  SLOT_MINUTES: 90,
  FIRST_SLOT: '08:00',
  CLOSING_TIME: '23:00',    
  DAYS_AHEAD: 7,
  MEMBER_DAYS_AHEAD: 14,
  BASE_PRICE: 40,
  SURCHARGE: 0.25,         
  SURCHARGE_FROM: '18:00',
  MEMBER_DISCOUNT: 0.2,    
  MAX_ACTIVE: 2,
  FREE_CANCEL_HOURS: 24,
  PENALTY: 0.5,             
};

export const COURTS: Court[] = [
   { id: 'c1', name: 'Campo 1', type: 'indoor' },
     { id: 'c2', name: 'Campo 2', type: 'indoor' },
      { id: 'c3', name: 'Campo 3', type: 'outdoor' },
];


export const USERS: User[] = [
  { id: 'u1', name: 'Daniel Barresi', member: true },
  { id: 'u2', name: 'Samuele', member: false },
  { id: 'u3', name: 'Alberto', member: false },
];