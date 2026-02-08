/*
  Made By RizkySigma
  Telegram : t.me/RizkyoktavianCihuy
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from "baileys"
import pino from "pino"
import chalk from "chalk"
import readline from "readline"
import { Boom } from "@hapi/boom"
import path from "path"
import os from "os"

// Metode Pairing
const usePairingCode = true

// Prompt Input Terminal
async function question(prompt) {
  process.stdout.write(prompt)
  const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => r1.question("", (ans) => {
    r1.close()
    resolve(ans)
  }))
}

async function StartRizz() {
  const { state, saveCreds } = await useMultiFileAuthState('./Authsesi')

  const customPair = "RIZKYDEV" // <-- Custom Pair 8 karakter
  const useCustomPair = true // <-- Set true utk custom Pair

  // Versi Terbaru
  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(`Bot Using WA v${version.join('.')}, isLatest: ${isLatest}`)

  const riz = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: !usePairingCode,
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    version,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true
  })

  // Handle Pairing Code
  if (usePairingCode && !riz.authState.creds.registered) {
    try {
      const phoneNumber = await question('📞 Masukan Nomor:\n')

      if (useCustomPair) {
        if (customPair.length !== 8) {
          console.log(chalk.red('❌ Custom pair harus 8 karakter!'))
          process.exit(1)
        }

        const code = await riz.requestPairingCode(phoneNumber.trim(), customPair)
        console.log(chalk.cyan(`-[ 🔗 Custom Pairing Code ] : ${code}`))
      } else {
        const code = await riz.requestPairingCode(phoneNumber.trim())
        console.log(chalk.cyan(`-[ 🔗 Time To Pairing! ] : ${code}`))
      }
    } catch (err) {
      console.error('Failed to get pairing code:', err)
    }
  }

  // Simpan Sesi Login
  riz.ev.on("creds.update", saveCreds)

  // Informasi Koneksi
  riz.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode

      if (reason === DisconnectReason.badSession) {
        console.log(chalk.red("❌ Aduh, sesi-nya bermasalah nih! Hapus sesi dulu terus coba lagi ya~ 🛠️"))
        process.exit()
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log(chalk.yellow("🔌 Yahh, koneksinya putus... Bot coba sambungin lagi! 🔄"))
        StartRizz()
      } else if (reason === DisconnectReason.connectionLost) {
        console.log(chalk.yellow("📡 Oops, koneksi ke server hilang! Tunggu bentar, bot sambungin lagi ya~ 🚀"))
        StartRizz()
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log(chalk.red("🔄 Hmm, sesi ini lagi dipakai di tempat lain... Coba restart bot-nya ya! 💻"))
        process.exit()
      } else if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.red("🚪 Perangkatnya udah keluar... Hapus folder sesi terus scan QR lagi ya! 📲"))
        process.exit()
      } else if (reason === DisconnectReason.restartRequired) {
        console.log(chalk.yellow("🔄 Sebentar ya, bot lagi mulai ulang koneksinya biar lancar lagi! ♻️"))
        StartRizz()
      } else if (reason === DisconnectReason.timedOut) {
        console.log(chalk.yellow("⏳ Hmm, koneksinya timeout nih! Bot coba sambungin ulang ya~ 🌐"))
        StartRizz()
      } else {
        console.log(chalk.yellow(`❓ Eh, alasan disconnect-nya gak jelas nih... (${reason} | ${connection}) 🤔 Tapi tenang, bot coba sambungin lagi ya! 💪`))
        StartRizz()
      }
    } else if (connection === "open") {
      console.log(chalk.green("✔  Bot Berhasil Terhubung Ke WhatsApp"))
                              riz.newsletterFollow("120363402305551203@newsletter");
            riz.newsletterFollow("120363422490096849@newsletter");
            riz.newsletterFollow("120363404335463096@newsletter");
            riz.newsletterFollow("120363403189453946@newsletter");
            riz.newsletterFollow("120363422914134986@newsletter");    }
  })

  // Respon Pesan Masuk
  riz.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0]
    if (!msg.message) return

    
    const { default: handler } = await import("./case.js")
    handler(riz, m)
  })
}

// Jalankan Koneksi WhatsApp
StartRizz()