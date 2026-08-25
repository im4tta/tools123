// /// <reference path="../node_modules/onnxruntime-web/types.d.ts" />
// onnxruntime-web ships an ambient `declare module 'onnxruntime-web'` in its single
// types.d.ts which re-exports from `onnxruntime-common`. Including that file gives
// TS the real types; the reference below points at it so it's loaded under the
// bundler resolution even though node_modules is excluded from the auto-glob.
/// <reference path="../node_modules/onnxruntime-web/types.d.ts" />
