import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, Calendar, Upload } from 'lucide-react';
import { SettingsSection } from '@/components/settings-section';

import { router, usePage } from '@inertiajs/react';
import { toast } from '@/components/custom-toast';

interface GoogleCalendarSettingsProps {
  settings?: Record<string, string>;
}

export default function GoogleCalendarSettings({ settings = {} }: GoogleCalendarSettingsProps) {
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    googleCalendarEnabled: settings.googleCalendarEnabled === '1' || settings.googleCalendarEnabled === 'true',
    googleCalendarId: settings.googleCalendarId || '',
  });
  const [jsonFile, setJsonFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data = new FormData();
    data.append('googleCalendarEnabled', formData.googleCalendarEnabled ? '1' : '0');
    data.append('googleCalendarId', formData.googleCalendarId);
    if (jsonFile) {
      data.append('googleCalendarJson', jsonFile);
    }

    router.post(route('settings.google-calendar.update'), data, {
      preserveScroll: true,
      onSuccess: (page) => {
        setIsLoading(false);
        const successMessage = page.props.flash?.success;
        const errorMessage = page.props.flash?.error;
        
        if (successMessage) {
          toast.success(successMessage);
        } else if (errorMessage) {
          toast.error(errorMessage);
        }
      },
      onError: (errors) => {
        setIsLoading(false);
        const errorMessage = errors.error || Object.values(errors).join(', ') || 'Failed to update Google Calendar settings';
        toast.error(errorMessage);
      }
    });
  };

  return (
    <SettingsSection
      title={"Google Calendar Settings"}
      description={"Configure Google Calendar integration for appointment synchronization"}
      action={
        <Button type="submit" form="google-calendar-form" disabled={isLoading} size="sm">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      }
    >
      <form id="google-calendar-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="googleCalendarEnabled">{"Enable Google Calendar"}</Label>
            <p className="text-sm text-muted-foreground">
              {"Enable Google Calendar integration for appointments"}
            </p>
          </div>
          <Switch
            id="googleCalendarEnabled"
            checked={formData.googleCalendarEnabled}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, googleCalendarEnabled: checked }))}
          />
        </div>

        {formData.googleCalendarEnabled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="googleCalendarId">{"Google Calendar ID"}</Label>
              <Input
                id="googleCalendarId"
                type="text"
                value={formData.googleCalendarId}
                onChange={(e) => setFormData(prev => ({ ...prev, googleCalendarId: e.target.value }))}
                placeholder={"Enter your Google Calendar ID"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleCalendarJson">{"Google Calendar JSON File"}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="googleCalendarJson"
                  type="file"
                  accept=".json"
                  onChange={(e) => setJsonFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                {"JSON files only, max 2MB"}
              </p>
            </div>
          </div>
        )}
      </form>
    </SettingsSection>
  );
}