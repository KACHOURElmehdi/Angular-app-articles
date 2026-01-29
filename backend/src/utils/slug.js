const slugify = require('slugify');
const { randomBytes } = require('crypto');

const buildSlug = title => {
  const base = slugify(title, { lower: true, strict: true }) || 'article';
  const suffix = randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
};

module.exports = { buildSlug };
