const LEAD_TYPE_LABEL = {
  service: '🔧 Remontas',
  compare: '⚖️ Palyginimas',
  sell:    '💰 Pardavimas',
};

/**
 * Sends a Telegram message when a new lead is submitted.
 * Fire-and-forget — never throws, never blocks the response.
 * Silently skips if TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set.
 */
export async function notifyNewLead(lead) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  const type = LEAD_TYPE_LABEL[lead.leadType] || lead.leadType;

  const text = [
    `📋 Naujas lead — ${type}`,
    `📍 Miestas: ${lead.city}`,
    `🚗 Automobilis: ${lead.carInfo}`,
    `🔩 Problema: ${lead.problemDescription}`,
    `📞 Kontaktas: ${lead.contact}`,
    lead.verdictTitle ? `📊 Verdiktas: ${lead.verdictTitle}` : null,
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chat_id: chatId, text }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('[notify] Telegram error:', res.status, body);
    }
  } catch (err) {
    console.error('[notify] Telegram request failed:', err.message);
  }
}
