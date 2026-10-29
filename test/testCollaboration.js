import http from 'http';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import { setupSocketServer } from '../src/sockets/socketServer.js';

async function runTests() {
  console.log('--- Starting PixelForge Backend Collaboration Test Suite ---\n');

  const server = http.createServer(app);
  setupSocketServer(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
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
