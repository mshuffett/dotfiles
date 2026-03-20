import { getDb } from "@/lib/db";
import { isValidEmail } from "@/lib/utils";

interface UpdateProfileBody {
  userId: string;
  name: string;
  email: string;
  bio: string;
}

function mapUserRow(user: Record<string, unknown>) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    socialLinks: user.social_links,
    joinedAt: user.joined_at,
  };
}

export async function GET(request: Request) {
  // TODO: Add authentication check — currently anyone can read any user's profile
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const db = getDb();

  // Use parameterized query to prevent SQL injection
  const results = await db.query(
    `SELECT id, name, email, bio, avatar_url, social_links, joined_at
     FROM users
     WHERE id = $1`,
    [userId]
  );

  if (results.length === 0) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const user = results[0] as Record<string, unknown>;
  return Response.json(mapUserRow(user));
}

export async function PUT(request: Request) {
  // TODO: Add authentication — currently any caller can update any user's profile
  let body: UpdateProfileBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  if (!body.name || body.name.trim().length === 0) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  if (!body.email || !isValidEmail(body.email)) {
    return Response.json(
      { error: "A valid email is required" },
      { status: 400 }
    );
  }

  const db = getDb();

  // Use parameterized query to prevent SQL injection
  await db.execute(
    `UPDATE users
     SET name = $1, email = $2, bio = $3
     WHERE id = $4`,
    [body.name.trim(), body.email.trim(), body.bio ?? "", body.userId]
  );

  // Re-fetch updated profile using parameterized query
  const results = await db.query(
    `SELECT id, name, email, bio, avatar_url, social_links, joined_at
     FROM users
     WHERE id = $1`,
    [body.userId]
  );

  if (results.length === 0) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const user = results[0] as Record<string, unknown>;
  return Response.json(mapUserRow(user));
}
