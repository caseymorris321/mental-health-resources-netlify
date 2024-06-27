const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  order: { type: Number, default: 0, index: true },
});

const SubCategorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true, index: true },
  order: { type: Number, default: 0, index: true }
});

SubCategorySchema.index({ name: 1, category: 1 }, { unique: true });

const ResourceSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true, trim: true },
  link: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        if (!v) return true;
        return /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  category: { type: String, required: true, trim: true, index: true },
  subCategory: {
    type: String,
    required: true,
    trim: true,
    index: true,
    validate: {
      validator: async function (v) {
        if (!this.isModified('subCategory')) return true;
        const subCategory = await SubCategory.findOne({ name: v });
        return subCategory !== null;
      },
      message: props => `${props.value} is not a valid subcategory!`
    }
  },
  contactInfo: { type: String, trim: true },
  address: { type: String, trim: true },
  availableHours: { type: String, trim: true },
  tags: [{ type: String, trim: true }],
  order: { type: Number, default: 0, index: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ResourceSchema.index({ name: 1, category: 1, subCategory: 1 }, { unique: true });
ResourceSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Category = mongoose.model('Category', CategorySchema);
const SubCategory = mongoose.model('SubCategory', SubCategorySchema);
const Resource = mongoose.model('Resource', ResourceSchema);

module.exports = { Resource, SubCategory, Category };