const functions = require("firebase-functions");
const admin = require("firebase-admin");
const apiCreateUserProvider = require("./src/api/createUserProvider/createUserProvider");
const apiCreateUserAdmin = require("./src/api/createUserAdmin/createUserAdmin");
const apiDeleteUser = require("./src/api/deleteUser/deleteUser");
const apiQueryDriveInduccion = require("./src/api/queryDriveInduccion/queryDriveInduccion");

exports.createUserProvider = functions.https.onRequest(apiCreateUserProvider);
exports.createUserAdmin = functions.https.onRequest(apiCreateUserAdmin);
exports.deleteUser = functions.https.onRequest(apiDeleteUser);
exports.QueryDriveInduccion = functions.https.onRequest(apiQueryDriveInduccion);
