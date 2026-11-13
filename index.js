
const makeWASocket = require("@whiskeysockets/baileys").default;
const {
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function startBot() {
  const phone = process.env.PHONE_NUMBER;

  if (!phone) {
    throw new Error("PHONE_NUMBER is missing!");
  }

  const { state, saveCreds } =
    await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection }) => {
    if (connection === "open") {
      console.log("NOVA-MD-BOT CONNECTED!");
    }

    if (connection === "close") {
      console.log("WhatsApp connection closed.");
    }
  });

  if (!state.creds.registered) {
    const code = await sock.requestPairingCode(phone);
    console.log("PAIRING CODE:", code);
  }
}

startBot().catch(console.error);
