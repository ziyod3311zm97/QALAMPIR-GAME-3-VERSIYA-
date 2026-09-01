const express = require("express");
const router = express.Router();

const referralService = require("../services/referralService");

// =====================================================
// GET REFERRAL INFO
// GET /api/referrals/:telegramId
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
            !referralService ||
            typeof referralService.getReferralInfo !== "function"
        ) {
            return res.status(503).json({
                success: false,
                error: "Referral service hali tayyor emas"
            });
        }

        const result =
            await referralService.getReferralInfo(telegramId);

        return res.json({
            success: true,
            referral: result
        });

    } catch (error) {
        console.error("GET REFERRAL INFO ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Referral ma'lumotlarini olishda xatolik"
        });
    }
});

// =====================================================
// APPLY REFERRAL
// POST /api/referrals/:telegramId/apply
// =====================================================

router.post("/:telegramId/apply", async (req, res) => {
    try {
        const { telegramId } = req.params;
        const { referralCode } = req.body;

        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: "telegramId kerak"
            });
        }

        if (!referralCode) {
            return res.status(400).json({
                success: false,
                error: "referralCode kerak"
            });
        }

        if (
            !referralService ||
            typeof referralService.applyReferral !== "function"
        ) {
            return res.status(503).json({
                success: false,
                error: "Referral service hali tayyor emas"
            });
        }

        const result =
            await referralService.applyReferral(
                telegramId,
                referralCode
            );

        return res.json({
            success: true,
            result
        });

    } catch (error) {
        console.error("APPLY REFERRAL ERROR:", error);

        return res.status(400).json({
            success: false,
            error: error.message || "Referral qo‘llashda xatolik"
        });
    }
});

// =====================================================
// GET REFERRAL LIST
// GET /api/referrals/:telegramId/list
// =====================================================

router.get("/:telegramId/list", async (req, res) => {
    try {
        const { telegramId } = req.params;

        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: "telegramId kerak"
            });
        }

        if (
            !referralService ||
            typeof referralService.getReferrals !== "function"
        ) {
            return res.status(503).json({
                success: false,
                error: "Referral list service hali tayyor emas"
            });
        }

        const referrals =
            await referralService.getReferrals(telegramId);

        return res.json({
            success: true,
            referrals: referrals || []
        });

    } catch (error) {
        console.error("GET REFERRALS ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Referral ro‘yxatini olishda xatolik"
        });
    }
});

// =====================================================
// REFERRAL STATS
// GET /api/referrals/:telegramId/stats
// =====================================================

router.get("/:telegramId/stats", async (req, res) => {
    try {
        const { telegramId } = req.params;

        if (
            !referralService ||
            typeof referralService.getReferralStats !== "function"
        ) {
            return res.status(503).json({
                success: false,
                error: "Referral statistics service hali tayyor emas"
            });
        }

        const stats =
            await referralService.getReferralStats(telegramId);

        return res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error("REFERRAL STATS ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Referral statistikasini olishda xatolik"
        });
    }
});

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
