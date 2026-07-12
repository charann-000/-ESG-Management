import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function EarthGlobe() {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const loaderRef = useRef(null);

  useEffect(() => {
    var canvas = canvasRef.current;
    var host = stageRef.current;
    var loading = loaderRef.current;

    if (!canvas || !host) {
      if (loading) loading.classList.add("hide");
      return;
    }

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (renderer.toneMapping !== undefined) renderer.toneMapping = THREE.NoToneMapping;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

    var group = new THREE.Group();
    scene.add(group);

    /* Bright wrap lighting */
    scene.add(new THREE.AmbientLight(0xffffff, 1.25));
    scene.add(new THREE.HemisphereLight(0xf0fff6, 0xd0e8ff, 0.95));
    var sun = new THREE.DirectionalLight(0xffffff, 1.05);
    sun.position.set(3.2, 2.2, 4.2);
    scene.add(sun);
    var fill = new THREE.DirectionalLight(0xc2f5d8, 1.05);
    fill.position.set(-3.8, 0.6, 2.4);
    scene.add(fill);
    var back = new THREE.DirectionalLight(0xe0fff2, 0.6);
    back.position.set(0.4, -1, -3);
    scene.add(back);

    var texLoader = new THREE.TextureLoader();
    texLoader.crossOrigin = "anonymous";

    var TEX = {
      day: "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
      topo: "https://unpkg.com/three-globe/example/img/earth-topology.png",
      fallbackDay: "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",
      fallbackClouds: "https://threejs.org/examples/textures/planets/earth_clouds_1024.png"
    };

    function loadTex(url) {
      return new Promise(function (resolve, reject) {
        texLoader.load(url, function (tex) {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          resolve(tex);
        }, undefined, reject);
      });
    }

    var earth = null;
    var clouds = null;
    var SEG = 96;

    // Glow shader
    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.14, 64, 64),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        uniforms: { glowColor: { value: new THREE.Color(0x29ae78) } },
        vertexShader: "varying vec3 vNormal;void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
        fragmentShader: "uniform vec3 glowColor;varying vec3 vNormal;void main(){float i=pow(0.75-dot(vNormal,vec3(0.,0.,1.)),3.2);gl_FragColor=vec4(glowColor,1.)*i*.4;}"
      })
    ));

    function buildEarth(dayMap, bumpMap, cloudMap) {
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
    }

    Promise.all([
      loadTex(TEX.day).catch(function () { return loadTex(TEX.fallbackDay); }),
      loadTex(TEX.topo).catch(function () { return null; }),
      loadTex(TEX.fallbackClouds).catch(function () { return null; })
    ]).then(function (maps) {
      buildEarth(maps[0], maps[1], maps[2]);
      if (loading) loading.classList.add("hide");
    }).catch(function () {
      earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, SEG, SEG),
        new THREE.MeshStandardMaterial({
          color: 0x29ae78,
          emissive: 0x1a5038,
          emissiveIntensity: 0.4,
          roughness: 0.7
        })
      );
      group.add(earth);
      if (loading) loading.classList.add("hide");
    });

    // Layout: Positions the Earth to interlock with the scaled-up UI card
    function layout() {
      var w = window.innerWidth;
      if (w >= 1000) {
        group.scale.set(1.65, 1.65, 1.65);
        group.position.set(1.0, 0, 0);
        camera.position.set(0, 0, 3.2);
      } else {
        group.scale.set(1.2, 1.2, 1.2);
        group.position.set(0.6, -0.4, 0);
        camera.position.set(0, 0, 4);
      }
    }
    layout();

    // Interactive Mouse Dragging
    var targetRX = 0.08, targetRY = 0.22, curRX = 0.08, curRY = 0.22;
    var isDragging = false;
    var previousMousePosition = { x: 0, y: 0 };

    var handleMouseDown = function(e) {
      isDragging = true;
      previousMousePosition = { x: e.offsetX, y: e.offsetY };
    };

    var handleMouseUp = function() { isDragging = false; };
    var handleMouseLeave = function() { isDragging = false; };

    var handleMouseMove = function(e) {
      if (isDragging) {
        var deltaMove = { x: e.offsetX - previousMousePosition.x, y: e.offsetY - previousMousePosition.y };
        targetRY += deltaMove.x * 0.005;
        targetRX += deltaMove.y * 0.005;
      }
      previousMousePosition = { x: e.offsetX, y: e.offsetY };
    };

    host.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseLeave);
    host.addEventListener('mousemove', handleMouseMove);

    function resize() {
      var w = host.clientWidth;
      var h = host.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      layout();
    }
    resize();
    window.addEventListener("resize", resize);

    var animId;
    function animate() {
      animId = requestAnimationFrame(animate);
      // Subtle constant rotation
      if (earth) earth.rotation.y += 0.001;
      if (clouds) clouds.rotation.y += 0.0015;

      // Apply interactive rotation easing
      curRX += (targetRX - curRX) * 0.1;
      curRY += (targetRY - curRY) * 0.1;

      // Clamp X rotation to prevent flipping upside down
      curRX = Math.max(-0.5, Math.min(0.5, curRX));

      group.rotation.x = curRX;
      group.rotation.y = curRY;

      renderer.render(scene, camera);
    }
    animate();

    var fallbackTimer = setTimeout(function () {
      if (loading) loading.classList.add("hide");
    }, 7000);

    // Cleanup
    return function () {
      clearTimeout(fallbackTimer);
      cancelAnimationFrame(animId);
      host.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseLeave);
      host.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener("resize", resize);

      scene.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(function (m) { m.dispose(); });
          } else {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div id="globe-stage" ref={stageRef} aria-hidden="true">
      <canvas id="globe-canvas" ref={canvasRef}></canvas>
      <div className="globe-loader" ref={loaderRef}>Loading Earth…</div>
    </div>
  );
}

export default EarthGlobe;
