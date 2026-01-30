const admin = require( 'firebase-admin');

admin.initializeApp();
admin.firestore().settings({ timestampsInSnapshots: true });

const db = admin.firestore();

const auth = admin.auth();


module.exports ={
    db,
    auth,
    admin
}