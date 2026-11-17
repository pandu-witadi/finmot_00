// Migration script to set initial positions for existing transactions
// Run: node scripts/migrate-transaction-positions.js

import mongoose from 'mongoose';

const config = {
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/finmot_00',
};

async function migrateTransactionPositions() {
    if (!config.mongoUri) {
        console.error('MONGODB_URI not set');
        process.exit(1);
    }

    try {
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const transactionsCollection = db.collection('transactions');

        // Find all transactions grouped by project
        const projects = await transactionsCollection.distinct('project');

        console.log(`Found ${projects.length} projects with transactions`);

        for (const projectId of projects) {
            // Get all transactions for this project, ordered by createdAt
            const transactions = await transactionsCollection
                .find({ project: new mongoose.Types.ObjectId(projectId) })
                .sort({ createdAt: 1 })
                .toArray();

            console.log(`Processing ${transactions.length} transactions for project ${projectId}`);

            // Update each transaction with its position (index)
            const bulkOps = transactions.map((tx, index) => ({
                updateOne: {
                    filter: { _id: new mongoose.Types.ObjectId(tx._id) },
                    update: { $set: { position: index } }
                }
            }));

            if (bulkOps.length > 0) {
                await transactionsCollection.bulkWrite(bulkOps);
                console.log(`  Set positions for ${bulkOps.length} transactions`);
            }
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateTransactionPositions();