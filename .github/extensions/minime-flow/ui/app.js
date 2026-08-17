const nonce = document.querySelector('meta[name="minime-nonce"]').content;
const byId = (id) => document.getElementById(id);
let latestState;

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function switchTab(tab) {
    const flow = tab === "flow";
    byId("flow-tab").setAttribute("aria-selected", String(flow));
    byId("project-tab").setAttribute("aria-selected", String(!flow));
    byId("flow-tab").tabIndex = flow ? 0 : -1;
    byId("project-tab").tabIndex = flow ? -1 : 0;
    byId("flow-panel").hidden = !flow;
    byId("project-panel").hidden = flow;
}

const replaceChildren = (parent, children) => parent.replaceChildren(...children);

function renderRuns(runs) {
    return runs.map((run) => {
        const item = element("li", "", `${run.name} · ${run.tool} · ${run.status}`);
        item.dataset.runId = run.id;
        return item;
    });
}

function renderPhases(phases) {
    replaceChildren(byId("phase-flow"), phases.map((phase, index) => {
        const card = element("li", "phase");
        card.dataset.phase = phase.id;
        const title = element("div", "phase-title");
        title.append(
            element("span", "phase-icon", phase.icon),
            element("h4", "", `${index + 1}. ${phase.label}`),
        );
        const latestRun = phase.runs.at(-1);
        const status = element(
            "div",
            `phase-state ${latestRun?.status ?? ""}`,
            latestRun?.status ?? "waiting",
        );
        const runs = element("ul", "run-list");
        runs.setAttribute("aria-label", `${phase.label} agent and tool runs`);
        replaceChildren(runs, renderRuns(phase.runs));
        card.append(title, element("p", "", phase.summary), status, runs);
        return card;
    }));
}

function renderCriteria(criteria) {
    replaceChildren(byId("criteria-list"), criteria.map((criterion) => {
        const item = element("li");
        const mark = element(
            "span",
            `criterion-mark ${criterion.complete ? "complete" : ""}`,
            criterion.complete ? "✓" : "○",
        );
        mark.setAttribute("aria-label", criterion.complete ? "Complete" : "Open");
        item.append(mark, element("span", "", criterion.text));
        return item;
    }));
}

function renderProjects(blueprints, selected) {
    byId("blueprint-count").textContent = `${blueprints.length} open`;
    replaceChildren(byId("blueprint-list"), blueprints.map((blueprint) => {
        const item = element("li");
        const button = element("button");
        button.type = "button";
        button.dataset.blueprint = blueprint.filename;
        if (blueprint.filename === selected) button.setAttribute("aria-current", "true");
        button.append(
            element("strong", "", blueprint.title),
            element("span", "status-pill", blueprint.status),
            element("small", "", blueprint.filename),
            element("small", "", `${blueprint.progress.completed} of ${blueprint.progress.total} criteria complete`),
        );
        button.addEventListener("click", () => selectBlueprint(blueprint.filename));
        item.append(button);
        return item;
    }));
}

function render(state) {
    latestState = state;
    byId("project-name").textContent = `${state.project.org}/${state.project.repo}`;
    const blueprint = state.blueprint;
    byId("blueprint-title").textContent = blueprint?.title ?? "No open blueprint";
    byId("blueprint-status").textContent = blueprint?.status ?? "idle";
    byId("blueprint-goal").textContent = blueprint?.goal ?? "No open blueprint is available.";
    const completed = blueprint?.progress.completed ?? 0;
    const total = blueprint?.progress.total ?? 0;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    byId("criteria-progress").textContent = `${completed} of ${total} active criteria complete`;
    byId("criteria-percent").textContent = `${percent}%`;
    byId("progress-bar").style.width = `${percent}%`;
    byId("work-title").textContent = state.currentWork.criterion;
    byId("session-state").textContent = `${state.currentWork.session.status}: ${state.currentWork.session.message}`;
    replaceChildren(byId("unmapped-runs"), renderRuns(state.currentWork.unmappedRuns));
    renderPhases(state.phases);
    renderCriteria(blueprint?.criteria ?? []);
    renderProjects(state.blueprints, blueprint?.filename);
    const commentState = byId("comment-state");
    commentState.textContent = state.comment.message;
    commentState.className = `comment-state ${state.comment.state}`;
    const pending = state.comment.state === "pending";
    byId("comment").disabled = pending || !blueprint;
    byId("comment-submit").disabled = pending || !blueprint;
}

async function request(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "X-Minime-Nonce": nonce,
            ...(options.headers ?? {}),
        },
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status}).`);
    return payload;
}

async function selectBlueprint(filename) {
    try {
        render(await request("/api/select", {
            method: "POST",
            body: JSON.stringify({ nonce, blueprint: filename }),
        }));
        switchTab("flow");
        byId("flow-tab").focus();
    } catch (error) {
        byId("comment-state").textContent = error.message;
        byId("comment-state").className = "comment-state error";
    }
}

byId("comment-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const textarea = byId("comment");
    const comment = textarea.value;
    if (!comment.trim()) {
        byId("comment-state").textContent = "Enter a non-empty correction.";
        byId("comment-state").className = "comment-state error";
        textarea.focus();
        return;
    }
    if (latestState?.comment.state === "pending") return;
    byId("comment-submit").disabled = true;
    byId("comment-state").textContent = "Sending correction…";
    try {
        render(await request("/api/comment", {
            method: "POST",
            body: JSON.stringify({ nonce, comment }),
        }));
        textarea.value = "";
    } catch (error) {
        byId("comment-state").textContent = `${error.message} You can retry.`;
        byId("comment-state").className = "comment-state error";
        byId("comment-submit").disabled = false;
        textarea.disabled = false;
    }
});

for (const [name, button] of [["flow", byId("flow-tab")], ["project", byId("project-tab")]]) {
    button.addEventListener("click", () => switchTab(name));
    button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const next = name === "flow" ? byId("project-tab") : byId("flow-tab");
        switchTab(name === "flow" ? "project" : "flow");
        next.focus();
    });
}

try {
    render(await request("/api/state"));
    const events = new EventSource(`/events?nonce=${encodeURIComponent(nonce)}`);
    events.addEventListener("state", (event) => {
        render(JSON.parse(event.data));
        byId("live-indicator").textContent = "Live";
        byId("live-indicator").className = "live-indicator connected";
    });
    events.onerror = () => {
        byId("live-indicator").textContent = "Reconnecting";
        byId("live-indicator").className = "live-indicator";
    };
} catch (error) {
    byId("blueprint-title").textContent = "Canvas unavailable";
    byId("blueprint-goal").textContent = error.message;
}
