const express = require('express');
const cors = require('cors');
const createLocationController= require('./createLocationController')
const apiCreateLocation = express();

// Automatically allow cross-origin requests
apiCreateLocation.use(cors({ origin: true }));
apiCreateLocation.use(express.json())


apiCreateLocation.use('/',createLocationController);

// Expose Express API as a single Cloud Function:
module.exports = apiCreateLocation;