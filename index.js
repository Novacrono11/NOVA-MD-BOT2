require("dotenv").config();

const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function startBot() {
  const phone = process.env.PHONE_NUMBER;

  if (!phone) {
    throw new Error("PHONE_NUMBER is missing");
  }

  const { state, saveCreds } =
    await useMultiFileAuthState("session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  let requested = false;

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (
      connection === "connecting" &&
      !state.creds.registered &&
      !requested
    ) {
      requested = true;

      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(phone);
          console.log("NOVA PAIRING CODE:", code);
        } catch (error) {
          console.error("PAIRING ERROR:", error.message);
        }
      }, 3000);
    }

    if (connection === "open") {
      console.log("NOVA-MD-BOT CONNECTED!");
    }

    if (connection === "close") {
      console.log(
        "CONNECTION CLOSED:",
        lastDisconnect?.error?.message
      );
    }
  });
}

startBot().catch(console.error);
