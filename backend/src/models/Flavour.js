import mongoose from 'mongoose';

/**
 * `flavours` collection — lean catalogue docs for the Flavours page
 * (cards grid, search, category filter). No heavy fields here:
 * no description, keyFeatures, or install guides — those live in
 * the `distros` (detail) collection. Linked via `distroId`.
 */
const flavourSchema = new mongoose.Schema(
  {
    // slug, e.g. "ubuntu" — matches frontend `distro.id`
    distroId: {
      type: String,
      required: [true, 'distroId is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: [true, 'name is required'], trim: true },
    accent: { type: String, default: '#E95420' },
    tagline: { type: String, default: '' },
    basedOn: { type: String, default: 'Independent' },
    pkgMgr: { type: String, default: 'apt' },
    category: { type: String, default: 'Independent', index: true },
    popular: { type: Boolean, default: false, index: true },
    angle: { type: Number },
    website: { type: String, default: '' },
    downloadUrl: { type: String, default: '' },
    cardBg: { type: String, default: '' },
    preview: { type: String, default: '' },
  },
  { timestamps: true }
);

// Text index for search (name, tagline, basedOn, pkgMgr, category)
flavourSchema.index({
  name: 'text',
  tagline: 'text',
  basedOn: 'text',
  pkgMgr: 'text',
  category: 'text',
});

// Expose `id` like the frontend expects (frontend uses distro.id)
flavourSchema.virtual('id').get(function () {
  return this.distroId;
});

// Shape API JSON like the frontend object: { id, ... } — hide internals.
const shapeJSON = (doc, ret) => {
  ret.id = ret.distroId;
  delete ret._id;
  delete ret.__v;
  return ret;
};
flavourSchema.set('toJSON', { virtuals: true, transform: shapeJSON });
flavourSchema.set('toObject', { virtuals: true, transform: shapeJSON });

const Flavour = mongoose.model('Flavour', flavourSchema);
export default Flavour;
