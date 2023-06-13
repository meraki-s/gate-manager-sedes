const express = require('express');
const cors = require('cors');
const createUserProviderController= require('./createUserProviderController')
const apiCreateUserProvider = express();

// Automatically allow cross-origin requests
apiCreateUserProvider.use(cors({ origin: true }));
apiCreateUserProvider.use(express.json())


apiCreateUserProvider.use('/',createUserProviderController);

// Expose Express API as a single Cloud Function:
module.exports = apiCreateUserProvider;