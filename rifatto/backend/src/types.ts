//com'è fatto un prodotto
export interface Product{
    id:string;
    name:string;
    description?:string;
    category:string;
    price:number;
    stock:number;
    icon?:string;
    image?:string;
}

//lo stato dell'ordine e un testo letteralmnte tipo ricevuto
export type OrderStatus = string;


//una riga dello scontrino
export interface OrderLine{
    productId:string;
    name:string;
    price:number;
    quantity:number;
}


//scontrino intero

export interface Order{
    id:string;
    number:number;
    customerName:string;
    slot:string;
    lines:OrderLine[];
    total:number;
    status:OrderStatus;
    createdAt:string;

}



// un orario di ritiro (calcolato non salvato)

export interface Slot{
      id: string;
  day: 'oggi' | 'domani';   
  time: string;
  booked: number;
  capacity: number;
  started: boolean;
  full: boolean;
  available: boolean;

}


// I numeri della traccia
export interface Rules {
  SLOT_MINUTES: number;
  FIRST_SLOT: string;
  LAST_SLOT: string;
  SLOT_CAPACITY: number;
  MIN_TOTAL: number;
  MAX_PER_ITEM: number | null;   
}

// Cosa c'è sul quaderno
export interface Database {
  products: Product[];
  orders: Order[];
  nextNumber: number;
}