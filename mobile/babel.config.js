module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Transforms import.meta → globalThis.__ExpoImportMetaRegistry
          // Required for web builds since Metro outputs a non-module script
          unstable_transformImportMeta: true,
        },
      ],
    ],
  };
};
