const { Router } = require('express');
const createUserAdminController=require('./createUserAdminController')

const router = Router();

router.post('/', createUserAdminController);


module.exports = router;