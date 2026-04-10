import { Form, Head, Link, useForm, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;
    const verificationForm = useForm({
        verification_email: (auth.user.verification_email as string | null | undefined) ?? auth.user.email,
    });

    const hasVerificationEmail = Boolean(verificationForm.data.verification_email);
    const isVerificationEmailVerified = Boolean(auth.user.verification_email_verified_at);

    const submitVerificationEmail = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        verificationForm.post('/settings/profile/verification-email', {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-8">
                <div className="rounded-2xl border border-sidebar-border/70 bg-white/95 p-4 shadow-sm md:p-6">
                    <Heading
                        variant="small"
                        title="Profile information"
                        description="Update your name and email address"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="mt-5 space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
                                            <p className="text-sm text-amber-900">
                                                Your email address is unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="font-semibold underline decoration-amber-500/60 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-amber-700"
                                                >
                                                    Click here to resend the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-700">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <div className="rounded-2xl border border-emerald-200/70 bg-white/95 p-4 shadow-sm md:p-5">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <Heading
                            variant="small"
                            title="Profile email verification"
                            description="Verify an email for profile notifications and recovery workflows"
                        />

                        <Badge variant={isVerificationEmailVerified ? 'default' : 'secondary'}>
                            {isVerificationEmailVerified ? 'Verified' : 'Pending verification'}
                        </Badge>
                    </div>

                    <form onSubmit={submitVerificationEmail} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="verification_email">Verification email</Label>
                            <Input
                                id="verification_email"
                                type="email"
                                name="verification_email"
                                className="mt-1 block w-full"
                                value={verificationForm.data.verification_email}
                                onChange={(event) => verificationForm.setData('verification_email', event.target.value)}
                                autoComplete="email"
                                placeholder="verification@example.com"
                                required
                            />
                            <InputError className="mt-2" message={verificationForm.errors.verification_email} />
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Puedes usar un correo diferente al de inicio de sesión, o el mismo si así lo prefieres.
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button type="submit" disabled={verificationForm.processing || !hasVerificationEmail}>
                                {isVerificationEmailVerified ? 'Re-verify email' : 'Send verification link'}
                            </Button>

                            {auth.user.verification_email && (
                                <span className="text-xs text-muted-foreground">
                                    Current: {String(auth.user.verification_email)}
                                </span>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
