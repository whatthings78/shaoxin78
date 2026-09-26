import assert from "node:assert/strict";

process.env.WORKBENCH_EMBEDDED = "1";
const { server, startServer } = await import("../server.mjs");
const address = await startServer({ port: 0 });
const port = typeof address === "object" && address ? address.port : 0;

try {
  assert.ok(port > 0, "嵌入式服务必须分配本机端口");
  const response = await fetch(`http://127.0.0.1:${port}/api/health`);
  const health = await response.json();
  assert.equal(response.status, 200);
  assert.equal(health.ok, true);
  assert.equal(health.version, "0.9.0");
  console.log("embedded server test passed");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
