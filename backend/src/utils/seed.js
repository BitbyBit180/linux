import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Distro from '../models/Distro.js';
import Flavour from '../models/Flavour.js';
import { DISTROS } from '../data/distros.js';
import { buildInstallGuide } from '../data/installGuide.js';

// Lean catalogue fields for the `flavours` collection (Flavours page).
// Heavy detail fields stay in the `distros` collection only.
const FLAVOUR_FIELDS = [
  'distroId',
  'name',
  'accent',
  'tagline',
  'basedOn',
  'pkgMgr',
  'category',
  'popular',
  'angle',
  'website',
  'downloadUrl',
  'cardBg',
  'preview',
];

const toDetailDoc = ({ id, init, ...rest }) => {
  const base = {
    distroId: id,
    // `init` in frontend data -> `initSystem` in DB (`init` is a reserved Mongoose key)
    initSystem: init || 'systemd',
    ...rest,
  };
  // Detail content (install guides) lives in the DB, not hardcoded in the client
  base.installation = buildInstallGuide({ id, ...rest });
  return base;
};

const toFlavourDoc = (detailDoc) =>
  Object.fromEntries(FLAVOUR_FIELDS.map((f) => [f, detailDoc[f]]));

const seed = async () => {
  await connectDB();
  await Distro.deleteMany({});
  await Flavour.deleteMany({});
  const detailDocs = DISTROS.map(toDetailDoc);
  await Distro.insertMany(detailDocs);
  const flavourDocs = detailDocs.map(toFlavourDoc);
  await Flavour.insertMany(flavourDocs);
  console.log(`Seeded ${detailDocs.length} distros + ${flavourDocs.length} flavours`);
  await mongoose.connection.close();
};

const destroy = async () => {
  await connectDB();
  await Distro.deleteMany({});
  await Flavour.deleteMany({});
  console.log('Destroyed all distros + flavours');
  await mongoose.connection.close();
};

const mode = process.argv[2];
if (mode === '--destroy') {
  destroy();
} else {
  seed();
}
