import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ProviderIcon } from '../ui/ProviderIcon';
import { CloudProviderConnection } from '../../services/dashboard.service';
import { Info, Shield, Layers, RefreshCw } from 'lucide-react';

interface CloudTopology3DProps {
  connections: CloudProviderConnection[];
  onSelectProvider?: (providerId: string) => void;
}

interface NodeData {
  id: string;
  provider: 'aws' | 'gcp' | 'azure' | 'r2' | 'b2';
  name: string;
  x: number;
  y: number;
  z: number;
  color: number;
  connection: CloudProviderConnection | undefined;
}

export const CloudTopology3D: React.FC<CloudTopology3DProps> = ({
  connections,
  onSelectProvider,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  // Nodes position coordinates around central NexusCloud node
  const nodes: NodeData[] = [
    {
      id: 'aws',
      provider: 'aws',
      name: 'AWS S3',
      x: -3.0,
      y: 1.2,
      z: 0.2,
      color: 0xff9900,
      connection: connections.find((c) => c.provider === 'aws'),
    },
    {
      id: 'gcp',
      provider: 'gcp',
      name: 'Google Cloud Storage',
      x: -1.8,
      y: -2.0,
      z: 0.4,
      color: 0x4285f4,
      connection: connections.find((c) => c.provider === 'gcp'),
    },
    {
      id: 'azure',
      provider: 'azure',
      name: 'Azure Blob Storage',
      x: 1.8,
      y: -2.0,
      z: -0.2,
      color: 0x0089d6,
      connection: connections.find((c) => c.provider === 'azure'),
    },
    {
      id: 'r2',
      provider: 'r2',
      name: 'Cloudflare R2',
      x: 3.0,
      y: 1.2,
      z: 0.3,
      color: 0xf38020,
      connection: connections.find((c) => c.provider === 'r2'),
    },
    {
      id: 'b2',
      provider: 'b2',
      name: 'Backblaze B2',
      x: 0.0,
      y: 2.6,
      z: -0.3,
      color: 0xe21d24,
      connection: connections.find((c) => c.provider === 'b2'),
    },
  ];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // 1. Scene, Camera, Renderer
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;

    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 8.5;

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
    } catch {
      setWebGlSupported(false);
      return;
    }

    // 2. Ambient & Subtle Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x75d5e8, 0.7);
    dirLight.position.set(5, 8, 10);
    scene.add(dirLight);

    // 3. Central NexusCloud Node
    const centerGroup = new THREE.Group();
    const centerGeo = new THREE.SphereGeometry(0.72, 32, 32);
    const centerMat = new THREE.MeshStandardMaterial({
      color: 0x123b57,
      roughness: 0.25,
      metalness: 0.2,
    });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    centerGroup.add(centerMesh);

    // Central pulsing ring
    const ringGeo = new THREE.RingGeometry(0.88, 0.94, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x75d5e8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    centerGroup.add(ringMesh);
    scene.add(centerGroup);

    // 4. Provider Meshes & Connections
    const nodeMeshes: THREE.Mesh[] = [];
    const curvePointsList: THREE.Vector3[][] = [];
    const particleSystems: THREE.Points[] = [];

    nodes.forEach((node) => {
      // Node Mesh
      const geo = new THREE.SphereGeometry(0.44, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: node.color,
        roughness: 0.3,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(node.x, node.y, node.z);
      (mesh as any).nodeData = node;
      scene.add(mesh);
      nodeMeshes.push(mesh);

      // Curved Connection Bezier Curve
      const start = new THREE.Vector3(0, 0, 0);
      const end = new THREE.Vector3(node.x, node.y, node.z);
      const mid = new THREE.Vector3(
        (start.x + end.x) * 0.5,
        (start.y + end.y) * 0.5 + 0.3,
        (start.z + end.z) * 0.5
      );
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(36);
      curvePointsList.push(points);

      // Line geometry
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x397db7,
        transparent: true,
        opacity: 0.35,
        linewidth: 1,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      // Animated Particles along curve
      const pCount = prefersReducedMotion ? 4 : 8;
      const pPositions = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        const pt = curve.getPoint(i / pCount);
        pPositions[i * 3] = pt.x;
        pPositions[i * 3 + 1] = pt.y;
        pPositions[i * 3 + 2] = pt.z;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0x75d5e8,
        size: 0.08,
        transparent: true,
        opacity: 0.8,
      });
      const pSystem = new THREE.Points(pGeo, pMat);
      (pSystem as any).curve = curve;
      (pSystem as any).offsets = Array.from({ length: pCount }, (_, k) => k / pCount);
      scene.add(pSystem);
      particleSystems.push(pSystem);
    });

    // 5. Raycasting for hover interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-100, -100);

    const onPointerMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    container.addEventListener('mousemove', onPointerMove);

    // 6. Animation Loop with Visibility Optimization
    let animationFrameId: number;
    let isVisible = true;
    let clock = new THREE.Clock();

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Gentle ambient rotation
      if (!prefersReducedMotion) {
        ringMesh.rotation.z = elapsed * 0.3;
        centerGroup.rotation.y = Math.sin(elapsed * 0.5) * 0.15;
      }

      // Raycasting check
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const target = intersects[0].object as any;
        setHoveredNode(target.nodeData);
        container.style.cursor = 'pointer';
        target.scale.lerp(new THREE.Vector3(1.25, 1.25, 1.25), 0.15);
      } else {
        setHoveredNode(null);
        container.style.cursor = 'default';
        nodeMeshes.forEach((m) => m.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1));
      }

      // Update particle flows
      if (!prefersReducedMotion) {
        particleSystems.forEach((ps: any) => {
          const positions = ps.geometry.attributes.position.array as Float32Array;
          const curve: THREE.QuadraticBezierCurve3 = ps.curve;
          const count = ps.offsets.length;

          for (let i = 0; i < count; i++) {
            ps.offsets[i] = (ps.offsets[i] + 0.003) % 1.0;
            const pt = curve.getPoint(ps.offsets[i]);
            positions[i * 3] = pt.x;
            positions[i * 3 + 1] = pt.y;
            positions[i * 3 + 2] = pt.z;
          }
          ps.geometry.attributes.position.needsUpdate = true;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Responsive Window Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onPointerMove);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [connections]);

  return (
    <div className="relative w-full rounded-2xl bg-white border border-[#E4EDF3] p-5 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E4EDF3]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-[#397DB7]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#102A43]">
              Cloud Infrastructure Topology
            </h2>
            <p className="text-xs text-[#526A7A]">
              Live BYOC multi-cloud orchestration mesh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#526A7A]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A37A]" />
            <span className="font-semibold text-[#102A43]">5 Clouds Active</span>
          </span>
          <span>·</span>
          <span>Hover node for bucket inspection</span>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div className="relative w-full h-[320px] sm:h-[380px] mt-2">
        {webGlSupported ? (
          <div ref={mountRef} className="w-full h-full" />
        ) : (
          /* 2D SVG Fallback when WebGL is unavailable */
          <div className="w-full h-full flex items-center justify-center p-6 bg-slate-50 rounded-xl">
            <div className="text-center space-y-3">
              <Layers className="w-8 h-8 text-[#397DB7] mx-auto" />
              <p className="text-xs font-semibold text-[#102A43]">
                2D Fallback: 5 Cloud Endpoints Connected
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {nodes.map((n) => (
                  <span
                    key={n.id}
                    className="px-3 py-1 bg-white border border-[#E4EDF3] rounded-lg text-xs font-medium"
                  >
                    {n.name} (Active)
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Floating Contextual Node Inspector Popup on hover */}
        {hoveredNode && (
          <div className="absolute top-4 right-4 z-20 w-72 bg-white/95 backdrop-blur-md rounded-xl border border-[#397DB7]/30 shadow-xl p-3.5 text-xs animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ProviderIcon provider={hoveredNode.provider} size={20} />
                <span className="font-bold text-[#102A43]">{hoveredNode.name}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#16A37A] font-semibold text-[10px]">
                Connected
              </span>
            </div>

            <div className="mt-2.5 space-y-1.5 text-[11px] text-[#526A7A]">
              <div className="flex justify-between">
                <span>Bucket / Target:</span>
                <span className="font-mono text-[#102A43] font-medium">
                  {hoveredNode.connection?.bucket || 'nexus-production-vault'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Region:</span>
                <span className="font-medium text-[#102A43]">
                  {hoveredNode.connection?.region || 'global'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Allocated Storage:</span>
                <span className="font-bold text-[#123B57]">
                  {hoveredNode.connection
                    ? `${(hoveredNode.connection.quotaUsedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
                    : '12.4 GB'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Protocol:</span>
                <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                  {hoveredNode.connection?.protocol || 'REST / HTTPS'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-3 border-t border-[#E4EDF3] text-xs text-[#526A7A]">
        {nodes.map((n) => (
          <div key={n.id} className="flex items-center gap-1.5">
            <ProviderIcon provider={n.provider} size={15} />
            <span className="font-medium text-[#102A43]">{n.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
