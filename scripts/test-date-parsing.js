const WordPressImporter = require('./wordpress-import');

// Test the date parsing logic
function testDateParsing() {
  console.log('📅 Testing WordPress Date Parsing...');
  
  const importer = new WordPressImporter();
  
  // Test various WordPress date formats
  const testDates = [
    '2024-07-05 12:22:22',           // WordPress post_date format
    'Fri, 05 Jul 2024 12:22:22 +0000', // RSS pubDate format
    '2024-12-25 00:00:00',           // Christmas example
    '2023-01-01 15:30:45',           // New Year example
    '',                              // Empty date
    null,                            // Null date
    'invalid-date'                   // Invalid format
  ];
  
  console.log('\n🔍 Date Parsing Results:');
  
  testDates.forEach((dateString, i) => {
    const parsed = importer.parseWordPressDate(dateString);
    const input = dateString || '(empty)';
    
    console.log(`   ${i + 1}. Input:  "${input}"`);
    console.log(`      Output: ${parsed.toISOString()}`);
    console.log(`      Display: ${parsed.toDateString()} ${parsed.toTimeString()}`);
    console.log('');
  });
  
  // Test date preservation scenario
  console.log('🎯 Article Dating Scenario:');
  const mockArticle = {
    title: 'Sample Article',
    postDate: '2024-07-05 12:22:22',
    modifiedDate: '2024-07-12 17:04:19',
    pubDate: 'Fri, 05 Jul 2024 12:22:22 +0000'
  };
  
  const originalDate = importer.parseWordPressDate(mockArticle.postDate);
  const modifiedDate = importer.parseWordPressDate(mockArticle.modifiedDate);
  
  console.log(`   📝 Article: "${mockArticle.title}"`);
  console.log(`   📅 Created:  ${originalDate.toDateString()}`);
  console.log(`   📅 Modified: ${modifiedDate.toDateString()}`);
  console.log(`   ⏰ Time difference: ${Math.round((modifiedDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24))} days`);
  
  console.log('\n✅ Date parsing test completed!');
  console.log('📊 All WordPress articles will maintain their original publication timeline.');
}

testDateParsing(); 