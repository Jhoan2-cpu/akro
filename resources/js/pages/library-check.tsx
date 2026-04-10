import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { FaFlask, FaIcons, FaBolt, FaPlay } from 'react-icons/fa6';
import { dashboard } from '@/routes';

const cards = [
    {
        title: 'react-icons',
        description: 'Icon set rendered from the installed package.',
        icon: FaIcons,
    },
    {
        title: 'framer-motion',
        description: 'Animated entrance and floating cards.',
        icon: FaBolt,
    },
    {
        title: 'Inertia page',
        description: 'Integrated with the current Laravel + React stack.',
        icon: FaPlay,
    },
];

export default function LibraryCheck() {
    return (
        <>
            <Head title="Library Check" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6">
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0 }}
                    className="rounded-2xl border border-sidebar-border/70 bg-linear-to-br from-neutral-950 via-neutral-900 to-neutral-800 p-6 text-white shadow-lg dark:border-sidebar-border"
                >
                    <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
                            <FaFlask />
                        </span>
                        <div>
                            <p className="text-sm tracking-[0.3em] text-white/60 uppercase">
                                Playground
                            </p>
                            <h1 className="text-2xl font-semibold">
                                Package verification page
                            </h1>
                        </div>
                    </div>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75">
                        This page confirms that <strong>react-icons</strong> and
                        <strong> framer-motion</strong> are installed and
                        working inside the current Inertia + React setup.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3 text-sm">
                        <Link
                            href={dashboard()}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-medium text-neutral-950 transition hover:scale-[1.02]"
                        >
                            <FaPlay />
                            Back to dashboard
                        </Link>
                        <span className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-white/70">
                            Motion enabled
                        </span>
                    </div>
                </motion.section>

                <section className="grid gap-4 md:grid-cols-3">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <motion.article
                                key={card.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15, delay: 0 }}
                                whileHover={{ y: -4, scale: 1.01 }}
                                className="rounded-2xl border border-sidebar-border/70 bg-background p-5 shadow-sm dark:border-sidebar-border"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">
                                    <Icon />
                                </div>
                                <h2 className="text-lg font-semibold">
                                    {card.title}
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {card.description}
                                </p>
                            </motion.article>
                        );
                    })}
                </section>

                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15, delay: 0 }}
                    className="rounded-2xl border border-sidebar-border/70 bg-muted/40 p-6 dark:border-sidebar-border"
                >
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-foreground shadow-sm">
                            <FaIcons />
                            react-icons ready
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-foreground shadow-sm">
                            <FaBolt />
                            framer-motion ready
                        </span>
                    </div>
                </motion.section>
            </div>
        </>
    );
}

LibraryCheck.layout = {
    breadcrumbs: [
        {
            title: 'Library Check',
            href: '/library-check',
        },
    ],
};
