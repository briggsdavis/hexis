import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Wires up the Convex Auth HTTP routes (sign-in callbacks, etc.).
auth.addHttpRoutes(http);

export default http;
