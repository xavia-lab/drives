import { HTTP } from "@cerbos/http";
import { getServerConfig } from "@utils/config";

// Call the config helper to get the validated runtime variables
const { DRIVES_FRONTEND_CERBOS_URL } = getServerConfig();

// In production, replace localhost with your actual Cerbos PDP URL
export const cerbos = new HTTP(DRIVES_FRONTEND_CERBOS_URL);
