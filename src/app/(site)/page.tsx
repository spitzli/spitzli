import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { ProjectGrid } from "@/components/ProjectGrid";
import { getProjects } from "@/lib/projects";
import { contactEnabled, site } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

const services = [
  [
    "Websites & Frontends",
    "Unternehmenswebsite, Portfolio oder individuelles Frontend: schnell, zugänglich und auf den Inhalt abgestimmt. Mit CMS, SEO und Performance im Blick.",
  ],
  [
    "Webapps & interne Tools",
    "Dashboards, Admin-Panels, Kundenportale und SaaS-Anwendungen. Software, die zu deinen Abläufen passt — statt umgekehrt.",
  ],
  [
    "Backends & APIs",
    "API-Design, Datenmodelle, Authentifizierung und Berechtigungen. Schnittstellen, die andere Entwickler verstehen und nutzen können.",
  ],
  [
    "Cloud & Infrastruktur",
    "Von Docker und Cloud Run bis Kubernetes und Self-Hosting. Mit Deployment-Pipelines, Monitoring und einem nachvollziehbaren Betrieb.",
  ],
  [
    "Automatisierung & Integrationen",
    "Systeme verbinden, Daten übertragen und wiederkehrende Arbeit automatisieren. Über APIs und passende Werkzeuge.",
  ],
  [
    "Wartung & Weiterentwicklung",
    "Bestehende Projekte verstehen, übernehmen und gezielt modernisieren. Nicht alles neu bauen, sondern das Richtige verbessern.",
  ],
];
const stack = [
  ["Anwendungen", "TypeScript / JavaScript", "React / Next.js", "Svelte / SvelteKit"],
  ["Backend & Daten", "Bun / Node.js / Rust", "PostgreSQL / Firebase", "REST APIs / Auth"],
  [
    "Infrastruktur",
    "Docker / Kubernetes / K3s",
    "Google Cloud / Cloud Run",
    "Linux / CI/CD / Vercel",
  ],
  [
    "Weitere Schwerpunkte",
    "Developer Experience",
    "IoT / AI-Integrationen",
    "API-Plattformen / Self-Hosting",
  ],
];

export default async function Home() {
  const projects = await getProjects();
  return (
    <main id="main">
      <section className="hero container" aria-labelledby="intro-title">
        <div className="hero-intro">
          <p className="personal-line">Dominik Spitzli · Softwareentwickler & Systemarchitekt</p>
          <h1 id="intro-title">
            Software.
            <br />
            Schnittstellen.
            <br />
            <span>Systeme.</span>
          </h1>
        </div>
        <div className="hero-copy">
          <p className="lede">
            Ich entwickle Webanwendungen, APIs und Infrastruktur für Unternehmen, die mehr als eine
            Standardlösung brauchen.
          </p>
          <p>
            Vom ersten Frontend bis zum laufenden System. Du sprichst direkt mit dem Entwickler, der
            dein Projekt umsetzt.
          </p>
          <div className="hero-actions">
            <a className="button" href="#kontakt">
              Projekt anfragen <span aria-hidden="true">↗</span>
            </a>
            <a className="text-link" href="#projekte">
              Arbeit ansehen <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        <nav className="section-nav" aria-label="Seitenabschnitte">
          <a href="#projekte">Projekte</a>
          <a href="#leistungen">Leistungen</a>
          <a href="#ueber-mich">Über mich</a>
          <span>Software Development · Web · APIs · Cloud</span>
        </nav>
      </section>

      <section className="work-section container" id="projekte" aria-labelledby="work-title">
        <div className="section-heading">
          <h2 id="work-title">Einblick in meine Arbeit.</h2>
          <p>
            Von der Unternehmenswebsite bis zur API-Plattform: eine Auswahl meiner Projekte und
            technischen Arbeit.
          </p>
        </div>
        <ProjectGrid projects={projects} />
      </section>

      <section className="services-section" id="leistungen" aria-labelledby="services-title">
        <div className="container">
          <div className="section-heading">
            <h2 id="services-title">Mehr als die Oberfläche.</h2>
            <p>
              Ich denke Frontend, Backend und Betrieb zusammen. Du kannst mit einer konkreten
              Aufgabe kommen oder mit einer Idee, die noch Struktur braucht.
            </p>
          </div>
          <div className="services-list">
            {services.map(([name, description]) => (
              <article key={name}>
                <h3>{name}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section container" id="ueber-mich" aria-labelledby="about-title">
        <div className="about-copy">
          <h2 id="about-title">
            Ich bin Dominik.
            <br />
            Ich baue das selbst.
          </h2>
          <p className="lede">
            Hinter Spitzli Development stehe ich — selbstständiger Softwareentwickler und
            Systemarchitekt.
          </p>
          <p>
            Ich arbeite an modernen Webanwendungen, APIs, internen Tools und Cloud-Infrastrukturen.
            Mich interessiert das ganze System: wie die Oberfläche mit dem Backend spricht, wo Daten
            liegen und wie Software zuverlässig in Betrieb geht.
          </p>
          <p>
            Erfahrung bringe ich aus Website-Projekten ebenso mit wie aus der API- und
            Plattformarbeit für Luninora und der Developer-Experience-Arbeit rund um turboSMTP.
            Meine Schwerpunkte sind wartbare Architektur, verständliche Schnittstellen und gute
            Werkzeuge für Entwickler.
          </p>
          <p>
            Spitzli Development ist mein Einzelunternehmen. Kein Wechsel zwischen Vertrieb und
            Umsetzung — du arbeitest direkt mit mir.
          </p>
          <a className="text-link" href={site.github} target="_blank" rel="noopener noreferrer">
            Mein GitHub-Profil <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="stack">
          <h3>Womit ich arbeite</h3>
          {stack.map(([title, ...items]) => (
            <div className="stack-group" key={title}>
              <h4>{title}</h4>
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="contact-section container" id="kontakt" aria-labelledby="contact-title">
        <div className="contact-copy">
          <h2 id="contact-title">Was hast du vor?</h2>
          <p>
            Eine neue Anwendung, eine API, die aufgeräumt werden muss, oder eine Website, die mehr
            können soll?
          </p>
          <p>Schreib mir, worum es geht. Ein paar Sätze reichen für den Anfang.</p>
          <a className="email-link" href={`mailto:${site.email}`}>
            {site.email} <span aria-hidden="true">↗</span>
          </a>
          <p className="contact-note">Deine Nachricht landet direkt bei mir.</p>
        </div>
        {contactEnabled() ? (
          <ContactForm />
        ) : (
          <div className="contact-direct">
            <p className="lede">Am besten direkt per E-Mail.</p>
            <p>
              Das Kontaktformular ist noch nicht freigeschaltet. Per E-Mail erreichst du mich schon
              jetzt.
            </p>
            <a className="button" href={`mailto:${site.email}`}>
              E-Mail schreiben <span aria-hidden="true">↗</span>
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
