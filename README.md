# Mapper

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

A tiny mapping helper for turning one plain object into another using a declarative schema. It’s meant for the boring day‑to‑day stuff: renaming keys, building nested output objects, applying a transform, and providing defaults.

## Features

- Simple `source -> destination` key mapping
- Nested paths on both sides (e.g. `user.profile.name`)
- Transforms (`transform({ source, value })`) and `defaultValue`
- Array appends via `[]` (e.g. `tags[]`)
- Bracket notation source paths (e.g. `items[0].name`)

## Install

This library is not published to npm yet.

For now you can use it in a couple of practical ways:

### Option A: clone and use locally

```sh
git clone https://github.com/mariuszr/mapper
cd mapper
pnpm install
```

### Option B: add as a dependency from GitHub

If your project uses `pnpm`, you can point to the repository directly:

```sh
pnpm add github:mariuszr/mapper
```

### Option C: add as a local file dependency

Useful when you keep multiple repos next to each other:

```sh
pnpm add file:../mapper
```

## Usage

Import function:

```js
const { mapping } = require("./src/mapper");
```

Define a schema and run mapping:

```js
const user = {
  first: "Will",
  last: "Smith",
  private: {
    user_schools: {
      highSchool: "High School Name",
    },
  },
};

// source -> destination
const mapSchema = {
  // simple rename
  first: { key: "first_name" },

  // shorthand form
  last: "last_name",

  // computed output
  name: {
    key: "display_name",
    transform: ({ source }) => `${source.first} ${source.last}`,
  },

  // nested source/destination paths
  "private.user_schools.elementarySchool": "private_info.schools.elementary_school",
  "private.user_schools.highSchool": "private_info.schools.high_school",

  // default when source path is missing
  "private.user_schools.collagedSchool": {
    key: "private_info.schools.collaged_school",
    defaultValue: "No Collaged School Information",
  },
};

const result = await mapping(user, mapSchema);
```

Result:

```js
{
  first_name: "Will",
  last_name: "Smith",
  display_name: "Will Smith",
  private_info: {
    schools: {
      elementary_school: null,
      high_school: "High School Name",
      collaged_school: "No Collaged School Information",
    },
  },
}
```

## Notes

- `mapping(source, mapSchema)` expects both arguments to be plain objects. If you pass `null`, an array, or a primitive, it throws a `TypeError`.

## Development

Run tests:

```sh
pnpm test
```

Run coverage:

```sh
pnpm test:coverage
```
