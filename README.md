# JavaScript Mapper Library

> The document is currently being created.

The small mapper library in JavaScript is a lightweight tool that simplifies the process of mapping data from a source dataset to a destination dataset. It allows developers to define custom mapping rules and apply them to the source dataset, transforming the data as needed. The library provides a simple and flexible way to handle complex data mapping tasks, making it easier to create efficient and maintainable code. With its intuitive syntax and minimal dependencies, the small mapper library is a valuable addition to any JavaScript project.

## Features

- Define custom mapping rules
- Apply rules to source dataset
- Transform data as needed

## Usage

First, import the library:

```js
const { mapping } = require("./<path to mapper lib directory>/mapper");
```

Next, define your custom mapping schema (mapSchema) for a sample user object:

```js
// an example of the data source
const user = {
    first: "Will",
    last: "Smith",
    private: {
    user_schools: {
      highSchool: "High School Name"
    },
  },
}

// source -> destination
const mapSchema = {
    // simple property mapping
    first: { key: "first_name"},
    // or simply like
    last: "last_name",
    // transformation mapping
    name: {
        key: "display_name",
        transform: ({source}) => {
            const { first, last } = source;
            return `${first} ${last}`
        }
    },
    // path to th source props and define the destination object
    "private.user_schools.elementarySchool": "private_info.schools.elementary_school",
    "private.user_schools.highSchool": "private_info.schools.high_school",
    "private.user_schools.collagedSchool": {
        key: "private_info.schools.collaged_school",
        defaultValue: "No Collaged School Information",
  },
}
```

Execute mapping by running the mapping function

```js
const result = await mapping(user, mapSchema);
```

Result of the sample mapping

```js
{
  first_name: "Will",
  last_name: "Smith",
  display_name: "Will Smith",
  private_info: {
    schools: {
      elementary_school: null,
      high_school: "High School Name",
      collaged_school: "No Collaged School Information"
    }
  }
}
```
