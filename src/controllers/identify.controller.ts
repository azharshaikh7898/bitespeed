import { Request, Response, NextFunction } from 'express';
import { identifyService } from '../services/identify.service';

export const identifyController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phoneNumber } = req.body;
    const result = await identifyService.identify({ email, phoneNumber });
    res.status(200).json({ contact: result });
  } catch (error) {
    next(error);
  }
};
