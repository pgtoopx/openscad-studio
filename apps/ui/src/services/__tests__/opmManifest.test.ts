import { parseOpmManifest } from '../../../../../packages/shared/src/opmManifest';

describe('opmManifest', () => {
  it('should parse a valid scad.json manifest', () => {
    const validJson = {
      dependencies: {
        BOSL2: '1.0.0',
      },
    };

    const result = parseOpmManifest(validJson);
    expect(result.dependencies).toBeDefined();
    expect(result.dependencies?.['BOSL2']).toBe('1.0.0');
  });

  it('should fail on invalid manifest', () => {
    const invalidJson = {
      dependencies: 'not-an-object',
    };

    expect(() => parseOpmManifest(invalidJson)).toThrow();
  });

  it('should allow manifest with missing dependencies object', () => {
    const emptyJson = {};
    const result = parseOpmManifest(emptyJson);
    expect(result.dependencies).toBeUndefined();
  });
});
