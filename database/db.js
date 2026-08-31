const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false
});


/* =====================================================
   O'YIN SOZLAMALARI
===================================================== */

const MAX_ENERGY = 5;
const ENERGY_REGEN_MINUTES = 10;

const DAILY_BONUS_AMOUNT = 50;

const REFERRAL_BONUS_REFERRER = 100;
const REFERRAL_BONUS_NEW_USER = 30;


/* =====================================================
   SKINLAR
===================================================== */

const SKINS = {
  chili_v1: {
    id: "chili_v1",
    name: "Chili V1",
    image: "/assets/skins/chili_v1.png",
    rarity: "Oddiy",
    price: 0
  },

  chili_v2: {
    id: "chili_v2",
    name: "Chili V2",
    image: "/assets/skins/chili_v2.png",
    rarity: "Nodir",
    price: 250
  },

  gold_v2: {
    id: "gold_v2",
    name: "Gold V2",
    image: "/assets/skins/gold_v2.png",
    rarity: "Nodir",
    price: 600
  },

  chili_fold: {
    id: "chili_fold",
    name: "Chili Fold",
    image: "/assets/skins/chili_fold.png",
    rarity: "Kamyob",
    price: 1000
  },

  amethyst: {
    id: "amethyst",
    name: "Amethyst Chili",
    image: "/assets/skins/amethyst.png",
    rarity: "Kamyob",
    price: 1500
  },

  chili_frost: {
    id: "chili_frost",
    name: "Chili Frost",
    image: "/assets/skins/chili_frost.png",
    rarity: "Afsonaviy",
    price: 2200
  },

  chili_void: {
    id: "chili_void",
    name: "Chili Void",
    image: "/assets/skins/chili_void.png",
    rarity: "Afsonaviy",
    price: 3500
  }
};


/* =====================================================
   DATABASE SXEMASI
===================================================== */

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      balance BIGINT NOT NULL DEFAULT 100,
      wins INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      streak INTEGER NOT NULL DEFAULT 0,
      energy INTEGER NOT NULL DEFAULT 5,
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount BIGINT NOT NULL,
      type TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS energy_updated_at
        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      ADD COLUMN IF NOT EXISTS last_bonus_date
        DATE,

      ADD COLUMN IF NOT EXISTS referred_by
        BIGINT,

      ADD COLUMN IF NOT EXISTS equipped_skin
        TEXT NOT NULL DEFAULT 'chili_v1',

      ADD COLUMN IF NOT EXISTS owned_skins
        TEXT[] NOT NULL DEFAULT ARRAY['chili_v1']::TEXT[],

      ADD COLUMN IF NOT EXISTS is_banned
        BOOLEAN NOT NULL DEFAULT false,

      ADD COLUMN IF NOT EXISTS theme
        TEXT NOT NULL DEFAULT 'ember';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stars_payments (
      id SERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

      package_id TEXT NOT NULL,
      stars_amount INTEGER NOT NULL,
      coins_amount INTEGER NOT NULL,
      telegram_charge_id TEXT,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    UPDATE users
    SET owned_skins =
      array_replace(owned_skins, 'fire', 'chili_v1')
    WHERE 'fire' = ANY(owned_skins);
  `);

  await pool.query(`
    UPDATE users
    SET equipped_skin = 'chili_v1'
    WHERE equipped_skin = 'fire';
  `);

  console.log("PostgreSQL database tayyor.");
}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {
  pool,
  initDatabase,

  MAX_ENERGY,
  ENERGY_REGEN_MINUTES,

  DAILY_BONUS_AMOUNT,

  REFERRAL_BONUS_REFERRER,
  REFERRAL_BONUS_NEW_USER,

  SKINS
};
