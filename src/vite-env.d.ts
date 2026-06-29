/// <reference types="vite/client" />

// Les paquets fontsource exposent du CSS sans declarations de types :
// on les declare comme modules a effet de bord.
declare module "@fontsource-variable/*";
declare module "@fontsource/*";
