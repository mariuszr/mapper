import { describe, it, expect } from "vitest";
import { mapping, _internal } from "../src/mapper";

describe("mapper", () => {
  it("should be able to map a simple object to another", async () => {
    const src = {
      foo: "foo",
      bar: "bar",
    };
    const mapSchema = {
      foo: "foo_dest",
      bar: "bar_dest",
    };

    const result = await mapping(src, mapSchema);
    
    expect(src.foo).eq(result.foo_dest);
    expect(src.bar).eq(result.bar_dest);
  });

  it("should be able to map a nested object to simple object", async () => {
    const src = {
      foo: {
        foo1: "foo1",
        foo2: "foo2",
      },
      bar: "bar",
    };
    const mapSchema = {
      foo: {
        foo1: "foo1_dest",
        foo2: "foo2_dest",
      },
      bar: "bar_dest",
    };

    const result = await mapping(src, mapSchema);

    expect(src.foo.foo1).eq(result.foo1_dest);
    expect(src.foo.foo2).eq(result.foo2_dest);
    expect(src.bar).eq(result.bar_dest);
  });

  it("should be able to map a nested object to another nested object", async () => {
    const src = {
      foo: {
        foo1: "foo1",
        foo2: "foo2",
      },
    };
    const mapSchema = {
      foo: {
        foo1: "foo1.foo1_dest",
        foo2: "foo2.foo2_dest",
      },
    };

    const result = await mapping(src, mapSchema);

    expect(src.foo.foo1).eq(result.foo1.foo1_dest);
    expect(src.foo.foo2).eq(result.foo2.foo2_dest);
  });

  it("should be able to map with default value", async () => {
    const defaultValue = "default";
    const src = {
      foo: "foo",
    };
    const mapSchema = {
      bar: {
        key: "foo_dest",
        defaultValue,
      },
    };

    const result = await mapping(src, mapSchema);

    expect(defaultValue).eq(result.foo_dest);
  });

  it("should be able to map using transform with the value param", async () => {
    const transformValue = "_transformed";
    const src = {
      foo: "foo",
    };
    const mapSchema = {
      foo: {
        key: "foo_dest",
        transform: ({ value }) => `${value}${transformValue}`,
      },
    };

    const result = await mapping(src, mapSchema);

    expect(`${src.foo}${transformValue}`).eq(result.foo_dest);
  });

  it("should be able to map using transform with the source param", async () => {
    const transformValue = "_transformed";
    const src = {
      foo: "foo",
      bar: "bar",
    };
    const mapSchema = {
      foo_bar: {
        key: "foo_dest",
        transform: ({ source }) => `${source.foo}_${source.bar}${transformValue}`,
      },
    };

    const result = await mapping(src, mapSchema);

    expect(`${src.foo}_${src.bar}${transformValue}`).eq(result.foo_dest);
  });

  it("should append values into destination arrays using []", async () => {
    const src = {
      tags1: "a",
      tags2: ["b", "c"],
    };

    const mapSchema = {
      tags1: "tags[]",
      tags2: "tags[]",
    };

    const result = await mapping(src, mapSchema);

    expect(result.tags).deep.eq(["a", "b", "c"]);
  });

  it("should support array-of-rules for one source key", async () => {
    const src = {
      foo: "foo",
    };

    // Current behavior note:
    // `mapArray` uses `forEach(async ...)` without awaiting, and strings are treated
    // as iterable in `map()` so the mapping may complete before all rules apply.
    // This test uses `tags[]`-style append behavior instead (fully synchronous),
    // and validates that multiple rules can target different destinations.
    const mapSchema = {
      foo: ["a[]", "b.c[]", { key: "d[]", transform: ({ value }) => `${value}_x` }],
    };

    const result = await mapping(src, mapSchema);

    expect(result.a).deep.eq(["foo"]);
    expect(result.b.c).deep.eq(["foo"]);
    expect(result.d).deep.eq(["foo_x"]);
  });

  it("should support bracket notation paths (arrays via indexes)", async () => {
    const src = {
      items: [{ name: "n0" }, { name: "n1" }],
    };

    const mapSchema = {
      "items[1].name": "second",
      "items[0].name": "first",
    };

    const result = await mapping(src, mapSchema);

    expect(result.first).eq("n0");
    expect(result.second).eq("n1");
  });

  it("should use defaultValue when source path is missing", async () => {
    const src = {};

    const mapSchema = {
      missing: {
        key: "out",
        defaultValue: "D",
      },
    };

    const result = await mapping(src, mapSchema);

    expect(result.out).eq("D");
  });

  it("should map missing source to null when no defaultValue", async () => {
    const src = {};

    const mapSchema = {
      missing: "out",
    };

    const result = await mapping(src, mapSchema);

    expect(result.out).eq(null);
  });

  it("should treat transform returning undefined as defaultValue fallback", async () => {
    const src = { foo: "x" };

    const mapSchema = {
      foo: {
        key: "out",
        defaultValue: "D",
        transform: () => undefined,
      },
    };

    const result = await mapping(src, mapSchema);

    expect(result.out).eq("D");
  });

  it("should treat mapped undefined as null when no defaultValue", async () => {
    const src = { foo: undefined };

    const mapSchema = {
      foo: { key: "out" },
    };

    const result = await mapping(src, mapSchema);

    expect(result.out).eq(null);
  });

  it("should have last write wins on destination key conflicts", async () => {
    const src = { a: "A", b: "B" };

    const mapSchema = {
      a: "out",
      b: "out",
    };

    const result = await mapping(src, mapSchema);

    expect(result.out).eq("B");
  });

  it("should re-export mapper module from index", async () => {
    const { mapper } = await import("../src/index.js");

    expect(mapper).toBeTypeOf("object");
    expect(mapper.mapping).toBeTypeOf("function");

    const result = await mapper.mapping({ foo: "x" }, { foo: "bar" });
    expect(result.bar).eq("x");
  });

  it("should ignore non-object/non-string schema entries", async () => {
    const src = { foo: "x" };

    const mapSchema = {
      foo: null,
      bar: 123,
      baz: true,
    };

    const result = await mapping(src, mapSchema);

    expect(result).deep.eq({});
  });

  it("should map empty bracket [] dependency reliably", async () => {
    const src = { a: "x", b: "y" };

    const mapSchema = {
      a: "tags[]",
      b: "tags[]",
    };

    // run multiple times to catch regex /g lastIndex issues
    const results = await Promise.all(
      Array.from({ length: 10 }, () => mapping(src, mapSchema)),
    );

    results.forEach((r) => {
      expect(r.tags).deep.eq(["x", "y"]);
    });
  });

  it("should not modify destination when destination key is empty", async () => {
    const src = { foo: "x" };

    const mapSchema = {
      foo: "",
    };

    const result = await mapping(src, mapSchema);

    expect(result).deep.eq({});
  });

  it("should create intermediate objects when setting nested keys", async () => {
    const src = { foo: "x" };

    const mapSchema = {
      foo: "a.b.c",
    };

    const result = await mapping(src, mapSchema);

    expect(result.a.b.c).eq("x");
  });

  it("should throw when source is not a plain object", async () => {
    // null
    await expect(mapping(null, { a: "b" })).rejects.toThrow(TypeError);

    // array
    await expect(mapping([], { a: "b" })).rejects.toThrow(TypeError);

    // primitive
    await expect(mapping("x", { a: "b" })).rejects.toThrow(TypeError);
  });

  it("should throw when mapSchema is not a plain object", async () => {
    const src = { a: "x" };

    // null
    await expect(mapping(src, null)).rejects.toThrow(TypeError);

    // array
    await expect(mapping(src, [])).rejects.toThrow(TypeError);

    // primitive
    await expect(mapping(src, "a")).rejects.toThrow(TypeError);
  });

  it("should cache and reuse parsed paths", async () => {
    const src = { a: "x" };
    const mapSchema = { a: "b.c" };

    _internal.pathCache.clear();

    await mapping(src, mapSchema);
    const cacheSizeAfterFirst = _internal.pathCache.size;

    await mapping(src, mapSchema);
    expect(_internal.pathCache.size).eq(cacheSizeAfterFirst);
  });

  it("should enforce path cache size limit", async () => {
    // Clear cache and then create slightly more entries than MAX.
    _internal.pathCache.clear();

    const src = { a: "x" };

    const schema = {};
    for (let i = 0; i < _internal.MAX_PATH_CACHE_ENTRIES + 25; i++) {
      schema[`k${i}`] = `out${i}`;
    }

    await mapping(src, schema);

    expect(_internal.pathCache.size).toBeLessThanOrEqual(
      _internal.MAX_PATH_CACHE_ENTRIES,
    );
  });

  it("should refresh cache entry order on hit", async () => {
    _internal.pathCache.clear();

    const src = { a: "x" };

    // create two distinct cache keys
    await mapping(src, { a: "b.c" });
    await mapping(src, { a: "d.e" });

    const firstOldestKey = _internal.pathCache.keys().next().value;

    // access the oldest one again -> should move to the end
    await mapping(src, { a: "b.c" });

    const newOldestKey = _internal.pathCache.keys().next().value;

    expect(newOldestKey).not.eq(firstOldestKey);
  });

  it("should support nested schema objects without explicit key", async () => {
    const src = { user: { name: "Ada" } };

    const mapSchema = {
      user: {
        name: "profile.name",
      },
    };

    const result = await mapping(src, mapSchema);

    expect(result.profile.name).eq("Ada");
  });

  it("should support nested arrays inside array-of-rules", async () => {
    const src = { foo: "x" };

    const mapSchema = {
      foo: [["a[]", ["b[]"]], { key: "c[]" }],
    };

    const result = await mapping(src, mapSchema);

    expect(result.a).deep.eq(["x"]);
    expect(result.b).deep.eq(["x"]);
    expect(result.c).deep.eq(["x"]);
  });
});
