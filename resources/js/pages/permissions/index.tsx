import { PageCrudWrapper } from '@/components/PageCrudWrapper';
import { permissionsConfig } from '@/config/crud/permissions';


export default function PermissionsPage() {
  
  const breadcrumbs = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'User Management', href: route('roles.index') },
    { title: 'Permissions' }
  ];

  return (
    <PageCrudWrapper 
      config={permissionsConfig} 
      url="/permissions" 
      breadcrumbs={breadcrumbs}
    />
  );
}