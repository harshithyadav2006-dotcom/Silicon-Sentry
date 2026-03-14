import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Home({ currentUser, copy }) {
  const landmarks = [
    {
      name: "Vidhana Soudha",
      image:
        "https://commons.wikimedia.org/wiki/Special:FilePath/Vidhana%20Soudha%20in%20Bengaluru%205.jpg",
    },
    {
      name: "Bengaluru Palace",
      image:
        "https://commons.wikimedia.org/wiki/Special:FilePath/Bangalore%20Palace%20%2810158966324%29.jpg",
    },
    {
      name: "Lalbagh Botanical Garden",
      image:
        "https://commons.wikimedia.org/wiki/Special:FilePath/Glass%20House%20%2CLalbagh%20Bangalore.jpg",
    },
    {
      name: "Cubbon Park",
      image:
        "https://commons.wikimedia.org/wiki/Special:FilePath/Cubbon%20park-1-bangalore-India.jpg",
    },
    {
      name: "MG Road",
      image:
        "https://commons.wikimedia.org/wiki/Special:FilePath/MG%20Road%2C%20Bangalore%20%282025%29.jpg",
    },
    {
      name: "Tipu Sultan's Summer Palace",
      image:
        "https://commons.wikimedia.org/wiki/Special:Redirect/file/Tipu_Sultans_summer_palace_bangalore_frontview.jpg",
    },
    {
      name: "ISKCON Temple Bangalore",
      image:
        "https://commons.wikimedia.org/wiki/Special:FilePath/ISKCON%20Temple%20Bangalore.jpg",
    },
    {
      name: "Bengaluru Fort",
      image:
        "https://commons.wikimedia.org/wiki/Special:FilePath/Bengaluru%20Fort.jpg",
    },
    {
      name: "Visvesvaraya Museum",
      image:
        "https://commons.wikimedia.org/wiki/Special:FilePath/Visvesvaraya%20Industrial%20and%20Technological%20Museum%20Bangalore.jpg",
    },
    {
      name: "Ulsoor Lake",
      image:
        "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ulsoor%20Lake%20%2C%20Bangalore%2002.jpg",
    },
    {
      name: "Bull Temple",
      image:
        "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bull%20temple%20Bull%20at%20Bangalore.jpg",
    },
    {
      name: "Chinnaswamy Stadium",
      image:
        "https://commons.wikimedia.org/wiki/Special:Redirect/file/Chinnaswamy%20Stadium.jpg",
    },
    {
      name: "Church Street",
      image:
        "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bangalore%20Church%20street%20trees%201.jpg",
    },
    {
      name: "Nandi Hills",
      image:
        "https://commons.wikimedia.org/wiki/Special:FilePath/Nandi%20Hills%20view.jpg",
    },
  ];
  const valuePillars = [
    "Automated issue categorization",
    "City-wide heat map detection",
    "Resolution workflow tracking",
    "Multilingual citizen access",
  ];
  const [activeLandmark, setActiveLandmark] = useState(0);
  const [mapStage, setMapStage] = useState(0);
  const mapViews = [
    {
      name: "Karnataka overview",
      src: "https://www.openstreetmap.org/export/embed.html?bbox=74.0%2C11.5%2C78.6%2C18.5&layer=mapnik&marker=15.3173%2C75.7139",
    },
    {
      name: "Bengaluru focus",
      src: "https://www.openstreetmap.org/export/embed.html?bbox=77.45%2C12.84%2C77.75%2C13.12&layer=mapnik&marker=12.9716%2C77.5946",
    },
  ];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveLandmark((current) => (current + 1) % landmarks.length);
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, [landmarks.length]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMapStage((current) => (current + 1) % mapViews.length);
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, [mapViews.length]);

  return (
    <div className="home-stack redesigned-home">
      <section className="home-hero-shell">
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />
        <div className="hero-card redesigned-hero">
          <div className="hero-copy-stack">
            <div className="hero-badge-row">
              <span className="hero-badge">AI Civic Intelligence</span>
              <span className="hero-badge hero-badge-outline">Bengaluru Public Issue Platform</span>
            </div>
            <p className="eyebrow">{copy.home.eyebrow}</p>
            <h2>{copy.home.title}</h2>
            <p className="hero-copy">{copy.home.description}</p>

            <div className="hero-actions">
              <Link className="primary-btn" to={currentUser ? "/submit" : "/login"}>
                {copy.home.primaryAction}
              </Link>
              <Link className="secondary-btn" to={currentUser ? "/admin" : "/login"}>
                {copy.home.secondaryAction}
              </Link>
            </div>

            <div className="value-pillars">
              {valuePillars.map((pillar) => (
                <span key={pillar} className="value-pillar">
                  {pillar}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="hero-metric-grid">
        {copy.home.metrics.map((metric) => (
          <article key={metric.title} className="metric-tile metric-showcase">
            <strong>{metric.title}</strong>
            <span>{metric.body}</span>
          </article>
        ))}
      </section>

      <section className="showcase-grid">
        <article className="panel showcase-panel">
          <div className="section-heading">
            <p className="eyebrow">{copy.home.mapEyebrow}</p>
            <h2>Live spatial visibility</h2>
            <p className="section-copy">
              Explore mapped public issues across Bengaluru and demonstrate how the platform reveals operational hotspots in real time.
            </p>
          </div>
          <div className="showcase-map-card">
            <div className="map-stage-pill">{mapViews[mapStage].name}</div>
            <iframe
              key={mapViews[mapStage].name}
              title="SiliconSentry map"
              src={mapViews[mapStage].src}
            />
          </div>
        </article>

        <article className="panel showcase-panel visual-side-panel">
          <div className="landmark-slider">
            <div className="landmark-meta">
              <span className="landmark-counter">
                {String(activeLandmark + 1).padStart(2, "0")} / {String(landmarks.length).padStart(2, "0")}
              </span>
            </div>
            {landmarks.map((landmark, index) => (
              <div
                key={landmark.name}
                className={
                  index === activeLandmark ? "landmark-slide active" : "landmark-slide"
                }
              >
                <img src={landmark.image} alt={landmark.name} />
                <div className="landmark-overlay">
                  <span>{landmark.name}</span>
                </div>
              </div>
            ))}
            <div className="landmark-controls">
              <div className="landmark-progress-track">
                <span
                  className="landmark-progress-bar"
                  style={{
                    width: `${((activeLandmark + 1) / landmarks.length) * 100}%`,
                  }}
                />
              </div>
              <div className="landmark-dots">
                {landmarks.map((landmark, index) => (
                  <button
                    key={landmark.name}
                    type="button"
                    className={index === activeLandmark ? "landmark-dot active" : "landmark-dot"}
                    onClick={() => setActiveLandmark(index)}
                    aria-label={`Show ${landmark.name}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="problem-grid redesigned-problem-grid">
        <article className="panel statement-card highlighted-panel">
          <p className="eyebrow">{copy.home.problemEyebrow}</p>
          <h2 className="compact-title">{copy.home.problemTitle}</h2>
          <p className="section-copy">{copy.home.problemBodyOne}</p>
          <p className="section-copy">{copy.home.problemBodyTwo}</p>
        </article>

        <article className="panel statement-card highlighted-panel accent-panel">
          <p className="eyebrow">{copy.home.challengeEyebrow}</p>
          <h2 className="compact-title">{copy.home.challengeTitle}</h2>
          <p className="section-copy">{copy.home.challengeBody}</p>
        </article>
      </section>

      <section className="trust-grid redesigned-trust-grid">
        <article className="panel trust-spotlight">
          <p className="eyebrow">{copy.home.residentEyebrow}</p>
          <h2 className="compact-title">{copy.home.residentTitle}</h2>
          <p className="section-copy">{copy.home.residentBody}</p>
        </article>
        <article className="panel trust-spotlight">
          <p className="eyebrow">{copy.home.adminEyebrow}</p>
          <h2 className="compact-title">{copy.home.adminTitle}</h2>
          <p className="section-copy">{copy.home.adminBody}</p>
        </article>
      </section>
    </div>
  );
}

export default Home;
