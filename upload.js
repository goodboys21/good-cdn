require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { Octokit } = require('@octokit/rest');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });
const port = 3000;

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = 'bagusdeployvercel';
const repo = 'hxhdbebbsvsve';
const folder = 'file';

function generateRandomString(length = 7) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function sendTelegramNotification(originalName, fileSizeMB, fileUrl) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const time = new Date().toLocaleString();

    const text = `📤 File Baru Diupload!\n\nLink: ${fileUrl}\nNama: ${originalName}\nUkuran: ${fileSizeMB} MB\nWaktu: ${time}\nBy Bagus Bahril`;

    axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: text
    }).catch(err => console.error('Gagal kirim Telegram:', err.response?.data));
}

app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ status: 'error', message: 'Tidak ada file!' });

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'pdf', 'zip', 'rar', 'txt', 'html', 'css', 'js'];
    const maxSize = 3 * 1024 * 1024; // 3MB
    const ext = path.extname(file.originalname).slice(1).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ status: 'error', message: 'Format file tidak didukung!' });
    }

    if (file.size > maxSize) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ status: 'error', message: 'Ukuran file melebihi batas 3MB!' });
    }

    const fileName = generateRandomString() + '.' + ext;
    const content = fs.readFileSync(file.path);
    const encodedContent = content.toString('base64');

    try {
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: `${folder}/${fileName}`,
            message: `Upload file ${fileName}`,
            content: encodedContent
        });

        const fileUrl = `https://cdn.baguss.xyz/file/${fileName}`;
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

        sendTelegramNotification(file.originalname, fileSizeMB, fileUrl);

        fs.unlinkSync(file.path);
        res.json({ status: 'success', url: fileUrl });
    } catch (err) {
        console.error('Upload gagal:', err);
        res.status(500).json({ status: 'error', message: 'Upload ke GitHub gagal!' });
    }
});

app.listen(port, () => {
    console.log(`Upload server running on http://localhost:${port}`);
});
