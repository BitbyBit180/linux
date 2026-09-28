import Distro from '../models/Distro.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildInstallGuide } from '../data/installGuide.js';

// Frontend sends `id` / `init` / `installGuide`;
// DB stores `distroId` / `initSystem` / `installation`
// (`init` is a reserved Mongoose Document method).
const toDB = (body = {}) => {
  const data = { ...body };
  if (data.id && !data.distroId) data.distroId = data.id;
  if (data.init && !data.initSystem) data.initSystem = data.init;
  if (data.installGuide && !data.installation) data.installation = data.installGuide;
  delete data.id;
  delete data.init;
  delete data.installGuide;
  return data;
};

// GET /api/distros/:id  (matches by distroId OR name, case-insensitive — same as frontend)
// Includes the full `installGuide` ({ normal, dual, vm }) from the DB.
// Docs created before guides existed get one built on the fly.
export const getDistroById = asyncHandler(async (req, res) => {
  const key = (req.params.id || '').toLowerCase();
  const distro =
    (await Distro.findOne({ distroId: key })) ||
    (await Distro.findOne({ name: { $regex: `^${key}$`, $options: 'i' } }));

  if (!distro) {
    res.status(404);
    throw new Error(`Distro '${req.params.id}' not found`);
  }
  if (!distro.installation) {
    distro.installation = buildInstallGuide(distro.toObject());
  }
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.json({ success: true, data: distro });
});

// GET /api/distros/compare?ids=ubuntu,arch,alpine
// Lean side-by-side comparison payload (max 4, enforced by the client too).
// Unrecognized ids are ignored; the response keeps the requested order.
const COMPARE_FIELDS =
  'distroId name accent tagline basedOn initSystem pkgMgr desktop category ' +
  'releaseModel latestVersion minRam minDisk license architectures installCmd ' +
  'website downloadUrl preview';

export const getDistrosForCompare = asyncHandler(async (req, res) => {
  const ids = (req.query.ids || '')
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);

  if (ids.length === 0) {
    res.status(400);
    throw new Error('Provide up to 4 distro ids, e.g. /api/distros/compare?ids=ubuntu,arch');
  }
  if (ids.length > 4) {
    res.status(400);
    throw new Error('Cannot compare more than 4 distros');
  }

  const docs = await Distro.find({ distroId: { $in: ids } }).select(COMPARE_FIELDS);
  const byId = new Map(docs.map((d) => [d.distroId, d]));
  // Documents go through the model's toJSON transform, so each comes out
  // shaped like the frontend object ({ id, init, ... }).
  const data = ids
    .map((id) => byId.get(id))
    .filter(Boolean);

  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.json({ success: true, count: data.length, data });
});

// POST /api/distros
export const createDistro = asyncHandler(async (req, res) => {
  const distro = await Distro.create(toDB(req.body));
  res.status(201).json({ success: true, data: distro });
});

// PUT /api/distros/:id
export const updateDistro = asyncHandler(async (req, res) => {
  const key = (req.params.id || '').toLowerCase();
  const distro = await Distro.findOneAndUpdate({ distroId: key }, toDB(req.body), {
    new: true,
    runValidators: true,
  });
  if (!distro) {
    res.status(404);
    throw new Error(`Distro '${req.params.id}' not found`);
  }
  res.json({ success: true, data: distro });
});

// DELETE /api/distros/:id
export const deleteDistro = asyncHandler(async (req, res) => {
  const key = (req.params.id || '').toLowerCase();
  const distro = await Distro.findOneAndDelete({ distroId: key });
  if (!distro) {
    res.status(404);
    throw new Error(`Distro '${req.params.id}' not found`);
  }
  res.json({ success: true, message: `Distro '${key}' deleted` });
});
