export function cleanStreetName(value: unknown): string | undefined {
  const out: string[] = [];

  const add = (input: unknown) => {
    const text = String(input ?? '')
      .trim()
      .replace(/^["']+|["']+$/g, '');

    if (!text) return;
    if (/^[\d\s.\/-]+$/.test(text)) return;
    if (/streetWidth|streetType|\{\s*["']?street/i.test(text)) return;
    if (!out.includes(text)) out.push(text);
  };

  const walk = (input: unknown) => {
    if (input === undefined || input === null) return;

    if (Array.isArray(input)) {
      input.forEach(walk);
      return;
    }

    if (typeof input === 'object') {
      const row = input as Record<string, unknown>;
      const direct = row.streetName ?? row.street_name ?? row.roadName ?? row.name;
      if (direct !== undefined) add(direct);
      return;
    }

    const text = String(input).trim();
    if (!text) return;

    let matched = false;
    const regex = /["']streetName["']\s*:\s*["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      add(match[1]);
      matched = true;
    }

    // If explicit streetName values exist, they are authoritative. Ignore trailing mixed fields.
    if (matched) return;

    if (text.startsWith('[') || text.startsWith('{')) {
      try {
        walk(JSON.parse(text));
        if (out.length) return;
      } catch {
        // Continue with safe token cleanup.
      }
    }

    text.split(/[،,;\n\r]+/).forEach(part => {
      const token = part.trim();
      if (!token) return;
      if (/^[\d\s.\/-]+$/.test(token)) return;
      if (/[{}\[\]]/.test(token)) return;
      if (/streetWidth|streetType/i.test(token)) return;
      add(token);
    });
  };

  walk(value);
  return out.length ? out.join('، ') : undefined;
}

export function normalizeDevelopedLicenseRequestBody(body: unknown): void {
  if (!body || typeof body !== 'object') return;
  const rows = (body as { rows?: unknown }).rows;
  if (!Array.isArray(rows)) return;

  for (const item of rows) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const clean = cleanStreetName(row.roadName);
    if (clean) row.roadName = clean;
    else delete row.roadName;

    // Preserve raw source payload, but expose the canonical clean street explicitly.
    if (row.rawData && typeof row.rawData === 'object' && clean) {
      (row.rawData as Record<string, unknown>).canonicalStreetName = clean;
    }
  }
}
