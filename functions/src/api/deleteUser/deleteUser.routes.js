const { Router } = require('express');
const deleteUserController=require('./deleteUserController')

const router = Router();

router.post('/', deleteUserController);


module.exports = router;