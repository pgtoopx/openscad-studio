import { jest } from '@jest/globals';

const mockShowSaveFilePicker = jest.fn();
const mockAnchorClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = jest.fn();

// Patch globals that webBridge accesses at call-time (not import-time, so order is fine)
Object.defineProperty(global, 'window', {
  value: {
    showOpenFilePicker: jest.fn(), // makes hasFileSystemAccess() return true
    showSaveFilePicker: mockShowSaveFilePicker,
  },
  writable: true,
});

// The fallback path calls bare `URL.createObjectURL` (not window.URL), so patch global.URL
Object.assign(URL, {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

Object.defineProperty(global, 'document', {
  value: {
    createElement: (tag: string) => {
      if (tag === 'a') return { href: '', download: '', click: mockAnchorClick };
      return undefined;
    },
    body: { appendChild: mockAppendChild, removeChild: mockRemoveChild },
  },
  writable: true,
});

import { WebBridge } from '../webBridge';

describe('WebBridge.fileExport', () => {
  const data = new Uint8Array([1, 2, 3]);
  const filename = 'export.stl';
  const filters = [{ name: 'STL Files', extensions: ['stl'] }];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  it('uses the browser download flow even when File System Access API is available', async () => {
    await new WebBridge().fileExport(data, filename, filters);

    expect(mockShowSaveFilePicker).not.toHaveBeenCalled();
    expect(mockAnchorClick).toHaveBeenCalledTimes(1);
    expect(mockAppendChild).toHaveBeenCalledTimes(1);
    expect(mockRemoveChild).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('uses the same browser download flow when File System Access API is unavailable', async () => {
    // Temporarily remove showOpenFilePicker to simulate an unsupported browser
    const originalWindow = global.window;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { showOpenFilePicker: _omit, ...windowWithoutFSA } = originalWindow as Record<
      string,
      unknown
    >;
    Object.defineProperty(global, 'window', { value: windowWithoutFSA, writable: true });

    await new WebBridge().fileExport(data, filename, filters);

    expect(mockAnchorClick).toHaveBeenCalledTimes(1);

    Object.defineProperty(global, 'window', { value: originalWindow, writable: true });
  });
});

import { getProjectStore } from '../../stores/projectStore';
import * as fflate from 'fflate';

describe('WebBridge.installProjectDependencies', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFetch = global.fetch;
    getProjectStore().getState().resetProject();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fails if openscad.json is invalid', async () => {
    getProjectStore().getState().openProject(
      null,
      {
        'openscad.json': 'invalid-json',
      },
      'main.scad'
    );

    const bridge = new WebBridge();
    const result = await bridge.installProjectDependencies();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to parse openscad.json');
  });

  it('installs valid dependency by fetching zip and adding to project store', async () => {
    getProjectStore()
      .getState()
      .openProject(
        null,
        {
          'openscad.json': JSON.stringify({ dependencies: { BOSL2: '*' } }),
        },
        'main.scad'
      );

    // Mock fetch for catalog and zip
    global.fetch = jest.fn(async (url: string | Request | URL) => {
      const urlStr = url.toString();
      if (urlStr === '/libraries/catalog.json') {
        return {
          ok: true,
          json: async () => ({ BOSL2: true }),
        } as Response;
      }
      if (urlStr === '/libraries/BOSL2.zip') {
        // Create a dummy zip with fflate
        const dummyZip = fflate.zipSync({
          'BOSL2/std.scad': fflate.strToU8('module std() {}'),
          'BOSL2/.git/config': fflate.strToU8('ignore me'),
          'BOSL2/helper.h': fflate.strToU8('#define HELPER'),
        });
        return {
          ok: true,
          arrayBuffer: async () => dummyZip.buffer,
        } as Response;
      }
      return { ok: false } as Response;
    });

    const bridge = new WebBridge();
    const result = await bridge.installProjectDependencies();

    expect(result.success).toBe(true);
    expect(result.output).toBe('Dependencies installed.');

    const files = getProjectStore().getState().files;
    expect(files['BOSL2/std.scad']).toBeDefined();
    expect(files['BOSL2/std.scad'].content).toBe('module std() {}');
    expect(files['BOSL2/helper.h']).toBeDefined();
    expect(files['BOSL2/.git/config']).toBeUndefined();
  });

  it('fails if catalog fetch fails', async () => {
    getProjectStore()
      .getState()
      .openProject(
        null,
        {
          'openscad.json': JSON.stringify({ dependencies: { BOSL2: '*' } }),
        },
        'main.scad'
      );

    global.fetch = jest.fn(async (url: string | Request | URL) => {
      const urlStr = url.toString();
      if (urlStr === '/libraries/catalog.json') {
        return { ok: false } as Response;
      }
      return { ok: false } as Response;
    });

    const bridge = new WebBridge();
    const result = await bridge.installProjectDependencies();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to fetch catalog.');
  });

  it('fails if dependency not found in catalog', async () => {
    getProjectStore()
      .getState()
      .openProject(
        null,
        {
          'openscad.json': JSON.stringify({ dependencies: { UnknownLib: '*' } }),
        },
        'main.scad'
      );

    global.fetch = jest.fn(async (url: string | Request | URL) => {
      const urlStr = url.toString();
      if (urlStr === '/libraries/catalog.json') {
        return {
          ok: true,
          json: async () => ({ BOSL2: true }),
        } as Response;
      }
      return { ok: false } as Response;
    });

    const bridge = new WebBridge();
    const result = await bridge.installProjectDependencies();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Dependency UnknownLib not found in catalog');
  });

  it('fails if zip download fails', async () => {
    getProjectStore()
      .getState()
      .openProject(
        null,
        {
          'openscad.json': JSON.stringify({ dependencies: { BOSL2: '*' } }),
        },
        'main.scad'
      );

    global.fetch = jest.fn(async (url: string | Request | URL) => {
      const urlStr = url.toString();
      if (urlStr === '/libraries/catalog.json') {
        return {
          ok: true,
          json: async () => ({ BOSL2: true }),
        } as Response;
      }
      if (urlStr === '/libraries/BOSL2.zip') {
        return { ok: false } as Response;
      }
      return { ok: false } as Response;
    });

    const bridge = new WebBridge();
    const result = await bridge.installProjectDependencies();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to download BOSL2.zip');
  });
});
