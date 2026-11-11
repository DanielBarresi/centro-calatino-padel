import express from 'express';
import type {NextFunction,Request,Response} from 'express';
import {api} from './routes/api.ts';
import {AppError} from './orders.ts';


const app = express();


// qui leggo il json e lo mette i req.body
app.use(express.json());


//scrivo nel terminale richieste che modificano i dati

app.use((req,res,next) => {
    if(req.method !== 'GET') console.log(req.method, req.url);
    next();
});


//faccio iniziare tutte le rotte con /api

app.use('/api',api);

//gestore degli errori


app.use((err:Error, req:Request, res: Response, next:NextFunction) =>{
    if (err instanceof AppError){
        res.status(err.status).json({ error:err.message});
return;
    }

    console.error(err);
    res.status(500).json({error:'Errore interno del server'});
});

app.listen(3001,()=> {
    console.log('Server acceso su http://localhost:3001');
});