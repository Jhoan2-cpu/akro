import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="px-4 py-6">
            <div className="rounded-3xl border border-sidebar-border/70 bg-linear-to-br from-white via-emerald-50/35 to-slate-100/70 p-4 shadow-sm md:p-6">
                <Heading
                    title="Settings"
                    description="Manage your profile and account settings"
                />

                <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:gap-8">
                    <aside className="w-full max-w-xl lg:w-52">
                        <div className="rounded-2xl border border-sidebar-border/70 bg-white/95 p-2 shadow-sm">
                            <nav
                                className="flex flex-col space-y-1 space-x-0"
                                aria-label="Settings"
                            >
                                {sidebarNavItems.map((item, index) => (
                                    <Button
                                        key={`${toUrl(item.href)}-${index}`}
                                        size="sm"
                                        variant="ghost"
                                        asChild
                                        className={cn(
                                            'h-11 w-full justify-start rounded-lg px-3 font-medium',
                                            {
                                                'bg-emerald-100 text-emerald-900 hover:bg-emerald-100':
                                                    isCurrentOrParentUrl(
                                                        item.href,
                                                    ),
                                            },
                                        )}
                                    >
                                        <Link href={item.href}>
                                            {item.icon && (
                                                <item.icon className="h-4 w-4" />
                                            )}
                                            {item.title}
                                        </Link>
                                    </Button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    <Separator className="my-6 lg:hidden" />

                    <div className="flex-1 md:max-w-3xl">
                        <section className="max-w-2xl space-y-8">
                            {children}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
