// com’è fatto un campo, un utente, una prenotazione-  nodejs con express

export type CourtType = 'indoor' | 'outdoor';

export interface Court { 
  id:string;
  name:string;
  type: CourtType;
}

export interface User{
  id:string;
  name:string;
  member:boolean;
}


export type BookingStatus = 'confermata' | 'annullata';
export interface Booking{
  id:string;
  userId:string;
  courtId: string;
  date:string;
  start:string;
  end:string;
  price:number;
  status: BookingStatus;
  createdAt:string;
  penalty?: number;
  active?: boolean;
}


export interface Rules {
  SLOT_MINUTES: number;
  DAYS_AHEAD: number;
  MEMBER_DAYS_AHEAD: number;
  BASE_PRICE: number;
  SURCHARGE: number;
  SURCHARGE_FROM: string;
  MEMBER_DISCOUNT: number;
  MAX_ACTIVE: number;
  FREE_CANCEL_HOURS: number;
  PENALTY: number;
}

export interface AppConfig {
  courts: Court[];
  users: User[];
  rules: Rules;
  slots: { start: string; end: string }[];
}

export type CellStatus = 'free' | 'booked' | 'mine' | 'past';
export interface GridCell { start: string; end: string; status: CellStatus; price: number; }
export interface GridRow { court: Court; cells: GridCell[]; }