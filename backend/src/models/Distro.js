import mongoose from 'mongoose';

/**
 * `distros` collection — FULL DETAIL docs for the Distro Detail page
 * (specs, description, keyFeatures, install guides).
 * The lean Flavours-page catalogue lives in the separate `flavours`
 * collection (see Flavour.js). Linked via `distroId`.
 */

const distroSchema = new mongoose.Schema(
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
    // NOTE: named `initSystem` in DB because `init` is a reserved
    // Mongoose Document method — exposed as `init` in API JSON below.
    initSystem: { type: String, default: 'systemd' },
    pkgMgr: { type: String, default: 'apt' },
    desktop: { type: String, default: '' },
    category: {
      type: String,
      default: 'Independent',
      index: true,
    },
    popular: { type: Boolean, default: false, index: true },
    angle: { type: Number },
    website: { type: String, default: '' },
    downloadUrl: { type: String, default: '' },
    releaseModel: { type: String, default: '' },
    architectures: { type: String, default: '' },
    installCmd: { type: String, default: '' },
    cardBg: { type: String, default: '' },
    preview: { type: String, default: '' },
    description: { type: String, default: '' },
    keyFeatures: { type: [String], default: [] },
    // Step-by-step install guides { normal, dual, vm } — built by
    // buildInstallGuide() and stored per-distro so detail content
    // lives in the DB, not hardcoded in the client.
    // Exposed in API JSON as `installGuide`.
    installation: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, suppressReservedKeysWarning: true }
);

// Text index for search (name, tagline, basedOn, pkgMgr, category)
distroSchema.index({
  name: 'text',
  tagline: 'text',
  basedOn: 'text',
  pkgMgr: 'text',
  category: 'text',
});

// Expose `id` like the frontend expects (frontend uses distro.id)
distroSchema.virtual('id').get(function () {
  return this.distroId;
});

// Shape API JSON exactly like the frontend object:
// { id, init, installGuide, ... } — hide _id/__v/initSystem internals.
// (`installation` is only present on detail responses; lists omit it.)
const shapeJSON = (doc, ret) => {
  ret.id = ret.distroId;
  ret.init = ret.initSystem ?? 'systemd';
  if (ret.installation) ret.installGuide = ret.installation;
  delete ret.installation;
  delete ret.initSystem;
  delete ret._id;
  delete ret.__v;
  return ret;
};
distroSchema.set('toJSON', { virtuals: true, transform: shapeJSON });
distroSchema.set('toObject', { virtuals: true, transform: shapeJSON });

const Distro = mongoose.model('Distro', distroSchema);
export default Distro;
