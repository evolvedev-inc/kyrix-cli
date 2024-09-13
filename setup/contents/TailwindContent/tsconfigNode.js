export const tsconfigNodeContent = `
{
  "compilerOptions": {
    "module": "esnext",
    "lib": ["ES2023"],
    "target": "ESNext",
    "moduleResolution": "Node",
    "skipLibCheck": true,

    /* Bundler mode */
    "allowImportingTsExtensions": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    "baseUrl": ".",
    "paths": {
      "@kyrix/server": ["./packages/@kyrix/server/index.ts"]
    }
  },
  "include": ["vite.config.server.ts", "postcss.config.ts", "tailwind.config.ts", "./src/server/**/*", "./packages/@kyrix/server/**/*"],
  "exclude": ["node_modules"]
}
`;
