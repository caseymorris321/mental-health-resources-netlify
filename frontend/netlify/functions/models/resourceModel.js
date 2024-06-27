const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  order: { type: Number, default: 0, index: true },
});

// Custom middleware to handle duplicate category name validation
CategorySchema.pre('save', async function(next) {
  const category = this;
  const existingCategory = await Category.findOne({ name: category.name });

  if (existingCategory && existingCategory._id.toString() !== category._id.toString()) {
    return next(new Error(`A category with the name "${category.name}" already exists.`));
  }

  next();
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

// Custom middleware to handle duplicate subcategory name validation
SubCategorySchema.pre('save', async function(next) {
  const subCategory = this;
  const existingSubCategory = await SubCategory.findOne({ name: subCategory.name, category: subCategory.category });

  if (existingSubCategory && existingSubCategory._id.toString() !== subCategory._id.toString()) {
    return next(new Error(`A subcategory with the name "${subCategory.name}" already exists in the "${subCategory.category}" category.`));
  }

  next();
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
        const subCategory = await SubCategory.findOne({ name: v, category: this.category });
        return subCategory !== null;
      },
      message: props => `${props.value} is not a valid subcategory!`
    }
  },
  contactInfo: { type: String },
  address: { type: String },
  availableHours: { type: String },
  tags: [{ type: String }],
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Custom middleware to handle duplicate resource name validation
ResourceSchema.pre('save', async function(next) {
  const resource = this;
  const existingResource = await Resource.findOne({ name: resource.name, category: resource.category, subCategory: resource.subCategory });

  if (existingResource && existingResource._id.toString() !== resource._id.toString()) {
    return next(new Error(`A resource with the name "${resource.name}" already exists in the "${resource.category}" category and "${resource.subCategory}" subcategory.`));
  }

  next();
});

const Resource = mongoose.model('Resource', ResourceSchema);

module.exports = { Resource, SubCategory, Category };