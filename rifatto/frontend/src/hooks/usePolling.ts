import {useCallback,useEffect,useRef,useState} from 'react';

//carica dei dati e li ricarica ogni 3 sec

export function usePolling <T>(load: () => Promise <T>, initial:T, intervalMs= 3000){
    const [data,setData] = useState <T> (initial);
    const [loading,setLoading] = useState(true);
const [error, setError] = useState('');
    const loadRef = useRef(load);
    useEffect(() => {
        loadRef.current = load;
    }, [load]);

    //corsa al server una però

    const refresh = useCallback(async () =>{
        try{
            setData(await loadRef.current());
            setError('');
        }catch (e){
            setError (( e as Error).message);
        } finally{
            setLoading(false);
        }
    },[]);


    //corro subito poi ogni 3 secondi.Quando il componente sparisce,smetto di correre
    useEffect(() => {
        refresh();
        const timer = setInterval(refresh,intervalMs);
        return()=> clearInterval(timer);
    },[refresh,intervalMs]);
    return {data,loading,error,refresh};
}