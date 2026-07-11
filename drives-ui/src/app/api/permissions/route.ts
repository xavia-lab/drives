import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@app/api/auth/[...nextauth]/options";
import { cerbos } from "@providers/cerbos";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ can: false }, { status: 401 });
  }

  try {
    const { resource, action, params } = await req.json();

    // Use Cerbos client (which safely calls getServerConfig on the server)
    const decision = await cerbos.checkResource({
      principal: {
        id: session.user.id || "anonymous",
        roles: session.user.roles || [],
      },
      resource: {
        kind: resource,
        id: params?.id?.toString() || "new",
        attr: params?.attributes || {},
      },
      actions: [action],
    });

    return NextResponse.json({ can: decision.isAllowed(action) });
  } catch (error) {
    console.error("Cerbos Server Error:", error);
    return NextResponse.json({ can: false }, { status: 500 });
  }
}
