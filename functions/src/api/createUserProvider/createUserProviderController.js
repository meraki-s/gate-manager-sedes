const { auth, db, admin } = require("../../../server");
const functions = require("firebase-functions");

const createUserProviderController = async (req, res) => {
  try {
    const user = req.body.user;
    const provider = req.body.provider;
    const imageURL = req.body.imageURL;

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
      role: "Provider",
    });

    await db.doc(`users/${createUser.uid}`).set({
      uid: createUser.uid,
      email: user.email,
      name: user.name,
      lastname: user.lastname,
      displayName: `${user.name} ${user.lastname}`,
      dni: user.dni,
      jobTitle: user.charge,
      phone: user.phone,
      companyName: provider.companyName,
      companyRuc: provider.companyRuc,
      role: "Provider",
      status: "enabled",
      providerId: provider.providerId ? provider.providerId : createUser.uid,
    });

    await db.doc(`providers/${createUser.uid}`).set({
      companyName: provider.companyName,
      companyRuc: provider.companyRuc,
      companyAddress: provider.companyAddress,
      companyField: provider.companyField,
      companyLogoURL: imageURL,
      salesRepresentative: provider.salesRepresentative,
      ceo: provider.ceo,
      numberOfWorkers: 0,
      createdBy: `${user.name} ${user.lastname}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      editedAt: `${user.name} ${user.lastname}`,
      editedBy: admin.firestore.FieldValue.serverTimestamp(),
      status: "registered",
      id: createUser.uid,
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
      msg: "User created successfully.",
      error,
    });
  }
};

module.exports = createUserProviderController;
