import Converter from "@/components/Converter";
import {
  ArrowDown,
  ArrowRight,
  AudioLines,
  Check,
  ChevronDown,
  Headphones,
  LockKeyhole,
  Music2,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";
import SiteShell from "@/components/SiteShell";
const features = [
  {
    icon: Zap,
    title: "Remarkably fast",
    text: "Your files convert right in your browser, with no upload queue or account to slow you down.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    text: "Local files stay on your device. We never store your audio or your conversion history on a server.",
  },
  {
    icon: AudioLines,
    title: "Sound your way",
    text: "Choose the bitrate that fits your needs, from compact 128 kbps to 320 kbps MP3.",
  },
];
const faqs = [
  {
    q: "Are my files uploaded to a server?",
    a: "Files you select from your device are processed locally in your browser. If you paste a direct media URL, our server briefly fetches it and passes it to your browser; it is not stored.",
  },
  {
    q: "Which files can I convert?",
    a: "MP3, WAV, M4A, AAC, FLAC, OGG, MP4 and WebM are accepted. Actual codec support depends on the FFmpeg browser build and the media inside the file.",
  },
  {
    q: "Does 320 kbps improve low-quality audio?",
    a: "No. A higher output bitrate can preserve more of the available detail, but it cannot restore quality already missing from the source.",
  },
  {
    q: "Can I convert a YouTube link?",
    a: "SONIX only accepts authorized direct media file URLs. YouTube page links cannot be extracted or converted here.",
  },
];
export default function Home() {
  return (
    <SiteShell>
      <main>
        <section id="home" className="hero section-wrap">
          <div className="hero-glow" />
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" /> AUDIO CONVERSION, REIMAGINED{" "}
              <Sparkles size={13} />
            </div>
            <h1>
              Your Audio.
              <br />
              Your Format.
              <br />
              <span>Your Freedom.</span>
            </h1>
            <p>
              Convert your audio and video files into high-quality MP3 in
              seconds. Fast, simple, and beautifully designed.
            </p>
            <div className="hero-actions">
              <a href="#converter" className="button-primary">
                Start Converting <ArrowRight size={18} />
              </a>
              <a href="#how-it-works" className="button-quiet">
                See how it works <ArrowDown size={17} />
              </a>
            </div>
            <div className="hero-proof">
              <div className="proof-icons">
                <span>
                  <Music2 size={16} />
                </span>
                <span>
                  <Headphones size={16} />
                </span>
                <span>
                  <AudioLines size={16} />
                </span>
              </div>
              <span>Beautiful sound, zero friction.</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="disc">
              <div className="disc-inner">
                <AudioLines size={58} strokeWidth={1.4} />
                <span>SONIX</span>
              </div>
            </div>
            <div className="float-tag float-tag-top">
              <span className="tag-icon">
                <WandSparkles size={17} />
              </span>
              <span>
                <b>High quality</b>
                <small>Crystal clear audio</small>
              </span>
            </div>
            <div className="float-tag float-tag-bottom">
              <span className="tag-icon green">
                <Check size={18} />
              </span>
              <span>
                <b>Conversion complete</b>
                <small>Ready to listen</small>
              </span>
            </div>
            <div className="wave-bars">
              {Array.from({ length: 42 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    height: `${12 + Math.round(Math.abs(Math.sin(i * 0.62) * Math.cos(i * 0.17)) * 80)}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </section>
        <div className="trust-strip">
          <div className="section-wrap trust-inner">
            <span>MADE FOR THE WAY YOU LISTEN</span>
            <span>
              <LockKeyhole size={16} /> Private & secure
            </span>
            <span>
              <Zap size={16} /> Browser-powered
            </span>
            <span>
              <Headphones size={16} /> Quality you control
            </span>
          </div>
        </div>
        <section id="converter" className="converter-section section-wrap">
          <div className="section-heading">
            <div className="eyebrow mini">THE CONVERTER</div>
            <h2>
              Make every sound <em>yours.</em>
            </h2>
            <p>Drop your files, pick your quality, and let the music flow.</p>
          </div>
          <Converter />
        </section>
        <section id="features" className="features-section section-wrap">
          <div className="section-heading">
            <div className="eyebrow mini">WHY SONIX</div>
            <h2>
              Everything you need.
              <br />
              <em>Nothing you don’t.</em>
            </h2>
            <p>Thoughtful tools for your audio, without the complications.</p>
          </div>
          <div className="feature-grid">
            {features.map(({ icon: Icon, title, text }, i) => (
              <article className="feature-card" key={title}>
                <div className={`feature-icon feature-${i}`}>
                  <Icon size={26} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="feature-index">0{i + 1} / 03</span>
              </article>
            ))}
          </div>
        </section>
        <section id="how-it-works" className="how-section section-wrap">
          <div className="how-panel">
            <div>
              <div className="eyebrow mini">SIMPLE BY DESIGN</div>
              <h2>
                From file to favorite
                <br />
                in <em>three steps.</em>
              </h2>
              <p>Great audio shouldn’t take a manual. Here’s how easy it is.</p>
            </div>
            <div className="steps">
              <div>
                <b>01</b>
                <span>
                  <strong>Add your file</strong>
                  <small>Drop your audio or video into the converter.</small>
                </span>
              </div>
              <div>
                <b>02</b>
                <span>
                  <strong>Choose your quality</strong>
                  <small>Select the MP3 bitrate that works for you.</small>
                </span>
              </div>
              <div>
                <b>03</b>
                <span>
                  <strong>Make it yours</strong>
                  <small>Convert, preview, and download in a click.</small>
                </span>
              </div>
            </div>
          </div>
        </section>
        <section id="faq" className="faq-section section-wrap">
          <div className="section-heading">
            <div className="eyebrow mini">GOOD TO KNOW</div>
            <h2>
              Questions? <em>Answered.</em>
            </h2>
          </div>
          <div className="faq-list">
            {faqs.map(({ q, a }) => (
              <details key={q}>
                <summary>
                  <span>{q}</span>
                  <ChevronDown size={20} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="bottom-cta section-wrap">
          <div className="cta-panel">
            <div className="eyebrow mini">READY WHEN YOU ARE</div>
            <h2>Good sound starts here.</h2>
            <p>Give your music the format it deserves.</p>
            <a className="button-primary" href="#converter">
              Start Converting <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>
      <footer className="footer section-wrap">
        <div className="brand">
          <span className="brand-mark">
            <AudioLines size={22} />
          </span>{" "}
          SONIX<span className="brand-period">.</span>
        </div>
        <span>Made for music. Built for freedom.</span>
        <span>© {new Date().getFullYear()} SONIX</span>
      </footer>
    </SiteShell>
  );
}
