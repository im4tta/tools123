// Standalone MCP (Model Context Protocol) server for 123 Toolbox.
//
// Exposes a small set of deterministic tools so AI assistants (Claude Desktop,
// Cursor, Copilot, etc.) can run them without a browser. Runs over stdio and
// implements the MCP JSON-RPC transport directly — no external dependencies.
//
// Usage:
//   node mcp/server.mjs
//
// Or register it in your client with the command above.

import { createHash, randomUUID } from "node:crypto";
import { createInterface } from "node:readline";

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_INFO = { name: "123-toolbox", version: "1.0.0" };

const KH_DIGITS = "០១២៣៤៥៦៧៨៩";

// ---------------------------------------------------------------------------
// Tool implementations (pure, deterministic)
// ---------------------------------------------------------------------------

function toolBase64({ input = "", operation = "encode" }) {
  if (operation === "decode") {
    try {
      return Buffer.from(String(input), "base64").toString("utf8");
    } catch {
      throw new Error("Invalid base64 input.");
    }
  }
  return Buffer.from(String(input), "utf8").toString("base64");
}

function toolHash({ input = "", algorithm = "sha256" }) {
  const algos = new Set(["md5", "sha1", "sha256", "sha384", "sha512"]);
  if (!algos.has(algorithm)) throw new Error(`Unsupported algorithm: ${algorithm}`);
  return createHash(algorithm).update(String(input), "utf8").digest("hex");
}

function toolUuid({ count = 1 }) {
  const n = Math.min(Math.max(Number(count) || 1, 1), 100);
  return Array.from({ length: n }, () => randomUUID());
}

function toolUrlEncode({ input = "", operation = "encode" }) {
  if (operation === "decode") {
    try {
      return decodeURIComponent(String(input));
    } catch {
      throw new Error("Invalid URL-encoded input.");
    }
  }
  return encodeURIComponent(String(input));
}

function toolJsonFormat({ input = "", indent = 2 }) {
  let parsed;
  try {
    parsed = JSON.parse(String(input));
  } catch {
    throw new Error("Invalid JSON input.");
  }
  return JSON.stringify(parsed, null, Number(indent) || 2);
}

function toolJsonMinify({ input = "" }) {
  let parsed;
  try {
    parsed = JSON.parse(String(input));
  } catch {
    throw new Error("Invalid JSON input.");
  }
  return JSON.stringify(parsed);
}

function toolCaseConvert({ input = "", mode = "lower" }) {
  const text = String(input);
  switch (mode) {
    case "upper": return text.toUpperCase();
    case "lower": return text.toLowerCase();
    case "title":
      return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    case "sentence":
      return text.replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
    default:
      throw new Error(`Unsupported mode: ${mode}`);
  }
}

function toolWordCount({ input = "" }) {
  const text = String(input);
  const words = (text.trim().match(/[\w\u1780-\u17ff]+/g) || []).length;
  const chars = [...text].length;
  const lines = text === "" ? 0 : text.split(/\r\n|\r|\n/).length;
  return { words, characters: chars, lines };
}

function toolKhmerDigits({ input = "", to = "khmer" }) {
  const text = String(input);
  if (to === "khmer") {
    return text.replace(/[0-9]/g, (d) => KH_DIGITS[Number(d)]);
  }
  if (to === "arabic") {
    const map = Object.fromEntries([...KH_DIGITS].map((k, i) => [k, String(i)]));
    return text.replace(/[០-៩]/g, (k) => map[k]);
  }
  throw new Error(`Unsupported target: ${to}`);
}

function toolSlugify({ input = "", separator = "-" }) {
  const text = String(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u1780-\u17ff]+/g, " ")
    .trim()
    .replace(/\s+/g, separator);
  return text;
}

// ---------------------------------------------------------------------------
// Tool catalog
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "base64",
    description: "Encode or decode text as Base64.",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string", description: "Text to encode (or Base64 to decode)." },
        operation: { type: "string", enum: ["encode", "decode"], description: "encode or decode" },
      },
      required: ["input"],
    },
    handler: toolBase64,
  },
  {
    name: "hash",
    description: "Compute a cryptographic hash (md5, sha1, sha256, sha384, sha512) of text.",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string" },
        algorithm: { type: "string", enum: ["md5", "sha1", "sha256", "sha384", "sha512"] },
      },
      required: ["input"],
    },
    handler: toolHash,
  },
  {
    name: "uuid",
    description: "Generate one or more random UUID v4 strings.",
    inputSchema: {
      type: "object",
      properties: {
        count: { type: "number", description: "How many UUIDs to generate (1-100)." },
      },
    },
    handler: toolUuid,
  },
  {
    name: "url_encode",
    description: "URL-encode or URL-decode a string.",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string" },
        operation: { type: "string", enum: ["encode", "decode"] },
      },
      required: ["input"],
    },
    handler: toolUrlEncode,
  },
  {
    name: "json_format",
    description: "Pretty-print or minify JSON, with configurable indentation.",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string", description: "JSON text." },
        indent: { type: "number", description: "Spaces per indent (default 2)." },
        minify: { type: "boolean", description: "Minify instead of pretty-print." },
      },
      required: ["input"],
    },
    handler: ({ input, indent, minify }) => (minify ? toolJsonMinify({ input }) : toolJsonFormat({ input, indent })),
  },
  {
    name: "case_convert",
    description: "Convert text case: upper, lower, title, or sentence.",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string" },
        mode: { type: "string", enum: ["upper", "lower", "title", "sentence"] },
      },
      required: ["input"],
    },
    handler: toolCaseConvert,
  },
  {
    name: "word_count",
    description: "Count words, characters, and lines in text (supports Khmer script).",
    inputSchema: {
      type: "object",
      properties: { input: { type: "string" } },
      required: ["input"],
    },
    handler: toolWordCount,
  },
  {
    name: "khmer_digits",
    description: "Convert Arabic numerals to Khmer numerals (០-៩) or back.",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string" },
        to: { type: "string", enum: ["khmer", "arabic"] },
      },
      required: ["input"],
    },
    handler: toolKhmerDigits,
  },
  {
    name: "slugify",
    description: "Convert text to a URL-safe slug, preserving Khmer characters.",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string" },
        separator: { type: "string", description: "Word separator (default '-')." },
      },
      required: ["input"],
    },
    handler: toolSlugify,
  },
];

// ---------------------------------------------------------------------------
// MCP stdio transport (JSON-RPC 2.0, newline-delimited)
// ---------------------------------------------------------------------------

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

function respondError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
}

function handleRequest(msg) {
  const { id, method, params } = msg || {};

  if (method === "initialize") {
    respond(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: SERVER_INFO,
    });
    return;
  }

  if (method === "ping") {
    respond(id, {});
    return;
  }

  if (method === "tools/list") {
    respond(id, { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
    return;
  }

  if (method === "tools/call") {
    const tool = TOOLS.find((t) => t.name === params?.name);
    if (!tool) {
      respondError(id, -32602, `Unknown tool: ${params?.name}`);
      return;
    }
    try {
      const output = tool.handler(params?.arguments ?? {});
      const text = typeof output === "string" ? output : JSON.stringify(output, null, 2);
      respond(id, { content: [{ type: "text", text }], isError: false });
    } catch (err) {
      respond(id, {
        content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
        isError: true,
      });
    }
    return;
  }

  // notifications/* and unknown methods: acknowledge silently where a response is expected.
  if (id !== undefined && id !== null) {
    respondError(id, -32601, `Method not found: ${method}`);
  }
}

const rl = createInterface({ input: process.stdin, terminal: false });
rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    handleRequest(JSON.parse(trimmed));
  } catch {
    // Ignore malformed frames; the client will time out or resend.
  }
});
rl.on("close", () => process.exit(0));
