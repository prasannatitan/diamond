import React, { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Tooltip } from "../ui/Tooltip";
import { Environment, OrbitControls, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { MetalType, GemType, SkinTone, RingModelType } from "../../types";
import { RingModel } from "./RingModel";
import { HandModel } from "./HandModel";
import * as THREE from "three";

interface SceneProps {
  metal: MetalType;
  gem: GemType;
  diamondShape: string;
  ringModel: RingModelType;
  autoRotate: boolean;
  skinTone: SkinTone;
  renderMode: "performance" | "quality";
  onToggleAutoRotate?: () => void;
}

const ENV_Metal = "/assets/metal/env.hdr";

export const Scene: React.FC<SceneProps> = ({
  metal,
  gem,
  diamondShape,
  ringModel,
  autoRotate,
  skinTone,
  renderMode,
  onToggleAutoRotate,
}) => {
  const [isModelReady, setIsModelReady] = useState(false);
  const [dpr, setDpr] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isHoveringModel, setIsHoveringModel] = useState(false);

  const isMacChrome = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      /Mac/.test(navigator.userAgent) &&
      /Chrome/.test(navigator.userAgent),
    []
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const deviceDpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const perfCap = renderMode === "performance";
    const cap = perfCap ? 1.1 : isMacChrome ? 1.25 : 2;
    const capped = Math.min(deviceDpr, cap);
    setDpr(capped);
  }, [isMacChrome, renderMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia?.("(max-width: 640px)");
    const handler = (e: MediaQueryList | MediaQueryListEvent) =>
      setIsMobile((e as any).matches ?? (e as MediaQueryList).matches);

    if (mq) {
      setIsMobile(mq.matches);

      if (mq.addEventListener) mq.addEventListener("change", handler as any);
      else mq.addListener(handler as any);

      return () => {
        if (mq.removeEventListener) mq.removeEventListener("change", handler as any);
        else mq.removeListener(handler as any);
      };
    }

    const onResize = () => setIsMobile(window.innerWidth <= 640);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleStart = () => setIsUserInteracting(true);
    const handleEnd = () => setIsUserInteracting(false);

    controls.addEventListener("start", handleStart);
    controls.addEventListener("end", handleEnd);

    return () => {
      controls.removeEventListener("start", handleStart);
      controls.removeEventListener("end", handleEnd);
    };
  }, [isModelReady]);

  const zoomIn = () => {
    try {
      controlsRef.current?.dollyOut?.(1.15);
      controlsRef.current?.update?.();
    } catch (err) {
      console.error("zoomIn failed", err);
    }
  };

  const zoomOut = () => {
    try {
      controlsRef.current?.dollyIn?.(1.15);
      controlsRef.current?.update?.();
    } catch (err) {
      console.error("zoomOut failed", err);
    }
  };

  useEffect(() => {
    const onFullScreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener("fullscreenchange", onFullScreenChange);
    document.addEventListener("webkitfullscreenchange", onFullScreenChange);
    document.addEventListener("mozfullscreenchange", onFullScreenChange);
    document.addEventListener("MSFullscreenChange", onFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullScreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullScreenChange);
      document.removeEventListener("mozfullscreenchange", onFullScreenChange);
      document.removeEventListener("MSFullscreenChange", onFullScreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const el: any = containerRef.current || document.documentElement;
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isFs) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
        else if (el.msRequestFullscreen) await el.msRequestFullscreen();
        else console.warn("Fullscreen not supported on this element");
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        } else {
          console.warn("Exit fullscreen not supported");
        }
      }
    } catch (err) {
      console.error("Fullscreen toggle failed", err);
    }
  };

  const handleModelPointerEnter = (e: any) => {
    e.stopPropagation();
    setIsHoveringModel(true);
  };

  const handleModelPointerMove = (e: any) => {
    e.stopPropagation();
    if (!isHoveringModel) {
      setIsHoveringModel(true);
    }
  };

  const handleModelPointerLeave = (e: any) => {
    e.stopPropagation();
    setIsHoveringModel(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none ${isFullscreen ? "bg-white" : "bg-transparent"}`}>
      <Canvas
        shadows
        dpr={dpr}
        gl={{
          antialias: !isMacChrome,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isMacChrome ? 1.0 : 1.2,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [0, 2, 6], fov: 45 }}
        className="w-full h-full select-none"
        onPointerMissed={() => setIsHoveringModel(false)}
        style={(() => {
          const canvasBase: React.CSSProperties = {
            backgroundColor: isFullscreen
              ? isMobile
                ? "#000"
                : "#fff"
              : "transparent",
          };

          const base: React.CSSProperties = {
            opacity: isModelReady ? 1 : 0,
            transition: "opacity 0.5s ease-in-out",
          };

          if (!isMobile && !isFullscreen) {
            return {
              ...base,
              transform: "translateX(50px) translateY(-50px)",
              marginLeft: "150px",
              marginTop: "10px",
            };
          }

          return {
            ...base,
            ...canvasBase,
          };
        })()}
      >
        <Suspense fallback={null}>
          <Environment
            files={ENV_Metal}
            background={false}
            blur={0.1}
            environmentIntensity={0.7}
          />

          <ambientLight intensity={0.5} />

          <spotLight
            position={[5, 8, 5]}
            angle={0.3}
            penumbra={1}
            intensity={2}
            castShadow
          />

          <group
            position={[0, -0.5, 0]}
            scale={0.1}
            onPointerEnter={handleModelPointerEnter}
            onPointerOver={handleModelPointerEnter}
            onPointerMove={handleModelPointerMove}
            onPointerLeave={handleModelPointerLeave}
            onPointerOut={handleModelPointerLeave}
          >
            <RingModel
              metal={metal}
              gem={gem}
              diamondShape={diamondShape}
              ringModel={ringModel}
              renderMode={renderMode}
              onModelReady={() => setIsModelReady(true)}
            />
          </group>

          <ContactShadows
            position={[0, -1.7, 0]}
            opacity={0.15}
            scale={10}
            blur={2.5}
            far={4}
          />

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 1.8}
            minDistance={renderMode === "performance" ? 2.5 : 2.2}
            maxDistance={8}
            autoRotate={!isUserInteracting && !isHoveringModel}
            autoRotateSpeed={8.5}
          />

          <EffectComposer>
            {!isMacChrome && (
              <Bloom
                intensity={0.2}
                luminanceThreshold={2}
                luminanceSmoothing={0.2}
                radius={0.6}
                blendFunction={BlendFunction.SCREEN}
              />
            )}
          </EffectComposer>
        </Suspense>
      </Canvas>

      <div className="absolute top-4 z-30 right-4 flex flex-col gap-3">
        <Tooltip content="Rotate">
          <button
            aria-label="Rotation always on"
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-blue-600 text-white"
            type="button"
          >
            <img
              src="/assets/images/rotate.png"
              alt="rotate"
              className="w-7 h-7 object-contain"
              draggable={false}
              style={{ filter: "invert(1) brightness(2)" }}
            />
          </button>
        </Tooltip>

        <Tooltip content="Fullscreen">
          <button
            aria-label="Fullscreen"
            className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center shadow-lg"
            onClick={toggleFullscreen}
            type="button"
          >
            <img
              src="/assets/images/fullscreen.png"
              alt="fullscreen"
              className="w-4 h-4 object-contain"
              draggable={false}
              style={{ filter: "invert(1) brightness(2)" }}
            />
          </button>
        </Tooltip>

        <Tooltip content="Zoom in">
          <button
            aria-label="Zoom in"
            className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center shadow-lg"
            onClick={zoomIn}
            type="button"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M12 5v14M5 12h14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </Tooltip>

        <Tooltip content="Zoom out">
          <button
            aria-label="Zoom out"
            className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center shadow-lg"
            onClick={zoomOut}
            type="button"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M5 12h14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </Tooltip>
      </div>
    </div>
  );
};