/*  
  Made By Lenwy
*/
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function CatboxMoe(input) {
  try {

    let fileStream;
    let tempFilePath = null;

    if (Buffer.isBuffer(input)) {

      tempFilePath = path.join(__dirname, "temp_upload_" + Date.now() + ".jpg");
      fs.writeFileSync(tempFilePath, input);
      fileStream = fs.createReadStream(tempFilePath);
    } else if (typeof input === "string") {

      if (!fs.existsSync(input)) {
        throw new Error("File not found");
      }
      fileStream = fs.createReadStream(input);
    } else {
      throw new Error("Invalid input type");
    }

    const form = new FormData();
    form.append("fileToUpload", fileStream);
    form.append("reqtype", "fileupload");

    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: form,
      headers: form.getHeaders()
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`);
    }

    const data = await res.text();

    if (tempFilePath) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }

    return data;
  } catch (e) {
    console.error("Catbox Upload Error:", e.message);
    throw new Error("Failed to upload to Catbox: " + e.message);
  }
}
