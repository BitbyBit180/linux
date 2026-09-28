import Flavour from '../models/Flavour.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/flavours?search=&category=&popular=true&page=1&limit=50&sort=name
export const getFlavours = asyncHandler(async (req, res) => {
  const { search = '', category = '', popular, page = '1', limit = '50', sort = '' } = req.query;

  const filter = {};
  if (category && category !== 'All') filter.category = category;
  if (popular === 'true') filter.popular = true;
  if (popular === 'false') filter.popular = false;

  if (search.trim()) {
    const q = search.trim();
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { tagline: { $regex: q, $options: 'i' } },
      { basedOn: { $regex: q, $options: 'i' } },
      { pkgMgr: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

  const sortOption = sort === 'name' ? { name: 1 } : sort === 'newest' ? { createdAt: -1 } : {};

  const [total, flavours] = await Promise.all([
    Flavour.countDocuments(filter),
    Flavour.find(filter).sort(sortOption).skip((pageNum - 1) * limitNum).limit(limitNum),
  ]);

  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.json({
    success: true,
    count: flavours.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: flavours,
  });
});

// GET /api/flavours/popular
export const getPopularFlavours = asyncHandler(async (req, res) => {
  const flavours = await Flavour.find({ popular: true }).sort({ name: 1 });
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.json({ success: true, count: flavours.length, data: flavours });
});

// GET /api/flavours/categories
export const getFlavourCategories = asyncHandler(async (req, res) => {
  const categories = await Flavour.distinct('category');
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  res.json({ success: true, data: ['All', ...categories.sort()] });
});

// GET /api/flavours/:id (by distroId OR name, case-insensitive)
export const getFlavourById = asyncHandler(async (req, res) => {
  const key = (req.params.id || '').toLowerCase();
  const flavour =
    (await Flavour.findOne({ distroId: key })) ||
    (await Flavour.findOne({ name: { $regex: `^${key}$`, $options: 'i' } }));

  if (!flavour) {
    res.status(404);
    throw new Error(`Flavour '${req.params.id}' not found`);
  }
  res.json({ success: true, data: flavour });
});

// POST /api/flavours
export const createFlavour = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.id && !data.distroId) data.distroId = data.id;
  delete data.id;
  const flavour = await Flavour.create(data);
  res.status(201).json({ success: true, data: flavour });
});

// PUT /api/flavours/:id
export const updateFlavour = asyncHandler(async (req, res) => {
  const key = (req.params.id || '').toLowerCase();
  const data = { ...req.body };
  delete data.id;
  delete data.distroId;
  const flavour = await Flavour.findOneAndUpdate({ distroId: key }, data, {
    new: true,
    runValidators: true,
  });
  if (!flavour) {
    res.status(404);
    throw new Error(`Flavour '${req.params.id}' not found`);
  }
  res.json({ success: true, data: flavour });
});

// DELETE /api/flavours/:id
export const deleteFlavour = asyncHandler(async (req, res) => {
  const key = (req.params.id || '').toLowerCase();
  const flavour = await Flavour.findOneAndDelete({ distroId: key });
  if (!flavour) {
    res.status(404);
    throw new Error(`Flavour '${req.params.id}' not found`);
  }
  res.json({ success: true, message: `Flavour '${key}' deleted` });
});
