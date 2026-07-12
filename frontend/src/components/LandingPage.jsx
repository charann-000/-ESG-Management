import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { ScoreCard } from "./ScoreCard";
import { loginUser } from "../api/api";
import { useStylesheet } from "../hooks/useStylesheet";
import useAuth from "../hooks/useAuth";

export const LandingPage = ({ scoreState, setScoreState, setUserRole, onViewChange }) => {
  useStylesheet(['/colors_and_type.css', '/root_index.css']);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginFeedback, setLoginFeedback] = useState("");
  const [activeRoleTab, setActiveRoleTab] = useState("Admin");

  // Navigation menu toggle
  const [menuOpen, setMenuOpen] = useState(false);

  // Gating checklist checkboxes
  const [checks, setChecks] = useState([false, false, false, false]);
  const [qrUnlocked, setQrUnlocked] = useState(false);
  const [gateFeedback, setGateFeedback] = useState("Complete every check — QR stays locked until policy is approved.");

  // Auditor complaint demo state
  const [complaintPolicy, setComplaintPolicy] = useState("");
  const [complaintDept, setComplaintDept] = useState("");
  const [complaintSummary, setComplaintSummary] = useState("");
  const [complaintProof, setComplaintProof] = useState("");
  const [complaintFeedback, setComplaintFeedback] = useState("");

  // Hackathon demo state
  const [demoName, setDemoName] = useState("");
  const [demoFeedback, setDemoFeedback] = useState("");

  const canvasRef = useRef(null);

  // Three.js Realistic Rotating Globe effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = canvas.parentElement.clientWidth || window.innerWidth;
    let height = canvas.parentElement.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.04, 2.6);

    const group = new THREE.Group();
    scene.add(group);

    scene.add(new THREE.AmbientLight(0xffffff, 1.25));
    scene.add(new THREE.HemisphereLight(0xf0fff6, 0xd0e8ff, 0.95));
    const sun = new THREE.DirectionalLight(0xffffff, 1.05);
    sun.position.set(3.2, 2.2, 4.2);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xc2f5d8, 1.05);
    fill.position.set(-3.8, 0.6, 2.4);
    scene.add(fill);
    const back = new THREE.DirectionalLight(0xe0fff2, 0.6);
    back.position.set(0.4, -1, -3);
    scene.add(back);

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";
    const TEX = {
      day: "https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-blue-marble.jpg",
      topo: "https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-topology.png",
      fallbackDay: "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
      fallbackClouds: "https://threejs.org/examples/textures/planets/earth_clouds_1024.png"
    };

    const loadTex = (url) => {
      return new Promise((resolve, reject) => {
        loader.load(url, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          resolve(tex);
        }, undefined, reject);
      });
    };

    let earth = null;
    let clouds = null;
    const SEG = 64;

    const glowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.14, SEG, SEG),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        uniforms: { glowColor: { value: new THREE.Color(0x8dffb8) } },
        vertexShader: `varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `uniform vec3 glowColor;
          varying vec3 vNormal;
          void main() {
            float i = pow(0.75 - dot(vNormal, vec3(0., 0., 1.)), 3.2);
            gl_FragColor = vec4(glowColor, 1.0) * i * 0.5;
          }`
      })
    );
    group.add(glowMesh);

    const buildEarth = (dayMap, bumpMap, cloudMap) => {
      earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, SEG, SEG),
        new THREE.MeshStandardMaterial({
          map: dayMap,
          bumpMap: bumpMap || null,
          bumpScale: bumpMap ? 0.016 : 0,
          roughness: 0.8,
          metalness: 0.02,
          emissive: new THREE.Color(0x1c4030),
          emissiveIntensity: 0.2,
          emissiveMap: dayMap
        })
      );
      group.add(earth);

      if (cloudMap) {
        clouds = new THREE.Mesh(
          new THREE.SphereGeometry(1.016, SEG, SEG),
          new THREE.MeshStandardMaterial({
            map: cloudMap,
            transparent: true,
            opacity: 0.26,
            depthWrite: false,
            roughness: 1,
            metalness: 0
          })
        );
        group.add(clouds);
      }
    };

    Promise.all([
      loadTex(TEX.day).catch(() => loadTex(TEX.fallbackDay)),
      loadTex(TEX.topo).catch(() => null),
      loadTex(TEX.fallbackClouds).catch(() => null)
    ]).then((maps) => {
      buildEarth(maps[0], maps[1], maps[2]);
    }).catch(() => {
      // green fallback
      earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, SEG, SEG),
        new THREE.MeshStandardMaterial({
          color: 0x07140f,
          emissive: 0x14965c,
          emissiveIntensity: 0.6,
          roughness: 0.2,
          metalness: 0.8,
          transparent: true,
          opacity: 0.85
        })
      );
      group.add(earth);

      const wireframe = new THREE.Mesh(
        new THREE.SphereGeometry(1.002, 24, 24),
        new THREE.MeshBasicMaterial({
          color: 0x14965c,
          wireframe: true,
          transparent: true,
          opacity: 0.35
        })
      );
      group.add(wireframe);
    });

    const layout = () => {
      const w = window.innerWidth;
      if (w >= 980) {
        group.position.set(1.05, 0.04, 0);
        camera.position.set(0.12, 0.03, 2.5);
      } else if (w >= 700) {
        group.position.set(0.55, -0.05, 0);
        camera.position.set(0.05, 0.02, 2.85);
      } else {
        group.position.set(0.2, -0.22, 0);
        camera.position.set(0, 0.02, 3.25);
      }
    };

    layout();

    let targetRX = 0.08, targetRY = 0.22, curRX = 0.08, curRY = 0.22;

    const handleMouseMove = (e) => {
      const wWidth = window.innerWidth;
      const wHeight = window.innerHeight;
      const nx = e.clientX / wWidth - 0.5;
      const ny = e.clientY / wHeight - 0.5;
      targetRY = 0.22 + nx * 0.35;
      targetRX = 0.08 + ny * 0.15;

      const card = document.getElementById("score-card");
      if (card && wWidth >= 980) {
        card.style.transform = `rotateY(${nx * -6}deg) rotateX(${ny * 5}deg)`;
      }
    };

    const handleMouseLeave = () => {
      targetRX = 0.08;
      targetRY = 0.22;
      const card = document.getElementById("score-card");
      if (card) card.style.transform = "";
    };

    const heroEl = document.getElementById("top");
    if (heroEl) {
      heroEl.addEventListener("mousemove", handleMouseMove);
      heroEl.addEventListener("mouseleave", handleMouseLeave);
    }

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        const w = canvas.parentElement.clientWidth || window.innerWidth;
        const h = canvas.parentElement.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(h, 1);
        camera.updateProjectionMatrix();
        layout();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (earth) earth.rotation.y += 0.0024;
      if (clouds) clouds.rotation.y += 0.003;
      curRX += (targetRX - curRX) * 0.05;
      curRY += (targetRY - curRY) * 0.05;
      group.rotation.x = curRX;
      group.rotation.y = curRY;
      camera.lookAt(group.position.x * 0.35, group.position.y, 0);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      if (heroEl) {
        heroEl.removeEventListener("mousemove", handleMouseMove);
        heroEl.removeEventListener("mouseleave", handleMouseLeave);
      }
      renderer.dispose();
    };
  }, []);

  // Derive role and route from email for fallback demo routing
  const getRoleRoute = (emailStr) => {
    const lower = emailStr.toLowerCase().trim();
    if (lower.includes("ceo")) return { role: "CEO", route: "ceo" };
    if (lower.includes("manager")) return { role: "Manager", route: "manager" };
    if (lower.includes("auditor")) return { role: "Auditor", route: "auditor" };
    if (lower.includes("employee")) return { role: "Employee", route: "roles" };
    if (lower.includes("admin")) return { role: "Admin", route: "admin" };
    return { role: "Admin", route: "admin" };
  };

  // Login handler — tries real backend first, falls back to demo routing
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginFeedback("Please fill in all fields.");
      return;
    }

    setLoginFeedback("Verifying credentials...");
    try {
      // Try real backend authentication
      const user = await login(email.trim(), password);
      setLoginFeedback(`Welcome back, ${user.name || 'User'}! Redirecting...`);
      setTimeout(() => {
        if (user.role === 'Admin') {
          navigate('/admin/dashboard');
        } else if (user.role === 'Department Manager') {
          navigate('/manager/dashboard');
        } else if (user.role === 'Auditor') {
          navigate('/auditor/dashboard');
        } else if (user.role === 'CEO') {
          navigate('/ceo/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
      }, 500);
    } catch (err) {
      console.warn("Backend login failed, using demo fallback:", err.message);
      // Backend auth failed — use demo fallback routing
      const { role, route } = getRoleRoute(email);

      setLoginFeedback(`Demo mode · Redirecting to ${role} workspace...`);
      setUserRole(role);

      setTimeout(() => {
        if (route === "roles") {
          setActiveRoleTab("Employee");
          const el = document.getElementById("roles");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        } else {
          // If in React Router, navigate to respective path
          if (role === 'Admin') navigate('/admin/dashboard');
          else if (role === 'Manager') navigate('/manager/dashboard');
          else if (role === 'Auditor') navigate('/auditor/dashboard');
          else if (role === 'CEO') navigate('/ceo/dashboard');
          else navigate('/employee/dashboard');
        }
      }, 600);
    }
  };

  const setLoginFields = (roleEmail) => {
    setEmail(roleEmail);
    setPassword("demo1234");
    setLoginFeedback("");
  };

  // Live Complaint submission
  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    if (!complaintPolicy || !complaintDept || !complaintSummary.trim() || !complaintProof.trim()) {
      setComplaintFeedback("All fields required — proof is mandatory.");
      return;
    }

    setScoreState((prev) => ({
      ...prev,
      g: Math.max(0, prev.g - 1.2),
    }));

    setComplaintFeedback(`Complaint filed on “${complaintPolicy}” · ${complaintDept}. Admin notified.`);
    setComplaintSummary("");
    setComplaintProof("");
  };

  // Gating checkboxes toggle
  const handleCheckboxToggle = (index) => {
    const nextChecks = [...checks];
    nextChecks[index] = !nextChecks[index];
    setChecks(nextChecks);
  };

  const checksRatio = checks.filter(Boolean).length / checks.length;
  const percentDone = Math.round(checksRatio * 100);

  const handleUnlockQR = () => {
    if (checksRatio < 1) return;
    setQrUnlocked(true);
    setGateFeedback("QR entry unlocked for this CSR activity.");
    setScoreState((prev) => ({
      ...prev,
      g: Math.min(100, prev.g + 3.0),
    }));
  };

  const handleApproveCSR = () => {
    setScoreState((prev) => ({
      ...prev,
      s: Math.min(100, prev.s + 2.4),
    }));
    const btn = document.getElementById("approve-csr-btn");
    if (btn) {
      btn.textContent = "CSR approved · Social +2.4";
      setTimeout(() => {
        btn.textContent = "Approve CSR + award XP";
      }, 1800);
    }
  };

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    if (!demoName.trim()) {
      setDemoFeedback("Add your team name to pin the checklist.");
      return;
    }
    setDemoFeedback(`Locked for ${demoName.trim()}: score → carbon → CSR → badge → reward → overdue → CSV.`);
    setDemoName("");
  };

  return (
    <>
      {/* Site Navigation */}
      <header className="site-nav" id="site-nav" data-od-id="site-nav">
        <div className="container">
          <div className="nav-shell">
            <a className="brand" href="#top" data-od-id="brand">
              <span className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M12 3c-3.4 4.4-6 7.7-6 11a6 6 0 0 0 12 0c0-3.3-2.6-6.6-6-11Z"/>
                  <path d="M12 14v7"/>
                </svg>
              </span>
              <span>EcoSphere<small>ESG platform</small></span>
            </a>
            <button 
              className="menu-toggle" 
              type="button" 
              aria-label="Open menu" 
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              data-od-id="menu-toggle"
            >
              <span></span>
            </button>
            <ul className={`nav-links ${menuOpen ? "open" : ""}`} data-od-id="nav-links">
              <li><a href="#problem" onClick={() => setMenuOpen(false)}>Problem</a></li>
              <li><a href="#roles" onClick={() => setMenuOpen(false)}>Roles</a></li>
              <li><a href="#pipeline" onClick={() => setMenuOpen(false)}>Pipeline</a></li>
              <li><a href="#try" onClick={() => setMenuOpen(false)}>Demo</a></li>
            </ul>
            <a className="btn btn-primary" href="#try" data-od-id="nav-cta">Run live score</a>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Full-bleed WebGL hero */}
        <section className="hero" id="hero-host">
          <div className="hero-void" aria-hidden="true"></div>
          <div id="globe-stage">
            <canvas ref={canvasRef} id="globe-canvas"></canvas>
            <div className="globe-loader" style={{ display: "none" }}>Loading Earth…</div>
          </div>

          <div className="hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">EcoSphere Portal</p>
              <h1>
                <span className="split-line"><span>EcoSphere <em>ESG</em></span></span>
              </h1>
              <p className="lead">
                ERP-integrated carbon accounting (E), CSR programs (S), and audited compliance policy (G) in real time.
              </p>

              <form id="hero-login-form" className="hero-login-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="login-email">Email Address</label>
                  <input
                    type="email"
                    id="login-email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="login-password">Password</label>
                  <input
                    type="password"
                    id="login-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ minHeight: "48px", borderRadius: "9999px" }}>
                  Sign in to dashboard
                </button>

                <div className="quick-login-hints">
                  <span>Quick demo accounts:</span>
                  <div className="quick-login-buttons">
                    <button type="button" className="btn-quick-login" onClick={() => setLoginFields("ceo@ecosphere.com")}>CEO Dashboard</button>
                    <button type="button" className="btn-quick-login" onClick={() => setLoginFields("admin@ecosphere.com")}>Admin</button>
                    <button type="button" className="btn-quick-login" onClick={() => setLoginFields("manager@ecosphere.com")}>Manager</button>
                    <button type="button" className="btn-quick-login" onClick={() => setLoginFields("employee@ecosphere.com")}>Employee</button>
                    <button type="button" className="btn-quick-login" onClick={() => setLoginFields("auditor@ecosphere.com")}>Auditor</button>
                  </div>
                </div>
                {loginFeedback && (
                  <div
                    className="login-feedback"
                    style={{
                      color: loginFeedback.includes("Welcome") || loginFeedback.includes("Verifying")
                        ? "var(--accent)"
                        : "var(--danger)",
                    }}
                  >
                    {loginFeedback}
                  </div>
                )}
              </form>
            </div>

            <div className="hero-hud">
              <div className="signal s1"><span>Carbon txn</span><b>+2.1 E</b></div>
              <div className="signal s2"><span>Grid factor</span><b>0.38 kg/kWh</b></div>
              <div className="signal s3"><span>Diesel txn</span><b>1,500 gal (-3.2 G)</b></div>
              <ScoreCard scoreState={scoreState} />
            </div>
          </div>
        </section>

        {/* Problem Statement Section */}
        <section className="content" id="problem">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Problem statement</p>
              <h2>ESG is critical — but stuck outside the ERP.</h2>
              <p>
                Operations live in purchases, manufacturing, fleet, and expenses. ESG still sits in disconnected PDFs — no real-time carbon math, no tracked CSR, no escalated compliance.
              </p>
            </div>
            <div className="pillars">
              <article className="tile">
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15v-5"/><path d="M12 15V8"/><path d="M16 15v-3"/>
                  </svg>
                </div>
                <h3>Environmental</h3>
                <p>Carbon accounting from emission factors and operational transactions — goals that move with the data.</p>
              </article>

              <article className="tile">
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5"/><path d="M16 11h5"/><path d="M18.5 8.5v5"/>
                  </svg>
                </div>
                <h3>Social</h3>
                <p>CSR activities, participation with proof, diversity metrics, and engagement that actually scores.</p>
              </article>

              <article className="tile">
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M7 4h10v16l-5-3-5 3V4Z"/>
                  </svg>
                </div>
                <h3>Governance</h3>
                <p>Policies, audits, compliance issues with owners and due dates — overdue items auto-flag and notify.</p>
              </article>

              <article className="tile">
                <div className="tile-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 4l2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 15.4 7.8 17l.8-4.7L5.2 9l4.7-.7L12 4z"/>
                  </svg>
                </div>
                <h3>Gamification</h3>
                <p>XP, badges, and rewards that turn ESG compliance into daily habits — not annual paperwork.</p>
              </article>
            </div>
          </div>
        </section>

        {/* Four Roles Section */}
        <section className="content" id="roles">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Four roles · one platform</p>
              <h2>Built for how ESG actually runs.</h2>
              <p>Admin charts and policies. Manager CSR. Employee rewards. Auditor complaints — each role has a clear surface.</p>
            </div>

            <div className="roles-shell">
              <div className="role-tabs">
                {(["Admin", "Manager", "Employee", "Auditor"]).map((r) => (
                  <button
                    key={r}
                    className="role-tab"
                    aria-selected={activeRoleTab === r}
                    onClick={() => setActiveRoleTab(r)}
                  >
                    {r}
                  </button>
                ))}
                <div
                  className="tab-ink"
                  style={{
                    width: "25%",
                    transform: `translateX(${
                      ["Admin", "Manager", "Employee", "Auditor"].indexOf(activeRoleTab) * 100
                    }%)`,
                  }}
                ></div>
              </div>

              {activeRoleTab === "Admin" && (
                <div className="role-panel active">
                  <h3>Admin — charts, policies, org score</h3>
                  <p>Own the org ESG score, emission factors, policy library, and rollups across departments.</p>
                  <ul className="role-list">
                    <li>Live weighted score dashboard (E 40 / S 30 / G 30)</li>
                    <li>Policy CRUD + version history</li>
                    <li>Carbon goals vs actuals from ERP transactions</li>
                    <li>Department heatmaps and export-ready CSV</li>
                  </ul>
                </div>
              )}

              {activeRoleTab === "Manager" && (
                <div className="role-panel active">
                  <h3>Manager — CSR ops</h3>
                  <p>Plan CSR activities, approve participation, and unlock QR entry only after policy gates clear.</p>
                  <ul className="role-list">
                    <li>Create CSR events with capacity + impact tags</li>
                    <li>Approve employee proof → Social score bump</li>
                    <li>Policy gate checklist before QR unlock</li>
                    <li>Team participation streaks</li>
                  </ul>
                </div>
              )}

              {activeRoleTab === "Employee" && (
                <div className="role-panel active">
                  <h3>Employee — rewards &amp; proof</h3>
                  <p>Scan, participate, upload proof, earn XP and badges that map back to Social scoring.</p>
                  <ul className="role-list">
                    <li>QR check-in after policy gate</li>
                    <li>Upload proof for CSR credit</li>
                    <li>XP, badges, and reward catalog</li>
                    <li>Personal contribution timeline</li>
                  </ul>
                </div>
              )}

              {activeRoleTab === "Auditor" && (
                <div className="role-panel active">
                  <h3>Auditor — complaints &amp; compliance</h3>
                  <p>File and escalate governance issues with mandatory proof — overdue items auto-flag.</p>
                  <ul className="role-list">
                    <li>Complaint form with policy link + proof</li>
                    <li>Owner assignment and due dates</li>
                    <li>Overdue escalation to Admin</li>
                    <li>Audit trail export</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Scoring Pipeline Bento Section */}
        <section className="content" id="pipeline">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Scoring pipeline</p>
              <h2>From transaction to weighted score.</h2>
              <p>Every action — carbon txn, CSR approval, complaint — feeds the live rollup judges can demo in one session.</p>
            </div>
            <div className="bento">
              <article className="bento-card span-7">
                <div className="step-num">01 · Capture</div>
                <h3>ERP-linked transactions</h3>
                <p>Purchases, fleet, manufacturing, and expenses map to emission factors. Environmental score moves with real ops data.</p>
              </article>
              <article className="bento-card span-5">
                <div className="step-num">02 · Gate</div>
                <h3>Policy before QR</h3>
                <p>Managers clear checklist items. QR entry stays locked until every policy gate is approved.</p>
              </article>
              <article className="bento-card span-4">
                <div className="step-num">03 · Social</div>
                <h3>CSR + proof</h3>
                <p>Approved participation bumps Social score and awards employee XP.</p>
              </article>
              <article className="bento-card span-4">
                <div className="step-num">04 · Govern</div>
                <h3>Complaints</h3>
                <p>Proof-required issues adjust Governance and notify owners before due dates slip.</p>
              </article>
              <article className="bento-card span-4">
                <div className="step-num">05 · Rollup</div>
                <h3>Live weighted score</h3>
                <p>Org score = E×0.4 + S×0.3 + G×0.3 — recomputed on every qualifying event.</p>
              </article>
            </div>
          </div>
        </section>

        {/* Interactive Demo section */}
        <section className="content" id="try">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow">Interactive demo</p>
              <h2>Touch the scoring engine.</h2>
              <p>File a complaint or clear the policy gate — watch Social / Governance and the org score update live.</p>
            </div>
            <div className="demo-grid">
              {/* Complaint tool */}
              <div className="tool-card">
                <h3>File a complaint</h3>
                <p>Auditor path — proof is mandatory. Governance dips so judges see the live link.</p>
                <form onSubmit={handleComplaintSubmit}>
                  <div className="field">
                    <label htmlFor="complaint-policy">Policy</label>
                    <select
                      id="complaint-policy"
                      required
                      value={complaintPolicy}
                      onChange={(e) => setComplaintPolicy(e.target.value)}
                    >
                      <option value="">Select policy</option>
                      <option>Waste segregation SOP</option>
                      <option>Fleet emission reporting</option>
                      <option>Vendor code of conduct</option>
                      <option>Data retention policy</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="complaint-dept">Department</label>
                    <select
                      id="complaint-dept"
                      required
                      value={complaintDept}
                      onChange={(e) => setComplaintDept(e.target.value)}
                    >
                      <option value="">Select department</option>
                      <option>Operations</option>
                      <option>Supply chain</option>
                      <option>HR</option>
                      <option>Finance</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="complaint-summary">Summary</label>
                    <textarea
                      id="complaint-summary"
                      placeholder="What failed and where?"
                      required
                      value={complaintSummary}
                      onChange={(e) => setComplaintSummary(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="complaint-proof">Proof link / ID</label>
                    <input
                      id="complaint-proof"
                      type="text"
                      placeholder="Photo ID, ticket #, or URL"
                      required
                      value={complaintProof}
                      onChange={(e) => setComplaintProof(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ width: "100%", padding: "12px", borderRadius: "20px" }}>Submit complaint</button>
                  {complaintFeedback && (
                    <p
                      className="form-note"
                      style={{
                        color: complaintFeedback.includes("filed") ? "var(--accent)" : "var(--danger)",
                        marginTop: "8px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px"
                      }}
                    >
                      {complaintFeedback}
                    </p>
                  )}
                </form>
              </div>

              {/* Checklist gate tool */}
              <div className="tool-card">
                <h3>Policy gate → QR unlock</h3>
                <p>Manager path — complete every check, then unlock QR entry for CSR.</p>
                <ul className="checklist">
                  {["Safety briefing acknowledged", "Venue policy approved", "Volunteer code signed", "Impact category tagged"].map((lbl, idx) => (
                    <li key={idx}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={checks[idx]}
                          onChange={() => handleCheckboxToggle(idx)}
                          style={{ accentColor: "var(--accent)" }}
                        />
                        {lbl}
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="gate-meter">
                  <div className="gate-track">
                    <div className="gate-fill" style={{ width: `${percentDone}%` }}></div>
                  </div>
                  <span className="gate-pct">{percentDone}%</span>
                </div>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={checksRatio < 1 || qrUnlocked}
                  onClick={handleUnlockQR}
                  style={{ width: "100%", padding: "12px", borderRadius: "20px" }}
                >
                  {qrUnlocked ? "QR entry unlocked" : "Unlock QR entry"}
                </button>
                <p className="form-note" style={{ color: qrUnlocked ? "var(--accent)" : "var(--muted)", marginTop: "6px" }}>
                  {gateFeedback}
                </p>

                <div className="tool-divider">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    id="approve-csr-btn"
                    onClick={handleApproveCSR}
                    style={{ width: "100%", padding: "12px", borderRadius: "20px", marginTop: "12px" }}
                  >
                    Approve CSR + award XP
                  </button>
                  <p className="form-note" style={{ marginTop: "6px" }}>
                    Live Social score: <strong style={{ color: "var(--accent)" }}>{scoreState.s.toFixed(1)}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hackathon demo checklist */}
        <section className="content" id="pitch">
          <div className="container">
            <div className="cta-block">
              <p className="eyebrow">Hackathon demo checklist</p>
              <h2>Ready for the judges’ walkthrough.</h2>
              <p>Pin your team flow: live score → carbon txn → CSR approve → badge → reward → overdue complaint → CSV export.</p>
              <form className="cta-form" onSubmit={handleDemoSubmit}>
                <div className="field">
                  <label htmlFor="demo-name">Team name</label>
                  <input
                    id="demo-name"
                    type="text"
                    placeholder="EcoSphere team"
                    required
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" type="submit" style={{ width: "100%", padding: "12px", borderRadius: "20px" }}>Lock demo checklist</button>
                {demoFeedback && (
                  <p className="form-note" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "11px", marginTop: "8px", textAlign: "center" }}>
                    {demoFeedback}
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer>
          <div className="container">
            <div className="footer-inner">
              <span>EcoSphere · hackathon pitch</span>
              <span>WebGL Earth · editorial UI</span>
              <span>E 40 · S 30 · G 30</span>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
};
