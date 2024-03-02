const regexWithIndex = /\[([^}]+)\]/g;
const regexEmptyBracets = /\[.*?\]/g;

const stringToPath = (path, regex = regexWithIndex) => {
  if (typeof path !== "string") return path;
  const output = [];

  path.split(".").forEach((item, index) => {
    item.split(regex).forEach((key) => {
      if (key.length > 0) {
        output.push(key);
      }
    });
  });

  return output;
};

const getObjectPropertyValue = (source, path, defaultValue) => {
  defaultValue ??= null;
  path = stringToPath(path);

  let value = source;

  for (var i = 0; i < path.length; i++) {
    value = value?.[path?.[i]] ?? defaultValue;
  }

  return value;
};

const setObjectProperties = (data = {}, property = {}) => {
  if (data && property) {
    let { key, value } = property;
    let dataStack = data;

    const isArray = regexEmptyBracets.test(key) || false;

    if (isArray) {
      key = key?.replace(regexEmptyBracets, "");
    }

    const propertyStack = stringToPath(key);

    while (propertyStack.length > 1) {
      const property = propertyStack.shift();
      dataStack = dataStack[property] ?? (dataStack[property] = {});
    }

    const nameStack = propertyStack.shift();

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

const mapString = async (source, destination, srcKey, descKey) => {
  const value = getObjectPropertyValue(source, srcKey) ?? null;
  setObjectProperties(destination, { key: descKey, value });
};

const mapObject = async (source, destination, srcKey, descKey) => {
  const { key, transform, defaultValue } = descKey;

  if (key) {
    let value = getObjectPropertyValue(source, srcKey, defaultValue);

    if (transform) {
      value = transform({ source, value });
    }

    value ??= defaultValue;

    setObjectProperties(destination, { key, value });
  } else {
    await map(source, destination, srcKey, descKey);
  }
};

const mapArray = async (source, destination, srcKey, descKey) => {
  descKey?.forEach(async (row) => await map(source, destination, srcKey, row));
};

const map = async (source, destination, srcKey, destKey) => {
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
  const destination = {};
  
  try {
    await map(source, destination, null, mapSchema);
  } catch (error) {
    console.log(error);
  }

  return destination;
};

module.exports.mapping = mapping;
