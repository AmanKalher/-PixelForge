import http from 'http';
import { io as Client } from 'socket.io-client';
import * as Y from 'yjs';
import app from '../src/app.js';
import { setupSocketServer } from '../src/sockets/socketServer.js';

async function runTests() {
  console.log('--- Starting PixelForge Backend Collaboration Test Suite ---\n');

  const server = http.createServer(app);
  setupSocketServer(server);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Test Server] Running on ${baseUrl}\n`);

  let client1 = null;
  let client2 = null;

  try {
    // 1. Health check test
    console.log('1. Testing GET /api/health...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    if (healthJson.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(healthJson)}`);
    }
    console.log('   ✓ Health check passed (status: ok)\n');

    // 2. Board Creation REST test
    console.log('2. Testing POST /api/boards...');
    const boardRes = await fetch(`${baseUrl}/api/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sprint Whiteboard Demo', settings: { gridSnap: true } }),
    });
    const boardJson = await boardRes.json();
    if (!boardJson.success || !boardJson.data?.id) {
      throw new Error(`Board creation failed: ${JSON.stringify(boardJson)}`);
    }
    const boardId = boardJson.data.id;
    console.log(`   ✓ Board created successfully with ID: ${boardId}\n`);

    // 3. Canvas Object Upsert REST test
    console.log('3. Testing POST /api/boards/:id/objects...');
    const objRes = await fetch(`${baseUrl}/api/boards/${boardId}/objects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'sticky-test-1',
        type: 'sticky',
        x: 100,
        y: 150,
        width: 200,
        height: 180,
        text: 'Hello from automated test!',
      }),
    });
    const objJson = await objRes.json();
    if (!objJson.success) {
      throw new Error(`Object upsert failed: ${JSON.stringify(objJson)}`);
    }
    console.log('   ✓ Canvas object upserted successfully\n');

    // 4. Query Objects REST test
    console.log('4. Testing GET /api/boards/:id/objects...');
    const getObjRes = await fetch(`${baseUrl}/api/boards/${boardId}/objects`);
    const getObjJson = await getObjRes.json();
    if (!getObjJson.success || getObjJson.count < 1) {
      throw new Error(`Object retrieval failed: ${JSON.stringify(getObjJson)}`);
    }
    console.log(`   ✓ Retrieved ${getObjJson.count} canvas objects\n`);

    // 5. Revision Snapshot REST test
    console.log('5. Testing POST /api/boards/:id/revisions...');
    const revRes = await fetch(`${baseUrl}/api/boards/${boardId}/revisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'manual', label: 'Milestone 1 Snapshot' }),
    });
    const revJson = await revRes.json();
    if (!revJson.success) {
      throw new Error(`Revision creation failed: ${JSON.stringify(revJson)}`);
    }
    console.log(`   ✓ Snapshot created (Revision #${revJson.data.revision_number})\n`);

    // 6. Share Link Generation REST test
    console.log('6. Testing POST /api/boards/:id/share...');
    const shareRes = await fetch(`${baseUrl}/api/boards/${boardId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'editor' }),
    });
    const shareJson = await shareRes.json();
    if (!shareJson.success || !shareJson.data.token) {
      throw new Error(`Share link creation failed: ${JSON.stringify(shareJson)}`);
    }
    console.log(`   ✓ Share link generated: ${shareJson.data.inviteUrl}\n`);

    // 7. Real-Time Socket.IO Collaboration Test
    console.log('7. Testing Real-time Socket.IO collaboration between 2 clients...');
    client1 = Client(baseUrl, { transports: ['websocket'] });
    client2 = Client(baseUrl, { transports: ['websocket'] });

    await Promise.all([
      new Promise((resolve) => client1.on('connect', resolve)),
      new Promise((resolve) => client2.on('connect', resolve)),
    ]);
    console.log('   ✓ Both Socket.IO clients connected');

    // Join board room
    await Promise.all([
      new Promise((resolve) => {
        client1.emit(
          'join-board',
          { boardId, user: { name: 'Alex Lee (Engine Lead)', color: '#3b82f6' } },
          resolve
        );
      }),
      new Promise((resolve) => {
        client2.emit(
          'join-board',
          { boardId, user: { name: 'Sam Blake (Backend Lead)', color: '#10b981' } },
          resolve
        );
      }),
    ]);
    console.log('   ✓ Both clients joined board room successfully');

    // Test cursor presence broadcast
    console.log('   Testing live cursor broadcast from Client 1 -> Client 2...');
    const cursorPromise = new Promise((resolve) => {
      client2.on('cursor-update', (payload) => {
        if (payload.cursor?.x === 320 && payload.cursor?.y === 480) {
          resolve(payload);
        }
      });
    });

    client1.emit('cursor-move', {
      boardId,
      cursor: { x: 320, y: 480 },
    });

    const receivedCursor = await Promise.race([
      cursorPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Cursor update timed out')), 4000)),
    ]);
    console.log(`   ✓ Client 2 received cursor update from "${receivedCursor.name}": (${receivedCursor.cursor.x}, ${receivedCursor.cursor.y})`);

    // Test canvas operation broadcast
    console.log('   Testing mutation operation broadcast from Client 1 -> Client 2...');
    const opPromise = new Promise((resolve) => {
      client2.on('operation-broadcast', (op) => {
        if (op.opId === 'test-op-1') {
          resolve(op);
        }
      });
    });

    client1.emit('canvas-operation', {
      boardId,
      operation: {
        opId: 'test-op-1',
        type: 'create',
        targetId: 'shape-rect-1',
        data: { id: 'shape-rect-1', type: 'rectangle', x: 200, y: 300, width: 140, height: 90 },
        timestamp: Date.now(),
      },
    });

    const receivedOp = await Promise.race([
      opPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Operation broadcast timed out')), 4000)),
    ]);
    console.log(`   ✓ Client 2 received operation: ${receivedOp.type} for target ${receivedOp.targetId}`);

    // Test board rename broadcast
    console.log('   Testing board rename broadcast from Client 1 -> Client 2...');
    const renamePromise = new Promise((resolve) => {
      client2.on('board-renamed', (data) => {
        if (data.title === 'Sprint Planning 2026') {
          resolve(data);
        }
      });
    });

    client1.emit('rename-board', {
      boardId,
      title: 'Sprint Planning 2026',
    });

    const receivedRename = await Promise.race([
      renamePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Rename broadcast timed out')), 4000)),
    ]);
    console.log(`   ✓ Client 2 received board rename: "${receivedRename.title}"`);

    // 8. Test Lock Request and Collaboration Chat Notification
    console.log('\n8. Testing Host Approval Workflow & Chat Notifications...');
    // Seed a locked object
    await fetch(`${baseUrl}/api/boards/${boardId}/objects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'locked-diagram-1',
        type: 'shape',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        isPixelForgeLocked: true,
      }),
    });

    // Client 2 requests access
    const chatPromise = new Promise((resolve) => {
      client1.on('chat:message', (msg) => {
        if (msg.type === 'lock_request' && msg.data?.objectId === 'locked-diagram-1') {
          resolve(msg);
        }
      });
    });

    const lockReqPromise = new Promise((resolve) => {
      client1.on('lock:request-received', (rec) => {
        if (rec.objectId === 'locked-diagram-1') {
          resolve(rec);
        }
      });
    });

    client2.emit('lock:request-access', {
      boardId,
      objectId: 'locked-diagram-1',
      objectName: 'Architecture Diagram',
      requesterId: 'client-user-2',
      requesterName: 'Sam Blake (Backend Lead)',
      requesterColor: '#10b981',
      note: 'Need to add database node',
    });

    const [chatMsg, lockReq] = await Promise.all([
      Promise.race([chatPromise, new Promise((_, reject) => setTimeout(() => reject(new Error('Chat notification timed out')), 4000))]),
      Promise.race([lockReqPromise, new Promise((_, reject) => setTimeout(() => reject(new Error('Lock request timed out')), 4000))]),
    ]);
    console.log(`   ✓ Host (Client 1) received chat lock_request from "${chatMsg.sender.name}" for "${chatMsg.data.objectName}"`);

    // 9. Test Lock Permission Enforcement (Unauthorized edit is blocked)
    console.log('9. Testing backend lock permission enforcement (unauthorized edit rejected)...');
    const rejectedPromise = new Promise((resolve) => {
      client2.on('lock:operation-rejected', (err) => {
        if (err.targetId === 'locked-diagram-1') {
          resolve(err);
        }
      });
    });

    client2.emit('canvas-operation', {
      boardId,
      userId: 'client-user-2',
      isHost: false,
      operation: {
        opId: 'unauthorized-op-1',
        type: 'update',
        targetId: 'locked-diagram-1',
        actorId: 'client-user-2',
        isHost: false,
        data: { id: 'locked-diagram-1', x: 999 },
      },
    });

    const rejectNotice = await Promise.race([
      rejectedPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Lock rejection timed out')), 4000)),
    ]);
    console.log(`   ✓ Backend correctly rejected unauthorized update: "${rejectNotice.reason}"`);

    // 10. Test Host Approval granting temporary access
    console.log('10. Testing Host Approval granting temporary access...');
    const grantedPromise = new Promise((resolve) => {
      client2.on('lock:access-granted', (grant) => {
        if (grant.objectId === 'locked-diagram-1' && grant.grantedTo === 'client-user-2') {
          resolve(grant);
        }
      });
    });

    client1.emit('lock:approve-access', {
      requestId: lockReq.id,
      boardId,
      objectId: 'locked-diagram-1',
      requesterId: 'client-user-2',
      requesterName: 'Sam Blake (Backend Lead)',
      objectName: 'Architecture Diagram',
      durationMinutes: 5,
    });

    const grantNotice = await Promise.race([
      grantedPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Approval grant timed out')), 4000)),
    ]);
    console.log(`   ✓ Client 2 received temporary access grant until: ${new Date(grantNotice.expiresAt).toLocaleTimeString()}`);

    // 11. Test Authorized Mutation Broadcast after approval
    console.log('11. Testing authorized mutation broadcast after approval...');
    const authorizedOpPromise = new Promise((resolve) => {
      client1.on('operation-broadcast', (op) => {
        if (op.opId === 'authorized-op-1') {
          resolve(op);
        }
      });
    });

    client2.emit('canvas-operation', {
      boardId,
      userId: 'client-user-2',
      isHost: false,
      operation: {
        opId: 'authorized-op-1',
        type: 'update',
        targetId: 'locked-diagram-1',
        actorId: 'client-user-2',
        isHost: false,
        data: { id: 'locked-diagram-1', x: 120, y: 120 },
      },
    });

    const authorizedOp = await Promise.race([
      authorizedOpPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Authorized op timed out')), 4000)),
    ]);
    console.log(`   ✓ Host (Client 1) successfully received authorized operation from temporary access holder: opId ${authorizedOp.opId}`);

    // 12. Test Yjs protocol relay (pf:ping / pf:pong and pf:y-update)
    console.log('12. Testing Yjs protocol relay (pf:ping, pf:pong, pf:y-update)...');
    const pongPromise = new Promise((resolve) => {
      client1.on('pf:pong', (pong) => {
        if (pong.sentAt === 12345) resolve(pong);
      });
    });
    client1.emit('pf:ping', { sentAt: 12345 });
    await Promise.race([
      pongPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('pf:pong timed out')), 4000)),
    ]);
    console.log('   ✓ Received pf:pong response with matching timestamp');

    const yUpdatePromise = new Promise((resolve) => {
      client2.on('pf:y-update', (payload) => {
        if (payload.room === boardId && Array.isArray(payload.update)) {
          resolve(payload);
        }
      });
    });

    client1.emit('pf:join', { room: boardId, userId: 'client-user-1' });
    client2.emit('pf:join', { room: boardId, userId: 'client-user-2' });
    const dummyYDoc = new Y.Doc();
    dummyYDoc.getMap('testMap').set('key', 'val');
    const validUpdate = Array.from(Y.encodeStateAsUpdate(dummyYDoc));
    client1.emit('pf:y-update', { room: boardId, update: validUpdate });

    const receivedYUpdate = await Promise.race([
      yUpdatePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('pf:y-update timed out')), 4000)),
    ]);
    console.log(`   ✓ Client 2 received Yjs update array length: ${receivedYUpdate.update.length}`);

    console.log('\n======================================================');
    console.log('🎉 ALL PIXELFORGE BACKEND TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
  } finally {
    if (client1) client1.disconnect();
    if (client2) client2.disconnect();
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
