const express = require('express');
const cors = require('cors');
const createUserAdminController= require('./createUserAdminController')
const apiCreateUserAdmin = express();

// Automatically allow cross-origin requests
apiCreateUserAdmin.use(cors({ origin: true }));
apiCreateUserAdmin.use(express.json())


apiCreateUserAdmin.use('/',createUserAdminController);

// Expose Express API as a single Cloud Function:
module.exports = apiCreateUserAdmin;