const state = {
  graph: null,
  selectedPersonId: null,
  toastTimeout: null,
  isReloading: false,
  viewport: {
    scale: 1,
    minScale: 0.65,
    maxScale: 2.4,
    offsetX: 0,
    offsetY: 0
  },
  pointer: {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0
  },
  layout: {
    width: 1200,
    height: 820
  }
};

const personForm = document.querySelector("#personForm");
const relationshipForm = document.querySelector("#relationshipForm");
const peopleList = document.querySelector("#peopleList");
const heroStats = document.querySelector("#heroStats");
const ontologyList = document.querySelector("#ontologyList");
const graphSvg = document.querySelector("#graphSvg");
const graphStage = document.querySelector("#graphStage");
const graphInspector = document.querySelector("#graphInspector");
const statusToast = document.querySelector("#status");
const sourceSelect = document.querySelector("#sourceId");
const targetSelect = document.querySelector("#targetId");
const relationshipTypeSelect = document.querySelector("#relationshipType");
const personCardTemplate = document.querySelector("#personCardTemplate");
const editDialog = document.querySelector("#editDialog");
const editStatus = document.querySelector("#editStatus");
const closeDialogButton = document.querySelector("#closeDialogButton");
const zoomInButton = document.querySelector("#zoomInButton");
const zoomOutButton = document.querySelector("#zoomOutButton");
const zoomResetButton = document.querySelector("#zoomResetButton");
const editSelectedButton = document.querySelector("#editSelectedButton");
let realtimeSource = null;

const PARENT_TYPES = new Set(["FATHER_OF", "MOTHER_OF", "PARENT_OF"]);
const SAME_GENERATION_TYPES = new Set(["SIBLING_OF", "BROTHER_OF", "SISTER_OF", "SPOUSE_OF", "HUSBAND_OF", "WIFE_OF"]);

function showStatus(message, isError = false) {
  statusToast.textContent = message;
  statusToast.style.background = isError ? "rgba(112, 35, 28, 0.95)" : "rgba(48, 33, 26, 0.9)";
  statusToast.classList.add("visible");
  clearTimeout(state.toastTimeout);
  state.toastTimeout = window.setTimeout(() => {
    statusToast.classList.remove("visible");
  }, 2600);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function renderStats(graph) {
  const stats = [
    { label: "People", value: graph.nodes.length },
    { label: "Connections", value: graph.edges.length },
    {
      label: "Family branches",
      value: new Set(graph.edges.map((edge) => edge.type)).size
    },
    {
      label: "Profiles with notes",
      value: graph.nodes.filter((node) => node.notes).length
    }
  ];

  heroStats.innerHTML = "";
  stats.forEach((stat) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    card.innerHTML = `<span>${stat.label}</span><span class="value">${stat.value}</span>`;
    heroStats.appendChild(card);
  });
}

function populateRelationshipTypes(ontology) {
  relationshipTypeSelect.innerHTML = "";
  Object.entries(ontology)
    .filter(([, definition]) => definition.selectable !== false)
    .forEach(([type, definition]) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = definition.aliases?.length
        ? `${definition.label} [${definition.aliases.join(", ")}]`
        : definition.label;
      relationshipTypeSelect.appendChild(option);
    });
}

function populatePersonSelectors(nodes) {
  const options = [`<option value="">Select a person</option>`]
    .concat(nodes.map((node) => `<option value="${node.id}">${node.name}</option>`))
    .join("");
  sourceSelect.innerHTML = options;
  targetSelect.innerHTML = options;
}

function renderOntology(ontology) {
  ontologyList.innerHTML = "";
  Object.entries(ontology).forEach(([type, definition]) => {
    const block = document.createElement("div");
    block.innerHTML = `
      <strong>${definition.label}</strong>
      <div class="ontology-code">${type}</div>
      <div>${definition.description}</div>
      <div>Inverse: ${definition.inverse}</div>
      <div>${definition.selectable === false ? "System-derived or reverse relation" : "Can be added from the form"}</div>
      ${definition.aliases?.length ? `<div>Common names: ${definition.aliases.join(", ")}</div>` : ""}
    `;
    ontologyList.appendChild(block);
  });
}

function describePrimaryMeta(person) {
  const pieces = [];
  if (person.dateOfBirth) {
    pieces.push(`Born ${person.dateOfBirth}`);
  }
  if (person.age !== null) {
    pieces.push(`Age ${person.age}`);
  }
  if (person.occupation) {
    pieces.push(person.occupation);
  }
  return pieces.join("  •  ") || "No profile details yet";
}

function getVisibleEdges(graph) {
  return graph.edges.filter((edge) => !edge.technical);
}

function getSelectedPerson() {
  return state.graph?.nodes.find((node) => node.id === state.selectedPersonId) || null;
}

function renderPeople(graph) {
  peopleList.innerHTML = "";
  const visibleEdges = getVisibleEdges(graph);

  if (!graph.nodes.length) {
    const empty = document.createElement("div");
    empty.className = "person-card";
    empty.textContent = "Add the first person to begin building your family graph.";
    peopleList.appendChild(empty);
    return;
  }

  graph.nodes.forEach((person) => {
    const fragment = personCardTemplate.content.cloneNode(true);
    fragment.querySelector(".person-name").textContent = person.name;
    fragment.querySelector(".person-meta").textContent = describePrimaryMeta(person);
    fragment.querySelector(".person-notes").textContent = person.notes || "No notes recorded.";

    const detailGrid = fragment.querySelector(".detail-grid");
    const details = [
      ["Personality", person.personalityType || "Not set"],
      ["Email", person.email || "Not set"],
      ["Phone", person.phone || "Not set"],
      ["Connections", `${new Set(visibleEdges.filter((edge) => edge.sourceId === person.id).map((edge) => edge.targetId)).size}`]
    ];

    detailGrid.innerHTML = details.map(([term, value]) => (
      `<div><dt>${term}</dt><dd>${value}</dd></div>`
    )).join("");

    const card = fragment.querySelector(".person-card");
    card.style.outline = state.selectedPersonId === person.id ? "2px solid rgba(187, 90, 60, 0.45)" : "none";

    fragment.querySelector(".edit-button").addEventListener("click", (event) => {
      event.stopPropagation();
      openEditDialog(person);
    });

    card.addEventListener("click", () => {
      state.selectedPersonId = person.id;
      renderGraph(graph);
      renderPeople(graph);
      renderInspector(graph);
      updateGraphControls();
    });

    peopleList.appendChild(fragment);
  });
}

function openEditDialog(person) {
  editStatus.textContent = "";
  const form = document.createElement("form");
  form.id = "editPersonForm";
  form.className = "stack";
  const escapeAttr = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("\"", "&quot;").replaceAll("<", "&lt;");
  form.innerHTML = `
    <div class="field-grid">
      <label><span>Name</span><input name="name" value="${escapeAttr(person.name)}" required /></label>
      <label><span>Date of birth</span><input type="date" name="dateOfBirth" value="${escapeAttr(person.dateOfBirth)}" /></label>
      <label><span>Occupation</span><input name="occupation" value="${escapeAttr(person.occupation)}" /></label>
      <label><span>Personality type</span><input name="personalityType" value="${escapeAttr(person.personalityType)}" /></label>
      <label><span>Email</span><input type="email" name="email" value="${escapeAttr(person.email)}" /></label>
      <label><span>Phone</span><input type="tel" name="phone" value="${escapeAttr(person.phone)}" /></label>
    </div>
    <label><span>Notes</span><textarea name="notes" rows="4">${escapeAttr(person.notes)}</textarea></label>
    <button type="submit" class="primary-button">Update person</button>
  `;

  const shell = editDialog.querySelector(".dialog-shell");
  const oldForm = shell.querySelector("#editPersonForm");
  if (oldForm) {
    oldForm.replaceWith(form);
  } else {
    shell.appendChild(form);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      await request(`/api/people/${person.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      await loadGraph(person.id);
      editDialog.close();
      showStatus("Profile updated.");
    } catch (error) {
      editStatus.textContent = error.message;
    }
  });

  editDialog.showModal();
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeGenerationMap(nodes, edges) {
  const generation = new Map(nodes.map((node) => [node.id, null]));
  const incomingParents = new Map(nodes.map((node) => [node.id, []]));
  const outgoingParents = new Map(nodes.map((node) => [node.id, []]));
  const sameGenNeighbors = new Map(nodes.map((node) => [node.id, new Set()]));

  edges.forEach((edge) => {
    if (PARENT_TYPES.has(edge.type)) {
      incomingParents.get(edge.targetId)?.push(edge.sourceId);
      outgoingParents.get(edge.sourceId)?.push(edge.targetId);
    }
    if (SAME_GENERATION_TYPES.has(edge.type)) {
      sameGenNeighbors.get(edge.sourceId)?.add(edge.targetId);
      sameGenNeighbors.get(edge.targetId)?.add(edge.sourceId);
    }
  });

  nodes.forEach((node) => {
    if ((incomingParents.get(node.id) || []).length === 0) {
      generation.set(node.id, 0);
    }
  });

  let changed = true;
  while (changed) {
    changed = false;

    nodes.forEach((node) => {
      const nodeId = node.id;
      const parentIds = incomingParents.get(nodeId) || [];
      const childIds = outgoingParents.get(nodeId) || [];
      const neighbors = [...(sameGenNeighbors.get(nodeId) || [])];
      const current = generation.get(nodeId);

      const parentValues = parentIds
        .map((parentId) => generation.get(parentId))
        .filter((value) => value !== null)
        .map((value) => value + 1);
      if (parentValues.length && current === null) {
        generation.set(nodeId, Math.round(average(parentValues)));
        changed = true;
        return;
      }

      const childValues = childIds
        .map((childId) => generation.get(childId))
        .filter((value) => value !== null)
        .map((value) => value - 1);
      if (childValues.length && current === null) {
        generation.set(nodeId, Math.round(average(childValues)));
        changed = true;
        return;
      }

      const neighborValues = neighbors
        .map((neighborId) => generation.get(neighborId))
        .filter((value) => value !== null);
      if (neighborValues.length && current === null) {
        generation.set(nodeId, Math.round(average(neighborValues)));
        changed = true;
        return;
      }

      if (current !== null) {
        neighbors.forEach((neighborId) => {
          if (generation.get(neighborId) === null) {
            generation.set(neighborId, current);
            changed = true;
          }
        });
        childIds.forEach((childId) => {
          if (generation.get(childId) === null) {
            generation.set(childId, current + 1);
            changed = true;
          }
        });
        parentIds.forEach((parentId) => {
          if (generation.get(parentId) === null) {
            generation.set(parentId, current - 1);
            changed = true;
          }
        });
      }
    });
  }

  nodes.forEach((node) => {
    if (generation.get(node.id) === null) {
      generation.set(node.id, 0);
    }
  });

  const minGeneration = Math.min(...nodes.map((node) => generation.get(node.id)));
  nodes.forEach((node) => {
    generation.set(node.id, generation.get(node.id) - minGeneration);
  });

  return generation;
}

function computeNodePositions(graph) {
  const visibleEdges = getVisibleEdges(graph);
  const generationMap = computeGenerationMap(graph.nodes, visibleEdges);
  const nodesByGeneration = new Map();

  graph.nodes.forEach((node) => {
    const level = generationMap.get(node.id) || 0;
    if (!nodesByGeneration.has(level)) {
      nodesByGeneration.set(level, []);
    }
    nodesByGeneration.get(level).push(node);
  });

  const generations = [...nodesByGeneration.keys()].sort((left, right) => left - right);
  generations.forEach((level) => {
    nodesByGeneration.get(level).sort((left, right) => left.name.localeCompare(right.name));
  });

  const maxCount = Math.max(1, ...generations.map((level) => nodesByGeneration.get(level).length));
  const width = Math.max(1200, maxCount * 230 + 180);
  const height = Math.max(820, generations.length * 180 + 160);
  state.layout = { width, height };

  const positioned = [];
  generations.forEach((level, index) => {
    const row = nodesByGeneration.get(level);
    const laneY = 110 + index * 180;
    const spacing = width / (row.length + 1);

    row.forEach((node, nodeIndex) => {
      positioned.push({
        ...node,
        generation: level,
        x: spacing * (nodeIndex + 1),
        y: laneY
      });
    });
  });

  return {
    nodes: positioned,
    generations,
    generationMap
  };
}

function updateGraphControls() {
  editSelectedButton.disabled = !getSelectedPerson();
}

function applyViewport() {
  const { scale, offsetX, offsetY } = state.viewport;
  const zoomGroup = graphSvg.querySelector("[data-viewport='zoom']");
  const panGroup = graphSvg.querySelector("[data-viewport='pan']");
  if (!zoomGroup || !panGroup) {
    return;
  }
  panGroup.setAttribute("transform", `translate(${offsetX} ${offsetY})`);
  zoomGroup.setAttribute("transform", `scale(${scale})`);
}

function clampScale(scale) {
  return Math.min(state.viewport.maxScale, Math.max(state.viewport.minScale, scale));
}

function zoomTo(nextScale, clientX, clientY) {
  const previousScale = state.viewport.scale;
  const scale = clampScale(nextScale);
  if (scale === previousScale) {
    return;
  }

  const rect = graphStage.getBoundingClientRect();
  const localX = clientX ?? rect.left + rect.width / 2;
  const localY = clientY ?? rect.top + rect.height / 2;
  const worldX = (localX - rect.left - state.viewport.offsetX) / previousScale;
  const worldY = (localY - rect.top - state.viewport.offsetY) / previousScale;

  state.viewport.scale = scale;
  state.viewport.offsetX = localX - rect.left - (worldX * scale);
  state.viewport.offsetY = localY - rect.top - (worldY * scale);
  applyViewport();
}

function resetViewport() {
  state.viewport.scale = 1;
  state.viewport.offsetX = 0;
  state.viewport.offsetY = 0;
  applyViewport();
}

function renderInspector(graph) {
  const person = getSelectedPerson();
  if (!person) {
    graphInspector.innerHTML = `<div class="graph-inspector-empty">Select a node to inspect that person here.</div>`;
    return;
  }

  const visibleEdges = getVisibleEdges(graph);
  const generationMap = computeGenerationMap(graph.nodes, visibleEdges);
  const relationships = visibleEdges.filter((edge) => edge.sourceId === person.id || edge.targetId === person.id);
  const peopleById = new Map(graph.nodes.map((node) => [node.id, node]));
  const relationshipMarkup = relationships.length
    ? relationships.map((edge) => {
      const otherId = edge.sourceId === person.id ? edge.targetId : edge.sourceId;
      const other = peopleById.get(otherId);
      const direction = edge.sourceId === person.id ? "to" : "from";
      return `
        <li>
          <strong>${edge.ontology?.shortLabel || edge.type}</strong> ${direction} ${other?.name || "Unknown"}
          <span>${edge.origin === "inferred" ? "Derived" : "Direct"}</span>
        </li>
      `;
    }).join("")
    : `<li>No visible connections yet.</li>`;

  graphInspector.innerHTML = `
    <div class="graph-inspector-head">
      <div>
        <h3>${person.name}</h3>
        <p>${describePrimaryMeta(person)}</p>
      </div>
      <button type="button" class="ghost-button" id="inspectorEditButton">Edit node</button>
    </div>
    <div class="graph-inspector-grid">
      <div><span>Email</span><strong>${person.email || "Not set"}</strong></div>
      <div><span>Phone</span><strong>${person.phone || "Not set"}</strong></div>
      <div><span>Personality</span><strong>${person.personalityType || "Not set"}</strong></div>
      <div><span>Generation lane</span><strong>${(generationMap.get(person.id) || 0) + 1}</strong></div>
    </div>
    <p class="graph-inspector-notes">${person.notes || "No notes recorded for this person yet."}</p>
    <div class="graph-inspector-relations">
      <h4>Visible relationships</h4>
      <ul>${relationshipMarkup}</ul>
    </div>
  `;

  graphInspector.querySelector("#inspectorEditButton").addEventListener("click", () => {
    openEditDialog(person);
  });
}

function renderGraph(graph) {
  const visibleEdges = getVisibleEdges(graph);
  const layout = computeNodePositions(graph);
  const nodes = layout.nodes;
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const width = state.layout.width;
  const height = state.layout.height;

  graphSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  graphSvg.innerHTML = `
    <g data-viewport="pan">
      <g data-viewport="zoom"></g>
    </g>
  `;

  const zoomGroup = graphSvg.querySelector("[data-viewport='zoom']");

  layout.generations.forEach((level, index) => {
    const lane = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    lane.setAttribute("x", "30");
    lane.setAttribute("y", `${55 + index * 180}`);
    lane.setAttribute("width", `${width - 60}`);
    lane.setAttribute("height", "110");
    lane.setAttribute("rx", "26");
    lane.setAttribute("fill", index % 2 === 0 ? "rgba(255,255,255,0.58)" : "rgba(247,228,211,0.58)");
    lane.setAttribute("stroke", "rgba(88, 60, 42, 0.08)");
    zoomGroup.appendChild(lane);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", "56");
    label.setAttribute("y", `${85 + index * 180}`);
    label.setAttribute("class", "generation-label");
    label.textContent = `Generation ${level + 1}`;
    zoomGroup.appendChild(label);
  });

  visibleEdges.forEach((edge) => {
    const source = nodeMap.get(edge.sourceId);
    const target = nodeMap.get(edge.targetId);
    if (!source || !target) {
      return;
    }

    const isActive = !state.selectedPersonId || edge.sourceId === state.selectedPersonId || edge.targetId === state.selectedPersonId;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", source.x);
    line.setAttribute("y1", source.y);
    line.setAttribute("x2", target.x);
    line.setAttribute("y2", target.y);
    line.setAttribute("class", edge.origin === "inferred" ? "link-line is-inferred" : "link-line");
    line.setAttribute("opacity", isActive ? "1" : "0.16");
    zoomGroup.appendChild(line);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", `${(source.x + target.x) / 2}`);
    label.setAttribute("y", `${(source.y + target.y) / 2 - 8}`);
    label.setAttribute("class", "link-label");
    label.setAttribute("opacity", isActive ? "0.95" : "0.22");
    label.textContent = edge.ontology?.shortLabel || edge.ontology?.label || edge.type;
    zoomGroup.appendChild(label);
  });

  nodes.forEach((node) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const isActive = state.selectedPersonId === node.id;
    const hasSelection = Boolean(state.selectedPersonId);
    const faded = hasSelection && !visibleEdges.some((edge) => (
      edge.sourceId === state.selectedPersonId && edge.targetId === node.id
    )) && !visibleEdges.some((edge) => (
      edge.targetId === state.selectedPersonId && edge.sourceId === node.id
    )) && !isActive;

    group.setAttribute("class", "graph-node");
    group.setAttribute("transform", `translate(${node.x}, ${node.y})`);
    group.setAttribute("style", `cursor:pointer; opacity:${faded ? 0.34 : 1}`);

    const card = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    card.setAttribute("x", "-74");
    card.setAttribute("y", "-34");
    card.setAttribute("width", "148");
    card.setAttribute("height", "68");
    card.setAttribute("rx", "22");
    card.setAttribute("class", `node-card${isActive ? " is-active" : ""}`);
    group.appendChild(card);

    const name = document.createElementNS("http://www.w3.org/2000/svg", "text");
    name.setAttribute("y", "-4");
    name.setAttribute("class", "node-label");
    name.textContent = node.name.length > 16 ? `${node.name.slice(0, 15)}...` : node.name;
    group.appendChild(name);

    const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
    sub.setAttribute("y", "18");
    sub.setAttribute("class", "node-subtext");
    sub.textContent = node.age !== null ? `Age ${node.age}` : node.occupation || "Profile";
    group.appendChild(sub);

    group.addEventListener("click", (event) => {
      event.stopPropagation();
      state.selectedPersonId = node.id;
      renderGraph(graph);
      renderPeople(graph);
      renderInspector(graph);
      updateGraphControls();
    });

    group.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      openEditDialog(node);
    });

    zoomGroup.appendChild(group);
  });

  applyViewport();
}

async function loadGraph(preferredSelectionId = state.selectedPersonId) {
  state.isReloading = true;
  try {
    const graph = await request("/api/graph");
    state.graph = graph;

    if (preferredSelectionId && graph.nodes.some((node) => node.id === preferredSelectionId)) {
      state.selectedPersonId = preferredSelectionId;
    } else if (state.selectedPersonId && !graph.nodes.some((node) => node.id === state.selectedPersonId)) {
      state.selectedPersonId = null;
    }

    renderStats(graph);
    renderPeople(graph);
    renderOntology(graph.ontology);
    populateRelationshipTypes(graph.ontology);
    populatePersonSelectors(graph.nodes);
    renderGraph(graph);
    renderInspector(graph);
    updateGraphControls();
  } finally {
    state.isReloading = false;
  }
}

function subscribeToRealtimeUpdates() {
  if (window.location.protocol === "file:" || typeof EventSource === "undefined") {
    return;
  }

  realtimeSource = new EventSource("/api/events");
  realtimeSource.addEventListener("graph-update", async () => {
    if (state.isReloading) {
      return;
    }
    const selection = state.selectedPersonId;
    try {
      await loadGraph(selection);
      showStatus("Family tree updated.");
    } catch {
      // keep quiet on transient reconnect issues
    }
  });
}

personForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(personForm).entries());
  try {
    await request("/api/people", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    personForm.reset();
    showStatus("Person saved to the family graph.");
    await loadGraph();
  } catch (error) {
    showStatus(error.message, true);
  }
});

relationshipForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(relationshipForm).entries());
  try {
    await request("/api/relationships", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    relationshipForm.reset();
    showStatus("Connection recorded in the graph.");
    await loadGraph();
  } catch (error) {
    showStatus(error.message, true);
  }
});

closeDialogButton.addEventListener("click", () => {
  editDialog.close();
});

zoomInButton.addEventListener("click", () => {
  zoomTo(state.viewport.scale * 1.18);
});

zoomOutButton.addEventListener("click", () => {
  zoomTo(state.viewport.scale / 1.18);
});

zoomResetButton.addEventListener("click", () => {
  resetViewport();
});

editSelectedButton.addEventListener("click", () => {
  const person = getSelectedPerson();
  if (person) {
    openEditDialog(person);
  }
});

graphSvg.addEventListener("click", () => {
  if (!state.graph) {
    return;
  }
  state.selectedPersonId = null;
  renderGraph(state.graph);
  renderPeople(state.graph);
  renderInspector(state.graph);
  updateGraphControls();
});

graphStage.addEventListener("wheel", (event) => {
  event.preventDefault();
  const direction = event.deltaY < 0 ? 1.12 : 0.9;
  zoomTo(state.viewport.scale * direction, event.clientX, event.clientY);
}, { passive: false });

graphStage.addEventListener("pointerdown", (event) => {
  const nodeTarget = event.target.closest(".graph-node");
  if (nodeTarget) {
    return;
  }
  state.pointer.active = true;
  state.pointer.pointerId = event.pointerId;
  state.pointer.startX = event.clientX;
  state.pointer.startY = event.clientY;
  state.pointer.originX = state.viewport.offsetX;
  state.pointer.originY = state.viewport.offsetY;
  graphStage.setPointerCapture(event.pointerId);
});

graphStage.addEventListener("pointermove", (event) => {
  if (!state.pointer.active || event.pointerId !== state.pointer.pointerId) {
    return;
  }
  const deltaX = event.clientX - state.pointer.startX;
  const deltaY = event.clientY - state.pointer.startY;
  state.viewport.offsetX = state.pointer.originX + deltaX;
  state.viewport.offsetY = state.pointer.originY + deltaY;
  applyViewport();
});

graphStage.addEventListener("pointerup", (event) => {
  if (state.pointer.active && event.pointerId === state.pointer.pointerId) {
    state.pointer.active = false;
    graphStage.releasePointerCapture(event.pointerId);
  }
});

graphStage.addEventListener("pointercancel", (event) => {
  if (state.pointer.active && event.pointerId === state.pointer.pointerId) {
    state.pointer.active = false;
    graphStage.releasePointerCapture(event.pointerId);
  }
});

subscribeToRealtimeUpdates();

loadGraph().catch((error) => {
  showStatus(error.message, true);
});
