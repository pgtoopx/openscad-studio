import { useEffect, useState } from 'react';
import { Button, Text } from '../ui';
import { getPlatform } from '../../platform';
import { SettingsCard, SettingsCardHeader, SettingsCardSection } from './SettingsPrimitives';
import { useProjectStore } from '../../stores/projectStore';
import { parseOpmManifest } from '../../../../../packages/shared/src/opmManifest';
import type { DependencyManagerStatus } from '../../platform/types';
import { useSettings } from '../../stores/settingsStore';
import { getRenderService } from '../../services/renderService';

export function ProjectDependenciesPanel() {
  const [settings] = useSettings();
  const projectRoot = useProjectStore((s) => s.projectRoot);
  const files = useProjectStore((s) => s.files);
  const scadJsonFile = files['scad.json'];

  const [status, setStatus] = useState<DependencyManagerStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installOutput, setInstallOutput] = useState<string>('');
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [dependencies, setDependencies] = useState<Record<string, string>>({});

  useEffect(() => {
    async function checkStatus() {
      setIsChecking(true);
      try {
        const platform = getPlatform();
        const res = await platform.getDependencyManagerStatus(settings.project.opmCustomPath);
        setStatus(res);
      } catch (e) {
        setStatus({ isAvailable: false, error: String(e) });
      } finally {
        setIsChecking(false);
      }
    }
    checkStatus();
  }, [settings.project.opmCustomPath]);

  useEffect(() => {
    if (scadJsonFile) {
      try {
        const parsed = JSON.parse(scadJsonFile.content);
        const manifest = parseOpmManifest(parsed);
        setDependencies(manifest.dependencies || {});
        setManifestError(null);
      } catch (e) {
        setManifestError('Invalid scad.json: ' + String(e));
        setDependencies({});
      }
    } else {
      setDependencies({});
      setManifestError(null);
    }
  }, [scadJsonFile]);

  const handleInstall = async () => {
    if (!projectRoot) return;
    setIsInstalling(true);
    setInstallOutput('Installing dependencies...\n');
    try {
      const platform = getPlatform();
      const result = await platform.installProjectDependencies(
        projectRoot,
        settings.project.opmCustomPath
      );
      setInstallOutput((prev) => prev + '\n' + result.output);

      if (result.success) {
        // Trigger render cache invalidation
        getRenderService().clearCache();
        // Here we could also trigger a re-render if we had access to the eventBus or similar
      } else {
        setInstallOutput((prev) => prev + '\nError: ' + (result.error || 'Unknown error'));
      }
    } catch (e) {
      setInstallOutput((prev) => prev + '\nException: ' + String(e));
    } finally {
      setIsInstalling(false);
    }
  };

  const hasDependencies = Object.keys(dependencies).length > 0;

  return (
    <SettingsCard>
      <SettingsCardHeader
        title="Project Libraries"
        description="Manage dependencies defined in scad.json using OPM."
      />
      <SettingsCardSection className="flex flex-col gap-4">
        {isChecking ? (
          <Text>Checking OPM status...</Text>
        ) : status?.isAvailable ? (
          <Text color="secondary">OPM version: {status.version}</Text>
        ) : (
          <Text color="error">OPM is not available. {status?.error}</Text>
        )}

        {!projectRoot ? (
          <Text color="tertiary">No project is currently open on the filesystem.</Text>
        ) : !scadJsonFile ? (
          <Text color="tertiary">No scad.json found in the project root.</Text>
        ) : manifestError ? (
          <Text color="error">{manifestError}</Text>
        ) : !hasDependencies ? (
          <Text color="tertiary">No dependencies defined in scad.json.</Text>
        ) : (
          <div className="flex flex-col gap-2">
            <Text weight="medium">Dependencies:</Text>
            <ul className="list-disc list-inside">
              {Object.entries(dependencies).map(([name, version]) => (
                <li key={name}>
                  <Text as="span">
                    {name} ({version})
                  </Text>
                </li>
              ))}
            </ul>
            <Button
              onClick={handleInstall}
              disabled={isInstalling || !status?.isAvailable}
              className="w-max mt-2"
            >
              {isInstalling ? 'Installing...' : 'Install Missing'}
            </Button>
          </div>
        )}

        {installOutput && (
          <pre className="mt-4 p-2 bg-black/5 dark:bg-white/5 rounded text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
            {installOutput}
          </pre>
        )}
      </SettingsCardSection>
    </SettingsCard>
  );
}
