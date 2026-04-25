-- Migration to support Easypaisa and Daraz E-Voucher payouts

ALTER TABLE payouts
ADD COLUMN payout_method VARCHAR(50),
ADD COLUMN account_details VARCHAR(255);
