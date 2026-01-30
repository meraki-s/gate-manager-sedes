// export const environment = {
//   firebase: {
//     projectId: 'gate-manager-sedes-staging',
//     appId: '1:506624533796:web:6ef64a9a831b738fc9ffb1',
//     storageBucket: 'gate-manager-sedes-staging.appspot.com',
//     apiKey: 'AIzaSyAK_i6cujoZCBHDQsjYnTxZignL9kHYsug',
//     authDomain: 'gate-manager-sedes-staging.firebaseapp.com',
//     messagingSenderId: '506624533796',
//     measurementId: 'G-TXQXZM73RK',
//   },
//   registerUserProviderURL:
//     'https://us-central1-gate-manager-sedes-staging.cloudfunctions.net/createUserProvider',
//   createUser:
//     'https://us-central1-gate-manager-sedes-staging.cloudfunctions.net/createUserAdmin',
//   deleteUser:
//     'https://us-central1-gate-manager-sedes-staging.cloudfunctions.net/deleteUser',
//   queryDriveURL:
//     'https://us-central1-gate-manager-sedes-staging.cloudfunctions.net/QueryDriveInduccion',
//   createLocationURL:
//     'https://us-central1-gate-manager-sedes-staging.cloudfunctions.net/createLocation',
//   useEmulators: false,
// };

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyChjBrjaei0f9Se6_hTG2cySlcKvxmXcjg',
    authDomain: 'gate-manager-staging.firebaseapp.com',
    projectId: 'gate-manager-staging',
    storageBucket: 'gate-manager-staging.appspot.com',
    messagingSenderId: '344809774648',
    appId: '1:344809774648:web:f3af0ab1d8b5ed4a1b90cd',
    measurementId: 'G-0KWP4BTMV5',
  },
  registerUserProviderURL:
    'https://us-central1-gate-manager-staging.cloudfunctions.net/createUserProvider',
  createUser:
    'https://us-central1-gate-manager-staging.cloudfunctions.net/createUserAdmin',
  deleteUser:
    'https://us-central1-gate-manager-staging.cloudfunctions.net/deleteUser',
  queryDriveURL:
    'https://us-central1-gate-manager-staging.cloudfunctions.net/QueryDriveInduccion',
  createLocationURL:
    'https://us-central1-gate-manager-sedes-staging.cloudfunctions.net/createLocation',
  useEmulators: false,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
