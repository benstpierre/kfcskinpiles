import { createApp } from "./app.mjs";
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("PORT must be between 1 and 65535.");
const app = await createApp();
await app.listen({
  port,
  host: process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
});
console.log(`Skin Piles listening on port ${port}`);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, async () => {
    await app.close();
    process.exit(0);
  });
