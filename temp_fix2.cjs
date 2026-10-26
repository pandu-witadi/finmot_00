const fs = require('fs');
const content = fs.readFileSync('E:\\code\\dev\\MFRN\\finmot_00\\frontend\\src\\pages\\ProjectDetail\\ProjectBudgets.tsx', 'utf8');

// Fix header Amount cell border
const newContent = content.replace(
  /border-r border-green-300">Amount<\/TableHead>/g,
  'border-r border-purple-500">Amount</TableHead>'
);

fs.writeFileSync('E:\\code\\dev\\MFRN\\finmot_00\\frontend\\src\\pages\\ProjectDetail\\ProjectBudgets.tsx', newContent, 'utf8');
console.log('Done');