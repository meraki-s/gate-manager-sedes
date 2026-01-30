const { auth, db, admin } = require("../../../server");
const functions = require("firebase-functions");

const deleteUserController = async (req, res) => {
  try {
    const uid = req.body.uid;

    await auth.deleteUser(uid);

    await db.doc(`users/${uid}`).delete();

    await db.doc(`db/ferreyros/providers/${uid}`).delete();

    functions.logger.info(`'User deleted successfully.'`, {
      structuredData: true,
    });
    res.status(200).json({
      ok: true,
      msg: "User deleted successfully.",
    });
  } catch (error) {
    functions.logger.error(`Could not delete the user.`, error);
    res.status(500).json({
      ok: false,
      msg: "Error deleting user.",
      error,
    });
  }
};

module.exports = deleteUserController;
