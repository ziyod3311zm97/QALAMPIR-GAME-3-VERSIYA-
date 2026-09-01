const express = require("express");
const router = express.Router();
const { dbQuery } = require("../db");

// ======================================================
// REWARDS ROUTES
// ======================================================

// GET /api/rewards
// Foydalanuvchining mavjud rewardlarini olish
router.get("/", async (req, res) => {
    try {
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId kerak"
            });
        }

        const rewards = await dbQuery.getRewards(userId);

        return res.json({
            success: true,
            rewards: rewards || []
        });
    } catch (error) {
        console.error("GET /api/rewards error:", error);

        return res.status(500).json({
            success: false,
            message: "Rewardlarni olishda xatolik"
        });
    }
});


// ======================================================
// GET USER REWARD BALANCE
// ======================================================

router.get("/balance", async (req, res) => {
    try {
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId kerak"
            });
        }

        const user = await dbQuery.getUser(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Foydalanuvchi topilmadi"
            });
        }

        return res.json({
            success: true,
            balance: Number(user.balance || 0),
            rewards: Number(user.rewards || 0)
        });
    } catch (error) {
        console.error("GET /api/rewards/balance error:", error);

        return res.status(500).json({
            success: false,
            message: "Balansni olishda xatolik"
        });
    }
});


// ======================================================
// CLAIM REWARD
// ======================================================

router.post("/claim", async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId;
        const rewardId = req.body.rewardId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId kerak"
            });
        }

        if (!rewardId) {
            return res.status(400).json({
                success: false,
                message: "rewardId kerak"
            });
        }

        // Agar dbQuery ichida claimReward mavjud bo‘lsa,
        // shu funksiya ishlatiladi.
        if (typeof dbQuery.claimReward === "function") {
            const result = await dbQuery.claimReward(
                userId,
                rewardId
            );

            return res.json({
                success: true,
                message: "Reward olindi",
                reward: result
            });
        }

        return res.status(501).json({
            success: false,
            message: "claimReward database funksiyasi hali mavjud emas"
        });

    } catch (error) {
        console.error("POST /api/rewards/claim error:", error);

        return res.status(500).json({
            success: false,
            message: "Reward olishda xatolik"
        });
    }
});


// ======================================================
// DAILY REWARD
// ======================================================

router.post("/daily", async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId kerak"
            });
        }

        if (typeof dbQuery.claimDailyReward !== "function") {
            return res.status(501).json({
                success: false,
                message: "claimDailyReward database funksiyasi hali mavjud emas"
            });
        }

        const result = await dbQuery.claimDailyReward(userId);

        return res.json({
            success: true,
            message: "Kunlik reward olindi",
            reward: result
        });

    } catch (error) {
        console.error("POST /api/rewards/daily error:", error);

        return res.status(500).json({
            success: false,
            message: "Kunlik reward olishda xatolik"
        });
    }
});


// ======================================================
// REFERRAL REWARD
// ======================================================

router.post("/referral", async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId kerak"
            });
        }

        if (typeof dbQuery.getReferralReward === "function") {
            const result = await dbQuery.getReferralReward(userId);

            return res.json({
                success: true,
                reward: result
            });
        }

        return res.status(501).json({
            success: false,
            message: "Referral reward funksiyasi hali mavjud emas"
        });

    } catch (error) {
        console.error("POST /api/rewards/referral error:", error);

        return res.status(500).json({
            success: false,
            message: "Referral reward olishda xatolik"
        });
    }
});


// ======================================================
// EXPORT
// ======================================================

module.exports = router;
