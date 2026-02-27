import express from 'express';
import identifyRoute from './routes/identify.route';

const app = express();

app.use(express.json());
app.use('/', identifyRoute);

// Root health check route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

export default app;
