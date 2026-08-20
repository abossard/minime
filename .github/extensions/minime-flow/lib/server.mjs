import { createHash, randomBytes } from "node:crypto";
import { watch } from "node:fs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { deriveRepository, repositoryBlueprintRoot } from "./blueprints.mjs";
import { FlowState } from "./flow-state.mjs";

const UI_ROOT = resolve(new URL("../ui", import.meta.url).pathname);
const MAX_COMMENT_BYTES = 4000;
const MIME = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
};

function json(res, status, value) {
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(value));
}

function fail(res, status, message) {
    json(res, status, { ok: false, error: message });
}

function body(req, limit) {
    return new Promise((resolveBody, reject) => {
        let settled = false;
        const rejectOnce = (error) => {
            if (settled) return;
            settled = true;
            reject(error);
        };
        if (Number(req.headers["content-length"] ?? 0) > limit) {
            req.resume();
            rejectOnce(Object.assign(new Error("Request body is too large."), { status: 413 }));
            return;
        }
        const chunks = [];
        let size = 0;
        const onData = (chunk) => {
            size += chunk.length;
            if (size > limit) {
                chunks.length = 0;
                req.off("data", onData);
                req.resume();
                rejectOnce(Object.assign(new Error("Request body is too large."), { status: 413 }));
                return;
            }
            chunks.push(chunk);
        };
        req.on("data", onData);
        req.on("end", () => {
            if (settled) return;
            try {
                const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
                settled = true;
                resolveBody(parsed);
            } catch {
                settled = true;
                reject(Object.assign(new Error("Request body must be valid JSON."), { status: 400 }));
            }
        });
        req.on("error", rejectOnce);
    });
}

const digest = (value) => createHash("sha256").update(value).digest("hex");
const safeEqual = (left, right) =>
    typeof left === "string" &&
    typeof right === "string" &&
    left.length === right.length &&
    left === right;

function correctionPrompt(path, comment) {
    return [
        "Treat the following text as a verbatim user correction to the selected living blueprint.",
        "Direct the active minime owner (for example Dr. Evil using the blueprint skill) to update the blueprint.",
        `Selected living blueprint: ${path}`,
        "Preserve every correction byte verbatim. Persist the update, then read the same blueprint back before responding.",
        "Do not transition to inspect or extract.",
        "Correction JSON string (decode once, without rewriting):",
        JSON.stringify(comment),
    ].join("\n");
}

export async function startCanvasServer({ session, selectedBlueprint }) {
    const repository = deriveRepository();
    const root = repositoryBlueprintRoot(repository);
    const state = new FlowState({ root, repository, selectedBlueprint });
    const nonce = randomBytes(24).toString("base64url");
    const clients = new Set();
    const cleanups = [];
    let origin;
    let pending = false;

    async function dispatchComment(comment) {
        if (pending) throw Object.assign(new Error("A correction is already pending."), { status: 409 });
        if (typeof comment !== "string" || !comment.trim()) {
            throw Object.assign(new Error("Enter a non-empty correction."), { status: 422 });
        }
        if (Buffer.byteLength(comment, "utf8") > MAX_COMMENT_BYTES) {
            throw Object.assign(new Error(`Correction must be at most ${MAX_COMMENT_BYTES} bytes.`), { status: 413 });
        }
        const selected = state.selectedFile();
        const beforeHash = digest(selected.markdown);
        pending = true;
        state.setComment("pending", "Correction sent. Waiting for persisted blueprint read-back.");
        try {
            await session.sendAndWait(
                { prompt: correctionPrompt(selected.path, comment) },
                120_000,
            );
            const reread = state.selectedFile();
            if (digest(reread.markdown) === beforeHash || !reread.markdown.includes(comment)) {
                throw new Error("The agent finished without persisting the verbatim correction.");
            }
            state.refresh();
            return state.setComment("success", "Correction persisted and read back.");
        } catch (error) {
            state.setComment("error", `${error?.message ?? "Agent update failed."} You can retry.`);
            throw error;
        } finally {
            pending = false;
        }
    }

    const server = createServer(async (req, res) => {
        try {
            const url = new URL(req.url ?? "/", origin ?? "http://127.0.0.1");
            const requestOrigin = req.headers.origin;
            if (requestOrigin && requestOrigin !== origin) {
                fail(res, 403, "Cross-origin request rejected.");
                return;
            }
            if (req.method === "POST" && requestOrigin !== origin) {
                fail(res, 403, "A same-origin request is required.");
                return;
            }
            if (req.method === "GET" && url.pathname === "/") {
                const source = await readFile(resolve(UI_ROOT, "index.html"), "utf8");
                res.writeHead(200, {
                    "Content-Type": MIME[".html"],
                    "Cache-Control": "no-store",
                    "Content-Security-Policy": "default-src 'self'; connect-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'",
                    "Referrer-Policy": "no-referrer",
                    "X-Content-Type-Options": "nosniff",
                });
                res.end(source.replace("__MINIME_NONCE__", nonce));
                return;
            }
            if (req.method === "GET" && ["/app.css", "/app.js"].includes(url.pathname)) {
                const source = await readFile(resolve(UI_ROOT, url.pathname.slice(1)));
                res.writeHead(200, {
                    "Content-Type": MIME[extname(url.pathname)],
                    "Cache-Control": "no-store",
                    "X-Content-Type-Options": "nosniff",
                });
                res.end(source);
                return;
            }
            if (req.method === "GET" && url.pathname === "/favicon.ico") {
                res.writeHead(204, { "Cache-Control": "public, max-age=86400" });
                res.end();
                return;
            }
            const suppliedNonce = req.headers["x-minime-nonce"] ?? url.searchParams.get("nonce");
            if (!safeEqual(suppliedNonce, nonce)) {
                fail(res, 403, "Invalid request nonce.");
                return;
            }
            if (req.method === "GET" && url.pathname === "/api/state") {
                json(res, 200, state.snapshot());
                return;
            }
            if (req.method === "GET" && url.pathname === "/events") {
                res.writeHead(200, {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache, no-transform",
                    Connection: "keep-alive",
                    "X-Accel-Buffering": "no",
                });
                const send = (snapshot) =>
                    res.write(`id: ${snapshot.revision}\nevent: state\ndata: ${JSON.stringify(snapshot)}\n\n`);
                const unsubscribe = state.subscribe(send);
                const heartbeat = setInterval(() => res.write(": keepalive\n\n"), 15_000);
                clients.add(res);
                req.on("close", () => {
                    clearInterval(heartbeat);
                    unsubscribe();
                    clients.delete(res);
                });
                return;
            }
            if (req.method === "POST" && url.pathname === "/api/select") {
                const input = await body(req, 1024);
                if (!safeEqual(input.nonce, nonce)) {
                    fail(res, 403, "Invalid request nonce.");
                    return;
                }
                json(res, 200, state.select(input.blueprint));
                return;
            }
            if (req.method === "POST" && url.pathname === "/api/comment") {
                const input = await body(req, MAX_COMMENT_BYTES + 512);
                if (!safeEqual(input.nonce, nonce)) {
                    fail(res, 403, "Invalid request nonce.");
                    return;
                }
                json(res, 200, await dispatchComment(input.comment));
                return;
            }
            fail(res, 404, "Route not found.");
        } catch (error) {
            if (!res.headersSent) fail(res, error?.status ?? 500, error?.message ?? "Request failed.");
            else res.end();
        }
    });

    await new Promise((resolveListen, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolveListen);
    });
    const address = server.address();
    origin = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;

    let refreshTimer;
    const watcher = watch(root, () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
            try { state.refresh(); }
            catch (error) { state.onSessionState("error", error?.message ?? "Blueprint refresh failed."); }
        }, 150);
    });
    cleanups.push(() => { clearTimeout(refreshTimer); watcher.close(); });
    cleanups.push(
        session.on("tool.execution_start", (event) => state.onToolStart(event.data)),
        session.on("tool.execution_complete", (event) => state.onToolComplete(event.data)),
        session.on("assistant.turn_start", () => state.onSessionState("running", "Agent turn in progress.")),
        session.on("session.idle", (event) =>
            state.onSessionState(event.data.aborted ? "aborted" : "completed", "Agent turn finished."),
        ),
        session.on("session.error", (event) =>
            state.onSessionState("error", event.data.message ?? "Session error."),
        ),
    );

    return {
        url: `${origin}/`,
        refresh: () => state.refresh(),
        select: (filename) => state.select(filename),
        close: async () => {
            for (const cleanup of cleanups) cleanup();
            for (const client of clients) client.end();
            await new Promise((resolveClose) => server.close(resolveClose));
        },
    };
}
