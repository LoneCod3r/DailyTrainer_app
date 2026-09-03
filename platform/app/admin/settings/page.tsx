import { getSettings } from '@/modules/settings/settings.service';
import { SettingsForm } from '@/components/admin/SettingsForm';

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500">
          Basic application settings. Membership pricing, donation settings and feature toggles will be added here
          once those modules are built.
        </p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
