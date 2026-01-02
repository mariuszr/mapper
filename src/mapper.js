const regexWithIndex = /\[([^}]+)\]/g;
// NOTE: do not use /g here because RegExp#test becomes stateful via lastIndex.
const regexEmptyBrackets = /\[.*?\]/;

const MAX_PATH_CACHE_ENTRIES = 10_000;
const pathCache = new Map();

const pathCacheGet = (key) => {
  const value = pathCache.get(key);
  if (value) {
    pathCache.delete(key);
    pathCache.set(key, value);
  }
  return value;
};

const pathCacheSet = (key, value) => {
  pathCache.set(key, value);
  if (pathCache.size > MAX_PATH_CACHE_ENTRIES) {
    const oldestKey = pathCache.keys().next().value;
    if (oldestKey !== undefined) pathCache.delete(oldestKey);
  }
};

const stringToPath = (path, regex = regexWithIndex) => {
  if (typeof path !== "string") return path;

  const cacheKey = `${regex.source}::${path}`;
  const cached = pathCacheGet(cacheKey);
  if (cached) return cached;

  const output = [];

  path.split(".").forEach((item) => {
    item.split(regex).forEach((key) => {
      if (key.length > 0) output.push(key);
    });
  });

  pathCacheSet(cacheKey, output);
  return output;
};

const getObjectPropertyValue = (source, path, defaultValue) => {
  if (defaultValue === undefined) defaultValue = null;
  path = stringToPath(path);


  let value = source;

  for (let i = 0; i < path.length; i++) {
    value = value?.[path?.[i]] ?? defaultValue;
  }

  return value;
};

const setObjectProperties = (data = {}, property = {}) => {
  if (data && property) {
    let { key, value } = property;
    let dataStack = data;

    const isArray = regexEmptyBrackets.test(key) || false;


    if (isArray) {
      key = key?.replace(regexEmptyBrackets, "");
    }

    const propertyStack = stringToPath(key);

    for (let i = 0; i < propertyStack.length - 1; i++) {
      const property = propertyStack[i];
      if (dataStack[property] === undefined) dataStack[property] = {};
      dataStack = dataStack[property];
    }

    const nameStack = propertyStack[propertyStack.length - 1];

    if (nameStack) {
      if ([undefined].includes(value)) {
        value = null;
      }

      if (isArray) {
        const arrayValue = Array.isArray(value) ? value : [value];
        dataStack[nameStack] = [...(dataStack[nameStack] ?? []), ...arrayValue];
      } else {
        dataStack[nameStack] = value;
      }
    }
  }
};

const isPlainObject = (value) => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

const mapString = async (source, destination, srcKey, descKey) => {
  const value = getObjectPropertyValue(source, srcKey) ?? null;
  setObjectProperties(destination, { key: descKey, value });
};

const mapObject = async (source, destination, srcKey, descKey) => {
  if (!isPlainObject(descKey)) return;

  const { key, transform, defaultValue } = descKey;

  if (typeof key === "string" && key.length > 0) {
    let value = getObjectPropertyValue(source, srcKey, defaultValue);

    if (typeof transform === "function") {
      value = transform({ source, value });
    }

    value ??= defaultValue;

    setObjectProperties(destination, { key, value });
  } else {
    await map(source, destination, srcKey, descKey);
  }
};

const mapArray = async (source, destination, srcKey, descKey) => {
  const rows = descKey ?? [];

  for (const row of rows) {
    if (typeof row === "string") {
      await mapString(source, destination, srcKey, row);
    } else if (Array.isArray(row)) {
      await mapArray(source, destination, srcKey, row);
    } else if (typeof row === "object") {
      await mapObject(source, destination, srcKey, row);
    }
  }
};


const map = async (source, destination, srcKey, destKey) => {
  if (!isPlainObject(destKey)) return;

  for (let sKey in destKey) {
    const dKey = destKey[sKey];
    const dType = typeof dKey;

    if (srcKey) {
      sKey = `${srcKey}.${sKey}`;
    }

    if (dType === "string") {
      await mapString(source, destination, sKey, dKey);
    } else if (Array.isArray(dKey)) {
      await mapArray(source, destination, sKey, dKey);
    } else if (dType === "object") {
      await mapObject(source, destination, sKey, dKey);
    }
  }
};

const mapping = async (source, mapSchema) => {
  if (!isPlainObject(source)) {
    throw new TypeError("mapping(): 'source' must be a plain object");
  }

  if (!isPlainObject(mapSchema)) {
    throw new TypeError("mapping(): 'mapSchema' must be a plain object");
  }

  const destination = {};

  await map(source, destination, null, mapSchema);

  return destination;
};

module.exports.mapping = mapping;
// exposed for tests/benchmarking (non-public API)
module.exports._internal = {
  MAX_PATH_CACHE_ENTRIES,
  pathCache,
};
