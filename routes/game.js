const express = require("express");
const router = express.Router();

const users = require("../database/users");
const gameService = require("../services/gameService");
const antiCheatService = require("../services/antiCheatService");

// =====================================================
// GET GAME STATE
// GET /api/game/:telegramId
// =====================================================

router.get("/:telegramId", async (req, res) => {
    try {
        const { telegramId } = req.params;

        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: "telegramId kerak"
            });
        }

        const user = await users.getUser(telegramId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "Foydalanuvchi topilmadi"
            });
        }

        let gameState = null;

        if (typeof gameService.getGameState === "function") {
            gameState = await gameService.getGameState(telegramId);
        }

        return res.json({
            success: true,
            user,
            game: gameState || {
                balance: user.balance || 0,
                energy: user.energy || 0
            }
        });

    } catch (error) {
        console.error("GET GAME STATE ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Game state olishda xatolik"
        });
    }
});

// =====================================================
// GAME ACTION
// POST /api/game/:telegramId/action
// =====================================================

router.post("/:telegramId/action", async (req, res) => {
    try {
        const { telegramId } = req.params;
        const {
            action,
            amount,
            clientTimestamp
        } = req.body;

        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: "telegramId kerak"
            });
        }

        if (!action) {
            return res.status(400).json({
                success: false,
                error: "action kerak"
            });
        }

        const user = await users.getUser(telegramId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "Foydalanuvchi topilmadi"
            });
        }

        // =================================================
        // ANTI-CHEAT
        // =================================================

        if (
            antiCheatService &&
            typeof antiCheatService.validateAction === "function"
        ) {
            const securityCheck =
                await antiCheatService.validateAction({
                    telegramId,
                    action,
                    amount,
                    clientTimestamp
                });

            if (!securityCheck || securityCheck.valid === false) {
                return res.status(403).json({
                    success: false,
                    error: "Game action rad etildi",
                    reason: securityCheck?.reason || "Security check failed"
                });
            }
        }

        // =================================================
        // GAME SERVICE
        // =================================================

        if (
            !gameService ||
            typeof gameService.processAction !== "function"
        ) {
            return res.status(503).json({
                success: false,
                error: "Game service hali tayyor emas"
            });
        }

        const result = await gameService.processAction({
            telegramId,
            action,
            amount,
            clientTimestamp
        });

        return res.json({
            success: true,
            result
        });

    } catch (error) {
        console.error("GAME ACTION ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Game action bajarishda xatolik"
        });
    }
});

// =====================================================
// START GAME
// POST /api/game/:telegramId/start
// =====================================================

router.post("/:telegramId/start", async (req, res) => {
    try {
        const { telegramId } = req.params;

        const user = await users.getUser(telegramId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "Foydalanuvchi topilmadi"
            });
        }

        let result;

        if (typeof gameService.startGame === "function") {
            result = await gameService.startGame(telegramId);
        } else {
            result = {
                balance: user.balance || 0,
                energy: user.energy || 0
            };
        }

        return res.json({
            success: true,
            game: result
        });

    } catch (error) {
        console.error("START GAME ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "O‘yinni boshlashda xatolik"
        });
    }
});

// =====================================================
// CLAIM REWARD
// POST /api/game/:telegramId/claim
// =====================================================

router.post("/:telegramId/claim", async (req, res) => {
    try {
        const { telegramId } = req.params;

        const user = await users.getUser(telegramId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "Foydalanuvchi topilmadi"
            });
        }

        if (
            !gameService ||
            typeof gameService.claimReward !== "function"
        ) {
            return res.status(503).json({
                success: false,
                error: "Reward system hali tayyor emas"
            });
        }

        const result =
            await gameService.claimReward(telegramId);

        return res.json({
            success: true,
            result
        });

    } catch (error) {
        console.error("CLAIM REWARD ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Reward olishda xatolik"
        });
    }
});

// =====================================================
// ENERGY
// GET /api/game/:telegramId/energy
// =====================================================

router.get("/:telegramId/energy", async (req, res) => {
    try {
        const { telegramId } = req.params;

        const user = await users.getUser(telegramId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "Foydalanuvchi topilmadi"
            });
        }

        return res.json({
            success: true,
            energy: user.energy || 0
        });

    } catch (error) {
        console.error("ENERGY ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Energy olishda xatolik"
        });
    }
});

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
