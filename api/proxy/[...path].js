const DEFAULT_BACKEND_API_BASE_URL = "http://api.simplificagov.com:8080";

function normalizeBaseUrl(value) {
  const raw = String(value || DEFAULT_BACKEND_API_BASE_URL).trim();
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function buildTargetUrl(req, backendBaseUrl) {
  const pathParam = req.query.path;
  const path = Array.isArray(pathParam)
    ? pathParam.join("/")
    : String(pathParam || "");

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const target = new URL(`${backendBaseUrl}${normalizedPath}`);

  for (const [key, value] of Object.entries(req.query || {})) {
    if (key === "path") {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => target.searchParams.append(key, String(item)));
    } else if (value !== undefined) {
      target.searchParams.append(key, String(value));
    }
  }

  return target;
}

module.exports = async (req, res) => {
  try {
    const backendBaseUrl = normalizeBaseUrl(process.env.BACKEND_API_BASE_URL);
    const targetUrl = buildTargetUrl(req, backendBaseUrl);

    const headers = {};
    if (req.headers["content-type"]) {
      headers["content-type"] = req.headers["content-type"];
    }
    if (req.headers.authorization) {
      headers.authorization = req.headers.authorization;
    }

    const method = req.method || "GET";
    const requestInit = {
      method,
      headers,
    };

    if (method !== "GET" && method !== "HEAD" && req.body !== undefined) {
      requestInit.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl.toString(), requestInit);
    const responseBody = await response.arrayBuffer();

    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("content-type", contentType);
    }

    res.status(response.status).send(Buffer.from(responseBody));
  } catch (error) {
    res.status(502).json({
      error: "proxy_error",
      message: error instanceof Error ? error.message : "Erro ao encaminhar requisicao para backend.",
    });
  }
};
