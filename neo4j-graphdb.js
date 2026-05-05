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

function compactCypher(statement) {
  return statement.replace(/\s+/g, " ").trim();
}

function serializeEdge(edge) {
  return {
    id: edge.id,
    kind: edge.kind,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    type: edge.type,
    origin: edge.origin || "explicit",
    mirroredFrom: edge.mirroredFrom || null,
    symmetric: Boolean(edge.symmetric),
    inferredBy: edge.inferredBy || null,
    createdAt: edge.createdAt || null
  };
}

function normalizeGenerationLane(value, fallback = undefined) {
  if (value === undefined) {
    return fallback;
  }
  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }
  const numeric = Number(normalized);
  if (!Number.isInteger(numeric) || numeric < 1) {
    throw new Error("Generation lane must be a whole number starting from 1.");
  }
  return numeric;
}

function normalizeRelationshipEntries(entries, graph, personId) {
  if (!Array.isArray(entries)) {
    throw new Error("Relationships payload must be a list.");
  }

  return entries
    .map((entry) => ({
      otherId: normalizeText(entry.otherId),
      type: normalizeText(entry.type)
    }))
    .filter((entry) => entry.otherId && entry.type)
    .map((entry) => {
      if (entry.otherId === personId) {
        throw new Error("A relationship must connect two different people.");
      }
      const otherExists = graph.nodes.some((node) => node.id === entry.otherId);
      if (!otherExists) {
        throw new Error("One of the related people could not be found.");
      }
      const definition = ONTOLOGY[entry.type];
      if (!definition || definition.selectable === false) {
        throw new Error(`Relationship type ${entry.type} cannot be edited here.`);
      }
      return entry;
    });
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
    const cypher = compactCypher(statement);
    const response = await fetch(this.httpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`
      },
      body: JSON.stringify({
        statement: cypher,
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
      const message = payload.message
        || payload.error
        || payload.errors?.[0]?.message
        || payload.rawText
        || JSON.stringify(payload)
        || `Neo4j request failed with status ${response.status}.`;
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
        [node IN nodes WHERE node IS NOT NULL | node] AS nodes,
        [edge IN collect(
          CASE
            WHEN r IS NULL THEN null
            ELSE r { .*, sourceId: source.id, targetId: target.id }
          END
        ) WHERE edge IS NOT NULL | edge] AS edges
    `);

    const fields = payload.data?.fields || [];
    const values = payload.data?.values || [];
    if (!values.length) {
      return { ...EMPTY_GRAPH };
    }

    const row = rowToObject(fields, values[0]);
    return {
      meta: {
        version: row.version || 1,
        title: row.title || "Family Graph",
        updatedAt: row.updatedAt || null
      },
      ontology: ONTOLOGY,
      nodes: Array.isArray(row.nodes) ? row.nodes : [],
      edges: Array.isArray(row.edges) ? row.edges : []
    };
  }

  async writeGraph(graph) {
    await this.ensureInitialized();

    const nextGraph = {
      ...graph,
      meta: {
        ...(graph.meta || {}),
        updatedAt: new Date().toISOString()
      },
      ontology: ONTOLOGY
    };

    await this.runQuery("MATCH (n) DETACH DELETE n");

    await this.runQuery(`
      MERGE (m:GraphMeta {key: 'family'})
      SET m.version = $meta.version,
          m.title = $meta.title,
          m.updatedAt = $meta.updatedAt
    `, {
      meta: nextGraph.meta
    });

    if (nextGraph.nodes.length) {
      await this.runQuery(`
        UNWIND $nodes AS node
        CREATE (p:Person)
        SET p = node
      `, {
        nodes: nextGraph.nodes
      });
    }

    if (nextGraph.edges.length) {
      await this.runQuery(`
        UNWIND $edges AS edge
        MATCH (source:Person {id: edge.sourceId})
        MATCH (target:Person {id: edge.targetId})
        CREATE (source)-[r:KINSHIP]->(target)
        SET r = edge
      `, {
        edges: nextGraph.edges.map(serializeEdge)
      });
    }
  }

  async getSnapshot() {
    return this.withWriteLock(async () => {
      const graph = await this.readGraph();
      const materializedGraph = materializeGraph(graph);
      if (graphsDiffer(graph, materializedGraph)) {
        await this.writeGraph(materializedGraph);
      }
      return formatSnapshot(materializedGraph);
    });
  }

  async addPerson(payload) {
    return this.withWriteLock(async () => {
      const graph = await this.readGraph();
      const person = {
        id: createId("person"),
        kind: "Person",
        name: normalizeText(payload.name),
        dateOfBirth: normalizeText(payload.dateOfBirth),
        generationLane: normalizeGenerationLane(payload.generationLane, null),
        occupation: normalizeText(payload.occupation),
        personalityType: normalizeText(payload.personalityType),
        email: normalizeText(payload.email),
        phone: normalizeText(payload.phone),
        notes: normalizeText(payload.notes),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (!person.name) {
        throw new Error("Name is required.");
      }

      graph.nodes.push(person);
      await this.writeGraph(materializeGraph(graph));
      return { ...person, age: calculateAge(person.dateOfBirth) };
    });
  }

  async updatePerson(personId, payload) {
    return this.withWriteLock(async () => {
      const graph = await this.readGraph();
      const person = graph.nodes.find((node) => node.id === personId);

      if (!person) {
        throw new Error("Person not found.");
      }

      Object.assign(person, {
        name: normalizeText(payload.name ?? person.name),
        dateOfBirth: normalizeText(payload.dateOfBirth ?? person.dateOfBirth),
        generationLane: normalizeGenerationLane(payload.generationLane, person.generationLane ?? null),
        occupation: normalizeText(payload.occupation ?? person.occupation),
        personalityType: normalizeText(payload.personalityType ?? person.personalityType),
        email: normalizeText(payload.email ?? person.email),
        phone: normalizeText(payload.phone ?? person.phone),
        notes: normalizeText(payload.notes ?? person.notes),
        updatedAt: new Date().toISOString()
      });

      if (!person.name) {
        throw new Error("Name is required.");
      }

      await this.writeGraph(materializeGraph(graph));
      return { ...person, age: calculateAge(person.dateOfBirth) };
    });
  }

  async updatePersonGraphDetails(personId, payload) {
    return this.withWriteLock(async () => {
      const graph = await this.readGraph();
      const person = graph.nodes.find((node) => node.id === personId);
      if (!person) {
        throw new Error("Person not found.");
      }

      person.generationLane = normalizeGenerationLane(payload.generationLane, person.generationLane ?? null);
      const relationships = normalizeRelationshipEntries(payload.relationships, graph, personId);

      graph.edges = graph.edges.filter((edge) => !(
        edge.origin === "explicit" &&
        (edge.sourceId === personId || edge.targetId === personId)
      ));

      relationships.forEach((relationship) => {
        ensureRelationshipPair(graph, {
          sourceId: personId,
          targetId: relationship.otherId,
          type: relationship.type,
          origin: "explicit"
        });
      });

      await this.writeGraph(materializeGraph(graph));
      return { ...person, age: calculateAge(person.dateOfBirth) };
    });
  }

  async deletePerson(personId) {
    return this.withWriteLock(async () => {
      const graph = await this.readGraph();
      const personIndex = graph.nodes.findIndex((node) => node.id === personId);
      if (personIndex === -1) {
        throw new Error("Person not found.");
      }

      const [person] = graph.nodes.splice(personIndex, 1);
      graph.edges = graph.edges.filter((edge) => edge.sourceId !== personId && edge.targetId !== personId);

      await this.writeGraph(materializeGraph(graph));
      return { ...person, age: calculateAge(person.dateOfBirth) };
    });
  }

  async addRelationship(payload) {
    return this.withWriteLock(async () => {
      const graph = await this.readGraph();
      const sourceId = normalizeText(payload.sourceId);
      const targetId = normalizeText(payload.targetId);
      const type = normalizeText(payload.type);

      if (!sourceId || !targetId) {
        throw new Error("Both people must be selected.");
      }

      if (sourceId === targetId) {
        throw new Error("A relationship must connect two different people.");
      }

      if (!ONTOLOGY[type]) {
        throw new Error("Unknown relationship type.");
      }

      const sourceExists = graph.nodes.some((node) => node.id === sourceId);
      const targetExists = graph.nodes.some((node) => node.id === targetId);
      if (!sourceExists || !targetExists) {
        throw new Error("Selected people were not found.");
      }

      const duplicate = graph.edges.find((edge) => (
        edge.sourceId === sourceId &&
        edge.targetId === targetId &&
        edge.type === type
      ));
      if (duplicate) {
        throw new Error("That relationship already exists.");
      }

      const created = ensureRelationshipPair(graph, {
        sourceId,
        targetId,
        type,
        origin: "explicit"
      });

      await this.writeGraph(materializeGraph(graph));
      return created.primary;
    });
  }
}
