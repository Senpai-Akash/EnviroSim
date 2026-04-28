"use client";
import { AngleSlider } from "@ark-ui/react/angle-slider";
import { useEffect, useRef, useState } from "react";
import { Thermometer, Wind, Cloud, Leaf } from "lucide-react";
import { simulate } from "@/app/utils/api";

const width = 150;
const thickness = 16;
const widthHorizontal = 100;
const thicknessHorizontal = 12;

interface EnvironmentValue {
  temperature: number;
  pollution: number;
  rainfall: number;
  vegetation: number;
}

interface EnvironmentControlsProps {
  onValuesChange?: (values: EnvironmentValue) => void;
  onPredictionChange?: (payload: {
    loading: boolean;
    error?: string;
    data?: unknown;
  }) => void;
  className?: string;
  layout?: 'vertical' | 'horizontal';
}

export default function EnvironmentControls({
  onValuesChange,
  onPredictionChange,
  className = "",
  layout = "vertical",
}: EnvironmentControlsProps) {
  const [values, setValues] = useState<EnvironmentValue>({
    temperature: (25 / 50) * 360,
    pollution: (30 / 100) * 360,
    rainfall: 45,
    vegetation: (60 / 100) * 360,
  });

  // Refs to avoid stale closures and infinite-loop from callback identity changes
  const predictionCbRef = useRef(onPredictionChange);
  const onValuesChangeRef = useRef(onValuesChange);

  useEffect(() => {
    predictionCbRef.current = onPredictionChange;
  }, [onPredictionChange]);

  useEffect(() => {
    onValuesChangeRef.current = onValuesChange;
  }, [onValuesChange]);

  const handleValueChange = (key: keyof EnvironmentValue, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  // Notify parent of value changes AFTER render (avoids setState-during-render error)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onValuesChangeRef.current?.(values);
  }, [values]);

  // Debounced ML prediction call — only depends on `values`
  useEffect(() => {
    predictionCbRef.current?.({ loading: true });

    const timeout = setTimeout(() => {
      const scaledValues = {
        temperature: (values.temperature / 360) * 50,
        pollution: (values.pollution / 360) * 100,
        rainfall: (values.rainfall / 360) * 360,
        vegetation: (values.vegetation / 360) * 100,
        month: new Date().getMonth() + 1,
      };

      simulate(scaledValues)
        .then((data) => {
          predictionCbRef.current?.({ loading: false, data });
        })
        .catch((err) => {
          predictionCbRef.current?.({
            loading: false,
            error: err?.message || "Failed to fetch prediction",
          });
        });
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [values]);

  const environmentParams = [
    {
      key: "temperature" as const,
      label: "Temperature",
      unit: "°C",
      icon: Thermometer,
      color: "from-red-600 to-orange-500",
      darkColor: "dark:from-red-400 dark:to-orange-400",
      min: 0,
      max: 50,
    },
    {
      key: "pollution" as const,
      label: "Pollution Level",
      unit: "%",
      icon: Wind,
      color: "from-orange-500 to-red-600",
      darkColor: "dark:from-orange-400 dark:to-red-500",
      min: 0,
      max: 100,
    },
    {
      key: "rainfall" as const,
      label: "Rainfall",
      unit: "mm",
      icon: Cloud,
      color: "from-blue-500 to-cyan-400",
      darkColor: "dark:from-blue-400 dark:to-cyan-300",
      min: 0,
      max: 360,
    },
    {
      key: "vegetation" as const,
      label: "Vegetation",
      unit: "%",
      icon: Leaf,
      color: "from-green-400 to-emerald-500",
      darkColor: "dark:from-green-300 dark:to-emerald-400",
      min: 0,
      max: 100,
    },
  ];

  return (
    <div
      className={`bg-white/10 dark:bg-slate-900/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-700/50 p-4 shadow-2xl ${className}`}
    >
      {layout === 'vertical' && (
        <div className="space-y-1 mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🌍 Environment Simulator
          </h2>
          <p className="text-sm text-gray-300">
            Adjust environmental parameters to simulate scenarios
          </p>
        </div>
      )}

      {layout === 'horizontal' && (
        <div className="space-y-1 mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ⚙️ Controls
          </h2>
          <p className="text-xs text-gray-300">
            Adjust environmental parameters
          </p>
        </div>
      )}

      <div className={layout === 'vertical' ? 'space-y-2' : 'grid grid-cols-2 md:grid-cols-4 gap-4'}>
        {environmentParams.map((param) => {
          const Icon = param.icon;
          const sliderValue = values[param.key];
          const percentValue = (sliderValue / 360) * 100;
          const displayValue = (sliderValue / 360) * param.max;

          return (
            <div
              key={param.key}
              className={`bg-white/5 dark:bg-slate-800/30 rounded-xl p-3 border border-white/10 dark:border-slate-700/30 ${layout === 'horizontal' ? 'flex flex-col items-center' : ''}`}
            >
              {layout === 'vertical' && (
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-white" />
                    <div>
                      <h3 className="font-semibold text-white">{param.label}</h3>
                      <p className="text-xs text-gray-400">
                        {Math.round(displayValue)} {param.unit}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {layout === 'horizontal' && (
                <div className="text-center mb-2">
                  <Icon className="w-4 h-4 text-white mx-auto mb-1" />
                  <h3 className="font-semibold text-white text-xs">{param.label}</h3>
                  <p className="text-xs text-gray-400">
                    {Math.round(displayValue)} {param.unit}
                  </p>
                </div>
              )}

              <AngleSlider.Root
                value={sliderValue}
                onValueChange={(details) => {
                  handleValueChange(param.key, details.value);
                }}
                className={`relative flex items-center justify-center overflow-visible ${layout === 'vertical' ? 'w-[150px] h-[150px] mx-auto' : 'w-[100px] h-[100px]'}`}
              >
                <AngleSlider.Control className="absolute inset-0">
                  <svg
                    width={layout === 'vertical' ? width : widthHorizontal}
                    height={layout === 'vertical' ? width : widthHorizontal}
                    viewBox={`0 0 ${layout === 'vertical' ? width : widthHorizontal} ${layout === 'vertical' ? width : widthHorizontal}`}
                    className={`[--gradient-start:var(--color-start)] [--gradient-end:var(--color-end)]`}
                    style={
                      {
                        "--size": `${layout === 'vertical' ? width : widthHorizontal}px`,
                        "--thickness": `${layout === 'vertical' ? thickness : thicknessHorizontal}px`,
                        "--percent": `${percentValue}`,
                        "--color-start": `rgb(${param.key === "temperature" ? "255, 0, 0" : param.key === "pollution" ? "139, 69, 19" : param.key === "rainfall" ? "0, 150, 255" : "173, 216, 230"})`,
                        "--color-end": `rgb(${param.key === "temperature" ? "255, 255, 0" : param.key === "pollution" ? "139, 139, 139" : param.key === "rainfall" ? "0, 255, 255" : "255, 255, 255"})`,
                      } as React.CSSProperties
                    }
                  >
                    <title>{param.label}</title>
                    {/* Track circle */}
                    <circle
                      className="stroke-gray-400 dark:stroke-gray-600 fill-transparent"
                      style={
                        {
                          "--radius": `calc(var(--size) / 2 - var(--thickness) / 2)`,
                          cx: "calc(var(--size) / 2)",
                          cy: "calc(var(--size) / 2)",
                          r: "var(--radius)",
                          strokeWidth: "var(--thickness)",
                        } as React.CSSProperties
                      }
                    />
                    {/* Progress circle */}
                    <circle
                      className="fill-transparent"
                      style={
                        {
                          "--radius": `calc(var(--size) / 2 - var(--thickness) / 2)`,
                          cx: "calc(var(--size) / 2)",
                          cy: "calc(var(--size) / 2)",
                          r: "var(--radius)",
                          strokeWidth: "var(--thickness)",
                          "--circumference": `calc(2 * 3.14159 * var(--radius))`,
                          "--offset": `calc(var(--circumference) * (100 - var(--percent)) / 100)`,
                          strokeDashoffset: `calc(var(--circumference) * (100 - var(--percent)) / 100)`,
                          strokeDasharray: "var(--circumference)",
                          strokeLinecap: "round",
                          transformOrigin: "center",
                          transform: "rotate(-90deg)",
                          stroke: `url(#gradient-${param.key})`,
                        } as React.CSSProperties
                      }
                    />
                    {/* Gradient definitions */}
                    <defs>
                      <linearGradient
                        id={`gradient-${param.key}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--color-start)"
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--color-end)"
                        />
                      </linearGradient>
                    </defs>
                  </svg>
                  <AngleSlider.Thumb className="absolute top-0 right-0 bottom-0 left-[calc(50%-1.5px)] pointer-events-none h-full w-[3px] flex items-start outline-hidden">
                    <span
                      className={`bg-gradient-to-br ${param.color} ${param.darkColor} w-4 h-4 rounded-full shrink-0 scale-100 shadow-lg border-2 border-white dark:border-gray-800`}
                    />
                  </AngleSlider.Thumb>
                </AngleSlider.Control>
                <AngleSlider.HiddenInput />
              </AngleSlider.Root>
            </div>
          );
        })}
      </div>
    </div>
  );
}
