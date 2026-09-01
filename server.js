require("dotenv").config();

const express = require("express");
const http = require("http");
const { Telegraf, Markup } = require("telegraf");

const app = express();
const server = http.createServer(app);

// ===============================
// ENV
// ===============================

const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL =
    process.env.WEB_APP_URL || "https://qalampir-game.onrender.com";

if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN topilmadi!");
    process.exit(1);
}

// ===============================
// EXPRESS
// ===============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend
app.use(express.static(__dirname));

// Health check
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Qalampir Game server ishlayapti",
        time: new Date().toISOString()
    });
});

// ===============================
// TELEGRAM BOT
// ===============================

const bot = new Telegraf(BOT_TOKEN);

// /start
bot.start(async (ctx) => {
    try {
        const firstName = ctx.from?.first_name || "Do‘st";

        await ctx.reply(
            `🌶️ Salom, ${firstName}!\n\n` +
            `🔥 QALAMPIR GAME'ga xush kelibsiz!\n\n` +
            `🎮 O‘yinni boshlash uchun pastdagi tugmani bosing.`,
            Markup.inlineKeyboard([
                [
                    Markup.button.webApp(
                        "🌶️ QALAMPIR GAME",
                        WEB_APP_URL
                    )
                ]
            ])
        );
    } catch (error) {
        console.error("❌ /start xatosi:", error);
    }
});

// /game
bot.command("game", async (ctx) => {
    try {
        await ctx.reply(
            "🌶️ QALAMPIR GAME",
            Markup.inlineKeyboard([
                [
                    Markup.button.webApp(
                        "🎮 O‘yinni ochish",
                        WEB_APP_URL
                    )
                ]
            ])
        );
    } catch (error) {
        console.error("❌ /game xatosi:", error);
    }
});

// /help
bot.help(async (ctx) => {
    await ctx.reply(
        "🌶️ QALAMPIR GAME\n\n" +
        "🎮 O‘yinni boshlash uchun /start buyrug‘ini yuboring.\n" +
        "🔥 Keyin «QALAMPIR GAME» tugmasini bosing."
    );
});

// ===============================
// ERROR HANDLER
// ===============================

bot.catch((error, ctx) => {
    console.error(
        `❌ Telegram bot xatosi [${ctx?.updateType || "unknown"}]:`,
        error
    );
});

// ===============================
// START SERVER + BOT
// ===============================

async function start() {
    try {
        // HTTP server
        server.listen(PORT, "0.0.0.0", () => {
            console.log("=================================");
            console.log("🌶️ QALAMPIR GAME");
            console.log("=================================");
            console.log(`🚀 Server port: ${PORT}`);
            console.log(`🌐 Web App: ${WEB_APP_URL}`);
            console.log("✅ Render server ishga tushdi");
        });

        // Telegram bot
        await bot.launch();

        console.log("🤖 Telegram bot ishga tushdi");
        console.log("✅ QALAMPIR GAME production rejimida ishlayapti");
    } catch (error) {
        console.error("❌ Server ishga tushirishda xato:", error);
        process.exit(1);
    }
}

start();

// ===============================
// GRACEFUL SHUTDOWN
// ===============================

process.once("SIGINT", () => {
    console.log("🛑 SIGINT...");
    bot.stop("SIGINT");
    server.close();
});

process.once("SIGTERM", () => {
    console.log("🛑 SIGTERM...");
    bot.stop("SIGTERM");
    server.close();
});
