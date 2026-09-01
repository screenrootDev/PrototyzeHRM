import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { Save, User, Lock } from 'lucide-react';

// Profile components
import { useForm, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
// import DeleteUser from '@/components/delete-user';

import { Camera } from 'lucide-react';


const sidebarNavItems: NavItem[] = [
  {
    title: 'Profile',
    href: '#profile',
    icon: <User className="h-4 w-4 mr-2" />,
  },
  {
    title: 'Password',
    href: '#password',
    icon: <Lock className="h-4 w-4 mr-2" />,
  }
];

export default function ProfileSettings({ mustVerifyEmail, status }: { mustVerifyEmail?: boolean; status?: string }) {
  
  const { auth } = usePage<SharedData>().props;
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  
  // Refs for each section
  const profileRef = useRef<HTMLDivElement>(null);
  const passwordRef = useRef<HTMLDivElement>(null);
  
  // Password form refs
  const passwordInput = useRef<HTMLInputElement>(null);
  const currentPasswordInput = useRef<HTMLInputElement>(null);

  // Profile form
  const { data: profileData, setData: setProfileData, post: profilePost, errors: profileErrors, processing: profileProcessing, recentlySuccessful: profileRecentlySuccessful } = useForm({
    name: auth?.user?.name || '',
    email: auth?.user?.email || '',
    avatar: null as File | null,
    _method: 'PATCH',
  });

  // Password form
  const { data: passwordData, setData: setPasswordData, errors: passwordErrors, put: passwordPut, reset: passwordReset, processing: passwordProcessing, recentlySuccessful: passwordRecentlySuccessful } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let newPassword = '';
    for (let i = 0; i < 16; i++) {
      newPassword += chars[Math.floor(Math.random() * chars.length)];
    }
    setPasswordData((data) => ({ ...data, password: newPassword, password_confirmation: newPassword }));
    setShowPassword(true);
  };

  // Handle profile form submission
  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    profilePost(route('profile.update'), {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: () => {
        // Reset avatar file input after successful upload
        setProfileData('avatar', null);
        // Reload page to refresh user data
        window.location.reload();
      },
    });
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileData('avatar', file);
    }
  };

  // Get avatar URL
  const getAvatarUrl = () => {
    // Show preview of selected file
    if (profileData.avatar) {
      return URL.createObjectURL(profileData.avatar);
    }
    // Show uploaded avatar from database
    if (auth?.user?.avatar) {
      return window.storage(auth.user.avatar);
    }
    // Show default avatar
    return window.asset('images/avatar/avatar.png');
  };

  // Handle password form submission
  const updatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    passwordPut(route('password.update'), {
      preserveScroll: true,
      onSuccess: () => passwordReset(),
      onError: (errors) => {
        if (errors.password) {
          passwordReset('password', 'password_confirmation');
          passwordInput.current?.focus();
        }
        if (errors.current_password) {
          passwordReset('current_password');
          currentPasswordInput.current?.focus();
        }
      },
    });
  };

  // Smart scroll functionality
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Add offset for better UX
      
      // Get positions of each section
      const profilePosition = profileRef.current?.offsetTop || 0;
      const passwordPosition = passwordRef.current?.offsetTop || 0;
      
      // Determine active section based on scroll position
      if (scrollPosition >= passwordPosition) {
        setActiveSection('password');
      } else {
        setActiveSection('profile');
      }
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
  const handleNavClick = (href: string) => {
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <PageTemplate 
      title={"Profile Settings"} 
      url="/profile"
    >
      <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-zinc-950 md:p-6">
        <div className="hidden">
          {sidebarNavItems.map((item) => (
            <Button
              key={item.href}
              size="sm"
              variant="outline"
              className={cn('justify-start', {
                'bg-muted': activeSection === item.href.replace('#', ''),
              })}
              onClick={() => handleNavClick(item.href)}
            >
              {item.icon}
              {item.title}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Profile Section */}
          <section id="profile" ref={profileRef} className="h-full">
            <div className="h-full">
              <div className="h-full min-h-[540px] overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-zinc-950">
                <div className="border-b bg-zinc-50/70 px-6 py-5 dark:bg-zinc-900/40">
                  <h3 className="text-base font-semibold">{"Profile Information"}</h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Details about your personal information</p>
                </div>

                <form id="profile-form" onSubmit={submitProfile} className="space-y-6 p-6">
                  {/* Avatar Upload Section */}
                  <div>
                    <Label htmlFor="avatar">Avatar</Label>
                    <div className="mt-3 flex items-center gap-5">
                    <Avatar className="h-24 w-24 rounded-lg border-2 border-zinc-200 bg-zinc-50">
                      <AvatarImage 
                        src={getAvatarUrl()} 
                        alt={auth?.user?.name || 'Avatar'}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-lg text-lg">
                        {auth?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input value={profileData.avatar?.name || (auth?.user as any)?.avatar_original_name || (auth?.user?.avatar ? 'avatar.png' : '')} readOnly placeholder="Select avatar image..." className="min-w-0 flex-1" />
                      <Label htmlFor="avatar" className="inline-flex h-10 shrink-0 cursor-pointer items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
                        <Camera className="h-4 w-4 mr-2" />
                        Browse
                      </Label>
                      </div>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">Upload a profile picture. Recommended size: 200x200px</p>
                    </div>
                    </div>
                  </div>
                  <InputError className="mt-2" message={profileErrors.avatar} />

                  <div className="grid gap-2">
                    <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      className="mt-1 block w-full"
                      value={profileData.name}
                      onChange={(e) => setProfileData('name', e.target.value)}
                      required
                      autoComplete="name"
                      placeholder={"Full name"}
                    />
                    <InputError className="mt-2" message={profileErrors.name} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      className="mt-1 block w-full"
                      value={profileData.email}
                      onChange={(e) => setProfileData('email', e.target.value)}
                      required
                      autoComplete="username"
                      placeholder={"Email address"}
                    />
                    <InputError className="mt-2" message={profileErrors.email} />
                  </div>

                  {mustVerifyEmail && auth?.user?.email_verified_at === null && (
                    <div>
                      <p className="text-muted-foreground -mt-4 text-sm">
                        {"Your email address is unverified."}{' '}
                        <button
                          type="button"
                          onClick={() => route('verification.send')}
                          className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current dark:decoration-neutral-500"
                        >
                          {"Click here to resend the verification email."}
                        </button>
                      </p>

                      {status === 'verification-link-sent' && (
                        <div className="mt-2 text-sm font-medium text-green-600">
                          {"A new verification link has been sent to your email address."}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-4">
                    <Button disabled={profileProcessing}>{"Save Changes"}</Button>
                    <Transition
                      show={profileRecentlySuccessful}
                      enter="transition ease-in-out"
                      enterFrom="opacity-0"
                      leave="transition ease-in-out"
                      leaveTo="opacity-0"
                    >
                      <p className="text-sm text-neutral-600">{"Saved"}</p>
                    </Transition>
                  </div>
                </form>
              </div>

              {/* <DeleteUser /> */}
            </div>
          </section>

          {/* Password Section */}
          <section id="password" ref={passwordRef} className="h-full">
            <div className="h-full">
              <div className="h-full min-h-[540px] overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-zinc-950">
                <div className="border-b bg-zinc-50/70 px-6 py-5 dark:bg-zinc-900/40">
                  <h3 className="text-base font-semibold">Change Password</h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Details about your account password change</p>
                </div>

                <form id="password-form" onSubmit={updatePassword} className="space-y-6 p-6 pt-12">
                  <div className="grid gap-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      ref={currentPasswordInput}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData('current_password', e.target.value)}
                      type="password"
                      className="mt-1 block w-full"
                      autoComplete="current-password"
                      placeholder="Enter current password"
                    />
                    <InputError message={passwordErrors.current_password} />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">New Password</Label>
                      <Button type="button" variant="outline" size="sm" onClick={generatePassword} className="h-7 px-2 text-xs">
                        Generate Password
                      </Button>
                    </div>
                    <Input
                      id="password"
                      ref={passwordInput}
                      value={passwordData.password}
                      onChange={(e) => setPasswordData('password', e.target.value)}
                      type={showPassword ? "text" : "password"}
                      className="mt-1 block w-full"
                      autoComplete="new-password"
                      placeholder="Enter new password"
                    />
                    <InputError message={passwordErrors.password} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                    <Input
                      id="password_confirmation"
                      value={passwordData.password_confirmation}
                      onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                      type={showPassword ? "text" : "password"}
                      className="mt-1 block w-full"
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                    />
                    <InputError message={passwordErrors.password_confirmation} />
                  </div>

                  <div className="flex items-center justify-end gap-4">
                    <Button disabled={passwordProcessing}>{"Save Changes"}</Button>
                    <Transition
                      show={passwordRecentlySuccessful}
                      enter="transition ease-in-out"
                      enterFrom="opacity-0"
                      leave="transition ease-in-out"
                      leaveTo="opacity-0"
                    >
                      <p className="text-sm text-neutral-600">{"Saved"}</p>
                    </Transition>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageTemplate>
  );
}
