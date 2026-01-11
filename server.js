import 'dotenv/config.js'
import cors from 'cors'

import ConnectDb from './config/db.js'
import authRoutes from './routes/authroutes.js'
import webhookRoutes from './routes/webhookroutes.js'
import teamroutes from './routes/teamroutes.js'
import managerroutes from './routes/managerroutes.js'

import express from  'express';



const app = express();

app.use(cors({
  origin: ['http://localhost:5173',
  'process.env.FRONTEND_URL'],
  credentials: true
}));

app.use(express.json());
const PORT = process.env.PORT || 3000
ConnectDb();

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/team',teamroutes)
app.use('/api/manager',managerroutes);

app.listen(PORT,()=>{
    console.log(`server is working ${PORT}`);
})