-- Run after a database backup and Alex's approval on coinbase-300w-db.
-- Existing id/name/symbol/price data and indexes are preserved.
-- Compatible with MariaDB 10.5; safe to run more than once.
USE crypto_db;
ALTER TABLE cryptocurrencies
  ADD COLUMN IF NOT EXISTS category VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS description TEXT NULL;

UPDATE cryptocurrencies SET
  category = COALESCE(NULLIF(category, ''), 'Digital currency'),
  description = COALESCE(NULLIF(description, ''), 'Bitcoin is a decentralized peer-to-peer cryptocurrency.')
WHERE symbol = 'BTC';
UPDATE cryptocurrencies SET
  category = COALESCE(NULLIF(category, ''), 'Smart contract platform'),
  description = COALESCE(NULLIF(description, ''), 'Ethereum is a programmable blockchain used for smart contracts and applications.')
WHERE symbol = 'ETH';
UPDATE cryptocurrencies SET
  category = COALESCE(NULLIF(category, ''), 'Payments'),
  description = COALESCE(NULLIF(description, ''), 'XRP is a cryptocurrency associated with the XRP Ledger and payment transfers.')
WHERE symbol = 'XRP';
UPDATE cryptocurrencies SET
  category = COALESCE(NULLIF(category, ''), 'Digital currency'),
  description = COALESCE(NULLIF(description, ''), 'Litecoin is a peer-to-peer cryptocurrency designed for payments.')
WHERE symbol = 'LTC';
UPDATE cryptocurrencies SET
  category = COALESCE(NULLIF(category, ''), 'Smart contract platform'),
  description = COALESCE(NULLIF(description, ''), 'Cardano is a proof-of-stake blockchain supporting smart contracts.')
WHERE symbol = 'ADA';
UPDATE cryptocurrencies SET
  category = COALESCE(NULLIF(category, ''), 'Meme cryptocurrency'),
  description = COALESCE(NULLIF(description, ''), 'Dogecoin is a cryptocurrency that originated from an internet meme.')
WHERE symbol = 'DOGE';
UPDATE cryptocurrencies SET
  category = COALESCE(NULLIF(category, ''), 'Smart contract platform'),
  description = COALESCE(NULLIF(description, ''), 'Solana is a blockchain that supports smart contracts and decentralized applications.')
WHERE symbol = 'SOL';
UPDATE cryptocurrencies SET
  category = COALESCE(NULLIF(category, ''), 'Privacy cryptocurrency'),
  description = COALESCE(NULLIF(description, ''), 'Monero is a cryptocurrency focused on transaction privacy.')
WHERE symbol = 'XMR';
