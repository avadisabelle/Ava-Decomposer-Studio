import fs from 'fs';
import path from 'path';

try {
  const esmPath = path.resolve('node_modules/ava-langchain-prompt-decomposition/dist/index.js');
  if (fs.existsSync(esmPath)) {
    let esm = fs.readFileSync(esmPath, 'utf8');
    if (!esm.includes('var DirectionalAnalysis =')) {
      esm = esm.replace(
        'export {',
        'var DirectionalAnalysis = {};\nvar DirectionalInsight = {};\nvar IntentExtractionResult = {};\nvar SecondaryIntent = {};\nvar PrimaryIntent = {};\nexport {\n  DirectionalAnalysis,\n  DirectionalInsight,\n  IntentExtractionResult,\n  SecondaryIntent,\n  PrimaryIntent,'
      );
      fs.writeFileSync(esmPath, esm);
    }
  }

  const cjsPath = path.resolve('node_modules/ava-langchain-prompt-decomposition/dist/index.cjs');
  if (fs.existsSync(cjsPath)) {
    let cjs = fs.readFileSync(cjsPath, 'utf8');
    if (!cjs.includes('DirectionalAnalysis')) {
      cjs += '\nexports.DirectionalAnalysis = {};\nexports.DirectionalInsight = {};\nexports.IntentExtractionResult = {};\nexports.SecondaryIntent = {};\nexports.PrimaryIntent = {};\n';
      fs.writeFileSync(cjsPath, cjs);
    }
  }
} catch (e) {
  console.warn('Note: patch-ava completed with notice:', e.message);
}
