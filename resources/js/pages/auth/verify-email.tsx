import { useForm } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { FormEventHandler } from 'react';

import TextLink from '@/components/text-link';

import AuthLayout from '@/layouts/auth-layout';
import AuthButton from '@/components/auth/auth-button';
import { toast } from '@/components/custom-toast';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

export default function VerifyEmail({ status }: { status?: string }) {
    
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'), {
            onSuccess: () => {
                toast.success('A new verification link has been sent to your email address.');
            },
            onError: () => {
                toast.error('Failed to send verification email. Please try again.');
            }
        });
    };

    return (
        <AuthLayout
            title={"Verify your email"}
            description={"Please verify your email address by clicking on the link we just emailed to you."}
            icon={<Mail className="h-7 w-7" style={{ color: primaryColor }} />}
            status={status === 'verification-link-sent' ? 
                "A new verification link has been sent to the email address you provided during registration." : 
                undefined}
        >
            <form onSubmit={submit} className="space-y-5">
                <AuthButton 
                    processing={processing}
                >
                    {"Resend verification email"}
                </AuthButton>

                <div className="text-center">
                    <TextLink 
                        href={route('logout')} 
                        method="post" 
                        className="font-medium transition-colors duration-200"
                        style={{ color: primaryColor }}
                    >
                        {"Log out"}
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}