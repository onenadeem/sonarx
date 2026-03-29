/**
 * Local development relay server for SonarX.
 *
 * Run this on the SAME machine as your Metro bundler:
 *   npm run relay
 *
 * Both phones must be on the same WiFi network as this machine.
 *
 * Two services:
 *   Port 8765 — GUN relay (used for presence/online status only)
 *   Port 8766 — Simple WebSocket message relay (reliable pub/sub for chat)
 */
const http = require("http");
const Gun = require("gun");
const os = require("os");
const WebSocketServer = require("ws").Server;

// ─── Helper: get all LAN IPs ────────────────────────────────────────────────
function getLanIPs() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const addresses of Object.values(nets)) {
    for (const addr of addresses) {
      if (addr.family === "IPv4" && !addr.internal) ips.push(addr.address);
    }
  }
  return ips;
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE 1 — GUN relay (presence only)
// ════════════════════════════════════════════════════════════════════════════
const GUN_PORT = 8765;
const gunServer = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("GUN relay OK\n");
    return;
  }
});

Gun({ web: gunServer, file: "radata", multicast: false });

gunServer.listen(GUN_PORT, "0.0.0.0", () => {
  const ips = getLanIPs();
  console.log("\n✅  GUN presence relay running!");
  ips.forEach((ip) => console.log(`   http://${ip}:${GUN_PORT}/gun`));
});

gunServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌  Port ${GUN_PORT} already in use.\n`);
  } else {
    console.error("GUN relay error:", err);
  }
  process.exit(1);
});

// ════════════════════════════════════════════════════════════════════════════
// SERVICE 2 — Simple WebSocket message relay
//
// Protocol (JSON frames over WebSocket):
//   Client → Server  { type:"subscribe", inbox:"myPhoneNumber" }
//   Client → Server  { type:"send", to:"theirNumber", id:"msgUUID", data:{...} }
//   Server → Client  { type:"message", id:"msgUUID", data:{...} }
//   Server → Client  { type:"ack", id:"msgUUID" }
// ════════════════════════════════════════════════════════════════════════════
const MSG_PORT = 8766;

// subscribers: Map<peerId, ws>
const subscribers = new Map();
// pendingMessages: Map<peerId, Array<{id, data}>>
const pendingMessages = new Map();

const msgWss = new WebSocketServer({ port: MSG_PORT });

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

msgWss.on("connection", (ws) => {
  let myId = null;

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === "subscribe" && msg.inbox) {
      myId = String(msg.inbox);
      subscribers.set(myId, ws);
      console.log(`[MsgRelay] 🔌 ${myId} subscribed`);

      // Deliver any pending messages
      const pending = pendingMessages.get(myId) || [];
      pending.forEach((item) => {
        send(ws, { type: "message", id: item.id, data: item.data });
        console.log(`[MsgRelay] 📬 Delivered pending msg ${item.id} to ${myId}`);
      });
      pendingMessages.delete(myId);

    } else if (msg.type === "send" && msg.to && msg.id && msg.data) {
      const recipientId = String(msg.to);
      const subscriber = subscribers.get(recipientId);

      // Ack the sender immediately
      send(ws, { type: "ack", id: msg.id });

      if (subscriber && subscriber.readyState === subscriber.OPEN) {
        // Recipient online — deliver now
        send(subscriber, { type: "message", id: msg.id, data: msg.data });
        console.log(`[MsgRelay] ✉️  ${myId || "?"} → ${recipientId} (live)`);
      } else {
        // Recipient offline — queue for later
        if (!pendingMessages.has(recipientId)) {
          pendingMessages.set(recipientId, []);
        }
        pendingMessages.get(recipientId).push({ id: msg.id, data: msg.data });
        console.log(`[MsgRelay] 📮 ${myId || "?"} → ${recipientId} (queued, ${pendingMessages.get(recipientId).length} pending)`);
      }
    }
  });

  ws.on("close", () => {
    if (myId) {
      subscribers.delete(myId);
      console.log(`[MsgRelay] 🔌 ${myId} disconnected`);
    }
  });

  ws.on("error", () => {
    if (myId) subscribers.delete(myId);
  });
});

msgWss.on("listening", () => {
  const ips = getLanIPs();
  console.log("\n✅  Message relay (WebSocket) running!");
  ips.forEach((ip) => console.log(`   ws://${ip}:${MSG_PORT}`));
  console.log("\nKeep this running while testing. Both devices must be on the same WiFi.\n");
});
