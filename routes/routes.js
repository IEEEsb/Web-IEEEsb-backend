const { Router }	= require('express');
const usersRouter	= require('./users');

const router = Router();

router.use(usersRouter);

export default router;
