export const ONTOLOGY = {
  FATHER_OF: {
    label: "Father of",
    shortLabel: "Father",
    inverse: "CHILD_OF",
    category: "directed",
    selectable: true,
    description: "Source person is the father of target person."
  },
  MOTHER_OF: {
    label: "Mother of",
    shortLabel: "Mother",
    inverse: "CHILD_OF",
    category: "directed",
    selectable: true,
    description: "Source person is the mother of target person."
  },
  PARENT_OF: {
    label: "Parent of",
    shortLabel: "Parent",
    inverse: "CHILD_OF",
    category: "directed",
    selectable: true,
    description: "Source person is a parent of target person."
  },
  CHILD_OF: {
    label: "Child of",
    shortLabel: "Child",
    inverse: "PARENT_OF",
    category: "directed",
    selectable: true,
    description: "Source person is a child of target person."
  },
  HUSBAND_OF: {
    label: "Husband of",
    shortLabel: "Husband",
    inverse: "WIFE_OF",
    category: "directed",
    selectable: true,
    description: "Source person is the husband of target person."
  },
  WIFE_OF: {
    label: "Wife of",
    shortLabel: "Wife",
    inverse: "HUSBAND_OF",
    category: "directed",
    selectable: true,
    description: "Source person is the wife of target person."
  },
  SPOUSE_OF: {
    label: "Spouse of",
    shortLabel: "Spouse",
    inverse: "SPOUSE_OF",
    category: "bidirectional",
    selectable: true,
    description: "Two people are spouses or life partners."
  },
  BROTHER_OF: {
    label: "Brother of",
    shortLabel: "Brother",
    inverse: "BROTHER_OF",
    category: "bidirectional",
    selectable: true,
    description: "Two people are brothers."
  },
  SISTER_OF: {
    label: "Sister of",
    shortLabel: "Sister",
    inverse: "SISTER_OF",
    category: "bidirectional",
    selectable: true,
    description: "Two people are sisters."
  },
  SIBLING_OF: {
    label: "Sibling of",
    shortLabel: "Sibling",
    inverse: "SIBLING_OF",
    category: "bidirectional",
    selectable: true,
    description: "Two people are siblings."
  },
  GRANDPARENT_OF: {
    label: "Grandparent of",
    shortLabel: "Grandparent",
    inverse: "GRANDCHILD_OF",
    category: "directed",
    selectable: false,
    description: "Source person is a grandparent of target person."
  },
  GRANDCHILD_OF: {
    label: "Grandchild of",
    shortLabel: "Grandchild",
    inverse: "GRANDPARENT_OF",
    category: "directed",
    selectable: false,
    description: "Source person is a grandchild of target person."
  },
  AUNT_UNCLE_OF: {
    label: "Aunt or uncle of",
    shortLabel: "Aunt/Uncle",
    inverse: "NIECE_NEPHEW_OF_AUNT_UNCLE",
    category: "directed",
    selectable: false,
    description: "Source person is an aunt or uncle of target person."
  },
  NIECE_NEPHEW_OF_AUNT_UNCLE: {
    label: "Niece or nephew of aunt or uncle",
    shortLabel: "Niece/Nephew",
    inverse: "AUNT_UNCLE_OF",
    category: "directed",
    selectable: false,
    description: "Source person is a niece or nephew of target person."
  },
  MATERNAL_UNCLE_OF: {
    label: "Maternal uncle (Mama) of",
    shortLabel: "Mama",
    aliases: ["mama"],
    inverse: "NIECE_NEPHEW_OF_MATERNAL_UNCLE",
    category: "directed",
    selectable: true,
    description: "Source person is the mother's brother of target person."
  },
  NIECE_NEPHEW_OF_MATERNAL_UNCLE: {
    label: "Niece or nephew of maternal uncle",
    shortLabel: "Niece/Nephew",
    inverse: "MATERNAL_UNCLE_OF",
    category: "directed",
    selectable: false,
    description: "Source person is the niece or nephew of target person's maternal uncle."
  },
  MATERNAL_AUNT_OF: {
    label: "Maternal aunt (Mausi) of",
    shortLabel: "Mausi",
    aliases: ["mausi"],
    inverse: "NIECE_NEPHEW_OF_MATERNAL_AUNT",
    category: "directed",
    selectable: true,
    description: "Source person is the mother's sister of target person."
  },
  NIECE_NEPHEW_OF_MATERNAL_AUNT: {
    label: "Niece or nephew of maternal aunt",
    shortLabel: "Niece/Nephew",
    inverse: "MATERNAL_AUNT_OF",
    category: "directed",
    selectable: false,
    description: "Source person is the niece or nephew of target person's maternal aunt."
  },
  PATERNAL_UNCLE_OF: {
    label: "Paternal uncle (Chacha/Tau) of",
    shortLabel: "Chacha/Tau",
    aliases: ["chacha", "tau"],
    inverse: "NIECE_NEPHEW_OF_PATERNAL_UNCLE",
    category: "directed",
    selectable: true,
    description: "Source person is the father's brother of target person."
  },
  NIECE_NEPHEW_OF_PATERNAL_UNCLE: {
    label: "Niece or nephew of paternal uncle",
    shortLabel: "Niece/Nephew",
    inverse: "PATERNAL_UNCLE_OF",
    category: "directed",
    selectable: false,
    description: "Source person is the niece or nephew of target person's paternal uncle."
  },
  PATERNAL_AUNT_OF: {
    label: "Paternal aunt (Bua/Phuphi) of",
    shortLabel: "Bua/Phuphi",
    aliases: ["bua", "phuphi"],
    inverse: "NIECE_NEPHEW_OF_PATERNAL_AUNT",
    category: "directed",
    selectable: true,
    description: "Source person is the father's sister of target person."
  },
  NIECE_NEPHEW_OF_PATERNAL_AUNT: {
    label: "Niece or nephew of paternal aunt",
    shortLabel: "Niece/Nephew",
    inverse: "PATERNAL_AUNT_OF",
    category: "directed",
    selectable: false,
    description: "Source person is the niece or nephew of target person's paternal aunt."
  },
  WIFE_OF_MATERNAL_UNCLE_OF: {
    label: "Maternal uncle's wife (Mami) of",
    shortLabel: "Mami",
    aliases: ["mami"],
    inverse: "NIECE_NEPHEW_OF_MAMI",
    category: "directed",
    selectable: true,
    description: "Source person is the wife of target person's maternal uncle."
  },
  NIECE_NEPHEW_OF_MAMI: {
    label: "Niece or nephew of maternal uncle's wife",
    shortLabel: "Niece/Nephew",
    inverse: "WIFE_OF_MATERNAL_UNCLE_OF",
    category: "directed",
    selectable: false,
    description: "Source person is the niece or nephew of target person's mami."
  },
  HUSBAND_OF_MATERNAL_AUNT_OF: {
    label: "Maternal aunt's husband (Mausa) of",
    shortLabel: "Mausa",
    aliases: ["mausa"],
    inverse: "NIECE_NEPHEW_OF_MAUSA",
    category: "directed",
    selectable: true,
    description: "Source person is the husband of target person's maternal aunt."
  },
  NIECE_NEPHEW_OF_MAUSA: {
    label: "Niece or nephew of maternal aunt's husband",
    shortLabel: "Niece/Nephew",
    inverse: "HUSBAND_OF_MATERNAL_AUNT_OF",
    category: "directed",
    selectable: false,
    description: "Source person is the niece or nephew of target person's mausa."
  },
  WIFE_OF_PATERNAL_UNCLE_OF: {
    label: "Paternal uncle's wife (Chachi/Tai) of",
    shortLabel: "Chachi/Tai",
    aliases: ["chachi", "tai"],
    inverse: "NIECE_NEPHEW_OF_CHACHI",
    category: "directed",
    selectable: true,
    description: "Source person is the wife of target person's paternal uncle."
  },
  NIECE_NEPHEW_OF_CHACHI: {
    label: "Niece or nephew of paternal uncle's wife",
    shortLabel: "Niece/Nephew",
    inverse: "WIFE_OF_PATERNAL_UNCLE_OF",
    category: "directed",
    selectable: false,
    description: "Source person is the niece or nephew of target person's chachi."
  },
  HUSBAND_OF_PATERNAL_AUNT_OF: {
    label: "Paternal aunt's husband (Phupha) of",
    shortLabel: "Phupha",
    aliases: ["phupha"],
    inverse: "NIECE_NEPHEW_OF_PHUPHA",
    category: "directed",
    selectable: true,
    description: "Source person is the husband of target person's paternal aunt."
  },
  NIECE_NEPHEW_OF_PHUPHA: {
    label: "Niece or nephew of paternal aunt's husband",
    shortLabel: "Niece/Nephew",
    inverse: "HUSBAND_OF_PATERNAL_AUNT_OF",
    category: "directed",
    selectable: false,
    description: "Source person is the niece or nephew of target person's phupha."
  }
};

export const EMPTY_GRAPH = {
  meta: {
    version: 1,
    title: "Family Graph",
    updatedAt: null
  },
  ontology: ONTOLOGY,
  nodes: [],
  edges: []
};

const PARENT_TYPES = new Set(["FATHER_OF", "MOTHER_OF", "PARENT_OF"]);
const SIBLING_TYPES = new Set(["BROTHER_OF", "SISTER_OF", "SIBLING_OF"]);
const TECHNICAL_TYPES = new Set([
  "CHILD_OF",
  "GRANDCHILD_OF",
  "NIECE_NEPHEW_OF_AUNT_UNCLE",
  "NIECE_NEPHEW_OF_MATERNAL_UNCLE",
  "NIECE_NEPHEW_OF_MATERNAL_AUNT",
  "NIECE_NEPHEW_OF_PATERNAL_UNCLE",
  "NIECE_NEPHEW_OF_PATERNAL_AUNT",
  "NIECE_NEPHEW_OF_MAMI",
  "NIECE_NEPHEW_OF_MAUSA",
  "NIECE_NEPHEW_OF_CHACHI",
  "NIECE_NEPHEW_OF_PHUPHA"
]);

export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) {
    return null;
  }
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.valueOf())) {
    return null;
  }
  const now = new Date();
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function isInferred(edge) {
  return edge.origin === "inferred";
}

function normalizeEdge(edge) {
  return {
    ...edge,
    origin: edge.origin || "explicit",
    ontology: ONTOLOGY[edge.type]
  };
}

function sanitizeGraphForComparison(graph) {
  return JSON.stringify({
    ontology: graph.ontology,
    nodes: graph.nodes,
    edges: graph.edges.map((edge) => ({
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      type: edge.type,
      origin: edge.origin || "explicit",
      mirroredFrom: edge.mirroredFrom || null,
      symmetric: Boolean(edge.symmetric),
      inferredBy: edge.inferredBy || null
    }))
  });
}

function ensureSingleEdge(graph, edgeInput) {
  const existing = graph.edges.find((edge) => (
    edge.sourceId === edgeInput.sourceId &&
    edge.targetId === edgeInput.targetId &&
    edge.type === edgeInput.type
  ));
  if (existing) {
    return { edge: existing, added: false };
  }
  const edge = normalizeEdge({
    id: createId("edge"),
    kind: "Relationship",
    createdAt: new Date().toISOString(),
    ...edgeInput
  });
  graph.edges.push(edge);
  return { edge, added: true };
}

export function ensureRelationshipPair(graph, edgeInput) {
  const primary = ensureSingleEdge(graph, edgeInput);
  const inverseType = ONTOLOGY[edgeInput.type].inverse;
  const isSymmetric = inverseType === edgeInput.type;
  const inverse = ensureSingleEdge(graph, {
    sourceId: edgeInput.targetId,
    targetId: edgeInput.sourceId,
    type: inverseType,
    origin: edgeInput.origin,
    mirroredFrom: primary.edge.id,
    symmetric: isSymmetric,
    inferredBy: edgeInput.inferredBy
  });
  return { added: primary.added || inverse.added, primary: primary.edge, inverse: inverse.edge };
}

function edgesByType(graph, types) {
  return graph.edges.filter((edge) => types.has(edge.type));
}

function inferRelationship(graph, sourceId, targetId, type, inferredBy) {
  if (!sourceId || !targetId || sourceId === targetId || !ONTOLOGY[type]) {
    return false;
  }
  return ensureRelationshipPair(graph, {
    sourceId,
    targetId,
    type,
    origin: "inferred",
    inferredBy
  }).added;
}

function deriveGenericRelationships(graph) {
  let changed = false;
  for (const edge of graph.edges) {
    if (edge.type === "FATHER_OF" || edge.type === "MOTHER_OF") {
      changed = inferRelationship(graph, edge.sourceId, edge.targetId, "PARENT_OF", "specific-parent-to-parent") || changed;
    }
    if (edge.type === "HUSBAND_OF" || edge.type === "WIFE_OF") {
      changed = inferRelationship(graph, edge.sourceId, edge.targetId, "SPOUSE_OF", "specific-spouse-to-spouse") || changed;
    }
    if (edge.type === "BROTHER_OF" || edge.type === "SISTER_OF") {
      changed = inferRelationship(graph, edge.sourceId, edge.targetId, "SIBLING_OF", "specific-sibling-to-sibling") || changed;
    }
  }
  return changed;
}

function deriveParentRules(graph) {
  let changed = false;
  const parentEdges = edgesByType(graph, PARENT_TYPES);
  const siblingEdges = edgesByType(graph, SIBLING_TYPES);
  for (const parentEdge of parentEdges) {
    for (const siblingEdge of siblingEdges) {
      if (siblingEdge.sourceId !== parentEdge.targetId) {
        continue;
      }
      changed = inferRelationship(graph, parentEdge.sourceId, siblingEdge.targetId, parentEdge.type, "shared-parent-across-siblings") || changed;
    }
  }
  for (const firstParent of parentEdges) {
    for (const secondParent of parentEdges) {
      if (firstParent.sourceId !== secondParent.sourceId || firstParent.targetId === secondParent.targetId) {
        continue;
      }
      changed = inferRelationship(graph, firstParent.targetId, secondParent.targetId, "SIBLING_OF", "shared-parent-implies-siblings") || changed;
    }
  }
  for (const elderParent of parentEdges) {
    for (const youngerParent of parentEdges) {
      if (elderParent.targetId !== youngerParent.sourceId || elderParent.sourceId === youngerParent.targetId) {
        continue;
      }
      changed = inferRelationship(graph, elderParent.sourceId, youngerParent.targetId, "GRANDPARENT_OF", "parent-chain-to-grandparent") || changed;
    }
  }
  return changed;
}

function deriveIndianKinship(graph) {
  let changed = false;
  const brotherEdges = graph.edges.filter((edge) => edge.type === "BROTHER_OF");
  const sisterEdges = graph.edges.filter((edge) => edge.type === "SISTER_OF");
  const parentEdges = edgesByType(graph, PARENT_TYPES);
  const genericSiblingEdges = edgesByType(graph, SIBLING_TYPES);

  for (const parentEdge of parentEdges) {
    for (const siblingEdge of genericSiblingEdges) {
      if (siblingEdge.targetId === parentEdge.sourceId) {
        changed = inferRelationship(graph, siblingEdge.sourceId, parentEdge.targetId, "AUNT_UNCLE_OF", "parent-sibling-to-aunt-uncle") || changed;
      }
    }
  }

  for (const brotherEdge of brotherEdges) {
    for (const potentialChild of graph.edges) {
      if (potentialChild.type === "MOTHER_OF" && brotherEdge.targetId === potentialChild.sourceId) {
        changed = inferRelationship(graph, brotherEdge.sourceId, potentialChild.targetId, "MATERNAL_UNCLE_OF", "mother-brother-to-mama") || changed;
      }
      if (potentialChild.type === "FATHER_OF" && brotherEdge.targetId === potentialChild.sourceId) {
        changed = inferRelationship(graph, brotherEdge.sourceId, potentialChild.targetId, "PATERNAL_UNCLE_OF", "father-brother-to-chacha") || changed;
      }
    }
  }

  for (const sisterEdge of sisterEdges) {
    for (const potentialChild of graph.edges) {
      if (potentialChild.type === "MOTHER_OF" && sisterEdge.targetId === potentialChild.sourceId) {
        changed = inferRelationship(graph, sisterEdge.sourceId, potentialChild.targetId, "MATERNAL_AUNT_OF", "mother-sister-to-mausi") || changed;
      }
      if (potentialChild.type === "FATHER_OF" && sisterEdge.targetId === potentialChild.sourceId) {
        changed = inferRelationship(graph, sisterEdge.sourceId, potentialChild.targetId, "PATERNAL_AUNT_OF", "father-sister-to-bua") || changed;
      }
    }
  }

  const wifeEdges = graph.edges.filter((edge) => edge.type === "WIFE_OF");
  const husbandEdges = graph.edges.filter((edge) => edge.type === "HUSBAND_OF");

  for (const wifeEdge of wifeEdges) {
    for (const relation of graph.edges) {
      if (relation.sourceId !== wifeEdge.targetId) {
        continue;
      }
      if (relation.type === "MATERNAL_UNCLE_OF") {
        changed = inferRelationship(graph, wifeEdge.sourceId, relation.targetId, "WIFE_OF_MATERNAL_UNCLE_OF", "mama-wife-to-mami") || changed;
      }
      if (relation.type === "PATERNAL_UNCLE_OF") {
        changed = inferRelationship(graph, wifeEdge.sourceId, relation.targetId, "WIFE_OF_PATERNAL_UNCLE_OF", "chacha-wife-to-chachi") || changed;
      }
    }
  }

  for (const husbandEdge of husbandEdges) {
    for (const relation of graph.edges) {
      if (relation.sourceId !== husbandEdge.targetId) {
        continue;
      }
      if (relation.type === "MATERNAL_AUNT_OF") {
        changed = inferRelationship(graph, husbandEdge.sourceId, relation.targetId, "HUSBAND_OF_MATERNAL_AUNT_OF", "mausi-husband-to-mausa") || changed;
      }
      if (relation.type === "PATERNAL_AUNT_OF") {
        changed = inferRelationship(graph, husbandEdge.sourceId, relation.targetId, "HUSBAND_OF_PATERNAL_AUNT_OF", "bua-husband-to-phupha") || changed;
      }
    }
  }

  return changed;
}

export function materializeGraph(graph) {
  const nextGraph = {
    ...graph,
    ontology: ONTOLOGY,
    nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
    edges: (Array.isArray(graph.edges) ? graph.edges : [])
      .filter((edge) => !isInferred(edge))
      .filter((edge) => ONTOLOGY[edge.type])
      .map((edge) => normalizeEdge(edge))
  };
  let changed = true;
  while (changed) {
    changed = false;
    changed = deriveGenericRelationships(nextGraph) || changed;
    changed = deriveParentRules(nextGraph) || changed;
    changed = deriveIndianKinship(nextGraph) || changed;
  }
  nextGraph.edges.sort((left, right) => {
    const leftKey = `${left.sourceId}:${left.type}:${left.targetId}`;
    const rightKey = `${right.sourceId}:${right.type}:${right.targetId}`;
    return leftKey.localeCompare(rightKey);
  });
  return nextGraph;
}

export function formatSnapshot(graph) {
  const materializedGraph = materializeGraph(graph);
  return {
    ...materializedGraph,
    nodes: materializedGraph.nodes.map((node) => ({
      ...node,
      age: calculateAge(node.dateOfBirth)
    })),
    edges: materializedGraph.edges.map((edge) => ({
      ...edge,
      technical: TECHNICAL_TYPES.has(edge.type)
    }))
  };
}

export function graphsDiffer(left, right) {
  return sanitizeGraphForComparison(left) !== sanitizeGraphForComparison(right);
}
