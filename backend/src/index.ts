import express, { NextFunction, Response, Request } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.json({
    message: 'Welcome to the luxe roofing api',
  });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
