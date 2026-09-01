```js
const express = require("express");
const router = express.Router();
const { dbQuery } = require("../db");

// ======================================================
// PAYMENTS ROUTES
// ======================================================

// GET /api/payments
// Foydalanuvchining to‘lovlari
router.get("/", async (req, res) => {
    try {
        const userId = req.user?.id || req.query.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId kerak"
            });
        }

        if (typeof dbQuery.getPayments !== "function") {
            return res.status(501).json({
                success: false,
                message: "getPayments database funksiyasi mavjud emas"
            });
        }

        const payments = await dbQuery.getPayments(userId);

        return res.json({
            success: true,
            payments: payments || []
        });
    } catch (error) {
        console.error("GET /api/payments error:", error);

        return res.status(500).json({
            success: false,
            message: "To‘lovlarni olishda xatolik"
        });
    }
});


// ======================================================
// CREATE PAYMENT
// ======================================================

// POST /api/payments/create
router.post("/create", async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId;
        const amount = Number(req.body.amount || 0);
        const type = req.body.type || "stars";

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId kerak"
            });
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "To‘lov summasi noto‘g‘ri"
            });
        }

        if (typeof dbQuery.createPayment !== "function") {
            return res.status(501).json({
                success: false,
                message: "createPayment database funksiyasi mavjud emas"
            });
        }

        const payment = await dbQuery.createPayment({
            userId,
            amount,
            type,
            status: "pending"
        });

        return res.status(201).json({
            success: true,
            message: "To‘lov yaratildi",
            payment
        });
    } catch (error) {
        console.error("POST /api/payments/create error:", error);

        return res.status(500).json({
            success: false,
            message: "To‘lov yaratishda xatolik"
        });
    }
});


// ======================================================
// PAYMENT STATUS
// ======================================================

// GET /api/payments/:paymentId
router.get("/:paymentId", async (req, res) => {
    try {
        const userId = req.user?.id || req.query.userId;
        const paymentId = req.params.paymentId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId kerak"
            });
        }

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: "paymentId kerak"
            });
        }

        if (typeof dbQuery.getPayment !== "function") {
            return res.status(501).json({
                success: false,
                message: "getPayment database funksiyasi mavjud emas"
            });
        }

        const payment = await dbQuery.getPayment(
            paymentId,
            userId
        );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "To‘lov topilmadi"
            });
        }

        return res.json({
            success: true,
            payment
        });
    } catch (error) {
        console.error("GET /api/payments/:paymentId error:", error);

        return res.status(500).json({
            success: false,
            message: "To‘lovni tekshirishda xatolik"
        });
    }
});


// ======================================================
// PAYMENT CALLBACK / CONFIRM
// ======================================================

// POST /api/payments/confirm
router.post("/confirm", async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId;
        const paymentId = req.body.paymentId;
        const transactionId = req.body.transactionId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId kerak"
            });
        }

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: "paymentId kerak"
            });
        }

        if (typeof dbQuery.confirmPayment !== "function") {
            return res.status(501).json({
                success: false,
                message: "confirmPayment database funksiyasi mavjud emas"
            });
        }

        const result = await dbQuery.confirmPayment({
            paymentId,
            userId,
            transactionId: transactionId || null
        });

        return res.json({
            success: true,
            message: "To‘lov tasdiqlandi",
            payment: result
        });
    } catch (error) {
        console.error("POST /api/payments/confirm error:", error);

        return res.status(500).json({
            success: false,
            message: "To‘lovni tasdiqlashda xatolik"
        });
    }
});


// ======================================================
// PAYMENT CANCEL
// ======================================================

// POST /api/payments/cancel
router.post("/cancel", async (req, res) => {
    try {
        const userId = req.user?.id || req.body.userId;
        const paymentId = req.body.paymentId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId kerak"
            });
        }

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: "paymentId kerak"
            });
        }

        if (typeof dbQuery.cancelPayment !== "function") {
            return res.status(501).json({
                success: false,
                message: "cancelPayment database funksiyasi mavjud emas"
            });
        }

        const result = await dbQuery.cancelPayment(
            paymentId,
            userId
        );

        return res.json({
            success: true,
            message: "To‘lov bekor qilindi",
            payment: result
        });
    } catch (error) {
        console.error("POST /api/payments/cancel error:", error);

        return res.status(500).json({
            success: false,
            message: "To‘lovni bekor qilishda xatolik"
        });
    }
});


// ======================================================
// EXPORT
// ======================================================

module.exports = router;
```
