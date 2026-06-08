import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("dist", import.meta.url)));
const indexFile = join(root, "index.html");
const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function getFilePath(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const requestedPath = resolve(root, `.${pathname}`);

  if (requestedPath !== root && !requestedPath.startsWith(`${root}${sep}`)) {
    return null;
  }

  try {
    const file = await stat(requestedPath);

    if (file.isFile()) {
      return requestedPath;
    }

    if (file.isDirectory()) {
      const directoryIndex = join(requestedPath, "index.html");

      try {
        const index = await stat(directoryIndex);

        return index.isFile() ? directoryIndex : null;
      } catch {
        return null;
      }
    }
  } catch {
    if (!extname(pathname)) {
      return indexFile;
    }
  }

  return null;
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method Not Allowed");
    return;
  }

  try {
    const filePath = await getFilePath(request.url ?? "/");

    if (!filePath) {
      response.writeHead(404);
      response.end("Not Found");
      return;
    }

    await stat(filePath);
    const extension = extname(filePath).toLowerCase();
    const isHtml = extension === ".html";

    response.writeHead(200, {
      "Cache-Control": isHtml ? "no-cache" : "public, max-age=31536000, immutable",
      "Content-Type": contentTypes[extension] ?? "application/octet-stream",
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(filePath).pipe(response);
  } catch (error) {
    console.error(error);
    response.writeHead(500);
    response.end("Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Frontend listening on http://0.0.0.0:${port}`);
});
