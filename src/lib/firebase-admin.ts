let adminAuth: any = null;

try {
  const { getAuth } = require("firebase-admin/auth");
  const { getApps, initializeApp, cert } = require("firebase-admin/app");

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId && privateKey.includes("BEGIN PRIVATE KEY")) {
    const adminApp =
      getApps().length === 0
        ? initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey: privateKey.replace(/\\n/g, "\n"),
            }),
          })
        : getApps()[0];
    adminAuth = getAuth(adminApp);
  }
} catch (e) {
  console.warn("Firebase Admin not initialized (dev mode):", (e as Error).message);
}

export { adminAuth };
