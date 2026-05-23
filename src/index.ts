import express, { Application, Request, Response } from 'express';
import { config } from 'dotenv';
import connectDB from './db/db';
import routes from './routes';



const app: Application = express();

// connect dotenv file
config();

// connect database
connectDB();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3002;

app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({ success: true, message: 'API is running.......' });
})

// endpoint
app.use('/api',routes);


app.listen(PORT, () => {
    console.log(`SERVER IS STARTED AT http://localhost:${PORT}`);
})

