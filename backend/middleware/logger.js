const morgan = require("morgan");

// Custom token: request body (truncated for safety)
morgan.token("body", (req) => {
  const body = req.body;
  if (!body || Object.keys(body).length === 0) return "-";
  const safe = JSON.stringify(body).slice(0, 120);
  return safe.length === 120 ? safe + "..." : safe;
});

// Custom token: response time color
morgan.token("status-colored", (req, res) => {
  const status = res.statusCode;
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`; // red
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`; // yellow
  return `\x1b[32m${status}\x1b[0m`; // green
});

const format = ":method :url :status-colored :response-time ms — body: :body";

module.exports = morgan(format);
