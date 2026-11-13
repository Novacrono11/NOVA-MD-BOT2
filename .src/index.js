require("dotenv").config();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["NOVA-MD-BOT", "Chrome", "1.0.0"]
  });

  if (!state.creds.registered) {
    const phone = process.env.PHONE_NUMBER;

    if (!phone) {
      console.log("PHONE_NUMBER is missing.");
      return;
    }

    const code = await sock.requestPairingCode(phone);
    console.log("NOVA-MD-BOT PAIRING CODE:", code);
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection }) => {
    if (connection === "open") {
      console.log("NOVA-MD-BOT CONNECTED!");
    }

    if (connection === "close") {
      console.log("Connection closed.");
    }
  });
}

startBot();
