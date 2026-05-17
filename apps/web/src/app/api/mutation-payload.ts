function isUploadFile(value: FormDataEntryValue): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "size" in value &&
    "type" in value
  );
}

function parsePayloadJson(rawPayload: FormDataEntryValue | null): unknown {
  if (typeof rawPayload !== "string") {
    throw new Error("MISSING_PAYLOAD");
  }

  try {
    return JSON.parse(rawPayload);
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function getFileMap(formData: FormData): Map<string, File> {
  const files = new Map<string, File>();

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("file:") || !isUploadFile(value) || value.size === 0) continue;
    files.set(key.slice("file:".length), value);
  }

  return files;
}

export async function readMutationPayload(
  request: Request
): Promise<{ payload: unknown; files: Map<string, File> }> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return {
      payload: parsePayloadJson(formData.get("payload")),
      files: getFileMap(formData),
    };
  }

  try {
    return { payload: await request.json(), files: new Map() };
  } catch {
    throw new Error("INVALID_JSON");
  }
}
