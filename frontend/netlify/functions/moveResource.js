const mongoose = require('mongoose');
const { Resource } = require('./models/resourceModel');


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

        if (event.httpMethod !== 'PATCH') {
            return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
        }

        const pathParts = event.path.split('/');
        const id = pathParts[pathParts.length - 2];
        const direction = pathParts[pathParts.length - 1];

        const resource = await Resource.findById(id);
        if (!resource) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Resource not found' })
            };
        }

        const operator = direction === 'up' ? '$lt' : '$gt';
        const sort = direction === 'up' ? -1 : 1;

        const adjacentResource = await Resource.findOne({
            category: resource.category,
            subCategory: resource.subCategory,
            order: { [operator]: resource.order }
        }).sort({ order: sort });

        if (adjacentResource) {
            const tempOrder = resource.order;
            resource.order = adjacentResource.order;
            adjacentResource.order = tempOrder;

            await Promise.all([resource.save(), adjacentResource.save()]);
        } else {
            const extremeResource = await Resource.findOne({
                category: resource.category,
                subCategory: resource.subCategory
            }).sort({ order: direction === 'up' ? 1 : -1 });
            if (extremeResource && extremeResource._id.toString() !== resource._id.toString()) {
                resource.order = direction === 'up' ? extremeResource.order - 1 : extremeResource.order + 1;
                await resource.save();
            }
        }

        const allResources = await Resource.find({
            category: resource.category,
            subCategory: resource.subCategory
        }).sort('order');
        for (let i = 0; i < allResources.length; i++) {
            allResources[i].order = i;
            await allResources[i].save();
        }

        const updatedResources = await Resource.find({
            category: resource.category,
            subCategory: resource.subCategory
        }).sort('order');
        console.log('Sending updated resources:', updatedResources);
        return {
            statusCode: 200,
            body: JSON.stringify(updatedResources)
        };
    } catch (error) {
        console.error('Error in moveResource:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message })
        };
    } 
};