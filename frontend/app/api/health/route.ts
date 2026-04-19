// Health-check route handler.
// GET /api/health → { status: "ok" }
export async function GET() {
  return Response.json({ status: "ok" });
}
