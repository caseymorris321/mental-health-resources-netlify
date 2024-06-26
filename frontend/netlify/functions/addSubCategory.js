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

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        await connectToDatabase();

        const body = JSON.parse(event.body);
        const maxOrderSubCategory = await SubCategory.findOne({ category: body.category }).sort('-order');
        const newOrder = maxOrderSubCategory ? maxOrderSubCategory.order + 1 : 0;
        const subCategory = new SubCategory({
            ...body,
            order: newOrder
        });
        const newSubCategory = await subCategory.save();
        return {
            statusCode: 201,
            body: JSON.stringify(newSubCategory)
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: error.message })
        };
    }
};