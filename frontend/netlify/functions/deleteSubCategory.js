const mongoose = require('mongoose');
const { SubCategory } = require('./models/resourceModel');



const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 1) {
        console.log('Using existing database connection');
        return mongoose.connection;
    }

    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    return mongoose.connection;

};

exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    try {
        await connectToDatabase();

        if (event.httpMethod !== 'DELETE') {
            return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
        }

        const id = event.path.split('/').pop();
        const subCategory = await SubCategory.findByIdAndDelete(id);
        if (!subCategory) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Subcategory not found' })
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Subcategory deleted' })
        };
    } catch (error) {
        console.error('Error in deleteSubCategory:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message })
        };
    }
};