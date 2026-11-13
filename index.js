require("dotenv").config();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
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
    printQRInTerminal: false,
    browser: ["NOVA-MD-BOT", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingRequested = false;

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (
      connection === "connecting" &&
      !state.creds.registered &&
      !pairingRequested
    ) {
      pairingRequested = true;

      try {
        await new Promise(resolve =>
          setTimeout(resolve, 10000)
        );

        if (sock.ws.isOpen) {
          const code = await sock.requestPairingCode(phone);
          console.log("NOVA PAIRING CODE:", code);
        } else {
          console.log("WhatsApp socket is not open yet.");
          pairingRequested = false;
        }
      } catch (error) {
        console.error("PAIRING ERROR:", error.message);
        pairingRequested = false;
      }
    }

    if (connection === "open") {
      console.log("NOVA-MD-BOT CONNECTED SUCCESSFULLY!");
    }

    if (connection === "close") {
      const status = lastDisconnect?.error?.output?.statusCode;

      console.log("CONNECTION CLOSED:", status);

      if (status !== DisconnectReason.loggedOut) {
        setTimeout(startBot, 5000);
      } else {
        console.log("WhatsApp logged out. Re-link required.");
      }
    }
  });
}

startBot().catch(console.error);
