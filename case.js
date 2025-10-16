/*
  Made By RizkySigma
  Telegram : t.me/RizkyoktavianCihuy
  Mohon Untuk Tidak Menghapus Watermark Di Dalam Kode Ini
*/

// Import Module
import './config.js'
import fs from 'fs'
import axios from 'axios'
import { proto, downloadContentFromMessage, jidNormalizedUser } from 'baileys'
import { Sticker, StickerTypes } from 'wa-sticker-formatter'
import fetch from 'node-fetch'

// Import Scraper
import Ai4Chat from './scrape/Ai4Chat.js'

// Export utama handler
export default async function handler(riz, m) {
  const msg = m.messages[0]
  if (!msg.message) return

  const body = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
      /**
    * Ambil JID user yang udah normal (hapus @lid)
    * @param {Object} msg - message dari baileys
    * @returns {string} - JID user yang udah clean
    */
    function CleanJid(msg) {
      const raw = msg?.key?.participantAlt || msg?.key?.participant;
      return jidNormalizedUser(raw);
    }

    const id = msg.key.remoteJid; // Id grup/Pv
    const sender = CleanJid(msg); // Lid > Jid
    const pushname = msg.pushName || "Unknown";
    const isGroup = id.endsWith("@g.us");
 
  // Prefix dari global
  const usedPrefix = global.prefix.find(p => body.startsWith(p))
  if (!usedPrefix) return

  const bodyWithoutPrefix = body.slice(usedPrefix.length)
  const args = bodyWithoutPrefix.trim().split(" ")
  const command = args.shift().toLowerCase()
  const q = args.join(" ")
  
      console.log(chalk.bold.blue("\n📩 PESAN MASUK!"));
    console.log(chalk.gray("────────────────────────────"));
    console.log(chalk.cyan("ID      :"), chalk.white(id));
    console.log(chalk.magenta("JID      :"), chalk.white(sender || "null"));
    console.log(chalk.yellow("ISGROUP  :"), chalk.white(isGroup));
    console.log(chalk.green("PUSHNAME :"), chalk.white(pushname));
    console.log(chalk.red("PESAN    :"), chalk.white(body));
    console.log(chalk.gray("────────────────────────────\n"));


  const reply = (teks) =>
    riz.sendMessage(id, { text: teks }, { quoted: msg })

  
  const menuImage = fs.readFileSync(global.image || './menu.jpg') // fallback biar gak error

  const menu = `\n╭─┴─❍「 *BOT INFO* 」❍
├ *Nama Bot*: RizkyBot
├ *Powered*: Baileys
├ *Owner*: 0895417273523
├ *Prefix*: *.*
├ *Version*: 1.0 Beta
╰─┬────❍
╭─┴─❍「 *MENU* 」❍
├ .ai
├ .s
├ .
├ .
├ .
├ .
├ .
╰──────❍`

  switch (command) {
    case "menu": {
      await riz.sendMessage(
        id,
        {
          image: menuImage,
          caption: menu,
          footer: "© RizkyDev - RizBot",
          contextInfo: {
            forwardingScore: 12,
            isForwarded: true,
            mentionedJid: [sender],
            forwardedNewsletterMessageInfo: {
              newsletterName: "— RizkyDev",
              newsletterJid: "120363402305551203@newsletter"
            },
            externalAdReply: {
              title: "Base Bot",
              body: "By RizkyDev",
              thumbnail: menuImage,
              sourceUrl: "https://github.com/Rizkygamers",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        },
        { quoted: msg }
      )
      break
    }

    case "ai": {
      if (!q) return reply("*Contoh:* .ai Apa itu Planet?")
      reply(global.mess?.wait || "⏳ Tunggu sebentar...")
      try {
        const aicht = await Ai4Chat(q)
        await reply(`*Ai4Chat*\n\n${aicht}`)
      } catch (error) {
        console.error("Error:", error)
        reply(global.mess?.error || "❌ Terjadi kesalahan pada AI.")
      }
      break
    }

    case "s": {
      try {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        if (!quoted) return reply('❌ Balas gambar/video/stiker dengan .s')

        const typeKey = Object.keys(quoted).find(k =>
          ['imageMessage', 'videoMessage', 'stickerMessage'].includes(k)
        )
        if (!typeKey) return reply('❌ Hanya support gambar, video, stiker')

        const stream = await downloadContentFromMessage(quoted[typeKey], typeKey.replace('Message', ''))
        let buf = Buffer.concat([])
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk])
        if (!buf || buf.length < 10) throw new Error('Media corrupt')

        const sticker = new Sticker(buf, {
          pack: 'Rizky',
          author: 'Rizky',
          type: StickerTypes.FULL,
          quality: 70,
          background: '#00000000'
        })

        await riz.sendMessage(id, await sticker.toMessage(), { quoted: msg })
      } catch (e) {
        console.error('Sticker Error:', e)
        return reply('❌ Gagal bikin stiker:\n' + e.message)
      }
      break
    }

    default:
      break
  }
}
