import {
  EMPTY_GRAPH,
  ONTOLOGY,
  calculateAge,
  createId,
  ensureRelationshipPair,
  formatSnapshot,
  graphsDiffer,
  materializeGraph,
  normalizeText
} from "./graph-core.js";

function rowToObject(fields, values) {
  const result = {};
  fields.forEach((field, index) => {
    result[field] = values[index];
  });
  return result;
}

export class Neo4jGraphDatabase {
  constructor(options) {
    this.httpUrl = options.httpUrl.replace(/\/$/, "");
    this.username = options.username;
    this.password = options.password;
    this.pendingWrite = Promise.resolve();
    this.initialized = false;
  }

  async withWriteLock(task) {
    const runTask = this.pendingWrite.then(task, task);
    this.pendingWrite = runTask.then(() => undefined, () => undefined);
    return runTask;
  }

  async runQuery(statement, parameters = {}) {
    const response = await fetch(this.httpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`
      },
      body: JSON.stringify({
        statement,
        parameters
      })
    });

    const rawText = await response.text();
    let payload = {};
    try {
      payload = rawText ? JSON.parse(rawText) : {};
    } catch {
      payload = { rawText };
    }

    if (!response.ok) {
      const message = payload.message || payload.error || payload.rawText || `Neo4j request failed with status ${response.status}.`;
      throw new Error(`Neo4j request failed with status ${response.status}: ${message}`);
    }

    if (payload.errors?.length) {
      throw new Error(payload.errors[0].message || "Neo4j query failed.");
    }

    return payload;
  }

  async ensureInitialized() {
    if (this.initialized) {
      return;
    }

    await this.runQuery("CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE");
    await this.runQuery("CREATE CONSTRAINT graph_meta_key IF NOT EXISTS FOR (m:GraphMeta) REQUIRE m.key IS UNIQUE");
    this.initialized = true;
  }

  async readGraph() {
    await this.ensureInitialized();
    const payload = await this.runQuery(`
      OPTIONAL MATCH (m:GraphMeta {key: 'family'})
      WITH m
      OPTIONAL MATCH (p:Person)
      WITH m, collect(CASE WHEN p IS NULL THEN null ELSE properties(p) END) AS nodes
      OPTIONAL MATCH (source:Person)-[r:KINSHIP]->(target:Person)
      RETURN
        coalesce(m.version, 1) AS version,
        coalesce(m.title, 'Family Graph') AS title,
        m.updatedAt AS updatedAt,
        [node IN nodes WHERE node IS NOT NULL] AS nodes,
        [edge IN collect(
          CASE
            WHEN r IS NULL THEN null
            ELSE properties(r) + {sourceId: source.id, targetId: target.id}
          END
        ) WHERE edge IS NOT NULL] AS edges
    `);

    const fields = payload.data?.fields || [];
