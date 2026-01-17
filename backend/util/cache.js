// cache.js
const cache = {};

exports.set = (key, value, ttl = 60) => {
  const expires = Date.now() + ttl * 1000;
  cache[key] = { value, expires };
};

exports.get = (key) => {
  const entry = cache[key];
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    delete cache[key];
    return null;
  }

  return entry.value;
};

exports.del = (key) => {
  delete cache[key];
};

exports.clear = () => {
  Object.keys(cache).forEach(key => delete cache[key]);
};
