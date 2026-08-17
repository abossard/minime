import { readFileSync } from "node:fs";
import { listOpenBlueprints, readBlueprint } from "./blueprints.mjs";

export const phaseDescriptors = JSON.parse(
    readFileSync(new URL("../phases.json", import.meta.url), "utf8"),
);

function textOf(value) {
    if (typeof value === "string") return value;
    try { return JSON.stringify(value ?? {}); } catch { return ""; }
}

function identifyRun(data) {
    const searchable = `${data.toolName ?? ""} ${textOf(data.arguments)}`.toLowerCase();
    const descriptor = phaseDescriptors.find((phase) =>
        phase.matchers.some((matcher) => searchable.includes(matcher.toLowerCase())),
    );
    return {
        phase: descriptor?.id ?? null,
        name: String(
            data.arguments?.name ??
            data.arguments?.agent_type ??
            data.arguments?.skill ??
            data.toolName ??
            "Agent activity",
        ),
    };
}

export class FlowState {
    constructor({ root, repository, selectedBlueprint }) {
        this.root = root;
        this.repository = repository;
        this.selectedBlueprint = selectedBlueprint;
        this.revision = 0;
        this.runs = new Map();
        this.subscribers = new Set();
        this.comment = { state: "idle", message: "Ready for a correction." };
        this.blueprints = [];
        this.blueprint = null;
        this.refresh();
    }

    refresh() {
        this.blueprints = listOpenBlueprints(this.root);
        const selected =
            this.blueprints.find((item) => item.filename === this.selectedBlueprint) ??
            this.blueprints[0] ??
            null;
        this.selectedBlueprint = selected?.filename ?? null;
        this.blueprint = selected ? readBlueprint(this.root, selected.filename).model : null;
        return this.publish();
    }

    select(filename) {
        const selected = this.blueprints.find((item) => item.filename === filename);
        if (!selected) {
            throw Object.assign(
                new Error("Blueprint is not open in this repository."),
                { status: 400 },
            );
        }
        this.selectedBlueprint = selected.filename;
        this.blueprint = readBlueprint(this.root, selected.filename).model;
        return this.publish();
    }

    selectedFile() {
        if (!this.selectedBlueprint) throw new Error("No open blueprint is selected.");
        return readBlueprint(this.root, this.selectedBlueprint);
    }

    setComment(state, message) {
        this.comment = { state, message };
        return this.publish();
    }

    onToolStart(data) {
        const identity = identifyRun(data);
        this.runs.set(data.toolCallId, {
            id: data.toolCallId,
            tool: String(data.toolName ?? "tool"),
            ...identity,
            status: "running",
            startedAt: new Date().toISOString(),
        });
        this.publish();
    }

    onToolComplete(data) {
        const run = this.runs.get(data.toolCallId);
        if (!run) return;
        Object.assign(run, {
            status: data.success ? "completed" : "failed",
            success: Boolean(data.success),
            completedAt: new Date().toISOString(),
        });
        this.publish();
    }

    onSessionState(status, message) {
        this.sessionState = { status, message, at: new Date().toISOString() };
        this.publish();
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        callback(this.snapshot());
        return () => this.subscribers.delete(callback);
    }

    publish() {
        this.revision += 1;
        const snapshot = this.snapshot();
        for (const subscriber of this.subscribers) subscriber(snapshot);
        return snapshot;
    }

    snapshot() {
        const runs = [...this.runs.values()].map((run) => ({ ...run }));
        return {
            revision: this.revision,
            project: { org: this.repository.org, repo: this.repository.repo },
            phases: phaseDescriptors.map((descriptor) => ({
                ...descriptor,
                runs: runs.filter((run) => run.phase === descriptor.id),
            })),
            blueprint: this.blueprint,
            blueprints: this.blueprints,
            comment: this.comment,
            currentWork: {
                criterion:
                    this.blueprint?.criteria.find((criterion) => !criterion.complete)?.text ??
                    "No unchecked active criterion.",
                session: this.sessionState ?? {
                    status: "idle",
                    message: "Waiting for session activity.",
                },
                unmappedRuns: runs.filter((run) => run.phase === null),
            },
        };
    }
}
