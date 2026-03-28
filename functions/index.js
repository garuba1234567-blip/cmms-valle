const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Notificación al crear orden
exports.notifyOrderCreate = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    if (!order) return null;

    const usersSnap = await admin.firestore().collection('users')
      .where('fcmToken', '!=', null)
      .get();

    const tokens = usersSnap.docs
      .map((d) => d.data().fcmToken)
      .filter(Boolean);

    if (!tokens.length) return null;

    const payload = {
      notification: {
        title: 'Nueva orden',
        body: `${order.title || 'Orden'}`.trim(),
      },
      data: {
        url: '/?view=orders',
        orderId: context.params.orderId,
      },
    };

    await admin.messaging().sendToDevice(tokens, payload, { priority: 'high' });
    return null;
  });

// Notificación cuando cambia el asignado
exports.notifyOrderAssign = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};

    if (before.assignedTo === after.assignedTo) return null;
    const assignee = after.assignedTo;
    if (!assignee) return null;

    const usersRef = admin.firestore().collection('users');
    const [byName, byUsername, byNombre] = await Promise.all([
      usersRef.where('name', '==', assignee).get(),
      usersRef.where('username', '==', assignee).get(),
      usersRef.where('nombre', '==', assignee).get()
    ]);

    const tokens = new Set();
    ;[byName, byUsername, byNombre].forEach(snap => {
      snap.forEach(doc => {
        const data = doc.data() || {};
        if (data.fcmToken) tokens.add(data.fcmToken);
      });
    });

    if (!tokens.size) return null;

    const payload = {
      notification: {
        title: 'Orden asignada',
        body: `${after.title || 'Orden'} ? ${assignee}`,
      },
      data: {
        url: '/?view=orders',
        orderId: context.params.orderId,
        assignedTo: assignee
      },
    };

    await admin.messaging().sendToDevice(Array.from(tokens), payload, { priority: 'high' });
    return null;
  });
