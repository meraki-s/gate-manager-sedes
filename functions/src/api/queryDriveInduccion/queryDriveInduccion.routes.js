const { Router } = require('express');
const queryDriveInduccionController=require('./queryDriveInduccionController')

const router = Router();

router.post('/', queryDriveInduccionController);


module.exports = router;