import useCanvas from "../../hooks/useCanvas";

export default function Canvas() {

    const {

        canvasRef,

        handleMouseDown,

        handleMouseMove,

        stopDrawing

    } = useCanvas();

    return (

        <main className="flex-1 bg-slate-100 p-6">

            <canvas

                ref={canvasRef}

                onMouseDown={handleMouseDown}

                onMouseMove={handleMouseMove}

                onMouseUp={stopDrawing}

                onMouseLeave={stopDrawing}

                className="w-full h-full bg-white rounded-xl shadow-lg cursor-crosshair"

            />

        </main>

    );

}