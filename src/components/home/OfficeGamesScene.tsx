"use client";

import { motion } from "framer-motion";

/** Full-bleed decorative props — office desk + mini-games atmosphere */
export function OfficeGamesScene() {
  return (
    <div className="home-floor pointer-events-none" aria-hidden>
      <div className="home-floor__wash" />
      <div className="home-floor__blinds" />
      <div className="home-floor__desk" />

      <motion.div
        className="home-prop home-prop--window is-float-slow"
        style={{ right: "4%", top: "14%" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="pane">
          <div className="pane__skyline" />
          <div className="pane__desk">
            <span className="pane__mug" />
            <span className="pane__laptop" />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="home-prop home-prop--monitor is-float"
        style={{ right: "18%", top: "22%" }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="screen relative">
          <div className="screen__live">
            <span className="screen__dot" />
            LIVE
          </div>
          <p className="screen__title">Leaderboard</p>
          <ul className="screen__board">
            <li>
              <span className="rank">1</span>
              <span className="name">Sangeetha</span>
              <span className="bar" style={{ width: "92%" }} />
              <span className="pts">980</span>
            </li>
            <li>
              <span className="rank">2</span>
              <span className="name">Jordan</span>
              <span className="bar" style={{ width: "78%" }} />
              <span className="pts">840</span>
            </li>
            <li>
              <span className="rank">3</span>
              <span className="name">Sam</span>
              <span className="bar" style={{ width: "61%" }} />
              <span className="pts">710</span>
            </li>
          </ul>
        </div>
      </motion.div>

      <motion.div
        className="home-prop home-prop--keys is-float-slow"
        style={{ right: "8%", top: "48%" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} />
        ))}
      </motion.div>

      <motion.div
        className="home-prop home-prop--note is-float"
        style={{ right: "26%", top: "58%" }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
      >
        +1000
      </motion.div>

      <motion.div
        className="home-prop home-prop--cards is-float"
        style={{
          right: "14%",
          bottom: "12%",
          border: "none",
          background: "transparent",
          backdropFilter: "none",
          boxShadow: "none",
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <i />
        <i />
        <i />
      </motion.div>

      <motion.div
        className="home-prop home-prop--target is-float-slow"
        style={{
          left: "4%",
          bottom: "14%",
          border: "none",
          background: "transparent",
          boxShadow: "none",
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
