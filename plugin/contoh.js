export const command = ["ba", "bluearchive"]

export default async (m, { riz, reply, id, qriz }) => {
  try {
    await reply('⏳ Tunggu bentar...')

    const apiUrl = 'https://api.nekolabs.my.id/random/blue-archive'
    const res = await fetch(apiUrl)
    if (!res.ok) throw new Error(`Status ${res.status}`)

    const buffer = await res.arrayBuffer()

    await riz.sendMessage(id, {
      image: Buffer.from(buffer),
      caption: '🌸 *Nih Blue Archive nya kak~*'
    }, { quoted: qriz })

  } catch (e) {
    console.error(e)
    await reply(`🍂 *Ups error:* ${e.message || e}`)
  }
}