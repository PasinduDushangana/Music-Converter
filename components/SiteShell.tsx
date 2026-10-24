"use client";
import { useEffect, useState } from "react";
import { AudioLines, Menu, Moon, Sun, X } from "lucide-react";
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [light, setLight] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    queueMicrotask(() =>
      setLight(localStorage.getItem("sonix-theme") === "light"),
    );
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = light ? "light" : "dark";
    localStorage.setItem("sonix-theme", light ? "light" : "dark");
  }, [light]);
  return (
    <>
      <header className="site-header">
        <nav className="nav section-wrap">
          <a href="#home" className="brand" onClick={() => setOpen(false)}>
            <span className="brand-mark">
              <AudioLines size={22} />
            </span>{" "}
            SONIX<span className="brand-period">.</span>
          </a>
          <div className={`nav-links ${open ? "open" : ""}`}>
            <a href="#home" onClick={() => setOpen(false)}>
              Home
            </a>
            <a href="#converter" onClick={() => setOpen(false)}>
              Converter
            </a>
            <a href="#features" onClick={() => setOpen(false)}>
              Features
            </a>
            <a href="#faq" onClick={() => setOpen(false)}>
              FAQ
            </a>
          </div>
          <div className="nav-actions">
            <button
              className="icon-button theme-button"
              type="button"
              onClick={() => setLight(!light)}
              aria-label={
                light ? "Switch to dark theme" : "Switch to light theme"
              }
            >
              {light ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <a className="nav-cta" href="#converter">
              Get Started <span>↗</span>
            </a>
            <button
              className="icon-button mobile-menu"
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </nav>
      </header>
      {children}
    </>
  );
}
