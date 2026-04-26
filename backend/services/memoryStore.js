const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

/**
 * In-memory data store — replaces MongoDB when running in trial/demo mode.
 * Provides Mongoose-compatible interfaces for User, ApiKey, and RequestLog.
 */

// ─── Storage Maps ───────────────────────────────────────────────────────────
const users = new Map(); // id -> user doc
const apiKeys = new Map(); // id -> apiKey doc
const requestLogs = []; // array of log entries (capped at 10,000)
const blockedUsers = new Map(); // identifier -> { expiresAt }

const MAX_LOGS = 10_000;

// ─── Helper ─────────────────────────────────────────────────────────────────
function genId() {
  return uuidv4().replace(/-/g, "").slice(0, 24);
}

// ─── User Store ─────────────────────────────────────────────────────────────
const UserStore = {
  async create({ username, email, password, role = "admin" }) {
    for (const u of users.values()) {
      if (u.email === email || u.username === username) {
        const err = new Error("User with that email or username already exists");
        err.code = 11000;
        throw err;
      }
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const id = genId();
    const user = {
      _id: id,
      username,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.set(id, user);
    const { password: _, ...safe } = user;
    safe.comparePassword = async (candidate) =>
      bcrypt.compare(candidate, hashedPassword);
    return safe;
  },

  async findOne(query) {
    for (const u of users.values()) {
      if (query.$or) {
        const match = query.$or.some((cond) =>
          Object.entries(cond).every(([k, v]) => u[k] === v)
        );
        if (match) {
          const copy = { ...u };
          copy.comparePassword = async (candidate) =>
            bcrypt.compare(candidate, u.password);
          return copy;
        }
      } else {
        const match = Object.entries(query).every(([k, v]) => u[k] === v);
        if (match) {
          const copy = { ...u };
          copy.comparePassword = async (candidate) =>
            bcrypt.compare(candidate, u.password);
          return copy;
        }
      }
    }
    return null;
  },

  async findById(id) {
    const u = users.get(id);
    if (!u) return null;
    const copy = { ...u };
    copy.comparePassword = async (candidate) =>
      bcrypt.compare(candidate, u.password);
    return copy;
  },

  findOneChain(query) {
    return {
      select: () => UserStore.findOne(query),
    };
  },
};

// ─── ApiKey Store ───────────────────────────────────────────────────────────
const ApiKeyStore = {
  async create({ key, name, userId, tier = "free" }) {
    const id = genId();
    const apiKey = {
      _id: id,
      key,
      name,
      userId,
      tier,
      active: true,
      requestCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    apiKeys.set(id, apiKey);
    return apiKey;
  },

  async findOne(query) {
    for (const k of apiKeys.values()) {
      const match = Object.entries(query).every(
        ([field, val]) => k[field] === val
      );
      if (match) return { ...k };
    }
    return null;
  },

  async find() {
    const all = Array.from(apiKeys.values())
      .map((k) => ({ ...k }))
      .sort((a, b) => b.createdAt - a.createdAt);
    return {
      select: () => ({
        sort: () => all,
      }),
    };
  },

  async findSorted() {
    return Array.from(apiKeys.values())
      .map((k) => ({ ...k }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async findByIdAndUpdate(id, update) {
    const k = apiKeys.get(id);
    if (!k) return null;
    if (update.$inc) {
      for (const [field, amt] of Object.entries(update.$inc)) {
        k[field] = (k[field] || 0) + amt;
      }
    } else {
      Object.assign(k, update);
    }
    k.updatedAt = new Date();
    return { ...k };
  },

  async updateOne(query, update) {
    for (const k of apiKeys.values()) {
      const match = Object.entries(query).every(([f, v]) => k[f] === v);
      if (match) {
        if (update.$inc) {
          for (const [field, amt] of Object.entries(update.$inc)) {
            k[field] = (k[field] || 0) + amt;
          }
        }
        return;
      }
    }
  },
};

// ─── RequestLog Store ───────────────────────────────────────────────────────
const RequestLogStore = {
  create(entry) {
    const doc = {
      ...entry,
      _id: genId(),
      timestamp: entry.timestamp || new Date(),
    };
    requestLogs.push(doc);
    if (requestLogs.length > MAX_LOGS) {
      requestLogs.splice(0, requestLogs.length - MAX_LOGS);
    }
    return Promise.resolve(doc);
  },

  countDocuments(query = {}) {
    return Promise.resolve(filterLogs(query).length);
  },

  distinct(field, query = {}) {
    const filtered = filterLogs(query);
    const vals = [...new Set(filtered.map((l) => l[field]).filter(Boolean))];
    return Promise.resolve(vals);
  },

  aggregate(pipeline) {
    return Promise.resolve(runAggregate(pipeline));
  },

  find(query = {}) {
    const filtered = filterLogs(query);
    return {
      sort: (sortObj) => {
        const key = Object.keys(sortObj)[0];
        const dir = sortObj[key];
        filtered.sort((a, b) =>
          dir === -1
            ? new Date(b[key]) - new Date(a[key])
            : new Date(a[key]) - new Date(b[key])
        );
        return {
          limit: (n) => ({
            lean: () => Promise.resolve(filtered.slice(0, n)),
          }),
          skip: (s) => ({
            limit: (n) => ({
              lean: () => Promise.resolve(filtered.slice(s, s + n)),
            }),
          }),
          lean: () => Promise.resolve(filtered),
        };
      },
    };
  },
};

// ─── Query helpers ──────────────────────────────────────────────────────────
function filterLogs(query) {
  return requestLogs.filter((log) => {
    for (const [key, cond] of Object.entries(query)) {
      if (
        typeof cond === "object" &&
        cond !== null &&
        !(cond instanceof Date)
      ) {
        if (cond.$gte && new Date(log[key]) < new Date(cond.$gte)) return false;
        if (cond.$lte && new Date(log[key]) > new Date(cond.$lte)) return false;
        if (cond.$eq && log[key] !== cond.$eq) return false;
      } else {
        if (log[key] !== cond) return false;
      }
    }
    return true;
  });
}

function runAggregate(pipeline) {
  let docs = [...requestLogs];

  for (const stage of pipeline) {
    if (stage.$match) {
      docs = docs.filter((doc) => {
        for (const [key, cond] of Object.entries(stage.$match)) {
          if (
            typeof cond === "object" &&
            cond !== null &&
            !(cond instanceof Date)
          ) {
            if (cond.$gte && new Date(doc[key]) < new Date(cond.$gte))
              return false;
            if (cond.$lte && new Date(doc[key]) > new Date(cond.$lte))
              return false;
            if (cond.$eq && doc[key] !== cond.$eq) return false;
          } else {
            if (doc[key] !== cond) return false;
          }
        }
        return true;
      });
    }

    if (stage.$group) {
      const groups = new Map();
      const groupDef = stage.$group;

      for (const doc of docs) {
        let groupKey;

        if (typeof groupDef._id === "string" && groupDef._id.startsWith("$")) {
          groupKey = doc[groupDef._id.slice(1)];
        } else if (
          typeof groupDef._id === "object" &&
          groupDef._id !== null
        ) {
          if (groupDef._id.$switch) {
            // Categorize by status code
            if (doc.status < 300) groupKey = "success";
            else if (doc.status < 400) groupKey = "redirect";
            else if (doc.status === 429) groupKey = "rate_limited";
            else if (doc.status === 403) groupKey = "forbidden";
            else if (doc.status < 500) groupKey = "client_error";
            else groupKey = "server_error";
          } else if (groupDef._id.$dateToString) {
            const ts = new Date(doc.timestamp);
            const y = ts.getFullYear();
            const m = String(ts.getMonth() + 1).padStart(2, "0");
            const d = String(ts.getDate()).padStart(2, "0");
            const h = String(ts.getHours()).padStart(2, "0");
            const min = String(ts.getMinutes()).padStart(2, "0");
            groupKey = `${y}-${m}-${d}T${h}:${min}`;
          } else {
            groupKey = JSON.stringify(
              Object.fromEntries(
                Object.entries(groupDef._id).map(([k, v]) => [
                  k,
                  typeof v === "string" && v.startsWith("$")
                    ? doc[v.slice(1)]
                    : v,
                ])
              )
            );
          }
        } else {
          groupKey = groupDef._id;
        }

        if (!groups.has(groupKey)) {
          groups.set(groupKey, { _id: groupKey, _docs: [] });
        }
        groups.get(groupKey)._docs.push(doc);
      }

      docs = Array.from(groups.values()).map((g) => {
        const result = { _id: g._id };
        for (const [field, acc] of Object.entries(groupDef)) {
          if (field === "_id") continue;
          if (acc.$sum) {
            if (acc.$sum === 1) {
              result[field] = g._docs.length;
            } else if (typeof acc.$sum === "object" && acc.$sum.$cond) {
              result[field] = g._docs.filter((d) => {
                const cond = acc.$sum.$cond;
                if (Array.isArray(cond)) {
                  const [test] = cond;
                  if (test.$eq) {
                    const fld = test.$eq[0].replace("$", "");
                    return d[fld] === test.$eq[1];
                  }
                }
                return false;
              }).length;
            }
          }
          if (acc.$avg) {
            const fld = acc.$avg.replace("$", "");
            const sum = g._docs.reduce((s, d) => s + (d[fld] || 0), 0);
            result[field] = g._docs.length > 0 ? Math.round(sum / g._docs.length) : 0;
          }
          if (acc.$max) {
            const fld = acc.$max.replace("$", "");
            result[field] = g._docs.reduce(
              (max, d) =>
                new Date(d[fld]) > new Date(max) ? d[fld] : max,
              g._docs[0]?.[fld]
            );
          }
          if (acc.$addToSet) {
            const fld = acc.$addToSet.replace("$", "");
            result[field] = [...new Set(g._docs.map((d) => d[fld]))];
          }
        }

        if (typeof g._id === "string" && g._id.startsWith("{")) {
          try {
            result._id = JSON.parse(g._id);
          } catch {}
        }

        return result;
      });
    }

    if (stage.$sort) {
      const [key, dir] = Object.entries(stage.$sort)[0];
      docs.sort((a, b) => (dir === -1 ? b[key] - a[key] : a[key] - b[key]));
    }

    if (stage.$limit) {
      docs = docs.slice(0, stage.$limit);
    }
  }

  return docs;
}

// ─── Blocked Users (in-memory, replaces Redis blocked keys) ─────────────────
const BlockedStore = {
  block(identifier, durationMin) {
    blockedUsers.set(identifier, {
      expiresAt: Date.now() + durationMin * 60 * 1000,
    });
    return true;
  },

  unblock(identifier) {
    blockedUsers.delete(identifier);
  },

  getTTL(identifier) {
    const entry = blockedUsers.get(identifier);
    if (!entry) return -2;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    if (remaining <= 0) {
      blockedUsers.delete(identifier);
      return -2;
    }
    return remaining;
  },

  getAll() {
    const now = Date.now();
    const result = [];
    for (const [identifier, entry] of blockedUsers) {
      const ttl = Math.ceil((entry.expiresAt - now) / 1000);
      if (ttl <= 0) {
        blockedUsers.delete(identifier);
      } else {
        result.push({
          identifier,
          ttl,
          expiresAt: new Date(entry.expiresAt),
        });
      }
    }
    result.sort((a, b) => b.ttl - a.ttl);
    return result;
  },

  count() {
    const now = Date.now();
    for (const [id, entry] of blockedUsers) {
      if (entry.expiresAt <= now) blockedUsers.delete(id);
    }
    return blockedUsers.size;
  },
};

// ─── Violations tracking (in-memory, replaces Redis) ────────────────────────
const violations = new Map();

const ViolationStore = {
  increment(identifier) {
    const now = Date.now();
    let entry = violations.get(identifier);
    if (!entry || entry.expiresAt < now) {
      entry = { count: 0, expiresAt: now + 300_000 };
    }
    entry.count++;
    violations.set(identifier, entry);
    return entry.count;
  },

  reset(identifier) {
    violations.delete(identifier);
  },
};

// Clean up expired entries every 60s
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of violations) {
    if (entry.expiresAt < now) violations.delete(id);
  }
  for (const [id, entry] of blockedUsers) {
    if (entry.expiresAt < now) blockedUsers.delete(id);
  }
}, 60_000);

module.exports = {
  UserStore,
  ApiKeyStore,
  RequestLogStore,
  BlockedStore,
  ViolationStore,
};
