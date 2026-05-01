import { GraphDatabase } from "./graphdb.js";
import { Neo4jGraphDatabase } from "./neo4j-graphdb.js";

export function createDatabase({ graphFile }) {
  const backend = process.env.GRAPH_BACKEND || "file";

  if (backend === "neo4j") {
    const httpUrl = process.env.https://5eaa5b4d.neo4j.io/db/neo4j/tx/commit;
    const username = process.env.5eaa5b4d;
    const password = process.env.BosMVLmr3cradeCkxwmXg98gYZigoLUgGwvKa0iVAcQ;

    if (!httpUrl || !username || !password) {
      throw new Error("Neo4j mode requires NEO4J_HTTP_URL, NEO4J_USERNAME, and NEO4J_PASSWORD.");
    }

    return new Neo4jGraphDatabase({
      httpUrl,
      username,
      password
    });
  }

  return new GraphDatabase(graphFile);
}
