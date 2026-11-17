// The full Prism build bundles every language and roughly doubled the size
// of the app's JavaScript. Register only the languages RGPT is likely to
// answer in; anything else is shown as plain text.
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';

const languages = {
  bash: [bash, 'sh', 'shell', 'zsh'],
  c: [c],
  cpp: [cpp, 'c++', 'cc', 'hpp'],
  csharp: [csharp, 'cs', 'c#'],
  css: [css],
  go: [go, 'golang'],
  java: [java],
  javascript: [javascript, 'js'],
  json: [json],
  jsx: [jsx],
  kotlin: [kotlin, 'kt'],
  markup: [markup, 'html', 'xml', 'svg'],
  php: [php],
  python: [python, 'py'],
  rust: [rust, 'rs'],
  sql: [sql],
  tsx: [tsx],
  typescript: [typescript, 'ts'],
  yaml: [yaml, 'yml'],
};

for (const [name, [grammar, ...aliases]] of Object.entries(languages)) {
  for (const alias of [name, ...aliases]) {
    SyntaxHighlighter.registerLanguage(alias, grammar);
  }
}

export default SyntaxHighlighter;
