function openEditDialog(person) {
  editStatus.textContent = "";
  const form = document.createElement("form");
  form.id = "editPersonForm";
  form.className = "stack";
  const escapeAttr = (value) => String(value || "").replaceAll("&", "&amp;").replaceAll("\"", "&quot;").replaceAll("<", "&lt;");
  const graph = state.graph;
  const relationshipSummary = graph ? summarizeRelationships(graph, person.id) : [];
  const editableRelationships = relationshipSummary.filter((entry) => entry.editable);
  const readonlyRelationships = relationshipSummary.filter((entry) => !entry.editable);
  const relationshipOptions = Object.entries(graph?.ontology || {})
    .filter(([, definition]) => definition.selectable !== false)
    .map(([type, definition]) => (
      `<option value="${type}">${definition.aliases?.length ? `${definition.label} [${definition.aliases.join(", ")}]` : definition.label}</option>`
    ))
    .join("");

  form.innerHTML = `
    <div class="field-grid">
      <label><span>Name</span><input name="name" value="${escapeAttr(person.name)}" required /></label>
      <label><span>Date of birth</span><input type="date" name="dateOfBirth" value="${escapeAttr(person.dateOfBirth)}" /></label>
      <label><span>Generation lane</span><input type="number" min="1" step="1" name="generationLane" value="${escapeAttr(person.generationLane)}" placeholder="Auto" /></label>
      <label><span>Occupation</span><input name="occupation" value="${escapeAttr(person.occupation)}" /></label>
      <label><span>Personality type</span><input name="personalityType" value="${escapeAttr(person.personalityType)}" /></label>
      <label><span>Email</span><input type="email" name="email" value="${escapeAttr(person.email)}" /></label>
      <label><span>Phone</span><input type="tel" name="phone" value="${escapeAttr(person.phone)}" /></label>
    </div>
    <label><span>Notes</span><textarea name="notes" rows="4">${escapeAttr(person.notes)}</textarea></label>
    <div class="relationship-editor">
      <div class="relationship-editor-head">
        <strong>Visible relationships</strong>
        <span>Direct connections can be changed here. Derived ones update automatically.</span>
      </div>
      <div class="relationship-editor-list">
        ${editableRelationships.length ? editableRelationships.map((entry) => `
          <label class="relationship-editor-row">
            <span>${escapeAttr(entry.other?.name || "Unknown person")}</span>
            <select name="relationship__${entry.otherId}">
              <option value="">Remove direct relationship</option>
              ${relationshipOptions}
            </select>
          </label>
        `).join("") : `<p class="relationship-editor-empty">No direct visible relationships to edit yet.</p>`}
      </div>
      ${readonlyRelationships.length ? `
        <div class="relationship-readonly">
          <strong>Derived relationships</strong>
          <ul>
            ${readonlyRelationships.map((entry) => `
              <li>${escapeAttr(entry.ontology?.shortLabel || entry.type)} ${entry.direction} ${escapeAttr(entry.other?.name || "Unknown")} <span>${entry.edge.origin === "inferred" ? "Derived" : "Locked"}</span></li>
            `).join("")}
          </ul>
        </div>
      ` : ""}
    </div>
    <div class="dialog-action-row">
      <button type="button" class="ghost-button" id="deletePersonButton">Delete person</button>
      <button type="submit" class="primary-button">Update person</button>
    </div>
  `;

  const shell = editDialog.querySelector(".dialog-shell");
  const oldForm = shell.querySelector("#editPersonForm");
  if (oldForm) {
    oldForm.replaceWith(form);
  } else {
    shell.appendChild(form);
  }

  editableRelationships.forEach((entry) => {
    const select = form.querySelector(`[name="relationship__${entry.otherId}"]`);
    if (select) {
      select.value = entry.type;
    }
  });

  form.querySelector("#deletePersonButton").addEventListener("click", async () => {
    const confirmed = window.confirm(`Delete ${person.name}? This will remove the person and all of their connections.`);
    if (!confirmed) {
      return;
    }

    try {
      await request(`/api/people/${person.id}`, {
        method: "DELETE"
      });
      state.selectedPersonId = null;
      await loadGraph(null);
      editDialog.close();
      showStatus("Person deleted.");
    } catch (error) {
      editStatus.textContent = error.message;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    const relationships = editableRelationships.map((entry) => ({
      otherId: entry.otherId,
      type: payload[`relationship__${entry.otherId}`]
    })).filter((entry) => entry.type);

    Object.keys(payload)
      .filter((key) => key.startsWith("relationship__"))
      .forEach((key) => {
        delete payload[key];
      });

    try {
      await request(`/api/people/${person.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      await request(`/api/people/${person.id}/graph-details`, {
        method: "PUT",
        body: JSON.stringify({
          generationLane: payload.generationLane,
          relationships
        })
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
