import { Router } from 'express';
import { identifyController } from '../controllers/identify.controller';

const router = Router();

router.post('/identify', identifyController);

// GET /identify route for health check or info
router.get('/identify', (req, res) => {
	res.send('Identify endpoint is available');
});

export default router;
