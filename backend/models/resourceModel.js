const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  order: { type: Number, default: 0, index: true },
});

const Category = mongoose.model('Category', CategorySchema);

const SubCategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  category: { 
    type: String, 
    required: true,
  },
  order: { type: Number, default: 0, index: true }
});

const SubCategory = mongoose.model('SubCategory', SubCategorySchema);

const ResourceSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  link: { 
    type: String, 
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  
  category: { 
    type: String, 
    required: true,
    
  },
  subCategory: { 
    type: String, 
    required: true,
    validate: {
      validator: async function(v) {
        const subCategory = await SubCategory.findOne({ name: v });
        return subCategory !== null;
      },
      message: props => `${props.value} is not a valid subcategory!`
    }
  },
  contactInfo: { type: String },
  address: { type: String },
  availableHours: { type: String },
  city: { type: String },
  state: { type: String },
  tags: [{ type: String }],
  order: { type: Number, default: 0, index: true },
}, { timestamps: true });

const Resource = mongoose.model('Resource', ResourceSchema);

module.exports = { Resource, SubCategory, Category };

