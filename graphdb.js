import fs from "node:fs/promises";
import path from "node:path";
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

export class GraphDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.pendingWrite = Promise.resolve();
  }

  async withWriteLock(task) {
    const runTask = this.pendingWrite.then(task, task);
    this.pendingWrite = runTask.then(() => undefined, () => undefined);
    return runTask;
  }

  async ensureGraphFile() {
    const directory = path.dirname(this.filePath);
    await fs.mkdir(directory, { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await this.writeGraph(EMPTY_GRAPH);
    }
  }

  async readGraph() {
    await this.ensureGraphFile();
    const content = await fs.readFile(this.filePath, "utf8");
    const graph = JSON.parse(content);
    return {
      ...graph,
      ontology: ONTOLOGY,
      nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
      edges: Array.isArray(graph.edges) ? graph.edges : []
    };
  }

  async writeGraph(graph) {
    const nextGraph = {
      ...graph,
      meta: {
        ...(graph.meta || {}),
        updatedAt: new Date().toISOString()
      },
      ontology: ONTOLOGY
    };
    await fs.writeFile(this.filePath, JSON.stringify(nextGraph, null, 2), "utf8");
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
