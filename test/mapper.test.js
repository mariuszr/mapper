import { describe, it, expect } from "vitest";
import { mapping } from "../src/mapper";

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
});
