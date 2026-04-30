import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.get('/muse', (req: Request, res: Response) => {
    res.send("OK")
})

app.listen(process.env.PORT, () => {
    console.log("Server is running on port", process.env.PORT);
    
})
