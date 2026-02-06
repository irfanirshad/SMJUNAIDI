# Database Setup & Seeding Guide

This guide explains how to import the provided **Turbo BabyMart** data into your own MongoDB database.

## Prerequisites

1. **MongoDB Connection**: You need a running MongoDB instance (Local or Atlas) and a connection URI (e.g., `mongodb+srv://...`).
2. **Environment Variables**: Ensure your `apps/api/.env` file has the `MONGO_URI` variable set correctly.

## Data Included

The seeding script will import data for the following collections:
- `adsbanners`
- `banners`
- `categories`
- `products`
- `producttypes`
- `websiteicons`
- `brands`

**Note:** This will populate your store with the demo data as seen in the live preview.

## How to Import Data

1. **Configure Database**:
   Make sure your `apps/api/.env` file is set up with your **MongoDB URI**.
   ```bash
   MONGO_URI="mongodb+srv://user:password@cluster.mongodb.net/yourdbname?..."
   ```

2. **Navigate to Scripts**:
   Open a terminal in the root of the project.

3. **Run the Seed Script**:
   Execute the following command:
   ```bash
   node scripts/seed-data.js
   ```

4. **Verify Import**:
   Check the console output. You should see "Importing..." messages for each collection and a success message at the end.

## Troubleshooting

- **Error: MONGO_URI is not defined**: Check that you have copied `apps/api/.env.example` to `apps/api/.env` and filled in the URI.
- **Connection Error**: Ensure your IP is whitelisted if using MongoDB Atlas.
- **Duplicate Key Error**: The script tries to `upsert` (update if exists, insert if new) based on the document ID (`_id`). If you have conflicting IDs, you might see errors. You can clear your database collection before running if you want a fresh start.
