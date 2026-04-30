export const sendTelegramNotification = async (message) => {
  const BOT_TOKEN = "8768105862:AAHdryyODCWHMxm34RQEEr5iq1fuh-EsMPA";
  const CHAT_ID = "5882947647";

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Telegram notification failed:", err);
  }
};
