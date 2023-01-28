import { ResizeObserver } from "@juggle/resize-observer";
import { useEffect, useRef, useState } from "react";

interface Dimensions {
  marginTop: number,
  marginBottom: number,
  marginRight: number,
  marginLeft: number,
  height: number,
  width: number,
}

interface BoundedDimensions extends Dimensions {
  boundedHeight: number,
  boundedWidth: number,
}

export const useChartDimensions = (passedSettings: Dimensions): [React.RefObject<HTMLDivElement>, BoundedDimensions] => {
  const ref = useRef<HTMLDivElement>(null);
  const dimensions = combineChartDimensions(passedSettings);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    // if (dimensions.width && dimensions.height) return [ref, dimensions];

    const element = ref.current;
    if (element) {
      const resizeObserver = new ResizeObserver((entries) => {
        if (!Array.isArray(entries)) return;
        if (!entries.length) return;
  
        const entry = entries[0];
  
        if (width != entry.contentRect.width) setWidth(entry.contentRect.width);
        if (height != entry.contentRect.height) setHeight(entry.contentRect.height);
      });
      resizeObserver.observe(element);
  
      return () => resizeObserver.unobserve(element);
    }
  }, []);

  const newSettings = combineChartDimensions({
    ...dimensions,
    width: dimensions.width || width,
    height: dimensions.height || height,
  });

  // return [ref, newSettings];
  return [ref, newSettings];
};


const combineChartDimensions = (dimensions: Dimensions): BoundedDimensions => {
  const parsedDimensions = {
    ...dimensions,
    marginTop: dimensions.marginTop || 10,
    marginRight: dimensions.marginRight || 10,
    marginBottom: dimensions.marginBottom || 40,
    marginLeft: dimensions.marginLeft || 75,
  };
  return {
    ...parsedDimensions,
    boundedHeight: Math.max(
      parsedDimensions.height - parsedDimensions.marginTop - parsedDimensions.marginBottom,
      0,
    ),
    boundedWidth: Math.max(
      parsedDimensions.width - parsedDimensions.marginLeft - parsedDimensions.marginRight,
      0,
    ),
  };
};
