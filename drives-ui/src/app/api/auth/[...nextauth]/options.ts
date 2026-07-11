import KeycloakProvider from "next-auth/providers/keycloak";
import jwt from "jsonwebtoken";
import { NextAuthOptions } from "next-auth";
import { getServerConfig } from "@utils/config";

// Get validated config at the top level
const {
  DRIVES_FRONTEND_KEYCLOAK_CLIENT_ID,
  DRIVES_FRONTEND_KEYCLOAK_CLIENT_SECRET,
  DRIVES_FRONTEND_KEYCLOAK_ISSUER,
  NEXTAUTH_SECRET,
} = getServerConfig();

// Define a helper to call Keycloak's token endpoint
async function refreshAccessToken(token: any) {
  try {
    const url = `${DRIVES_FRONTEND_KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DRIVES_FRONTEND_KEYCLOAK_CLIENT_ID,
        client_secret: DRIVES_FRONTEND_KEYCLOAK_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();
    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fallback to old refresh token
    };
  } catch (error) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    // !!! Should be stored in .env file.
    KeycloakProvider({
      clientId: DRIVES_FRONTEND_KEYCLOAK_CLIENT_ID,
      clientSecret: DRIVES_FRONTEND_KEYCLOAK_CLIENT_SECRET,
      issuer: DRIVES_FRONTEND_KEYCLOAK_ISSUER!,
      profile(profile) {
        const name = profile.name ?? profile.preferred_username;
        // Use Keycloak's 'picture' claim, or fallback to a generator
        const avatarUrl =
          profile.picture ??
          `https://ui-avatars.com/api/?name=${name.replace(" ", "+")}?background=random`;

        return {
          id: profile.sub,
          name: name,
          email: profile.email,
          image: avatarUrl,
        };
      },
    }),
  ],
  secret: NEXTAUTH_SECRET!,
  callbacks: {
    async jwt({ token, account, user, profile }) {
      // Initial sign in
      if (account && user) {
        const decodedToken: any = jwt.decode(account.access_token!);
        return {
          ...token, // IMPORTANT: Spread existing token (includes name/email/picture)
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + Number(account.expires_in) * 1000,
          refreshToken: account.refresh_token,
          roles: decodedToken?.realm_access?.roles || [],
          id: user.id,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token expired, refresh it
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      if (session.user) {
        session.accessToken = token.accessToken;
        session.user.id = token.sub;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture; // Map 'picture' claim to 'image'
        session.user.roles = token.roles;
      }
      session.error = token.error;
      return session;
    },
  },
};

export default authOptions;
