# Mapper

[![CI](https://github.com/mariuszr/mapper/actions/workflows/ci.yml/badge.svg)](https://github.com/mariuszr/mapper/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/mariuszr/mapper)](https://github.com/mariuszr/mapper/releases)
[![License](https://img.shields.io/github/license/mariuszr/mapper)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/mariuszr/mapper)](https://github.com/mariuszr/mapper/commits)
[![Issues](https://img.shields.io/github/issues/mariuszr/mapper)](https://github.com/mariuszr/mapper/issues)
[![PRs](https://img.shields.io/github/issues-pr/mariuszr/mapper)](https://github.com/mariuszr/mapper/pulls)

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
const { mapping } = require("mapper");
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

## API

### `mapping(source, mapSchema)`

Returns a new object created by applying `mapSchema` to `source`.

Both `source` and `mapSchema` must be plain objects. Passing `null`, arrays, or primitives throws a `TypeError`.

### Schema format

Each key in `mapSchema` represents a source path. The value decides how that source value is written to the output:

- **String**: destination path
  - Example: `{ "user.name": "profile.fullName" }`
- **Object rule**: `{ key, defaultValue, transform }`
  - `key` (string): destination path
  - `defaultValue` (any): used when source path is missing or when `transform` returns `undefined`
  - `transform` (function): called as `transform({ source, value })` (synchronous)
- **Array of rules**: apply multiple rules to the same source key
  - Example: `{ id: ["userId", "audit.id"] }`

### Paths

- Dot notation is supported on both sides: `a.b.c`.
- Source can use bracket indexes: `items[0].name`.
- Destination can append to arrays using `[]`: `tags[]`.

## More examples

### Append to arrays (`[]`)

```js
const src = { t1: "a", t2: ["b", "c"] };
const mapSchema = { t1: "tags[]", t2: "tags[]" };

const out = await mapping(src, mapSchema);
// { tags: ["a", "b", "c"] }
```

### Nested schema objects

You can group rules under a source object (handy for big schemas):

```js
const src = { user: { name: "Ada", age: 31 } };

const mapSchema = {
  user: {
    name: "profile.name",
    age: "profile.age",
  },
};

const out = await mapping(src, mapSchema);
// { profile: { name: "Ada", age: 31 } }
```

### Default values

```js
const src = {};

const mapSchema = {
  missing: { key: "out", defaultValue: "D" },
};

const out = await mapping(src, mapSchema);
// { out: "D" }
```

## Notes

- `mapping()` is intentionally small and focused. If a schema entry is `null`/number/boolean, it will be ignored.
- If a destination path conflicts with an existing non-object value (e.g. `out` is a string but you try to set `out.nested`), that write is ignored.
- For `[]` appends, existing non-array values are coerced into arrays (to preserve existing values).
- Internals (like caching) are not part of the public API and may change.

## Development

Run tests:

```sh
pnpm test
```

Run coverage:

```sh
pnpm test:coverage
```

## License

MIT — see `LICENSE`.
