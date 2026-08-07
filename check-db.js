require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

async function checkDb() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.error('FIREBASE_SERVICE_ACCOUNT_JSON is missing');
    return;
  }
  
  const serviceAccount = JSON.parse(serviceAccountJson);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();
  console.log('Connected to Firestore, fetching waitlist...');
  
  try {
    const snapshot = await db.collection('waitlist').get();
    if (snapshot.empty) {
      console.log('The waitlist collection is completely empty.');
      return;
    }
    
    console.log(`Found ${snapshot.size} entries:`);
    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
    });
  } catch (err) {
    console.error('Error fetching waitlist:', err);
  }
}

checkDb();
