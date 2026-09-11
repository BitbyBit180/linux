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
  res.json({ success: true, data: distro });
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
