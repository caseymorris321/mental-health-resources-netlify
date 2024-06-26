const mongoose = require('mongoose');
const { Category } = require('./models/resourceModel');



const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 1) {
        console.log('Using existing database connection');
        return mongoose.connection;
    }

    await mongoose.connect(process.env.MONGO_URI, {
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
        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Category not found' })
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Category deleted' })
        };
    } catch (error) {
        console.error('Error in deleteCategory:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message })
        };
    }
};