export default {
  providers: [
    {
      // Set by `npx convex dev` / `npx @convex-dev/auth`.
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
