import { z } from 'zod';

export const opmManifestSchema = z.object({
  dependencies: z.record(z.string()).optional(),
});

export type OpmManifest = z.infer<typeof opmManifestSchema>;

export function parseOpmManifest(data: unknown): OpmManifest {
  return opmManifestSchema.parse(data);
}
