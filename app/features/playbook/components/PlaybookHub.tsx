import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SplitText } from "@/components/motion/SplitText";
import { fraunces } from "@/core/fonts";
import { ADMIN_MODULES, COMMERCE_WORKFLOW, ICP_PROFILES, MOTION_MODES, REFERENCE_BRANDS, SEO_CHECKLIST } from "../constants";
import styles from "./Playbook.module.scss";

export function PlaybookHub(): React.JSX.Element {
    return (
        <div className={`${fraunces.variable} ${styles.shell}`}>
            <MotionProvider />
            <header className={styles.top}>
                <div className="container row row-between">
                    <p className={styles.logo}>Shielva <span>Storefronts</span></p>
                    <nav aria-label="Playbook sections">
                        <ul className={styles.topNav}>
                            <li><a href="#icps">ICPs</a></li>
                            <li><a href="#research">Research</a></li>
                            <li><a href="#engine">Motion engine</a></li>
                            <li><a href="#platform">Platform</a></li>
                        </ul>
                    </nav>
                </div>
            </header>

            <main id="main-content" tabIndex={-1}>
                <section className={`container ${styles.hero}`} aria-labelledby="pb-title">
                    <p className="eyebrow" data-reveal="fade">ICP-led commerce design</p>
                    <h1 id="pb-title" className={`display ${styles.title}`}>
                        <SplitText text="One commerce engine." />
                        <br />
                        <em><SplitText text="Three buyers, three page grammars." /></em>
                    </h1>
                    <p className={styles.lede} data-reveal="rise" style={{ "--i": 3 } as CSSProperties}>
                        A Gen-Z lipstick buyer, a time-poor salon client and a conscious menswear shopper don&apos;t read a page the same way —
                        so they shouldn&apos;t get the same page. Each storefront below is designed from its ICP&apos;s buying trigger backwards:
                        layout, conversion widget, motion and structured data.
                    </p>
                </section>

                <section id="icps" className={`container ${styles.icps}`} aria-label="ICP storefronts">
                    {ICP_PROFILES.map((icp, i) => (
                        <article key={icp.id} className={styles.icp} data-reveal="rise" style={{ "--i": i, "--swatch": `var(${icp.swatch})` } as CSSProperties}>
                            <Link href={icp.href} className={styles.icpHead}>
                                <span>
                                    <span className={styles.vertical}>{icp.vertical}</span>
                                    <span className={styles.brand}>{icp.brand}</span>
                                </span>
                                <span className={styles.open}>Open demo <ArrowUpRight size={14} aria-hidden="true" /></span>
                            </Link>
                            <dl className={styles.facts}>
                                <div><dt>Who</dt><dd>{icp.persona}</dd></div>
                                <div><dt>Buying trigger</dt><dd>{icp.trigger}</dd></div>
                                <div><dt>Page grammar</dt><dd>{icp.grammar}</dd></div>
                                <div>
                                    <dt>Conversion widgets</dt>
                                    <dd><ul className={styles.chips}>{icp.widgets.map((w) => <li key={w}>{w}</li>)}</ul></dd>
                                </div>
                                <div><dt>Scroll signature</dt><dd>{icp.motion}</dd></div>
                                <div><dt>Structured data</dt><dd className={styles.mono}>{icp.schema}</dd></div>
                            </dl>
                            <ul className={styles.roi} aria-label={`${icp.brand} ROI levers`}>
                                {icp.roi.map((r) => (
                                    <li key={r.metric}><strong>{r.metric}</strong><span>{r.lever}</span></li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </section>

                <section id="research" className={`section ${styles.band}`} aria-labelledby="research-title">
                    <div className="container stack">
                        <p className="eyebrow">Research</p>
                        <h2 id="research-title" className={`display ${styles.h2}`}>What category leaders do — and what we borrowed</h2>
                        <p className="text-muted">Patterns observed on the leaders&apos; public sites. Their Lighthouse scores were not measured; ours are measured on this build.</p>
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <caption className="visually-hidden">Reference brands, their conversion pattern and the metric it moves</caption>
                                <thead><tr><th scope="col">Vertical</th><th scope="col">Brand</th><th scope="col">Pattern</th><th scope="col">Moves</th></tr></thead>
                                <tbody>
                                    {REFERENCE_BRANDS.map((b) => (
                                        <tr key={b.brand}><td>{b.vertical}</td><th scope="row">{b.brand}</th><td>{b.pattern}</td><td>{b.lever}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section id="engine" className="section" aria-labelledby="engine-title">
                    <div className={`container ${styles.split}`}>
                        <div className="stack">
                            <p className="eyebrow">Motion engine</p>
                            <h2 id="engine-title" className={`display ${styles.h2}`}>Framer-grade motion, zero animation library.</h2>
                            <p className="text-muted">
                                One ~3 KB engine: a single rAF loop and two IntersectionObservers. Sections opt in with HTML attributes —
                        <code> data-reveal</code> for entrances, <code>data-scroll</code> for scroll-linked scenes — so server-rendered
                                sections animate without shipping per-section JavaScript. Progress is smoothed with a frame-rate-independent lerp, so
                                it feels inertial while native scrolling, find-in-page and screen readers keep working.
                            </p>
                        </div>
                        <ul className={styles.modes}>
                            {MOTION_MODES.map((m, i) => (
                                <li key={m.mode} data-reveal="left" style={{ "--i": i } as CSSProperties}>
                                    <code>{m.mode}</code>
                                    <strong>{m.who}</strong>
                                    <span>{m.what}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section id="platform" className={`section ${styles.band}`} aria-labelledby="platform-title">
                    <div className="container stack">
                        <p className="eyebrow">The platform behind the pages · live</p>
                        <h2 id="platform-title" className={`display ${styles.h2}`}>Admin + full commerce workflow, on Shopify Payments</h2>
                        <div className={styles.split}>
                            <ol className={styles.flow}>
                                {COMMERCE_WORKFLOW.map((w, i) => (
                                    <li key={w.step} data-reveal="rise" style={{ "--i": i } as CSSProperties}><strong>{w.step}</strong><span>{w.detail}</span></li>
                                ))}
                            </ol>
                            <ul className={styles.admin}>
                                {ADMIN_MODULES.map((m, i) => (
                                    <li key={m.name} data-reveal="rise" style={{ "--i": i } as CSSProperties}><strong>{m.name}</strong><span>{m.detail}</span></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="section" aria-labelledby="seo-title">
                    <div className="container stack">
                        <p className="eyebrow">SEO baseline (every storefront)</p>
                        <h2 id="seo-title" className={`display ${styles.h2}`}>Built to rank, not just to move.</h2>
                        <ul className={styles.checklist}>
                            {SEO_CHECKLIST.map((c, i) => <li key={c} data-reveal="fade" style={{ "--i": i } as CSSProperties}>{c}</li>)}
                        </ul>
                    </div>
                </section>
            </main>
            <footer className={styles.foot}><p className="container">© 2026 Shielva — storefront design playbook.</p></footer>
        </div>
    );
}
