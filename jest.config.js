module.exports = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transformIgnorePatterns: ["node_modules/(?!(whatwg-fetch)/)"],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.(ts|tsx)?$": ["ts-jest", { babelConfig: true }],
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};
