const { auth, db, admin } = require("../../../server");
const functions = require("firebase-functions");

const createUserAdminController = async (req, res) => {
  try {
    const user = req.body.user;

    const createUser = await auth.createUser({
      email: user.email,
      password: user.password,
    });

    await auth.updateUser(createUser.uid, {
      disabled: false,
      emailVerified: true,
      displayName: `${user.name} ${user.lastname}`,
    });

    await auth.setCustomUserClaims(createUser.uid, {
      role: user.role,
    });

    const fsUser = {
      uid: createUser.uid,
      email: user.email,
      name: user.name,
      lastname: user.lastname,
      displayName: `${user.name} ${user.lastname}`,
      dni: user.dni,
      jobTitle: user.charge,
      phone: user.phone,
      // locations: [{ name: user.location.name, id: user.location.id }],
      // currentLocation: user.location.id,
      companyName: "",
      companyRuc: "",
      role: user.role,
      status: "enabled",
      providerId: "",
    };

    await db.doc(`users/${createUser.uid}`).set(fsUser);

    await db.doc(`locations/${user.location.id}`).update({
      usersRelated: admin.firestore.FieldValue.arrayUnion(fsUser),
    });

    functions.logger.info(`'User created successfully.'`, {
      structuredData: true,
    });
    res.status(200).json({
      ok: true,
      msg: "User created successfully.",
    });
  } catch (error) {
    functions.logger.error(`Could not create user.`, error);
    res.status(500).json({
      ok: false,
      msg: "Error creating user.",
      error,
    });
  }
};

module.exports = createUserAdminController;
