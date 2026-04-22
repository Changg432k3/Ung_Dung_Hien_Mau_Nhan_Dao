const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (filePath.endsWith('AppContext.tsx')) {
    // Event interface
    content = content.replace(/date: string;/, 'startDate: string;\n  endDate: string;');
    
    // MOCK_EVENTS
    content = content.replace(/date: '2024-03-15',/g, "startDate: '2024-03-15',\n    endDate: '2024-03-16',");
    content = content.replace(/date: '2024-03-20',/g, "startDate: '2024-03-20',\n    endDate: '2024-03-21',");
    content = content.replace(/date: '2024-03-05',/g, "startDate: '2024-03-05',\n    endDate: '2024-03-06',");
    content = content.replace(/date: '2024-04-10',/g, "startDate: '2024-04-10',\n    endDate: '2024-04-11',");
    content = content.replace(/date: '2024-03-25',/g, "startDate: '2024-03-25',\n    endDate: '2024-03-26',");
    content = content.replace(/date: '2024-03-10',/g, "startDate: '2024-03-10',\n    endDate: '2024-03-11',");
    content = content.replace(/date: '2024-04-05',/g, "startDate: '2024-04-05',\n    endDate: '2024-04-06',");
    content = content.replace(/date: '2026-03-02',/g, "startDate: '2026-03-02',\n    endDate: '2026-03-03',");
    
    // getEventStatus
    content = content.replace(/const eventDate = new Date\(event\.date\);/g, "const eventStartDate = new Date(event.startDate);\n    const eventEndDate = new Date(event.endDate);");
    content = content.replace(/const startDateTime = new Date\(eventDate\);/g, "const startDateTime = new Date(eventStartDate);");
    content = content.replace(/const endDateTime = new Date\(eventDate\);/g, "const endDateTime = new Date(eventEndDate);");
    
    // registerForEvent
    content = content.replace(/date: event\.date,/g, "date: event.startDate,");
  }
  
  fs.writeFileSync(filePath, content);
}

processFile('src/store/AppContext.tsx');
