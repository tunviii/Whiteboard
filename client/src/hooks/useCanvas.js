import { useEffect, useRef } from "react";
import { drawLine } from "../utils/drawLine";

export default function useCanvas() {

    const canvasRef = useRef(null);

    const isDrawing = useRef(false);

    const lastPoint = useRef({
        x: 0,
        y: 0
    });

    useEffect(() => {

        const canvas = canvasRef.current;

        const ctx = canvas.getContext("2d");

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

    }, []);

    const getMousePos = (e) => {

        const rect = canvasRef.current.getBoundingClientRect();

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

    };

    const handleMouseDown = (e) => {

        isDrawing.current = true;

        lastPoint.current = getMousePos(e);

    };

    const handleMouseMove = (e) => {

        if (!isDrawing.current) return;

        const ctx = canvasRef.current.getContext("2d");

        const current = getMousePos(e);

        drawLine(
            ctx,
            lastPoint.current.x,
            lastPoint.current.y,
            current.x,
            current.y
        );

        lastPoint.current = current;

    };

    const stopDrawing = () => {

        isDrawing.current = false;

    };

    return {

        canvasRef,

        handleMouseDown,

        handleMouseMove,

        stopDrawing

    };

}