import { Router } from "express";

const router = Router();

const BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"];
const CHAT_ID = process.env["TELEGRAM_CHAT_ID"];

router.post("/chat/send", async (req, res) => {
  const { text, userName, userEmail } = req.body as {
    text?: string;
    userName?: string;
    userEmail?: string;
  };

  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "text is required" });
    return;
  }

  if (!BOT_TOKEN || !CHAT_ID) {
    req.log.error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set");
    res.status(500).json({ error: "Telegram not configured" });
    return;
  }

  const from = userName ? `👤 ${userName}` : "Гость";
  const email = userEmail && userEmail !== "не авторизован" ? `\n📧 ${userEmail}` : "";
  const message = `💬 Сообщение от клиента\n${from}${email}\n\n${text}`;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      req.log.error({ err }, "Telegram API error");
      res.status(502).json({ error: "Failed to send to Telegram" });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to reach Telegram");
    res.status(502).json({ error: "Network error" });
  }
});

export default router;
