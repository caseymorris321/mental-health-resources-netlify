const mongoose = require('mongoose');
const { SubCategory, Resource } = require('./models/resourceModel');

const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 1) {
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

        if (event.httpMethod !== 'PUT') {
            return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
        }

        const id = event.path.split('/').pop();
        const { name, oldName, category } = JSON.parse(event.body);

        const updatedSubCategory = await SubCategory.findByIdAndUpdate(
            id,
            { name, category },
            { new: true, runValidators: true }
        );

        if (!updatedSubCategory) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Subcategory not found' })
            };
        }

        await Resource.updateMany(
            { subCategory: oldName, category: category },
            { subCategory: name }
        );

        const updatedResources = await Resource.find({ subCategory: name, category: category });

        return {
            statusCode: 200,
            body: JSON.stringify({
                subCategory: updatedSubCategory,
                resources: updatedResources
            })
        };
    } catch (error) {
        console.error('Detailed error:', error);
        console.error('Stack trace:', error.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error', error: error.message })
        };
    }
};