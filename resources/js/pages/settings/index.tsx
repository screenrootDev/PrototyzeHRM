import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Settings as SettingsIcon, Building, DollarSign, Users, RefreshCw, Palette, BookOpen, Award, FileText, Mail, Bell, Link2, CreditCard, Calendar, HardDrive, Shield, Bot, Cookie, Search, Webhook, Wallet, Clock, Fingerprint, Network } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import SystemSettings from './components/system-settings';
import { usePage } from '@inertiajs/react';

import CurrencySettings from './components/currency-settings';

import BrandSettings from './components/brand-settings';
import EmailSettings from './components/email-settings';
import PaymentSettings from './components/payment-settings';
import StorageSettings from './components/storage-settings';
import RecaptchaSettings from './components/recaptcha-settings';
import ChatGptSettings from './components/chatgpt-settings';
import CookieSettings from './components/cookie-settings';
import SeoSettings from './components/seo-settings';
import CacheSettings from './components/cache-settings';
import WebhookSettings from './components/webhook-settings';
import GoogleCalendarSettings from './components/google-calendar-settings';
import WorkingDaysSettings from './components/working-days-settings';
import ZektoSettings from './components/zekto-settings';
import IpRestrictionSettings from './components/ip-restriction-settings';
import { Toaster } from '@/components/ui/toaster';

import { hasPermission } from '@/utils/permissions';
import { useLayout } from '@/contexts/LayoutContext';

export default function Settings() {
  
  const { position } = useLayout();

  const { systemSettings = {}, cacheSize = '0.00', timezones = {}, dateFormats = {}, timeFormats = {}, paymentSettings = {}, webhooks = [], auth = {}, globalSettings = {}, zektoSettings = {} } = usePage().props as any;
  const isSaas = globalSettings?.is_saas;
  const [activeSection, setActiveSection] = useState('system-settings');

  // Define all possible sidebar navigation items
  const allSidebarNavItems: (NavItem & { permission?: string })[] = [
    {
      title: 'System Settings',
      href: '#system-settings',
      icon: <SettingsIcon className="h-4 w-4 mr-2" />,
      permission: 'manage-system-settings'
    },
    {
      title: 'Brand Settings',
      href: '#brand-settings',
      icon: <Palette className="h-4 w-4 mr-2" />,
      permission: 'manage-brand-settings'
    },
    {
      title: 'Currency Settings',
      href: '#currency-settings',
      icon: <DollarSign className="h-4 w-4 mr-2" />,
      permission: 'manage-currency-settings'
    },
    {
      title: 'Email Settings',
      href: '#email-settings',
      icon: <Mail className="h-4 w-4 mr-2" />,
      permission: 'manage-email-settings'
    },
    {
      title: 'Working Days Settings',
      href: '#working-days-settings',
      icon: <Clock className="h-4 w-4 mr-2" />,
      permission: 'manage-working-days-settings'
    },
    {
      title: 'IP Restriction Settings',
      href: '#ip-restriction-settings',
      icon: <Network className="h-4 w-4 mr-2" />,
      permission: 'manage-ip-restriction-settings'
    },
    {
      title: 'Zekto Settings',
      href: '#zekto-settings',
      icon: <Fingerprint className="h-4 w-4 mr-2" />,
      permission: 'manage-biomatric-attedance-settings'
    },
    {
      title: 'Payment Settings',
      href: '#payment-settings',
      icon: <CreditCard className="h-4 w-4 mr-2" />,
      permission: 'manage-payment-settings'
    },
    {
      title: 'Storage Settings',
      href: '#storage-settings',
      icon: <HardDrive className="h-4 w-4 mr-2" />,
      permission: 'manage-storage-settings'
    },
    {
      title: 'ReCaptcha Settings',
      href: '#recaptcha-settings',
      icon: <Shield className="h-4 w-4 mr-2" />,
      permission: 'manage-recaptcha-settings'
    },
    {
      title: 'Chat GPT Settings',
      href: '#chatgpt-settings',
      icon: <Bot className="h-4 w-4 mr-2" />,
      permission: 'manage-chatgpt-settings'
    },
    {
      title: 'Cookie Settings',
      href: '#cookie-settings',
      icon: <Cookie className="h-4 w-4 mr-2" />,
      permission: 'manage-cookie-settings'
    },
    {
      title: 'SEO Settings',
      href: '#seo-settings',
      icon: <Search className="h-4 w-4 mr-2" />,
      permission: 'manage-seo-settings'
    },
    {
      title: 'Cache Settings',
      href: '#cache-settings',
      icon: <HardDrive className="h-4 w-4 mr-2" />,
      permission: 'manage-cache-settings'
    },
    // {
    //   title: 'Google Calendar Settings',
    //   href: '#google-calendar-settings',
    //   icon: <Calendar className="h-4 w-4 mr-2" />,
    //   permission: 'settings'
    // },
  ];

  // if (auth.user?.type !== 'superadmin') {
  //   allSidebarNavItems.push({
  //     title: 'Webhook Settings',
  //     href: '#webhook-settings',
  //     icon: <Webhook className="h-4 w-4 mr-2" />,
  //     permission: 'manage-webhook-settings'
  //   });
  // }
  // Filter sidebar items based on user permissions
  const sidebarNavItems = allSidebarNavItems.filter(item => {
    // Exclude Working Days Settings from superadmin
    if (item.permission === 'manage-working-days-settings' && auth.user?.type === 'superadmin') {
      return false;
    }
    if (item.permission === 'manage-biomatric-attedance-settings' && auth.user?.type === 'superadmin') {
      return false;
    }
    if (item.permission === 'manage-ip-restriction-settings' && auth.user?.type === 'superadmin') {
      return false;
    }
    // If no permission is required or user has the permission
    if (!item.permission || (auth.permissions && auth.permissions.includes(item.permission))) {
      return true;
    }
    // For company users, show different settings based on SaaS mode
    if (auth.user && auth.user.type === 'company') {
      // In non-SaaS mode, allow additional settings
      const allowedPermissions = ['manage-system-settings', 'manage-email-settings', 'manage-currency-settings', 'manage-brand-settings', 'manage-webhook-settings', 'manage-working-days-settings', 'manage-biomatric-attedance-settings', 'manage-ip-restriction-settings', 'settings'];
      if (!isSaas) {
        allowedPermissions.push('manage-storage-settings', 'manage-recaptcha-settings', 'manage-chatgpt-settings', 'manage-cookie-settings', 'manage-seo-settings', 'manage-cache-settings', 'manage-working-days-settings', 'manage-biomatric-attedance-settings', 'manage-ip-restriction-settings');
      }
      return allowedPermissions.includes(item.permission);
    }
    return false;
  });

  // Refs for each section
  const systemSettingsRef = useRef<HTMLDivElement>(null);
  const brandSettingsRef = useRef<HTMLDivElement>(null);

  const currencySettingsRef = useRef<HTMLDivElement>(null);
  const workingDaysSettingsRef = useRef<HTMLDivElement>(null);
  const emailSettingsRef = useRef<HTMLDivElement>(null);
  const paymentSettingsRef = useRef<HTMLDivElement>(null);
  const storageSettingsRef = useRef<HTMLDivElement>(null);
  const recaptchaSettingsRef = useRef<HTMLDivElement>(null);
  const chatgptSettingsRef = useRef<HTMLDivElement>(null);
  const cookieSettingsRef = useRef<HTMLDivElement>(null);
  const seoSettingsRef = useRef<HTMLDivElement>(null);
  const cacheSettingsRef = useRef<HTMLDivElement>(null);
  const webhookSettingsRef = useRef<HTMLDivElement>(null);
  const googleCalendarSettingsRef = useRef<HTMLDivElement>(null);
  const googleWalletSettingsRef = useRef<HTMLDivElement>(null);
  const zektoSettingsRef = useRef<HTMLDivElement>(null);
  const ipRestrictionSettingsRef = useRef<HTMLDivElement>(null);


  // Smart scroll functionality
  const isManualScroll = useRef(false);

  const handleNavClick = (href: string) => {
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      isManualScroll.current = true;
      setActiveSection(id);
      element.scrollIntoView({ behavior: 'smooth' });
      
      // Re-enable scroll detection after the smooth scroll finishes
      setTimeout(() => {
        isManualScroll.current = false;
      }, 1000);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isManualScroll.current) return;
      
      // Dynamic detection: Loop through all nav items and find the active one
      const ids = sidebarNavItems.map(item => item.href.replace('#', ''));
      let current = ids[0];
      
      for (const id of ids) {
        const element = document.getElementById(id);
        if (element) {
          // If the section's top is near the top of the viewport (with 150px buffer)
          if (window.scrollY + 150 >= element.offsetTop) {
            current = id;
          }
        }
      }
      
      setActiveSection(current);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Initial check for hash in URL
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(hash);
      }
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle navigation click

  return (
    <PageTemplate
      title={'Settings'}
      url="/settings"
      breadcrumbs={[
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Settings' }
      ]}
    >
      <div className={`flex flex-col md:flex-row gap-8`} dir={position === 'right' ? 'rtl' : 'ltr'}>
        {/* <div className={`flex flex-col md:flex-row gap-8 ${position === 'rtl' ? 'md:flex-row-reverse' : ''}`}> */}
        {/* Sidebar Navigation */}
        <div className="md:w-64 flex-shrink-0">
          <div className="sticky top-20">
            <ScrollArea className="h-[calc(100vh-5rem)]">
                <div className={`space-y-1 ${position === 'rtl' ? 'pl-4' : 'pr-4'}`}>
                  {sidebarNavItems.map((item) => {
                    const itemId = item.href.replace('#', '');
                    const isActive = activeSection === itemId;
                    
                    return (
                      <Button
                        key={item.href}
                        variant="ghost"
                        onClick={() => handleNavClick(item.href)}
                        className={cn(
                          'w-full justify-start h-10 mb-1 px-3 relative group transition-all duration-200 rounded-lg',
                          isActive 
                            ? 'text-primary font-bold bg-primary/10 border border-primary/30 shadow-sm' 
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
                        )}
                      >
                        {React.cloneElement(item.icon as React.ReactElement, {
                          className: cn(
                            "h-4 w-4 mr-3 transition-colors duration-200",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )
                        })}
                        <span className="truncate">
                          {item.title}
                        </span>
                      </Button>
                    );
                  })}
                </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* System Settings Section */}
          {(auth.permissions?.includes('manage-system-settings') || auth.user?.type === 'superadmin' || auth.user?.type === 'company') && (
            <section id="system-settings" ref={systemSettingsRef} className="mb-8">
              <SystemSettings
                settings={systemSettings}
                timezones={timezones}
                dateFormats={dateFormats}
                timeFormats={timeFormats}
                isCompanyUser={auth.user?.type === 'company'}
              />
            </section>
          )}

          {/* Brand Settings Section */}
          {(auth.permissions?.includes('manage-brand-settings') || auth.user?.type === 'superadmin') && (
            <section id="brand-settings" ref={brandSettingsRef} className="mb-8">
              <BrandSettings settings={systemSettings} />
            </section>
          )}



          {/* Currency Settings Section */}
          {(auth.permissions?.includes('manage-currency-settings') || auth.user?.type === 'superadmin' || auth.user?.type === 'company') && (
            <section id="currency-settings" ref={currencySettingsRef} className="mb-8">
              <CurrencySettings />
            </section>
          )}

          {/* Email Settings Section */}
          {(auth.permissions?.includes('manage-email-settings') || auth.user?.type === 'superadmin') && (
            <section id="email-settings" ref={emailSettingsRef} className="mb-8">
              <EmailSettings />
            </section>
          )}

          {/* Working Days Settings Section */}
          {auth.user?.type !== 'superadmin' && (auth.permissions?.includes('manage-working-days-settings') || auth.user?.type === 'company') && (
            <section id="working-days-settings" ref={workingDaysSettingsRef} className="mb-8">
              <WorkingDaysSettings settings={systemSettings} />
            </section>
          )}

          {/* IP Restriction Settings Section */}
          {auth.user?.type === 'company' && (auth.permissions?.includes('manage-ip-restriction-settings')) && (
            <section id="ip-restriction-settings" ref={ipRestrictionSettingsRef} className="mb-8">
              <IpRestrictionSettings />
            </section>
          )}

          {/* Zekto Settings Section */}
          {auth.user?.type === 'company' && (auth.permissions?.includes('manage-biomatric-attedance-settings')) && (
            <section id="zekto-settings" ref={zektoSettingsRef} className="mb-8">
              <ZektoSettings settings={zektoSettings} />
            </section>
          )}

          {/* Payment Settings Section */}
          {(auth.permissions?.includes('manage-payment-settings') || auth.user?.type === 'superadmin') && (
            <section id="payment-settings" ref={paymentSettingsRef} className="mb-8">
              <PaymentSettings settings={paymentSettings} />
            </section>
          )}

          {/* Storage Settings Section */}
          {(auth.permissions?.includes('manage-settings') && (auth.user?.type === 'superadmin' || (auth.user?.type === 'company' && !isSaas))) && (
            <section id="storage-settings" ref={storageSettingsRef} className="mb-8">
              <StorageSettings settings={systemSettings} />
            </section>
          )}

          {/* ReCaptcha Settings Section */}
          {(auth.permissions?.includes('manage-recaptcha-settings') || auth.user?.type === 'superadmin' || (auth.user?.type === 'company' && !isSaas)) && (
            <section id="recaptcha-settings" ref={recaptchaSettingsRef} className="mb-8">
              <RecaptchaSettings settings={systemSettings} />
            </section>
          )}

          {/* Chat GPT Settings Section */}
          {(auth.permissions?.includes('manage-chatgpt-settings') || auth.user?.type === 'superadmin' || (auth.user?.type === 'company' && !isSaas)) && (
            <section id="chatgpt-settings" ref={chatgptSettingsRef} className="mb-8">
              <ChatGptSettings settings={systemSettings} />
            </section>
          )}

          {/* Cookie Settings Section */}
          {(auth.permissions?.includes('manage-cookie-settings') || auth.user?.type === 'superadmin' || (auth.user?.type === 'company' && !isSaas)) && (
            <section id="cookie-settings" ref={cookieSettingsRef} className="mb-8">
              <CookieSettings settings={systemSettings} />
            </section>
          )}

          {/* SEO Settings Section */}
          {(auth.permissions?.includes('manage-seo-settings') || auth.user?.type === 'superadmin' || (auth.user?.type === 'company' && !isSaas)) && (
            <section id="seo-settings" ref={seoSettingsRef} className="mb-8">
              <SeoSettings settings={systemSettings} />
            </section>
          )}

          {/* Cache Settings Section */}
          {(auth.permissions?.includes('manage-cache-settings') || auth.user?.type === 'superadmin' || (auth.user?.type === 'company' && !isSaas)) && (
            <section id="cache-settings" ref={cacheSettingsRef} className="mb-8">
              <CacheSettings cacheSize={cacheSize} />
            </section>
          )}

          {/* Google Calendar Settings Section */}
          {/* {(auth.permissions?.includes('settings') || auth.user?.type === 'company') && (
            <section id="google-calendar-settings" ref={googleCalendarSettingsRef} className="mb-8">
              <GoogleCalendarSettings settings={systemSettings} />
            </section>
          )} */}

          {/* Webhook Settings Section */}
          {/* {(auth.permissions?.includes('manage-webhook-settings') && auth.user?.type !== 'superadmin') && (
            <section id="webhook-settings" ref={webhookSettingsRef} className="mb-8">
              <WebhookSettings webhooks={webhooks} />
            </section>
          )} */}

        </div>
      </div>
      <Toaster />
    </PageTemplate>
  );
}