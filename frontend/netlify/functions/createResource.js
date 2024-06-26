const mongoose = require('mongoose');
const { Resource } = require('./models/resourceModel');



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

        if (event.httpMethod !== 'POST') {
            return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
        }

        const body = JSON.parse(event.body);
        const maxOrderResource = await Resource.findOne({
            category: body.category,
            subCategory: body.subCategory
        }).sort('-order');
        const newOrder = maxOrderResource ? maxOrderResource.order + 1 : 0;
        const resource = new Resource({
            ...body,
            order: newOrder
        });
        const newResource = await resource.save();
        return {
            statusCode: 201,
            body: JSON.stringify(newResource)
        };
    } catch (error) {
        console.error('Error in createResource:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: error.message })
        };
    }
};