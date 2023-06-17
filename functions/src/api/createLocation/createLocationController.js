const { db, admin } = require("../../../server");
const functions = require("firebase-functions");

const createLocationController = async (req, res) => {
  // Set CORS headers for preflight requests
  // Allow GETs from any origin with the Content-Type header
  // and cache preflight response for 3600s

  // res.set("Access-Control-Allow-Origin", "*");

  // if (req.method === "OPTIONS") {
  //   // Send response to OPTIONS requests
  //   res.set("Access-Control-Allow-Methods", "GET");
  //   res.set("Access-Control-Allow-Headers", "Content-Type");
  //   res.set("Access-Control-Max-Age", "3600");
  //   res.status(204).send("");
  // } else {
  //   res.send("Hello World!");
  // }

  try {
    const location = req.body.location;

    const locationRef = await db.collection("locations").add({
      name: location.name,
      status: "enabled",
      workersOnLocation: 0,
      usersRelated: location.user.role === "Superuser" ? [location.user] : [],
      visits: 0,
      worksInProgress: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: location.user.displayName,
      editedAt: admin.firestore.FieldValue.serverTimestamp(),
      editedBy: location.user.displayName,
    });

    // if user is superuser, add it also to his locations list
    if (location.user.role === "Superuser") {
      await db.doc(`users/${location.user.uid}`).update({
        locations: admin.firestore.FieldValue.arrayUnion({
          name: location.name,
          id: locationRef.id,
        }),
      });
    }

    functions.logger.info(`'Location created successfully.'`, {
      structuredData: true,
    });
    res.status(200).json({
      ok: true,
      msg: "Location created successfully.",
    });
  } catch (error) {
    functions.logger.error(`Could not create Location.`, error);
    res.status(500).json({
      ok: false,
      msg: "Error creating Location.",
      error,
    });
  }
};

module.exports = createLocationController;
