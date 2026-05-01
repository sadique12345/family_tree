# Hosting Kinship Atlas

This app now supports two backend modes:

- `file`: local JSON storage for development or single-machine use
- `neo4j`: hosted graph-database mode for shared multi-user access

## What "shared and realtime" means here

When deployed behind one central backend:

- every user opens the same URL
- all reads and writes go to the same database
- the browser subscribes to `/api/events`
- when one user changes the tree, all other open browsers refresh automatically

## Recommended production shape

Use one backend deployment and one Neo4j database.

- Frontend + backend: deploy this Node app to one server
- Database: provision a dedicated Neo4j instance
- Domain: point one family-friendly URL to the app

For a small family tree, one backend instance is enough.

## Environment variables

Copy `.env.example` into your host's environment settings.

Required for hosted shared mode:

```env
HOST=0.0.0.0
PORT=3000
ALLOW_ORIGIN=*
GRAPH_BACKEND=neo4j
NEO4J_HTTP_URL=https://YOUR_NEO4J_HOST/db/neo4j/tx/commit
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
```

Notes:

- `NEO4J_HTTP_URL` must be the transactional HTTP endpoint, not a Bolt URL.
- Use a dedicated Neo4j database for this app because the current writer rebuilds the stored explicit graph on each write.

## Local run

If you want the current local mode:

```bash
GRAPH_BACKEND=file /path/to/node server.js
```

## Hosted run

Run the same app with the hosted env vars above.

```bash
HOST=0.0.0.0 GRAPH_BACKEND=neo4j /path/to/node server.js
```

## What is already implemented

- central graph storage abstraction
- Neo4j-backed mode
- realtime browser updates using Server-Sent Events
- existing ontology and inference rules on top of stored explicit facts

## What you should add before inviting the whole family

This app is now technically shareable, but a real family rollout should still add:

- authentication or invite-only access
- backups
- rate limiting
- edit history / audit trail
- moderation for accidental edits
- HTTPS on the deployed domain

## Suggested rollout plan

1. Deploy the app privately with `GRAPH_BACKEND=neo4j`
2. Test from two phones at once
3. Confirm realtime updates and data persistence
4. Add auth and backups
5. Share the final link with family
