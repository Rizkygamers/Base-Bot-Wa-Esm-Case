/*
  Made By RizkySigma
  Telegram : t.me/RizkyoktavianCihuy
  Mohon Untuk Tidak Menghapus Watermark Di Dalam Kode Ini
*/

// Import Module
import './config.js'
import fs from 'fs'
import axios from 'axios'
import moment from 'moment-timezone';
import os from 'os';
import { fileURLToPath, pathToFileURL } from "url";
import chalk from "chalk";
import path from 'path';
import {
  proto,
  downloadContentFromMessage,
  jidNormalizedUser
} from 'baileys'
import {
  Sticker,
  StickerTypes
} from 'wa-sticker-formatter'
import fetch from 'node-fetch'

// Import Scraper
import Ai4Chat from './scrape/Ai4Chat.js'
import UguuUpload from './scrape/Uguu.js'
import CatboxMoe from './scrape/CatBox.js';

// Export utama handler
export default async function handler(riz, m) {
  const msg = m.messages[0]
  if (!msg.message) return

  let body =
  msg.message.conversation ||
  msg.message.extendedTextMessage?.text ||
  msg.message.imageMessage?.caption ||
  msg.message.videoMessage?.caption ||
  msg.message.buttonsResponseMessage?.selectedButtonId ||
  msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
  msg.message.templateButtonReplyMessage?.selectedId ||
  (msg.message.nativeFlowResponseMessage?.paramsJson
    ? JSON.parse(msg.message.nativeFlowResponseMessage.paramsJson)?.id: "") ||
  "";

function CleanJid(msg) {
    const raw = msg?.key?.participantAlt || msg?.key?.participant || msg.key.remoteJid || msg.key.participantPn;
    return jidNormalizedUser(raw);
  }

  const id = msg.key.remoteJid; // Id grup/Pv
  const sender = CleanJid(msg); // Lid > Jid
  const pushname = msg.pushName || "Unknown";
  const isGroup = id.endsWith("@g.us");

  const pplu = fs.readFileSync(global.image)
  const qriz = {
    key: {
      participant: `0@s.whatsapp.net`,
      ...(msg.chat ? {
        remoteJid: `status@broadcast`
      }: {})
    },
    message: {
      contactMessage: {
        displayName: `${pushname}`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:XL;Rizky,;;;\nFN: Rizky V2.2\nitem1.TEL;waid=${sender.split("@")[0]}:+${sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
        jpegThumbnail: pplu,
        thumbnail: pplu,
        sendEphemeral: true
      }
    }
  }

  // Prefix dari global
  const usedPrefix = global.prefix.find(p => body.startsWith(p))
  if (!usedPrefix) return

  const bodyWithoutPrefix = body.slice(usedPrefix.length)
  const args = bodyWithoutPrefix.trim().split(" ")
  const command = args.shift().toLowerCase()
  const q = args.join(" ")

  //===== MODUL GRUP =====
  let groupMetadata = {};
  if (isGroup) {
    try {
      groupMetadata = await riz.groupMetadata(id);
    } catch (e) {
      console.error("Error groupMetadata:", e);
      return;
    }
  }

  const groupName = isGroup ? (groupMetadata.subject || "Nama Grup Tidak Diketahui"): null;
  const groupDesc = isGroup ? (groupMetadata.desc?.toString() || "Deskripsi belum diset."): null;

  const participants = isGroup
  ? (groupMetadata.participants || []).map(p => {
    const adminRaw = p.admin ?? (p.isAdmin ? 'admin': null);
    let admin = null;
    if (adminRaw === 'superadmin' || adminRaw === 'creator' || adminRaw === 'owner') admin = 'superadmin';
    else if (adminRaw === 'admin') admin = 'admin';

    return {
      id: p?.id || null,
      jid: p?.jid || null,
      admin,
      full: p
    };
  }): [];

  const groupOwner = isGroup
  ? (groupMetadata.owner || participants.find(p => p.admin === 'superadmin')?.jid || ''): '';

  const groupAdmins = participants
  .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
  .map(p => p.jid || p.id)
  .filter(Boolean);

  let botNumber = (riz.user && (riz.user.jid || riz.user.id)) || ''
  const botJid = botNumber ? jidNormalizedUser(botNumber): ''


  const isBotAdmin = groupAdmins.includes(botJid);
  const isAdmin = groupAdmins.includes(sender);
  //===== MODUL GRUP =====

  console.log(chalk.bold.blue("\n📩 PESAN MASUK!"));
  console.log(chalk.gray("────────────────────────────"));
  console.log(chalk.cyan("ID      :"),
    chalk.white(id));
  console.log(chalk.magenta("JID      :"),
    chalk.white(sender || "null"));
  console.log(chalk.yellow("ISGROUP  :"),
    chalk.white(isGroup));
  console.log(chalk.green("PUSHNAME :"),
    chalk.white(pushname));
  console.log(chalk.red("PESAN    :"),
    chalk.white(body));
  console.log(chalk.gray("────────────────────────────\n"));


  const reply = (teks) =>
  riz.sendMessage(id,
    {
      text: teks
    },
    {
      quoted: qriz
    })


  const menuImage = fs.readFileSync(global.image || './menu.jpg') // fallback biar gak error

const menu = `
 ╭─┴─❍「 *BOT INFO* 」❍
├ *Nama Bot*: RizkyBot
├ *Powered*: Baileys
├ *Owner*: ${global.owner}
├ *Prefix*: *.*
├ *Version*: 1.0 Beta
╰─┬────❍
╭─┴─❍「 *MENU* 」❍
├ .ai
├ .s
├ .sc
├ .self
├ .public
├ .
├ .
╰──────❍`



  const isOwner =
    (Array.isArray(global.owner) && global.owner.includes(sender.split("@")[0])) ||
    msg?.key?.fromMe === true;
    if (global.selfmode && !isOwner) return;

  // === SYSTEM PLUGIN ===
  const pluginDir = path.resolve("./plugin");
  let plugins = [];

  async function loadPlugins() {
    try {
      const files = fs.readdirSync(pluginDir).filter(f => f.endsWith(".js"));
      for (const file of files) {
        const filePath = path.join(pluginDir, file);
        const module = await import(`file://${filePath}?v=${Date.now()}`);
        const plugin = module.default;
        const cmds = module.command || [];

        if (!plugin || !Array.isArray(cmds)) {
          console.log(`⚠️ ${file} plugin tidak valid. Pastikan pakai "export default" & "export const command"`);
          continue;
        }

        plugins.push({
          run: plugin, command: cmds
        });
        console.log(`✅ Loaded plugin: ${file} (${cmds.join(", ")})`);
      }

      console.log(`📦 Total plugin: ${plugins.length}`);
    } catch (err) {
      console.error("❌ Gagal load plugin:", err);
    }
  }

  await loadPlugins();
  const PLUGIN_CTX = {
    riz,
    id,
    msg,
    sender,
    pushname,
    isOwner,
    isAdmin,
    participants,
    isBotAdmin,
    qriz,
    groupMetadata,
    command,
    args,
    q,
    reply,
    isGroup,
  };

  // === EKSEKUSI PLUGIN ===
  for (const {
    run, command: cmds
  } of plugins) {
    if (cmds.find(c => c.toLowerCase() === command)) {
      try {
        await run(msg, PLUGIN_CTX);
        return; // stop biar gak lanjut ke switch-case
      } catch (err) {
        console.error(`❌ Plugin '${command}' error:`, err);
        await reply(`❌ Error di plugin '${command}': ${err.message}`);
        return;
      }
    }
  }

  console.log("🧩 Command terdeteksi:", command);

  console.log("📦 Plugin loaded:", plugins.map(p => p.command).flat());


  switch (command) {
  

  case "sc": {
      reply("https://github.com/Rizkygamers/Base-Bot-Wa-Esm-Case")
      reply("FREE CUY PAKE AJA\n")
    } break;

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
        {
          quoted: qriz
        }
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

        await riz.sendMessage(id, await sticker.toMessage(), {
          quoted: qriz
        })
      } catch (e) {
        console.error('Sticker Error:', e)
        return reply('❌ Gagal bikin stiker:\n' + e.message)
      }
      break
    }

case 'tourl': {
        try {
          const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
          if (!quotedMsg) return reply('⚠ *Reply ke media dulu, bro!*')

          const mediaType = Object.keys(quotedMsg).find(type =>
            ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(type)
          )
          if (!mediaType) return reply('⚠ *Yang direply harus media (gambar/video/audio/dokumen/stiker)!*')

          const mime = quotedMsg[mediaType]?.mimetype || ''
          const isImage = /image/.test(mime)
          const isVideo = /video/.test(mime)
          const isAudio = /audio/.test(mime)
          const isSticker = mediaType === 'stickerMessage'
          const isDocument = mediaType === 'documentMessage'

          reply(mess.wait)

          const stream = await downloadContentFromMessage(quotedMsg[mediaType], mediaType.replace('Message', ''))
          let buffer = Buffer.from([])
          for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

          if (buffer.length === 0) return reply('❌ *Gagal ambil media, buffer kosong.*')

          let fileExt = '.jpg'
          let fileName = `./temp_${Date.now()}`

          if (isImage) {
            fileExt = '.jpg'
            fileName += fileExt
          } else if (isVideo) {
            fileExt = '.mp4'
            fileName += fileExt
          } else if (isAudio) {
            fileExt = '.mp3'
            fileName += fileExt
          } else if (isSticker) {
            fileExt = '.webp'
            fileName += fileExt
          } else if (isDocument) {
            const docName = quotedMsg[mediaType]?.fileName || 'file'
            fileExt = path.extname(docName) || '.bin'
            fileName += fileExt
          }

          fs.writeFileSync(fileName, buffer)

          let catboxUrl = "Upload gagal"
          try {
            const catRes = await CatboxMoe(fileName)
            if (catRes && catRes.startsWith("http")) catboxUrl = catRes
          } catch (e) {
            console.error("Catbox Error:", e.message)
          }

          let uguuUrl = "Upload gagal"
          try {
            const uguuRes = await UguuUpload(fileName, `upload_${Date.now()}${fileExt}`)
            if (uguuRes?.url) uguuUrl = uguuRes.url
          } catch (e) {
            console.error("Uguu Error:", e.message)
          }

          const mediaTypeText = isImage ? 'Gambar':
          isVideo ? 'Video':
          isAudio ? 'Audio':
          isSticker ? 'Stiker':
          isDocument ? 'Dokumen': 'File'

          reply(
            `✅ *Hasil Upload ${mediaTypeText}:*\n\n` +
            `📦 Catbox : ${catboxUrl}\n` +
            `📦 Uguu   : ${uguuUrl}`
          )

          fs.unlinkSync(fileName)
        } catch (err) {
          console.error('[tourl ERROR]', err)
          reply('❌ *Gagal upload, pastikan yang di-reply itu media valid!*')
        }
        break
      }

  case "self": {
      if (!isOwner) return reply("❌ Khusus Owner!");
      global.selfmode = true;
      reply("✅ Bot sekarang dalam *SELF MODE* (hanya owner).");
      break;
    }

  case "public": {
      if (!isOwner) return reply("❌ Khusus Owner!");
      global.selfmode = false;
      reply("✅ Bot sekarang dalam *PUBLIC MODE* (semua orang bisa pakai).");
      break;
    }

    case "runtime":
    case "tes": {
        const uptime = process.uptime();
        const hari = Math.floor(uptime / (3600 * 24));
        const jam = Math.floor((uptime % (3600 * 24)) / 3600);
        const menit = Math.floor((uptime % 3600) / 60);
        const detik = Math.floor(uptime % 60);
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memPercent = (usedMem / totalMem * 100).toFixed(2);
        const cpus = os.cpus();
        const cpuModel = cpus[0].model;
        const cpuSpeed = cpus[0].speed;
        const coreCount = cpus.length;

       
        let totalIdle = 0,
        totalTick = 0;
        cpus.forEach(cpu => {
          for (let type in cpu.times) {
            totalTick += cpu.times[type];
          }
          totalIdle += cpu.times.idle;
        });
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const cpuPercent = (100 - ~~(100 * idle / total)).toFixed(2);

        const teks = `🤖 *INFO BOT*\n\n` +
        `🟢 Status : Online\n` +
        `⏳ Runtime : ${hari}d ${jam}h ${menit}m ${detik}s\n` +
        `📅 Waktu : ${moment().tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm:ss")}\n\n` +
        `💾 RAM : ${(usedMem / 1024 / 1024).toFixed(2)} MB / ${(totalMem / 1024 / 1024).toFixed(2)} MB (${memPercent}%)\n` +
        `🖥️ CPU : ${cpuModel} (${coreCount} Core @${cpuSpeed}MHz)\n` +
        `⚡ CPU Usage : ${cpuPercent}%\n`

        reply(teks);
        break;
      }

  default:
    break
  }
}