-- Add non-clothing donation categories (grains, toys, school supplies, etc.)
-- to every NGO that already exists in the database.
--
-- Idempotent: "slug" is globally unique, so re-running this migration (or
-- running it against a database which already has some of these rows) is a
-- no-op thanks to ON CONFLICT DO NOTHING. Fresh databases get the same rows
-- from prisma/seed.ts.

INSERT INTO "ClothingCategory"
    ("name", "slug", "description", "imageUrl", "genderAgeGroup", "defaultReorderThreshold", "ngoId", "createdAt", "updatedAt")
SELECT
    v."name",
    v."slug",
    v."description",
    NULL,
    v."gender",
    v."threshold",
    n."id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "NGO" AS n
CROSS JOIN (VALUES
    ('Grains & Pulses',    'grains-pulses',    'Rice, wheat, dal and other staple grains for family ration kits', 'Unisex',   100),
    ('Toys',               'toys',             'Soft toys, puzzles and learning toys for children',               'Children',  40),
    ('Books & Stationery', 'books-stationery', 'Textbooks, notebooks, pens and school stationery',                'Children',  60),
    ('Footwear',           'footwear',         'Footwear for children, women and men',                            'Unisex',    30),
    ('Blankets & Bedding', 'blankets-bedding', 'Blankets, bedsheets and warm bedding for families',               'Unisex',    25),
    ('Kitchen Utensils',   'kitchen-utensils', 'Cooking and serving utensils for household kits',                 'Unisex',    20),
    ('Hygiene Kits',       'hygiene-kits',     'Soap, sanitary pads and personal hygiene essentials',             'Unisex',    50),
    ('School Bags',        'school-bags',      'Backpacks and school bags for students',                          'Children',  40)
) AS v("name", "slug", "description", "gender", "threshold")
ON CONFLICT ("slug") DO NOTHING;
