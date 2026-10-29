import { v4 as uuidv4 } from 'uuid';
import { memoryStore } from '../config/db.js';

export const LockApprovalHandler = {
  /**
   * Handle collaborator request for edit access to a locked object
   */
  handleRequestAccess(socket, io, payload) {
    const {
      boardId,
      objectId,
      objectName = 'Object',
      requesterId,
      requesterName = 'Collaborator',
      requesterColor = '#F26B5B',
      note = '',
    } = payload || {};

    if (!boardId || !objectId || !requesterId) return;

    const requestId = uuidv4();
    const requestRecord = {
      id: requestId,
      boardId,
      objectId,
      objectName,
      requesterId,
      requesterName,
      requesterColor,
      note,
      status: 'pending',
      durationMinutes: 5,
      createdAt: Date.now(),
    };

    memoryStore.lockedObjectApprovals.set(requestId, requestRecord);

    // Create a collaboration chat notification item
    const chatMessage = {
      id: `chat-req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'lock_request',
      boardId,
      sender: {
        id: requesterId,
        name: requesterName,
        color: requesterColor,
      },
      text: `requested temporary editing access for locked object "${objectName}"`,
      data: {
        requestId,
        objectId,
        objectName,
        requesterId,
        requesterName,
        status: 'pending',
        durationMinutes: 5,
      },
      timestamp: Date.now(),
    };

    if (!memoryStore.chatMessages.has(boardId)) {
      memoryStore.chatMessages.set(boardId, []);
    }
    const messages = memoryStore.chatMessages.get(boardId);
    messages.push(chatMessage);
    if (messages.length > 100) messages.shift();

    // Broadcast both the typed lock-request event and chat message to everyone in the room
    io.to(boardId).emit('lock:request-received', requestRecord);
    io.to(boardId).emit('chat:message', chatMessage);

    console.log(`[LockApproval] User "${requesterName}" requested access for object "${objectId}" in board "${boardId}"`);
  },

  /**
   * Handle host approval of a lock access request
   */
  handleApproveAccess(socket, io, payload) {
    const {
      requestId,
      boardId,
      objectId,
      requesterId,
      requesterName = 'Collaborator',
      objectName = 'Object',
      durationMinutes = 5,
    } = payload || {};

    if (!boardId || !objectId || !requesterId) return;

    // Update approval record
    if (requestId && memoryStore.lockedObjectApprovals.has(requestId)) {
      const rec = memoryStore.lockedObjectApprovals.get(requestId);
      rec.status = 'approved';
    }

    // Register active temporary grant
    const grantKey = `${boardId}:${objectId}:${requesterId}`;
    const expiresAt = Date.now() + durationMinutes * 60 * 1000;
    memoryStore.temporaryAccessGrants.set(grantKey, {
      boardId,
      objectId,
      grantedTo: requesterId,
      grantedBy: socket.id,
      expiresAt,
    });

    // Update any matching lock_request in chat messages
    const messages = memoryStore.chatMessages.get(boardId) || [];
    for (const msg of messages) {
      if (msg.data?.requestId === requestId || (msg.data?.objectId === objectId && msg.data?.requesterId === requesterId)) {
        msg.data.status = 'approved';
        msg.data.expiresAt = expiresAt;
      }
    }

    // Post system announcement to chat
    const sysMessage = {
      id: `chat-sys-${Date.now()}`,
      type: 'system',
      boardId,
      sender: { id: 'system', name: 'Host / System', color: '#6366f1' },
      text: `Host approved temporary editing access on "${objectName}" for ${requesterName} (${durationMinutes} min).`,
      timestamp: Date.now(),
    };
    messages.push(sysMessage);
    if (messages.length > 100) messages.shift();

    // Broadcast access-granted and updated chat
    io.to(boardId).emit('lock:access-granted', {
      requestId,
      boardId,
      objectId,
      grantedTo: requesterId,
      expiresAt,
      objectName,
    });
    io.to(boardId).emit('chat:message', sysMessage);

    console.log(`[LockApproval] Host granted temporary edit access on "${objectId}" to "${requesterId}" until ${new Date(expiresAt).toLocaleTimeString()}`);
  },

  /**
   * Handle host rejection of a lock access request
   */
  handleRejectAccess(socket, io, payload) {
    const {
      requestId,
      boardId,
      objectId,
      requesterId,
      requesterName = 'Collaborator',
      objectName = 'Object',
    } = payload || {};

    if (!boardId || !objectId || !requesterId) return;

    if (requestId && memoryStore.lockedObjectApprovals.has(requestId)) {
      const rec = memoryStore.lockedObjectApprovals.get(requestId);
      rec.status = 'rejected';
    }

    // Update matching lock_request in chat messages
    const messages = memoryStore.chatMessages.get(boardId) || [];
    for (const msg of messages) {
      if (msg.data?.requestId === requestId) {
        msg.data.status = 'rejected';
      }
    }

    const sysMessage = {
      id: `chat-sys-${Date.now()}`,
      type: 'system',
      boardId,
      sender: { id: 'system', name: 'Host / System', color: '#e11d48' },
      text: `Host declined editing access on "${objectName}" for ${requesterName}.`,
      timestamp: Date.now(),
    };
    messages.push(sysMessage);

    io.to(boardId).emit('lock:access-rejected', {
      requestId,
      boardId,
      objectId,
      requesterId,
    });
    io.to(boardId).emit('chat:message', sysMessage);

    console.log(`[LockApproval] Host rejected edit access on "${objectId}" for "${requesterId}"`);
  },

  /**
   * Handle collaborator releasing their temporary access
   */
  handleReleaseAccess(socket, io, payload) {
    const { boardId, objectId, requesterId, requesterName = 'Collaborator', objectName = 'Object' } = payload || {};
    if (!boardId || !objectId || !requesterId) return;

    const grantKey = `${boardId}:${objectId}:${requesterId}`;
    memoryStore.temporaryAccessGrants.delete(grantKey);

    const messages = memoryStore.chatMessages.get(boardId) || [];
    const sysMessage = {
      id: `chat-sys-${Date.now()}`,
      type: 'system',
      boardId,
      sender: { id: 'system', name: 'System', color: '#64748b' },
      text: `${requesterName} released temporary editing access on "${objectName}".`,
      timestamp: Date.now(),
    };
    messages.push(sysMessage);

    io.to(boardId).emit('lock:access-revoked', {
      boardId,
      objectId,
      userId: requesterId,
    });
    io.to(boardId).emit('chat:message', sysMessage);

    console.log(`[LockApproval] User "${requesterId}" released access on "${objectId}"`);
  },

  /**
   * Handle normal chat messages between collaborators
   */
  handleChatMessage(socket, io, payload) {
    const { boardId, text, sender } = payload || {};
    if (!boardId || !text || !sender) return;

    const chatMessage = {
      id: `chat-user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'user',
      boardId,
      sender: {
        id: sender.id || socket.id,
        name: sender.name || 'Anonymous Guest',
        color: sender.color || '#F26B5B',
      },
      text: String(text).trim(),
      timestamp: Date.now(),
    };

    if (!memoryStore.chatMessages.has(boardId)) {
      memoryStore.chatMessages.set(boardId, []);
    }
    const messages = memoryStore.chatMessages.get(boardId);
    messages.push(chatMessage);
    if (messages.length > 100) messages.shift();

    io.to(boardId).emit('chat:message', chatMessage);
  },

  /**
   * Fetch chat history for room
   */
  handleFetchChatHistory(socket, io, payload, callback) {
    const { boardId } = payload || {};
    if (!boardId) return;
    const history = memoryStore.chatMessages.get(boardId) || [];
    if (typeof callback === 'function') {
      callback({ success: true, messages: history });
    } else {
      socket.emit('chat:history', history);
    }
  },

  /**
   * Check if a specific user currently has permission to edit an object
   */
  hasEditPermission(boardId, objectId, userId, isHost = false) {
    if (isHost) return true;
    const grantKey = `${boardId}:${objectId}:${userId}`;
    const grant = memoryStore.temporaryAccessGrants.get(grantKey);
    if (grant && grant.expiresAt > Date.now()) {
      return true;
    }
    return false;
  },
};
