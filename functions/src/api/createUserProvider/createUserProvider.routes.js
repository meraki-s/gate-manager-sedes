const { Router } = require('express');
const createUserProviderController=require('./createUserProviderController')

const router = Router();

router.post('/', createUserProviderController);


module.exports = router;