/**
 * Royal Ludo Arena v2.0.0 — Zero-Dependency RFC 6455 WebSocket Server
 * Runs natively on Node.js http.Server upgrade events with zero npm packages.
 */
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

export class WSClient extends EventEmitter {
  constructor(socket, req) {
    super();
    this.socket = socket;
    this.req = req;
    this.id = crypto.randomUUID();
    this.alive = true;
    this.closed = false;
    this._buffer = Buffer.alloc(0);

    socket.on('data', chunk => this._onData(chunk));
    socket.on('close', () => this._handleClose());
    socket.on('error', () => this._handleClose());
  }

  sendJSON(payload) {
    if (this.closed || this.socket.destroyed) return;
    this.sendText(JSON.stringify(payload));
  }

  sendText(text) {
    if (this.closed || this.socket.destroyed) return;
    const data = Buffer.from(text, 'utf8');
    this._sendFrame(0x1, data);
  }

  ping() {
    if (this.closed || this.socket.destroyed) return;
    this._sendFrame(0x9, Buffer.alloc(0));
  }

  close(code = 1000) {
    if (this.closed) return;
    const payload = Buffer.alloc(2);
    payload.writeUInt16BE(code, 0);
    this._sendFrame(0x8, payload);
    this.socket.end();
    this._handleClose();
  }

  _sendFrame(opcode, payload) {
    const len = payload.length;
    let header;
    if (len < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x80 | opcode;
      header[1] = len;
    } else if (len < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | opcode;
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | opcode;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    try {
      if (this.socket.writableLength > 1048576) { this.close(1009); return; }
      this.socket.write(Buffer.concat([header, payload]));
    } catch {
      this._handleClose();
    }
  }

  _onData(chunk) {
    if (this._buffer.length + chunk.length > 262158) { this.close(1009); return; }
    this._buffer = Buffer.concat([this._buffer, chunk]);
    while (this._buffer.length >= 2) {
      const b0 = this._buffer[0];
      const b1 = this._buffer[1];
      const opcode = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      // Browsers MUST mask client frames. Fragmented / compressed frames are
      // unsupported by this intentionally minimal preview transport.
      if (!masked || !(b0 & 0x80) || (b0 & 0x70) || ![0x1, 0x8, 0x9, 0xA].includes(opcode)) {
        this.close(1002);
        return;
      }
      let payloadLen = b1 & 0x7f;
      let offset = 2;

      if (payloadLen === 126) {
        if (this._buffer.length < 4) return;
        payloadLen = this._buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLen === 127) {
        if (this._buffer.length < 10) return;
        payloadLen = Number(this._buffer.readBigUInt64BE(2));
        offset = 10;
      }

      // Guard against oversized abusive frames (> 256 KB)
      if (payloadLen > 262144) {
        this.close(1009);
        return;
      }

      const totalLen = offset + (masked ? 4 : 0) + payloadLen;
      if (this._buffer.length < totalLen) return;

      let maskKey = null;
      if (masked) {
        maskKey = this._buffer.subarray(offset, offset + 4);
        offset += 4;
      }

      const payload = Buffer.from(this._buffer.subarray(offset, offset + payloadLen));
      this._buffer = this._buffer.subarray(totalLen);

      if (masked && maskKey) {
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= maskKey[i % 4];
        }
      }

      if (opcode === 0x8) {
        this.close(1000);
        return;
      } else if (opcode === 0x9) {
        this._sendFrame(0xA, payload); // Pong
      } else if (opcode === 0xA) {
        this.alive = true;
      } else if (opcode === 0x1) {
        const text = payload.toString('utf8');
        this.emit('message', text);
      }
    }
  }

  _handleClose() {
    if (this.closed) return;
    this.closed = true;
    this.emit('close');
  }
}

export class WSServer extends EventEmitter {
  constructor(httpServer, path = '/ws') {
    super();
    this.path = path;
    this.clients = new Set();

    httpServer.on('upgrade', (req, socket) => {
      const urlPath = (req.url || '').split('?')[0];
      if (urlPath !== this.path) {
        socket.destroy();
        return;
      }
      const key = req.headers['sec-websocket-key'];
      const origin = req.headers.origin;
      let trustedOrigin = true;
      try { if (origin) trustedOrigin = new URL(origin).host === req.headers.host; } catch { trustedOrigin = false; }
      if (!trustedOrigin || req.headers['sec-websocket-version'] !== '13') {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }
      if (!key || typeof key !== 'string' || Buffer.from(key, 'base64').length !== 16) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }
      const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
      );
      const client = new WSClient(socket, req);
      this.clients.add(client);
      client.on('close', () => this.clients.delete(client));
      this.emit('connection', client, req);
    });

    this._heartbeat = setInterval(() => {
      for (const c of this.clients) {
        if (!c.alive) {
          c.close(1001);
          continue;
        }
        c.alive = false;
        c.ping();
      }
    }, 30000);
    this._heartbeat.unref?.();
  }

  close() {
    clearInterval(this._heartbeat);
    for (const c of this.clients) c.close(1001);
    this.clients.clear();
  }
}
