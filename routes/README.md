# QALAMPIR GAME — API ROUTES

Ushbu papkada QALAMPIR GAME backend API route'lari joylashgan.

## Papka tuzilishi

```text
routes/
├── users.js
├── game.js
├── referrals.js
├── leaderboard.js
├── rewards.js
├── payments.js
└── README.md
```

---

## 1. Users

Fayl:

```text
routes/users.js
```

Endpointlar:

```text
GET  /api/users
GET  /api/users/:userId
POST /api/users
PUT  /api/users/:userId
```

Foydalanuvchi ma'lumotlari, balans va profil bilan ishlash uchun ishlatiladi.

---

## 2. Game

Fayl:

```text
routes/game.js
```

Endpointlar:

```text
GET  /api/game
GET  /api/game/state
POST /api/game/start
POST /api/game/play
POST /api/game/claim
```

O'yinning asosiy jarayonlari shu route orqali boshqariladi.

---

## 3. Referrals

Fayl:

```text
routes/referrals.js
```

Endpointlar:

```text
GET  /api/referrals
GET  /api/referrals/stats
POST /api/referrals/claim
```

Referral tizimi va taklif qilingan foydalanuvchilar bilan ishlaydi.

---

## 4. Leaderboard

Fayl:

```text
routes/leaderboard.js
```

Endpointlar:

```text
GET /api/leaderboard
GET /api/leaderboard/top
GET /api/leaderboard/me
```

O'yinchilar reytingi va foydalanuvchining reytingdagi o'rnini ko'rsatadi.

---

## 5. Rewards

Fayl:

```text
routes/rewards.js
```

Endpointlar:

```text
GET  /api/rewards
GET  /api/rewards/balance
POST /api/rewards/claim
POST /api/rewards/daily
POST /api/rewards/referral
```

Kunlik reward, referral reward va boshqa mukofotlar bilan ishlaydi.

---

## 6. Payments

Fayl:

```text
routes/payments.js
```

Endpointlar:

```text
GET  /api/payments
POST /api/payments/create
GET  /api/payments/:paymentId
POST /api/payments/confirm
POST /api/payments/cancel
```

To'lovlarni yaratish, tekshirish, tasdiqlash va bekor qilish uchun ishlatiladi.

---

# Server.js ga ulash

Barcha route'lar `server.js` ichida quyidagicha ulanadi:

```js
const usersRoutes = require("./routes/users");
const gameRoutes = require("./routes/game");
const referralsRoutes = require("./routes/referrals");
const leaderboardRoutes = require("./routes/leaderboard");
const rewardsRoutes = require("./routes/rewards");
const paymentsRoutes = require("./routes/payments");

app.use("/api/users", usersRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/referrals", referralsRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/payments", paymentsRoutes);
```

---

# Muhim

Route fayllari database funksiyalarini:

```js
const { dbQuery } = require("../db");
```

orqali chaqiradi.

Shuning uchun `db.js` ichidagi funksiyalar route'larda ishlatilayotgan funksiyalar bilan mos bo'lishi kerak.

---

# Production

QALAMPIR GAME production muhitida:

```text
Telegram Mini App
        │
        ▼
     Render
        │
        ▼
    server.js
        │
        ├── /api/users
        ├── /api/game
        ├── /api/referrals
        ├── /api/leaderboard
        ├── /api/rewards
        └── /api/payments
                │
                ▼
             Database
```

Route'larda foydalanuvchi ma'lumotlari va to'lovlar bilan ishlaganda server tomonidan tekshiruvlar bajarilishi kerak.

Client tomonidan yuborilgan `userId`, balans yoki to'lov holatiga to'liq ishonmaslik kerak.
