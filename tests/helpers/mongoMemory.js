const deepClone = (value) => {
  return JSON.parse(JSON.stringify(value));
};

class InMemoryCollection {
  constructor(name) {
    this.name = name;
    this.docs = [];
  }

  matchesFilter(doc, filter = {}) {
    if (!filter || Object.keys(filter).length === 0) {
      return true;
    }
    return Object.entries(filter).every(([key, value]) => {
      return doc[key] === value;
    });
  }

  async insertOne(doc) {
    const clone = deepClone(doc);
    this.docs.push(clone);
    return { acknowledged: true, insertedId: clone._id ?? null };
  }

  async findOne(filter = {}) {
    const found = this.docs.find((doc) => this.matchesFilter(doc, filter));
    return found ? deepClone(found) : null;
  }

  find(filter = {}) {
    const matches = this.docs.filter((doc) => this.matchesFilter(doc, filter));
    return {
      toArray: async () => matches.map((doc) => deepClone(doc)),
    };
  }

  async replaceOne(filter = {}, replacement) {
    const idx = this.docs.findIndex((doc) => this.matchesFilter(doc, filter));
    if (idx === -1) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    const clone = deepClone(replacement);
    this.docs[idx] = clone;
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteOne(filter = {}) {
    const idx = this.docs.findIndex((doc) => this.matchesFilter(doc, filter));
    if (idx === -1) {
      return { deletedCount: 0 };
    }
    this.docs.splice(idx, 1);
    return { deletedCount: 1 };
  }
}

const createDatabase = () => {
  const collections = new Map();

  return {
    collection(name) {
      if (!collections.has(name)) {
        collections.set(name, new InMemoryCollection(name));
      }
      return collections.get(name);
    },
  };
};

export async function startMongoMemory({ dbName = 'lenders_hq_test' } = {}) {
  const db = createDatabase();

  return {
    mongod: null,
    client: { close: async () => {} },
    uri: `memory://${dbName}`,
    db,
    stop: async () => {},
  };
}
