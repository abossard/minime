import { joinSession, createCanvas } from "@github/copilot-sdk/extension";
import { startCanvasServer } from "./lib/server.mjs";

const instances = new Map();

const session = await joinSession({
    canvases: [
        createCanvas({
            id: "minime-flow",
            displayName: "Minime flow",
            description: "View live minime phases, open blueprints, and submit blueprint corrections.",
            inputSchema: {
                type: "object",
                properties: { blueprint: { type: "string" } },
                additionalProperties: false,
            },
            actions: [
                {
                    name: "refresh",
                    description: "Refresh blueprint and live flow state.",
                    handler: ({ instanceId }) => {
                        const instance = instances.get(instanceId);
                        if (!instance) throw new Error("Canvas instance is not open.");
                        return instance.refresh();
                    },
                },
                {
                    name: "select_blueprint",
                    description: "Select an open repository blueprint by filename.",
                    inputSchema: {
                        type: "object",
                        required: ["blueprint"],
                        properties: { blueprint: { type: "string" } },
                        additionalProperties: false,
                    },
                    handler: ({ instanceId, input }) => {
                        const instance = instances.get(instanceId);
                        if (!instance) throw new Error("Canvas instance is not open.");
                        return instance.select(input?.blueprint);
                    },
                },
            ],
            open: async ({ instanceId, input }) => {
                let instance = instances.get(instanceId);
                if (!instance) {
                    instance = await startCanvasServer({
                        session,
                        selectedBlueprint: input?.blueprint,
                    });
                    instances.set(instanceId, instance);
                } else if (input?.blueprint) {
                    instance.select(input.blueprint);
                }
                return { title: "Minime flow", url: instance.url, status: "ready" };
            },
            onClose: async ({ instanceId }) => {
                const instance = instances.get(instanceId);
                if (!instance) return;
                instances.delete(instanceId);
                await instance.close();
            },
        }),
    ],
});
