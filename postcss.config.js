import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default (ctx) => ({
  from: ctx.file,
  plugins: [tailwindcss(), autoprefixer()],
});

