const { Router } = require('express');
const createLocationController=require('./createLocationController')

const router = Router();

router.post('/', createLocationController);


module.exports = router;