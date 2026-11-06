import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finmot';

const orphanedAssignedTo = '6aed6947138cbeec63665357';

async function fixOrphanedTransactions() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const transactionsCollection = db.collection('transactions');

        // Find transactions with orphaned assignedTo
        const orphaned = await transactionsCollection.countDocuments({
            assignedTo: new mongoose.Types.ObjectId(orphanedAssignedTo)
        });

        console.log(`Found ${orphaned} transactions with orphaned assignedTo: ${orphanedAssignedTo}`);

        if (orphaned > 0) {
            // Update to set assignedTo to null
            const result = await transactionsCollection.updateMany(
                { assignedTo: new mongoose.Types.ObjectId(orphanedAssignedTo) },
                { $set: { assignedTo: null } }
            );

            console.log(`Updated ${result.modifiedCount} transactions`);
            console.log('Fix completed successfully');
        } else {
            console.log('No orphaned transactions found');
        }

        await mongoose.disconnect();
        console.log('Done');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixOrphanedTransactions();