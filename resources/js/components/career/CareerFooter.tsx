import { Link, usePage } from '@inertiajs/react';
import { getImagePath } from '@/utils/helpers';


interface CareerFooterProps {
  companySettings?: any;
}

export default function CareerFooter({ companySettings }: CareerFooterProps) {
  
  const { props } = usePage();
  const settings = companySettings || (props as any).companySettings;
  
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">{settings?.company_name || "Company Name"}</h3>
            <p className="text-gray-400">
              {settings?.company_description || "Building the future of work with innovative solutions and amazing people."}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{"Contact Info"}</h4>
            <div className="text-gray-400 space-y-2">
              <p>{"Email"}: {settings?.company_email || 'careers@company.com'}</p>
              <p>{"Phone"}: {settings?.companyMobile || '+1 (555) 123-4567'}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>{settings?.footerText || "© 2024 Company Name. All rights reserved."}</p>
        </div>
      </div>
    </footer>
  );
}