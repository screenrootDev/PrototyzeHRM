import { SettingsSection } from '@/components/settings-section';
import { toast } from '@/components/custom-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router, usePage } from '@inertiajs/react';
import { AlertCircle, PlugZap, RefreshCw, Save } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface FreedcampSettingsProps {
  settings?: {
    credentials_configured?: boolean;
    sync_status?: string;
    sync_message?: string;
    last_synced_at?: string;
  };
}

interface FreedcampPageProps extends Record<string, unknown> {
  globalSettings?: {
    is_demo?: boolean;
  };
}

export default function FreedcampSettings({ settings = {} }: FreedcampSettingsProps) {
  const { globalSettings } = usePage<FreedcampPageProps>().props;
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isStartingSync, setIsStartingSync] = useState(false);
  const isConfigured = Boolean(settings.credentials_configured);

  const finishRequest = () => {
    setIsTesting(false);
    if (!globalSettings?.is_demo) toast.dismiss();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!globalSettings?.is_demo) toast.loading('Saving Freedcamp settings...');

    router.post(route('settings.freedcamp.update'), {
      freedcamp_api_key: apiKey,
      freedcamp_secret_key: secretKey,
      credentials_configured: isConfigured,
    }, {
      preserveScroll: true,
      onSuccess: (page) => {
        finishRequest();
        setApiKey('');
        setSecretKey('');
        const flash = page.props.flash as { success?: string; error?: string } | undefined;
        const message = flash?.success || flash?.error;
        if (flash?.error) {
          toast.error(message);
        } else {
          toast.success(message || 'Freedcamp settings saved successfully.');
        }
      },
      onError: (errors) => {
        finishRequest();
        toast.error(Object.values(errors).join(', ') || 'Failed to save Freedcamp settings.');
      },
    });
  };

  const handleTest = () => {
    setIsTesting(true);
    if (!globalSettings?.is_demo) toast.loading('Testing Freedcamp connection...');

    router.post(route('settings.freedcamp.test'), {
      freedcamp_api_key: apiKey,
      freedcamp_secret_key: secretKey,
    }, {
      preserveScroll: true,
      onSuccess: (page) => {
        finishRequest();
        const flash = page.props.flash as { success?: string; error?: string } | undefined;
        if (flash?.error) {
          toast.error(flash.error);
        } else {
          toast.success(flash?.success || 'Freedcamp connection successful.');
        }
      },
      onError: (errors) => {
        finishRequest();
        toast.error(Object.values(errors).join(', ') || 'Unable to test Freedcamp connection.');
      },
    });
  };

  const handleFullSync = () => {
    setIsStartingSync(true);
    router.post(route('hr.time-entries.sync-freedcamp'), { sync_all: true }, {
      preserveScroll: true,
      onSuccess: (page) => {
        const flash = page.props.flash as { success?: string; error?: string } | undefined;
        flash?.error ? toast.error(flash.error) : toast.success(flash?.success || 'Full history sync started.');
      },
      onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Unable to start full sync.'),
      onFinish: () => setIsStartingSync(false),
    });
  };

  return (
    <SettingsSection
      title="Freedcamp Settings"
      description="Configure your Freedcamp project management integration"
      action={
        <Button type="submit" form="freedcamp-settings-form" size="sm">
          <Save className="mr-2 size-4" />
          Save Changes
        </Button>
      }
    >
      <Card>
        <CardContent className="pt-6">
          <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800">
            <AlertCircle className="size-4 self-center text-blue-600" />
            <AlertDescription className="flex-1 space-y-2 font-medium text-pretty">
              <div>Generate a secured API key in Freedcamp under My Account → Integrations → API.</div>
              <div>Your credentials are encrypted before they are stored and are never displayed after saving.</div>
            </AlertDescription>
          </Alert>

          <form id="freedcamp-settings-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="freedcamp_api_key">API Key {!isConfigured && <span className="text-red-500">*</span>}</Label>
                <Input
                  id="freedcamp_api_key"
                  type="password"
                  autoComplete="new-password"
                  placeholder={isConfigured ? 'Saved — enter to replace' : 'Enter Freedcamp API key'}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  required={!isConfigured}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="freedcamp_secret_key">Secret Key {!isConfigured && <span className="text-red-500">*</span>}</Label>
                <Input
                  id="freedcamp_secret_key"
                  type="password"
                  autoComplete="new-password"
                  placeholder={isConfigured ? 'Saved — enter to replace' : 'Enter Freedcamp secret key'}
                  value={secretKey}
                  onChange={(event) => setSecretKey(event.target.value)}
                  required={!isConfigured}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-pretty text-muted-foreground">
                {isConfigured ? 'Freedcamp credentials are configured.' : 'Freedcamp credentials have not been configured yet.'}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={isTesting || (!isConfigured && (!apiKey || !secretKey))}
              >
                <PlugZap className="mr-2 size-4" />
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
            {isConfigured && (
              <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium">Full history synchronization</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.sync_message || 'Run this for initial setup or recovery. Regular Timesheet sync imports only the latest 30 days.'}
                  </p>
                  {settings.last_synced_at && <p className="mt-1 text-xs text-muted-foreground">Last completed: {settings.last_synced_at}</p>}
                </div>
                <Button type="button" variant="outline" onClick={handleFullSync} disabled={isStartingSync || settings.sync_status === 'running'}>
                  <RefreshCw className={`mr-2 size-4 ${(isStartingSync || settings.sync_status === 'running') ? 'animate-spin' : ''}`} />
                  {isStartingSync || settings.sync_status === 'running' ? 'Starting...' : 'Sync Full History'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </SettingsSection>
  );
}
