const express = require('express');
const cors = require('cors');
const queryDriveInduccionController= require('./queryDriveInduccionController')
const apiQueryDriveInduccion = express();

// Automatically allow cross-origin requests
apiQueryDriveInduccion.use(cors({ origin: true }));
apiQueryDriveInduccion.use(express.json())


apiQueryDriveInduccion.use('/:dni',queryDriveInduccionController);

// Expose Express API as a single Cloud Function:
module.exports = apiQueryDriveInduccion;