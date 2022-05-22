import typescript from "@rollup/plugin-typescript"

export default {
  input: "./packages/vue/src/index.ts",
  output: [
    {
      format: "cjs",
      file: "lib/mini-vue.cjs.js",
    },
    {
      format: "es",
      file: "lib/mini-vue.esm.js",
    },
  ],
  plugins: [typescript()],
  onwarn: (msg, warn) => {
    if (!/Circular/.test(msg)) {
      warn(msg)
    }
  },
}
