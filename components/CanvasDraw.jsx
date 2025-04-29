import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";

const CanvasDraw = forwardRef(({ penSize = 2 }, ref) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const ctxRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Fill white background once at start
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Initial style
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = penSize; // (initially)

    ctxRef.current = ctx;

    const getEventPosition = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      if (e.touches && e.touches.length > 0) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        };
      } else {
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      }
    };

    const startDrawing = (e) => {
      e.preventDefault();
      const { x, y } = getEventPosition(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      isDrawing.current = true;
    };

    const draw = (e) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const { x, y } = getEventPosition(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = (e) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      ctx.closePath();
      isDrawing.current = false;
    };

    // Attach events
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    canvas.addEventListener("touchstart", startDrawing);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", stopDrawing);
    canvas.addEventListener("touchcancel", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseout", stopDrawing);

      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDrawing);
      canvas.removeEventListener("touchcancel", stopDrawing);
    };
  }, []);

  // Update pen size without resetting canvas
  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.lineWidth = penSize;
    }
  }, [penSize]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    },
    getDataURL: () => {
      const canvas = canvasRef.current;
      return canvas.toDataURL("image/png");
    }
  }));

  return (
    <div className="relative w-full h-full overflow-hidden rounded border border-gray-200 bg-white">
      <canvas
        ref={canvasRef}
        width={256}
        height={256}
        className="absolute top-0 left-0 w-full h-full touch-none"
      />
    </div>
  );
});

export default CanvasDraw;
