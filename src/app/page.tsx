const navItems = [
  { label: "Products", href: "#products" },
  { label: "Tools", href: "#tools" },
  { label: "Services", href: "#services" },
  { label: "Concepts", href: "#concepts" },
  { label: "Contact", href: "#contact" }
];

const productModules = [
  {
    name: "You Know Ball",
    status: "Live web MVP",
    body: "A sports debate product that turns takes into defended arguments and shareable content. Debate only, not betting advice.",
    tone: "orange"
  },
  {
    name: "Creator AI Command Center",
    status: "Build",
    body: "A workflow dashboard concept for organizing content, planning, review loops, and creator operations.",
    tone: "cyan"
  },
  {
    name: "KOI Cave",
    status: "Local",
    body: "A local-first personal command system for tracking work, decisions, automation boundaries, and daily operating context.",
    tone: "gold"
  }
];

const concepts = [
  "Service websites for local operators",
  "Client intake and workflow dashboards",
  "Creator systems and content planning",
  "Small AI tools that solve one concrete problem"
];

const services = [
  {
    title: "MVP and prototype builds",
    body: "Turn a product idea into a working web experience that can be tested, shared, and improved."
  },
  {
    title: "Service business websites",
    body: "Clean pages for local businesses that need clear offers, proof, contact paths, and mobile-first structure."
  },
  {
    title: "Workflow systems",
    body: "Dashboards, internal tools, and structured operating systems for recurring messy work."
  }
];

export default function Home() {
  return (
    <main id="top">
      <nav className="site-nav" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Koinophobia Labs home">
          <span className="brand-mark">KL</span>
          <span>
            <strong>Koinophobia</strong>
            <em>Labs</em>
          </span>
        </a>
        <div className="nav-links">
          {navItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <a className="btn btn-gold nav-cta" href="#contact">
          Work With Me
        </a>
      </nav>

      <section className="hero section">
        <div className="hero-copy">
          <p className="kicker">Koinophobia Labs - AI product lab</p>
          <h1>I build systems, products, and useful software for messy work.</h1>
          <p className="hero-sub">
            Koinophobia Labs is a founder-led product and build studio for AI tools, creator
            systems, service websites, and practical workflow products. Built with an operator
            mindset and shipped with clear boundaries.
          </p>
          <div className="cta-row">
            <a className="btn btn-gold" href="#products">
              View Products
            </a>
            <a className="btn btn-cyan" href="#tools">
              Shipped Tools
            </a>
          </div>
        </div>

        <aside className="console panel" aria-label="Koinophobia Labs command deck">
          <header>
            <span />
            <span />
            <span />
            <strong>koi://command-deck</strong>
          </header>
          <div className="console-lines">
            <p>Product Lab loaded</p>
            <p>Services and concepts online</p>
            <p>Shipped tools ready</p>
            <p>Career Forge Lite linked</p>
          </div>
          <footer>Mode: build useful software</footer>
        </aside>
      </section>

      <section className="section" id="products">
        <div className="section-head">
          <p className="kicker">Product Lab</p>
          <h2>Products in active rotation.</h2>
          <p>
            A focused lab for practical products, creator systems, and small tools that move from
            idea to working software.
          </p>
        </div>

        <div className="card-grid">
          {productModules.map((product) => (
            <article className={`card card-${product.tone}`} key={product.name}>
              <span className="status">{product.status}</span>
              <h3>{product.name}</h3>
              <p>{product.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section band" id="tools">
        <div className="section-head">
          <p className="kicker">Shipped Tools</p>
          <h2>Useful tools with public links.</h2>
          <p>Small, focused products that are live, reviewable, and easy to try.</p>
        </div>

        <article className="tool-card panel">
          <div>
            <span className="status status-live">Live MVP</span>
            <h3>Career Forge Lite</h3>
            <p>
              ATS-focused resume and LinkedIn headline generator for early-career tech and
              business roles.
            </p>
          </div>
          <div className="tool-actions">
            <a className="btn btn-gold" href="https://career-forge-lite.vercel.app" target="_blank" rel="noopener">
              Live Demo
            </a>
            <a
              className="btn btn-ghost"
              href="https://github.com/koinophobia-labs/career-forge-lite"
              target="_blank"
              rel="noopener"
            >
              GitHub
            </a>
          </div>
        </article>
      </section>

      <section className="section" id="services">
        <div className="section-head">
          <p className="kicker">Services</p>
          <h2>Build help for practical web products.</h2>
          <p>
            Founder-led builds for people who need a clear web presence, prototype, or internal
            workflow system without overbuilding the first version.
          </p>
        </div>

        <div className="card-grid">
          {services.map((service) => (
            <article className="card" key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section split" id="concepts">
        <div className="section-head">
          <p className="kicker">Concepts</p>
          <h2>Client work and concept builds.</h2>
          <p>
            The lab explores clean, high-trust web experiences for local businesses, creators, and
            operators who need sharper workflows or clearer public pages.
          </p>
        </div>
        <ul className="concept-list">
          {concepts.map((concept) => (
            <li key={concept}>{concept}</li>
          ))}
        </ul>
      </section>

      <section className="section contact panel" id="contact">
        <p className="kicker">First Client / Beta Offer</p>
        <h2>Need a site, prototype, or tool that gets the first useful version live?</h2>
        <p>
          Send the current page, product idea, or workflow problem. I will tell you what I would
          improve first and whether a focused build makes sense.
        </p>
        <div className="cta-row">
          <a className="btn btn-gold" href="mailto:koinophobia999@gmail.com">
            Email Koinophobia Labs
          </a>
          <a className="btn btn-ghost" href="#tools">
            View shipped tools
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <span>© 2026 Koinophobia Labs</span>
        <span>Founder-led product lab for useful systems.</span>
      </footer>
    </main>
  );
}
