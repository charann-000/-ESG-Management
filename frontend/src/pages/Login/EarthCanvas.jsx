import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function EarthCanvas() {
  const containerRef = useRef(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* ── Scene setup ── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    /* ── Earth sphere with procedural texture ── */
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);

    /* Generate a procedural Earth-like texture */
    const textureSize = 1024;
    const canvas2D = document.createElement('canvas');
    canvas2D.width = textureSize;
    canvas2D.height = textureSize / 2;
    const ctx = canvas2D.getContext('2d');

    /* Ocean base */
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas2D.height);
    oceanGrad.addColorStop(0, '#0a2e4d');
    oceanGrad.addColorStop(0.3, '#0d3b66');
    oceanGrad.addColorStop(0.5, '#0a4a7a');
    oceanGrad.addColorStop(0.7, '#0d3b66');
    oceanGrad.addColorStop(1, '#0a2e4d');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas2D.width, canvas2D.height);

    /* Draw landmasses procedurally */
    const seededRandom = (seed) => {
      const x = Math.sin(seed * 9301 + 49297) * 49297;
      return x - Math.floor(x);
    };

    const landColor = '#0f5132';
    const lightLand = '#157347';
    const desertColor = '#8B7355';

    /* Continent-like blobs */
    const continents = [
      { x: 0.25, y: 0.35, rx: 0.08, ry: 0.12, color: landColor },
      { x: 0.28, y: 0.55, rx: 0.04, ry: 0.15, color: lightLand },
      { x: 0.52, y: 0.3, rx: 0.12, ry: 0.08, color: landColor },
      { x: 0.55, y: 0.42, rx: 0.06, ry: 0.06, color: desertColor },
      { x: 0.65, y: 0.35, rx: 0.1, ry: 0.12, color: landColor },
      { x: 0.7, y: 0.55, rx: 0.05, ry: 0.08, color: lightLand },
      { x: 0.85, y: 0.4, rx: 0.06, ry: 0.1, color: landColor },
      { x: 0.15, y: 0.85, rx: 0.04, ry: 0.04, color: '#e8e8e8' },
      { x: 0.55, y: 0.15, rx: 0.08, ry: 0.04, color: '#e8e8e8' },
    ];

    continents.forEach((c) => {
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.ellipse(
        c.x * canvas2D.width,
        c.y * canvas2D.height,
        c.rx * canvas2D.width,
        c.ry * canvas2D.height,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      /* Add terrain variation */
      for (let i = 0; i < 15; i++) {
        const ox = (seededRandom(i * 3 + c.x * 100) - 0.5) * c.rx * 1.6 * canvas2D.width;
        const oy = (seededRandom(i * 7 + c.y * 100) - 0.5) * c.ry * 1.6 * canvas2D.height;
        const r = seededRandom(i * 11 + c.x * 50) * c.rx * 0.5 * canvas2D.width;
        ctx.beginPath();
        ctx.arc(c.x * canvas2D.width + ox, c.y * canvas2D.height + oy, r, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? lightLand : landColor;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    });

    const earthTexture = new THREE.CanvasTexture(canvas2D);
    earthTexture.wrapS = THREE.RepeatWrapping;

    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 25,
      specular: new THREE.Color(0x222244),
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    /* ── Atmosphere glow ── */
    const atmosphereGeometry = new THREE.SphereGeometry(1.08, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          vec3 atmosphereColor = mix(
            vec3(0.2, 0.83, 0.6),
            vec3(0.024, 0.71, 0.83),
            intensity
          );
          gl_FragColor = vec4(atmosphereColor, intensity * 0.7);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    /* ── Connection points (cities) ── */
    const pointGeometry = new THREE.SphereGeometry(0.012, 8, 8);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x34d399 });

    const cityCoords = [
      [40.7, -74.0], [51.5, -0.1], [35.7, 139.7], [-33.9, 151.2],
      [28.6, 77.2], [-23.5, -46.6], [55.8, 37.6], [22.3, 114.2],
      [48.9, 2.3], [1.3, 103.9], [37.6, 127.0], [30.0, 31.2],
      [-1.3, 36.8], [19.4, -99.1], [25.3, 55.3],
    ];

    const latLngToVector3 = (lat, lng, radius) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    const cityPoints = [];
    cityCoords.forEach(([lat, lng]) => {
      const point = new THREE.Mesh(pointGeometry, pointMaterial.clone());
      const pos = latLngToVector3(lat, lng, 1.01);
      point.position.copy(pos);
      earth.add(point);
      cityPoints.push(point);
    });

    /* ── Connection arcs between cities ── */
    const arcMaterial = new THREE.LineBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.3,
    });

    const connections = [
      [0, 1], [0, 5], [1, 2], [1, 4], [2, 7],
      [3, 2], [4, 7], [6, 1], [8, 6], [9, 2],
    ];

    connections.forEach(([a, b]) => {
      const start = latLngToVector3(cityCoords[a][0], cityCoords[a][1], 1.01);
      const end = latLngToVector3(cityCoords[b][0], cityCoords[b][1], 1.01);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(1.3);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(40);
      const arcGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const arc = new THREE.Line(arcGeometry, arcMaterial.clone());
      earth.add(arc);
    });

    /* ── Star field ── */
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 100;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    /* ── Lighting ── */
    const ambientLight = new THREE.AmbientLight(0x333344, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0x34d399, 0.4);
    rimLight.position.set(-3, -1, -3);
    scene.add(rimLight);

    /* ── Mouse interaction ── */
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    /* ── Resize handler ── */
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    /* ── Animation loop ── */
    let animationId;
    const clock = new THREE.Timer();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      clock.update();
      const elapsed = clock.getElapsed();

      /* Slow auto-rotation */
      earth.rotation.y += 0.002;

      /* Mouse-follow parallax */
      earth.rotation.x += (mouseY * 0.1 - earth.rotation.x) * 0.02;

      /* Pulse city points */
      cityPoints.forEach((point, i) => {
        const scale = 1 + Math.sin(elapsed * 2 + i * 0.7) * 0.4;
        point.scale.setScalar(scale);
        point.material.opacity = 0.6 + Math.sin(elapsed * 3 + i) * 0.4;
      });

      /* Subtle star twinkling */
      stars.rotation.y = elapsed * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    /* ── Cleanup ── */
    cleanupRef.current = () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  return <div ref={containerRef} className="earth-canvas" />;
}

export default EarthCanvas;
