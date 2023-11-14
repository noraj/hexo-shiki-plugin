const shiki = require("shiki");
const stripIndent = require("strip-indent");
const themes = require("./lib/themes");
const codeMatch =
  /^(?<start>\s*)(?<tick>~{3,}|`{3,})\s*(?<args>.*)\n(?<code>[\s\S]*?)^\s*\k<tick>(?<end>\s*)$/gm;
const theme = themes.has(config.theme) ? config.theme : "one-dark-pro";
const config = hexo.config.shiki;
const css = hexo.extend.helper.get("css").bind(hexo);
const js = hexo.extend.helper.get("js").bind(hexo);
hexo.extend.injector.register("head_end", () => {
  return css("https://unpkg.com/hexo-shiki-plugin@latest/lib/codeblock.css");
});
hexo.extend.injector.register("head_end", () => {
  return themes.get(theme);
});
hexo.extend.injector.register("head_end", () => {
  return `
  <style>.code-expand-btn:not(.expand-done)~pre,.code-expand-btn:not(.expand-done)~table{height:${hexo.config.shiki.highlightHeightLimit}px}</style>
  `;
});
hexo.extend.injector.register("body_end", () => {
  return js("https://unpkg.com/hexo-shiki-plugin@latest/lib/codeblock.js");
});
hexo.extend.injector.register("body_end", () => {
  const {
    beatutify,
    highlight_copy,
    highlight_lang,
    highlight_height_limit,
    is_highlight_shrink,
    copy: { success, error, no_support },
  } = hexo.config.shiki;
  return `
  <script>
  const CODE_CONFIG = {
    beautify: ${beatutify},
    highlightCopy: ${highlight_copy},
    highlightLang: ${highlight_lang},
    highlightHeightLimit: ${highlight_height_limit},
    isHighlightShrink: ${is_highlight_shrink},
    copy: {
      success: ${success},
      error: ${error},
      noSupport: ${no_support},
    }
  }
  </script>
  `;
});
return shiki
  .getHighlighter({
    theme,
  })
  .then((hl) => {
    hexo.extend.filter.register("before_post_render", (post) => {
      post.content = post.content.replace(codeMatch, (...argv) => {
        let { start, end, args, code } = argv.pop();
        let result;
        try {
          code = stripIndent(code.trimEnd());
          const arr = code.split("\n");
          let numbers = "";
          for (let i = 0, len = arr.length; i < len; i++) {
            numbers += `<span class="line">${1 + i}</span><br>`;
          }
          const pre = hl.codeToHtml(code, { lang: args });
          result = `<figure class="shiki${args ? ` ${args}` : ""}"${
            args ? ` data-language="${args}"` : ""
          }>`;
          result += "<table><tr>";
          result += `<td class="gutter"><pre>${numbers}</pre></td>`;
          result += `<td class="code">${pre}</td>`;
          result += "</tr></table></figure>";
          return `${start}<hexoPostRenderCodeBlock>${result}</hexoPostRenderCodeBlock>${end}`;
        } catch (e) {
          console.error(e);
          return `${start}<hexoPostRenderCodeBlock>${code}</hexoPostRenderCodeBlock>${end}`;
        }
      });
    });
  });
