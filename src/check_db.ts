import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function check() {
  try {
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    console.log('events collection size:', eventsSnapshot.size);
    if (eventsSnapshot.size > 0) {
      console.log('Sample event:', eventsSnapshot.docs[0].data());
    }

    const suKienSnapshot = await getDocs(collection(db, 'sự kiện'));
    console.log('sự kiện collection size:', suKienSnapshot.size);
    if (suKienSnapshot.size > 0) {
      console.log('Sample sự kiện:', suKienSnapshot.docs[0].data());
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
check();
