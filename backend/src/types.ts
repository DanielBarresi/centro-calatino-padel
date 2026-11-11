export type CourtType = 'indoor' | 'outdoor';



export interface Court{
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
    status:BookingStatus;
    createdAt:string;
    penalty?: number;
  }


  export interface Database{
    bookings: Booking[];
  }




















