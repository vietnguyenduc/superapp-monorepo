const fs = require('fs');
const path = require('path');

const inputPath = 'C:\\Users\\Lenovo ThinkBook 14\\.gemini\\antigravity\\brain\\3caf0b7b-48ce-4677-af80-5a3c062d4601\\.system_generated\\steps\\76\\output.txt';
const outputPath = 'c:\\Vibecoding\\superapp-monorepo\\packages\\types\\src\\database.types.ts';

try {
  const data = fs.readFileSync(inputPath, 'utf8');
  const json = JSON.parse(data);
  
  if (json.types) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, json.types, 'utf8');
    console.log('Types successfully written to', outputPath);
  } else {
    console.error('No types found in JSON');
  }
} catch (error) {
  console.error('Error processing file:', error);
}
