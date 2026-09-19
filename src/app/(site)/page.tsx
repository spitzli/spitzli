import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { ProjectGrid } from "@/components/ProjectGrid";
import { SystemMap } from "@/components/SystemMap";
import { languageAlternates } from "@/i18n/locale";
import { getI18n } from "@/i18n/server";
import { getProjects } from "@/lib/projects";
import { contactEnabled, site } from "@/lib/site";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return { alternates: languageAlternates("/", locale) };
}

const services = [
  [
    "Websites & frontends",
    "Company websites, portfolios and custom frontends. Fast, accessible and focused on content — with CMS, SEO and performance in mind.",
  ],
  [
    "Web apps & internal tools",
    "Dashboards, admin panels, customer portals and SaaS applications. Software that fits your workflow, not the other way around.",
  ],
  [
    "Backends & APIs",
    "API design, data models, authentication and permissions. Interfaces other developers can understand and use.",
  ],
  [
    "Cloud & infrastructure",
    "Broad Google Cloud knowledge, from architecture to deployment and operation. Cloud Run, Firebase, Docker, Kubernetes and self-hosting where they fit.",
  ],
  [
    "Automation & integrations",
    "Connect systems, move data and automate recurring work with APIs and the right tools.",
  ],
  [
    "Maintenance & development",
    "Understand existing projects, take them over and modernise them deliberately. Improve the right things instead of rebuilding everything.",
  ],
];
const stack = [
  ["Applications", "TypeScript / JavaScript", "React / Next.js", "Svelte / SvelteKit"],
  ["Backend & data", "Bun / Node.js / Rust", "PostgreSQL / Firebase", "REST APIs / Auth"],
  [
    "Infrastructure",
    "Google Cloud / Cloud Run",
    "Docker / Kubernetes / K3s",
    "Linux / CI/CD / Vercel",
  ],
  ["Also on my workbench", "Developer Experience", "IoT / AI", "API platforms / Self-hosting"],
];

export default async function Home() {
  const { locale, t } = await getI18n();
  const projects = await getProjects(locale);
  return (
    <main id="main">
      <section className="hero container" aria-labelledby="intro-title">
        <div className="hero-intro">
          <p className="personal-line">
            Dominik Spitzli · {t("Software developer & system architect")}
          </p>
          <h1 id="intro-title">
            {t("Software.")}
            <br />
            <span>{t("Connected.")}</span>
          </h1>
          <p className="lede">
            {t(
              "I build web applications, APIs and the infrastructure behind them. From the first interface to the system in operation.",
            )}
          </p>
          <p className="hero-personal">
            {t("You work directly with me — the developer who actually builds your project.")}
          </p>
          <div className="hero-actions">
            <a className="button" href="#kontakt">
              {t("Discuss a project")} <span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="#projekte">
              {t("Explore my work")} <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <SystemMap />
      </section>

      <section className="cloud-section container" id="google-cloud" aria-labelledby="cloud-title">
        <div className="cloud-heading">
          <p className="cloud-wordmark">Google Cloud</p>
          <h2 id="cloud-title">
            {t("Not just a service.")}
            <br />
            {t("The whole system.")}
          </h2>
        </div>
        <div className="cloud-copy">
          <p className="lede">
            {t(
              "Google Cloud is a focus of my work. I bring broad knowledge of the platform, beyond individual products.",
            )}
          </p>
          <p>
            {t(
              "Architecture, applications, identities, data and deployment belong together. I connect these pieces — with Cloud Run and Firebase, and with an eye on permissions, maintainability and day-to-day operation.",
            )}
          </p>
          <ul className="cloud-topics">
            <li>{t("Architecture")}</li>
            <li>Cloud Run</li>
            <li>Firebase</li>
            <li>{t("Permissions")}</li>
            <li>{t("Deployment & operation")}</li>
          </ul>
        </div>
      </section>

      <section className="work-section container" id="projekte" aria-labelledby="work-title">
        <div className="section-heading">
          <h2 id="work-title">{t("Work, not promises.")}</h2>
          <p>
            {t(
              "A selection of websites, platform work and developer tools. The projects differ. Thinking beyond a single component is the common thread.",
            )}
          </p>
        </div>
        <ProjectGrid projects={projects} />
      </section>

      <section className="services-section" id="leistungen" aria-labelledby="services-title">
        <div className="container">
          <div className="section-heading">
            <h2 id="services-title">{t("Where I can help.")}</h2>
            <p>
              {t(
                "Bring a concrete task or an idea that still needs structure. I think about the interface, the backend and the operation together.",
              )}
            </p>
          </div>
          <div className="services-list">
            {services.map(([title, description]) => (
              <article key={title}>
                <h3>{t(title)}</h3>
                <p>{t(description)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section container" id="ueber-mich" aria-labelledby="about-title">
        <div className="about-copy">
          <h2 id="about-title">
            {t("Hi, I’m Dominik.")}
            <br />
            {t("I build this myself.")}
          </h2>
          <p className="lede">
            {t(
              "Spitzli Development is my sole proprietorship. I’m an independent software developer and system architect — not an agency team.",
            )}
          </p>
          <p>
            {t(
              "I work on web applications, APIs, internal tools and cloud infrastructure. What interests me is how everything connects: what the interface needs, where the data lives and how the software runs reliably.",
            )}
          </p>
          <p>
            {t(
              "My experience includes website projects, backend and platform work for Luninora, and developer experience around turboSMTP. Google Cloud, understandable APIs and maintainable systems are particular interests.",
            )}
          </p>
          <a className="text-link" href={site.github} target="_blank" rel="noopener noreferrer">
            {t("My GitHub profile")} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="stack">
          <h3>{t("Tools I work with")}</h3>
          {stack.map(([title, ...items]) => (
            <div className="stack-group" key={title}>
              <h4>{t(title)}</h4>
              <ul>
                {items.map((item) => (
                  <li key={item}>{t(item)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="contact-section container" id="kontakt" aria-labelledby="contact-title">
        <div className="contact-copy">
          <h2 id="contact-title">{t("What are you planning?")}</h2>
          <p>
            {t(
              "A new application, an API that needs attention, or a website that should do more? Tell me what you have in mind. A few sentences are enough to start.",
            )}
          </p>
          <a className="email-link" href={`mailto:${site.email}`}>
            {site.email} <span aria-hidden="true">↗</span>
          </a>
          <p className="contact-note">{t("Your message goes straight to me.")}</p>
        </div>
        <ContactForm enabled={contactEnabled()} email={site.email} />
      </section>
    </main>
  );
}
