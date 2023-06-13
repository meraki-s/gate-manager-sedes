const express = require('express');
const cors = require('cors');
const deleteUserController= require('./deleteUserController')
const apiDeleteUser = express();

// Automatically allow cross-origin requests
apiDeleteUser.use(cors({ origin: true }));
apiDeleteUser.use(express.json())


apiDeleteUser.use('/',deleteUserController);

// Expose Express API as a single Cloud Function:
module.exports = apiDeleteUser;