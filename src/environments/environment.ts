export const environment = {
  firebase: {
    projectId: 'gate-manager-sedes-staging',
    appId: '1:506624533796:web:6ef64a9a831b738fc9ffb1',
    storageBucket: 'gate-manager-sedes-staging.appspot.com',
    apiKey: 'AIzaSyAK_i6cujoZCBHDQsjYnTxZignL9kHYsug',
    authDomain: 'gate-manager-sedes-staging.firebaseapp.com',
    messagingSenderId: '506624533796',
    measurementId: 'G-TXQXZM73RK',
  },
  registerUserProviderURL:
    'https://us-central1-gate-manager-staging.cloudfunctions.net/createUserProvider',
  createUser:
    'https://us-central1-gate-manager-staging.cloudfunctions.net/createUserAdmin',
  deleteUser:
    'https://us-central1-gate-manager-staging.cloudfunctions.net/deleteUser',
  queryDriveURL:
    'https://us-central1-gate-manager-staging.cloudfunctions.net/QueryDriveInduccion',
  useEmulators: false,
};