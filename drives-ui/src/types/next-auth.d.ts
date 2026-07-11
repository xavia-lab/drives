import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id?: string;
      roles?: string[];
    } & DefaultSession["user"];
  }

  interface User {
    roles?: string[];
  }

  /**
   * Usually mapped from the Keycloak 'account' object in the jwt callback
   */
  interface Account {
    access_token?: string;
    expires_at?: number;
    refresh_token?: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    roles?: string[];
    error?: string;
  }
}
