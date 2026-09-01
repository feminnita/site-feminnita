"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchColorSwatches } from "../../services/colorsService";
import type { ColorSwatch } from "../../types/colors/colors";

const ColorSwatchContext = createContext<ColorSwatch[]>([]);

export function ColorSwatchesProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [swatches, setSwatches] = useState<ColorSwatch[]>([]);

    useEffect(() => {
        fetchColorSwatches()
            .then(setSwatches)
            .catch(() => { });
    }, []);

    return (
        <ColorSwatchContext.Provider value={swatches}>
            {children}
        </ColorSwatchContext.Provider>
    );
}

export function useColorSwatches(): ColorSwatch[] {
    return useContext(ColorSwatchContext);
}
