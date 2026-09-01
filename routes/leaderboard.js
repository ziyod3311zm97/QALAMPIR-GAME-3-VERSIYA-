const express = require("express");
const router = express.Router();

const leaderboard = require("../database/leaderboard");

// =====================================================
// GET TOP PLAYERS
// GET /api/leaderboard
// =====================================================

router.get("/", async (req, res) => {
    try {
        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 100, 1),
            100
        );

        const result = await leaderboard.getLeaderboard(limit);

        return res.json({
            success: true,
            leaderboard: result || []
        });

    } catch (error) {
        console.error("GET LEADERBOARD ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Leaderboardni olishda xatolik"
        });
    }
});

// =====================================================
// GET USER RANK
// GET /api/leaderboard/:telegramId
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

        if (
            typeof leaderboard.getUserRank !== "function"
        ) {
            return res.status(503).json({
                success: false,
                error: "User rank service hali tayyor emas"
            });
        }

        const result =
            await leaderboard.getUserRank(telegramId);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: "Foydalanuvchi reytingda topilmadi"
            });
        }

        return res.json({
            success: true,
            rank: result
        });

    } catch (error) {
        console.error("GET USER RANK ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "User rank olishda xatolik"
        });
    }
});

// =====================================================
// GET TOP 10
// GET /api/leaderboard/top
// =====================================================

router.get("/top", async (req, res) => {
    try {
        const result =
            await leaderboard.getLeaderboard(10);

        return res.json({
            success: true,
            leaderboard: result || []
        });

    } catch (error) {
        console.error("GET TOP LEADERBOARD ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Top leaderboardni olishda xatolik"
        });
    }
});

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
