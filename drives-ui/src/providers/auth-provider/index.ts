import { type AuthProvider } from "@refinedev/core";
import { getSession, signIn, signOut } from "next-auth/react";

export const createAuthProvider = (to?: string): AuthProvider => ({
  login: async () => {
    signIn("keycloak", {
      callbackUrl: to ? to.toString() : "/",
      redirect: true,
    });

    return {
      success: true,
    };
  },
  logout: async () => {
    signOut({
      redirect: true,
      callbackUrl: "/login",
    });

    return {
      success: true,
    };
  },
  onError: async (error) => {
    // If the dataProvider throws after the retry failed
    if (error.status === 401 || error.status === 403) {
      return {
        logout: true,
        redirectTo: "/login",
        error: new Error("Session expired. Please login again."),
      };
    }
    return { error };
  },
  check: async () => {
    const session = await getSession();

    // 1. If we have a valid session, the user is authenticated
    if (session && session.error !== "RefreshAccessTokenError") {
      return { authenticated: true };
    }

    // 2. If no session (or refresh error), they are NOT authenticated
    // Use window.location.pathname to check the current route (client-side)
    const isLoginPage = window.location.pathname === "/login";

    return {
      authenticated: false,
      // ONLY redirect if we aren't already on the login page
      redirectTo: isLoginPage ? undefined : "/login",
      error:
        session?.error === "RefreshAccessTokenError"
          ? new Error("Session expired")
          : undefined,
    };
  },
  getPermissions: async () => {
    const session = await getSession();

    if (session?.user?.roles) {
      // Returns an array of roles: ["admin", "editor", "default-roles-myrealm"]
      return session.user.roles;
    }

    return null;
  },
  getIdentity: async () => {
    try {
      const session = await getSession();
      console.log("Current Session User: ", JSON.stringify(session?.user));
      if (session?.user) {
        return {
          ...session.user,
          name: session.user.name,
          email: session.user.email,
          avatar: session.user.image,
        };
      }
    } catch (error) {
      console.error("Session fetch failed:", error);
    }
    return null;
  },
});
