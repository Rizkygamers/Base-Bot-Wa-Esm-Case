import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function UguuUpload(input, filename = "file") {
  try {
    let fileStream;
    let tempFilePath = null;

    if (Buffer.isBuffer(input)) {
      tempFilePath = path.join(__dirname, "temp_upload_" + Date.now() + ".tmp");
      fs.writeFileSync(tempFilePath, input);
      fileStream = fs.createReadStream(tempFilePath);
    } else if (typeof input === "string") {
      if (!fs.existsSync(input)) {
        throw new Error("File not found");
      }
      fileStream = fs.createReadStream(input);
    } else {
      throw new Error("Invalid input type (must be Buffer or FilePath)");
    }

    const form = new FormData();
    form.append("files[]", fileStream, filename);

    const res = await fetch("https://uguu.se/upload.php", {
      method: "POST",
      body: form,
      headers: {
        ...form.getHeaders(),
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
        Referer: "https://uguu.se/",
        Accept: "*/*",
        Origin: "https://uguu.se",
      },
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`);
    }

    const data = await res.json();
    const v = data.files?.[0];

    if (tempFilePath) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    return {
      fileName: v?.filename,
      url: v?.url?.replace(/\\\//g, "/"),
      size: v?.size,
    };
  } catch (e) {
    console.error("Uguu Upload Error:", e.message);
    throw new Error("Failed to upload to Uguu: " + e.message);
  }
}