import * as changeCase from "change-case-all";

import config from "./config.mjs";

// eslint-disable-next-line security/detect-non-literal-regexp
const parseRegex = new RegExp(
  `${config.injectionStartDelimiter}(.*?)${config.injectionEndDelimiter}`,
  "g"
);
// eslint-disable-next-line security/detect-non-literal-regexp
const argsRegex = new RegExp(
  `${config.injectionStartDelimiter}|${config.injectionEndDelimiter}`,
  "g"
);

export default class TemplateEngine {
  static #parse(inputTemplate) {
    let template = inputTemplate;

    let result = parseRegex.exec(template);
    const arr = [];
    let firstPos;

    while (result) {
      firstPos = result.index;
      if (firstPos !== 0) {
        arr.push(template.substring(0, firstPos));
        template = template.slice(firstPos);
      }

      arr.push(result[0]);
      template = template.slice(result[0].length);
      result = parseRegex.exec(template);
    }

    if (template) arr.push(template);
    return arr;
  }

  static #compile(templateArray, data) {
    const injectedData = data || {};
    let compiledText = ``;
    templateArray.forEach((text) => {
      if (
        text.startsWith(config.injectionStartDelimiter) &&
        text.endsWith(config.injectionEndDelimiter)
      ) {
        const sectionArgs = TemplateEngine.#readSectionArgs(text);
        const sectionKey = (sectionArgs[0] || "").trim();
        const sectionOptions = (sectionArgs[1] || "").trim();
        compiledText += `${TemplateEngine.#formatSectionData(
          injectedData[`${sectionKey}`],
          sectionOptions.split()
        )}`;
      } else {
        compiledText += `${text}`;
      }
    });
    return compiledText;
  }

  static #readSectionArgs(argsText) {
    return (argsText.split(argsRegex).filter(Boolean)[0].trim() || "").split(
      "|"
    );
  }

  static #formatSectionData(text, options) {
    let formalizedText = text || "";
    options.forEach((option) => {
      let method = null;
      if (option.startsWith("case:")) {
        method = changeCase[`${option.split(":")[1]}`];
      }
      if (method) formalizedText = method(formalizedText);
    });
    return formalizedText;
  }

  static process(template, data) {
    return TemplateEngine.#compile(TemplateEngine.#parse(template), data);
  }
}
