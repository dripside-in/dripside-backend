import express from 'express';
import { adminRouter, sampleRouter, userRouter, artistRouter } from '.';


const router = express.Router();

router.use('/admin', adminRouter);
router.use('/user', userRouter);
router.use('/sample', sampleRouter);
router.use('/artist', artistRouter);

export default router;
