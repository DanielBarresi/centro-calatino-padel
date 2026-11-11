import type { AppConfig, CartItem,Order,Product,Slot} from './types';

//questa e una funzione che fa tutte le richieste

async function request <T>(url:string,options:RequestInit = {}): Promise <T> {
    let res:Response;
    try{
        res = await fetch ('/api' + url,{
            ...options,
            headers: { 'Content-type' : 'application/json'},
        });
    } catch{
        throw new Error ('Server non raggiungibile. È acceso?');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Errore ' + res.status);
    return data as T;
}

//scorciatoia per le richieste POST
function post <T> (url:string, body?: unknown): Promise <T>{
    return request <T> (url, {method:'POST', body: JSON.stringify(body ?? {}) });
}

//tutti i 'bigliettini' che il front end può mandare

export const api= {
    getConfig:() => request<AppConfig>('/config'),
    getProducts: () => request <Product[]> ('/products'),
    getSlots:() => request <Slot[]> ('/slots'),

    getAllOrders: () => request<Order[]> ('/orders'),
    getMyOrders: (ids:string[]) =>
    ids.length === 0 ? Promise.resolve([]) : request<Order[]>('/orders?ids=' + ids.join(',')),

  createOrder: (data: { customerName: string; slot: string; items: CartItem[] }) => post<Order>('/orders', data),
  advanceOrder: (id: string) => post<Order>('/orders/' + id + '/advance'),
  cancelOrder: (id: string) => post<Order>('/orders/' + id + '/cancel'),
  reset: () => post<{ ok: boolean }>('/reset'),
}

