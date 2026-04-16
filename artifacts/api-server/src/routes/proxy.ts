import { Router, type Request, type Response } from "express";

const router: Router = Router();
const BMG_API = "https://booomerangs.ru/api";

function getAuthHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Origin": "https://booomerangs.ru",
  };
  const auth = req.headers.authorization;
  if (auth) headers["Authorization"] = auth;
  return headers;
}

function extractToken(setCookie: string | null): string | null {
  if (!setCookie) return null;
  const match = setCookie.match(/auth_token=([^;]+)/);
  return match ? match[1] : null;
}

async function forwardRequest(
  req: Request,
  res: Response,
  path: string,
  method: string,
  body?: unknown
) {
  try {
    const options: RequestInit = {
      method,
      headers: getAuthHeaders(req),
    };
    if (body !== undefined && method !== "GET") {
      options.body = JSON.stringify(body);
    }
    const upstream = await fetch(`${BMG_API}${path}`, options);
    let data: unknown;
    try {
      data = await upstream.json();
    } catch {
      data = {};
    }
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Proxy error" });
  }
}

router.post("/proxy/login", async (req: Request, res: Response) => {
  try {
    const upstream = await fetch(`${BMG_API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "https://booomerangs.ru" },
      body: JSON.stringify(req.body),
    });
    const token = extractToken(upstream.headers.get("set-cookie"));
    let data: Record<string, unknown>;
    try { data = await upstream.json() as Record<string, unknown>; } catch { data = {}; }
    res.status(upstream.status).json({ ...data, token: token ?? undefined });
  } catch {
    res.status(500).json({ error: "Proxy error" });
  }
});

router.post("/proxy/register", async (req: Request, res: Response) => {
  try {
    const upstream = await fetch(`${BMG_API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "https://booomerangs.ru" },
      body: JSON.stringify(req.body),
    });
    const token = extractToken(upstream.headers.get("set-cookie"));
    let data: Record<string, unknown>;
    try { data = await upstream.json() as Record<string, unknown>; } catch { data = {}; }
    res.status(upstream.status).json({ ...data, token: token ?? undefined });
  } catch {
    res.status(500).json({ error: "Proxy error" });
  }
});

router.get("/proxy/me", (req, res) => forwardRequest(req, res, "/auth/me", "GET"));
router.post("/proxy/logout", (req, res) => forwardRequest(req, res, "/auth/logout", "POST"));
router.get("/proxy/orders", (req, res) => forwardRequest(req, res, "/auth/orders", "GET"));
router.get("/proxy/my-gift-cards", (req, res) => forwardRequest(req, res, "/auth/my-gift-cards", "GET"));
router.get("/proxy/my-promo-codes", (req, res) => forwardRequest(req, res, "/auth/my-promo-codes", "GET"));
router.patch("/proxy/profile", (req, res) => forwardRequest(req, res, "/auth/profile", "PATCH", req.body));
router.post("/proxy/change-password", (req, res) => forwardRequest(req, res, "/auth/change-password", "POST", req.body));
router.post("/proxy/forgot-password", (req, res) => forwardRequest(req, res, "/auth/forgot-password", "POST", req.body));
router.post("/proxy/orders/:id/cancel", (req, res) =>
  forwardRequest(req, res, `/auth/orders/${req.params.id}/cancel`, "POST", req.body));
router.post("/proxy/orders/:id/refresh-tracking", (req, res) =>
  forwardRequest(req, res, `/auth/orders/${req.params.id}/refresh-tracking`, "POST"));
router.post("/proxy/orders/:id/refresh-yandex-tracking", (req, res) =>
  forwardRequest(req, res, `/auth/orders/${req.params.id}/refresh-yandex-tracking`, "POST"));

export default router;
