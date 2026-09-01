const express = require("express");
const router = express.Router();

const users = require("../database/users");

// =====================================================
// GET USER
// GET /api/users/:telegramId
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

        return res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error("GET USER ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Server xatosi"
        });
    }
});

// =====================================================
// CREATE / GET USER
// POST /api/users
// =====================================================

router.post("/", async (req, res) => {
    try {
        const {
            telegramId,
            username,
            firstName,
            lastName,
            referralCode
        } = req.body;

        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: "telegramId kerak"
            });
        }

        let user = await users.getUser(telegramId);

        // User mavjud bo'lmasa yaratamiz
        if (!user) {
            user = await users.createUser({
                telegramId,
                username: username || null,
                firstName: firstName || null,
                lastName: lastName || null,
                referralCode: referralCode || null
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("CREATE USER ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Foydalanuvchini yaratishda xatolik"
        });
    }
});

// =====================================================
// UPDATE USER
// PATCH /api/users/:telegramId
// =====================================================

router.patch("/:telegramId", async (req, res) => {
    try {
        const { telegramId } = req.params;

        if (!telegramId) {
            return res.status(400).json({
                success: false,
                error: "telegramId kerak"
            });
        }

        const allowedFields = [
            "username",
            "firstName",
            "lastName",
            "avatar"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: "Yangilanadigan ma'lumot yo'q"
            });
        }

        const user = await users.updateUser(
            telegramId,
            updates
        );

        return res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error("UPDATE USER ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Foydalanuvchini yangilashda xatolik"
        });
    }
});

// =====================================================
// USER BALANCE
// GET /api/users/:telegramId/balance
// =====================================================

router.get("/:telegramId/balance", async (req, res) => {
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
            balance: user.balance || 0,
            energy: user.energy || 0
        });
    } catch (error) {
        console.error("BALANCE ERROR:", error);

        return res.status(500).json({
            success: false,
            error: "Balansni olishda xatolik"
        });
    }
});

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
