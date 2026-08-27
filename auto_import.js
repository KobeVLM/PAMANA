const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'backend/src/main/java/com/pamana');
const testDir = path.join(__dirname, 'backend/src/test/java/com/pamana');

const classMap = {
  // Auth
  'AuthController': 'com.pamana.auth.AuthController',
  'AuthService': 'com.pamana.auth.AuthService',
  'UserRepository': 'com.pamana.auth.UserRepository',
  'User': 'com.pamana.auth.User',
  'Role': 'com.pamana.auth.Role',
  'AuthResponse': 'com.pamana.auth.dto.AuthResponse',
  'LoginRequest': 'com.pamana.auth.dto.LoginRequest',
  'RegisterRequest': 'com.pamana.auth.dto.RegisterRequest',
  'UserResponse': 'com.pamana.auth.dto.UserResponse',
  // Klase
  'KlaseController': 'com.pamana.klase.KlaseController',
  'KlaseService': 'com.pamana.klase.KlaseService',
  'KlaseRepository': 'com.pamana.klase.KlaseRepository',
  'Klase': 'com.pamana.klase.Klase',
  'CreateKlaseRequest': 'com.pamana.klase.dto.CreateKlaseRequest',
  'KlaseResponse': 'com.pamana.klase.dto.KlaseResponse',
  'LeaderboardEntry': 'com.pamana.klase.dto.LeaderboardEntry',
  // Syllable
  'SyllableController': 'com.pamana.syllable.SyllableController',
  'SyllableService': 'com.pamana.syllable.SyllableService',
  'SyllableProgressRepository': 'com.pamana.syllable.SyllableProgressRepository',
  'SyllableProgress': 'com.pamana.syllable.SyllableProgress',
  'SyllableProgressRequest': 'com.pamana.syllable.dto.SyllableProgressRequest',
  'SyllableProgressResponse': 'com.pamana.syllable.dto.SyllableProgressResponse',
  'SyllableSetResponse': 'com.pamana.syllable.dto.SyllableSetResponse',
  'SyllableStatusResponse': 'com.pamana.syllable.dto.SyllableStatusResponse',
  // Vocabulary
  'VocabularyController': 'com.pamana.vocabulary.VocabularyController',
  'VocabularyService': 'com.pamana.vocabulary.VocabularyService',
  'VocabularyItemRepository': 'com.pamana.vocabulary.VocabularyItemRepository',
  'WordMasteryRepository': 'com.pamana.vocabulary.WordMasteryRepository',
  'VocabularyItem': 'com.pamana.vocabulary.VocabularyItem',
  'WordMastery': 'com.pamana.vocabulary.WordMastery',
  'VocabularyProgressRequest': 'com.pamana.vocabulary.dto.VocabularyProgressRequest',
  'VocabularyWordResponse': 'com.pamana.vocabulary.dto.VocabularyWordResponse',
  'WordMasteryResponse': 'com.pamana.vocabulary.dto.WordMasteryResponse',
  'WordMasteryStatus': 'com.pamana.vocabulary.dto.WordMasteryStatus',
  'MatchOptionsResponse': 'com.pamana.vocabulary.dto.MatchOptionsResponse',
  // Hamon
  'HamonService': 'com.pamana.hamon.HamonService',
  'HamonSessionRepository': 'com.pamana.hamon.HamonSessionRepository',
  'HamonSession': 'com.pamana.hamon.HamonSession',
  'HamonResultResponse': 'com.pamana.hamon.dto.HamonResultResponse',
  'HamonSessionResponse': 'com.pamana.hamon.dto.HamonSessionResponse',
  // Sentence
  'SentenceController': 'com.pamana.sentence.SentenceController',
  'SentenceService': 'com.pamana.sentence.SentenceService',
  'SentenceProgressRepository': 'com.pamana.sentence.SentenceProgressRepository',
  'SentenceProgress': 'com.pamana.sentence.SentenceProgress',
  'SentenceProgressRequest': 'com.pamana.sentence.dto.SentenceProgressRequest',
  'SentenceResultResponse': 'com.pamana.sentence.dto.SentenceResultResponse',
  'SentenceTaskResponse': 'com.pamana.sentence.dto.SentenceTaskResponse',
  // Progress
  'ModuleController': 'com.pamana.progress.ModuleController',
  'ProgressController': 'com.pamana.progress.ProgressController',
  'ModuleLockService': 'com.pamana.progress.ModuleLockService',
  'ProgressService': 'com.pamana.progress.ProgressService',
  'ModuleAttemptHistoryRepository': 'com.pamana.progress.ModuleAttemptHistoryRepository',
  'ModuleProgressRepository': 'com.pamana.progress.ModuleProgressRepository',
  'ModuleAttemptHistory': 'com.pamana.progress.ModuleAttemptHistory',
  'ModuleProgress': 'com.pamana.progress.ModuleProgress',
  'ModuleAccuracy': 'com.pamana.progress.dto.ModuleAccuracy',
  // Parent
  'ParentController': 'com.pamana.parent.ParentController',
  'ReportController': 'com.pamana.parent.ReportController',
  'ReportService': 'com.pamana.parent.ReportService',
  'ParentReportRepository': 'com.pamana.parent.ParentReportRepository',
  'SessionLogRepository': 'com.pamana.parent.SessionLogRepository',
  'ParentReport': 'com.pamana.parent.ParentReport',
  'SessionLog': 'com.pamana.parent.SessionLog',
  'DashboardResponse': 'com.pamana.parent.dto.DashboardResponse',
  'LearnerDetail': 'com.pamana.parent.dto.LearnerDetail',
  'LinkLearnerRequest': 'com.pamana.parent.dto.LinkLearnerRequest',
  // Common
  'BaseGameService': 'com.pamana.common.BaseGameService',
  'DialogueResponse': 'com.pamana.common.dto.DialogueResponse',
  // Security config
  'JwtTokenProvider': 'com.pamana.security.JwtTokenProvider',
  'JwtAuthenticationFilter': 'com.pamana.security.JwtAuthenticationFilter',
  'SecurityConfig': 'com.pamana.security.SecurityConfig',
};

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.java')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // 1. Remove all old wildcard imports
      content = content.replace(/^import com\.pamana\.(model|dto|service|repository|controller)\.\*;/gm, '');
      
      // 2. Inline exact replacements (e.g. com.pamana.dto.LoginRequest -> com.pamana.auth.dto.LoginRequest)
      for (const [className, fqcn] of Object.entries(classMap)) {
        const regex = new RegExp(`com\\.pamana\\.(model|dto|service|repository|controller)\\.${className}\\b`, 'g');
        content = content.replace(regex, fqcn);
      }
      
      // 3. Inject explicit imports for any class used in this file
      const words = new Set(content.match(/[a-zA-Z0-9_]+/g) || []);
      const importsToInject = [];
      for (const [className, fqcn] of Object.entries(classMap)) {
        if (words.has(className)) {
          importsToInject.push(`import ${fqcn};`);
        }
      }
      
      if (importsToInject.length > 0) {
        const importBlock = importsToInject.join('\n') + '\n';
        content = content.replace(/^(package\s+[a-zA-Z0-9_.]+;)\r?\n/m, `$1\n\n${importBlock}`);
      }
      
      // 4. Clean up duplicate imports
      let lines = content.split(/\r?\n/);
      let seenImports = new Set();
      lines = lines.filter(line => {
         if (line.startsWith('import ')) {
             if (seenImports.has(line)) return false;
             seenImports.add(line);
         }
         return true;
      });
      content = lines.join('\n');
      
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
}

console.log("Processing auto-imports...");
processDirectory(baseDir);
processDirectory(testDir);
console.log("Done.");
