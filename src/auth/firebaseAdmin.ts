import * as firebase from 'firebase-admin';

const firebase_params = {
    type: process.env.FSA_type,
    projectId: process.env.FSA_project_id,
    privateKeyId: process.env.FSA_private_key_id,
    privateKey: process.env.FSA_private_key,
    clientEmail: process.env.FSA_client_email,
    clientId: process.env.FSA_client_id,
    authUri: process.env.FSA_auth_uri,
    tokenUri: process.env.FSA_token_uri,
    authProviderX509CertUrl: process.env.FSA_auth_provider_x509_cert_url,
    clientC509CertUrl: process.env.FSA_client_x509_cert_url
}

console.log(firebase_params);

const defaultApp = firebase.initializeApp({
    credential: firebase.credential.cert(firebase_params),
    databaseURL: "https://fir-auth-bd895.firebaseio.com"
});

export {
    defaultApp
}