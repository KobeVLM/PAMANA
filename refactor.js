const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'backend/src/main/java/com/pamana');
const testDir = path.join(__dirname, 'backend/src/test/java/com/pamana');

const mapping = {
  // Auth
  'controller/AuthController.java': 'auth/AuthController.java',
  'service/AuthService.java': 'auth/AuthService.java',
  'repository/UserRepository.java': 'auth/UserRepository.java',
  'model/User.java': 'auth/User.java',
  'model/Role.java': 'auth/Role.java',
  'dto/AuthResponse.java': 'auth/dto/AuthResponse.java',
  'dto/LoginRequest.java': 'auth/dto/LoginRequest.java',
  'dto/RegisterRequest.java': 'auth/dto/RegisterRequest.java',
  'dto/UserResponse.java': 'auth/dto/UserResponse.java',
  
  // Klase
  'controller/KlaseController.java': 'klase/KlaseController.java',
  'service/KlaseService.java': 'klase/KlaseService.java',
  'repository/KlaseRepository.java': 'klase/KlaseRepository.java',
  'model/Klase.java': 'klase/Klase.java',
  'dto/CreateKlaseRequest.java': 'klase/dto/CreateKlaseRequest.java',
  'dto/KlaseResponse.java': 'klase/dto/KlaseResponse.java',
  'dto/LeaderboardEntry.java': 'klase/dto/LeaderboardEntry.java',
  
  // Syllable
  'controller/SyllableController.java': 'syllable/SyllableController.java',
  'service/SyllableService.java': 'syllable/SyllableService.java',
  'repository/SyllableProgressRepository.java': 'syllable/SyllableProgressRepository.java',
  'model/SyllableProgress.java': 'syllable/SyllableProgress.java',
  'dto/SyllableProgressRequest.java': 'syllable/dto/SyllableProgressRequest.java',
  'dto/SyllableProgressResponse.java': 'syllable/dto/SyllableProgressResponse.java',
  'dto/SyllableSetResponse.java': 'syllable/dto/SyllableSetResponse.java',
  'dto/SyllableStatusResponse.java': 'syllable/dto/SyllableStatusResponse.java',
  
  // Vocabulary
  'controller/VocabularyController.java': 'vocabulary/VocabularyController.java',
  'service/VocabularyService.java': 'vocabulary/VocabularyService.java',
  'repository/VocabularyItemRepository.java': 'vocabulary/VocabularyItemRepository.java',
  'repository/WordMasteryRepository.java': 'vocabulary/WordMasteryRepository.java',
  'model/VocabularyItem.java': 'vocabulary/VocabularyItem.java',
  'model/WordMastery.java': 'vocabulary/WordMastery.java',
  'dto/VocabularyProgressRequest.java': 'vocabulary/dto/VocabularyProgressRequest.java',
  'dto/VocabularyWordResponse.java': 'vocabulary/dto/VocabularyWordResponse.java',
  'dto/WordMasteryResponse.java': 'vocabulary/dto/WordMasteryResponse.java',
  'dto/WordMasteryStatus.java': 'vocabulary/dto/WordMasteryStatus.java',
  'dto/MatchOptionsResponse.java': 'vocabulary/dto/MatchOptionsResponse.java',
  
  // Hamon
  'service/HamonService.java': 'hamon/HamonService.java',
  'repository/HamonSessionRepository.java': 'hamon/HamonSessionRepository.java',
  'model/HamonSession.java': 'hamon/HamonSession.java',
  'dto/HamonResultResponse.java': 'hamon/dto/HamonResultResponse.java',
  'dto/HamonSessionResponse.java': 'hamon/dto/HamonSessionResponse.java',
  
  // Sentence
  'controller/SentenceController.java': 'sentence/SentenceController.java',
  'service/SentenceService.java': 'sentence/SentenceService.java',
  'repository/SentenceProgressRepository.java': 'sentence/SentenceProgressRepository.java',
  'model/SentenceProgress.java': 'sentence/SentenceProgress.java',
  'dto/SentenceProgressRequest.java': 'sentence/dto/SentenceProgressRequest.java',
  'dto/SentenceResultResponse.java': 'sentence/dto/SentenceResultResponse.java',
  'dto/SentenceTaskResponse.java': 'sentence/dto/SentenceTaskResponse.java',
  
  // Progress
  'controller/ModuleController.java': 'progress/ModuleController.java',
  'controller/ProgressController.java': 'progress/ProgressController.java',
  'service/ModuleLockService.java': 'progress/ModuleLockService.java',
  'service/ProgressService.java': 'progress/ProgressService.java',
  'repository/ModuleAttemptHistoryRepository.java': 'progress/ModuleAttemptHistoryRepository.java',
  'repository/ModuleProgressRepository.java': 'progress/ModuleProgressRepository.java',
  'model/ModuleAttemptHistory.java': 'progress/ModuleAttemptHistory.java',
  'model/ModuleProgress.java': 'progress/ModuleProgress.java',
  'dto/ModuleAccuracy.java': 'progress/dto/ModuleAccuracy.java',
  
  // Parent
  'controller/ParentController.java': 'parent/ParentController.java',
  'controller/ReportController.java': 'parent/ReportController.java',
  'service/ReportService.java': 'parent/ReportService.java',
  'repository/ParentReportRepository.java': 'parent/ParentReportRepository.java',
  'repository/SessionLogRepository.java': 'parent/SessionLogRepository.java',
  'model/ParentReport.java': 'parent/ParentReport.java',
  'model/SessionLog.java': 'parent/SessionLog.java',
  'dto/DashboardResponse.java': 'parent/dto/DashboardResponse.java',
  'dto/LearnerDetail.java': 'parent/dto/LearnerDetail.java',
  'dto/LinkLearnerRequest.java': 'parent/dto/LinkLearnerRequest.java',
  
  // Common
  'service/BaseGameService.java': 'common/BaseGameService.java',
  'dto/DialogueResponse.java': 'common/dto/DialogueResponse.java',
};

// Also test files
const testMapping = {
  'controller/AuthControllerTest.java': 'auth/AuthControllerTest.java',
  'controller/SentenceControllerTest.java': 'sentence/SentenceControllerTest.java',
  'controller/SyllableControllerTest.java': 'syllable/SyllableControllerTest.java',
  'controller/VocabularyControllerTest.java': 'vocabulary/VocabularyControllerTest.java',
};

// Package replacements
const importReplacements = Object.entries(mapping).map(([oldRelPath, newRelPath]) => {
  const oldClassPath = oldRelPath.replace('.java', '').replace(/\//g, '.');
  const newClassPath = newRelPath.replace('.java', '').replace(/\//g, '.');
  return {
    oldImport: `com.pamana.${oldClassPath}`,
    newImport: `com.pamana.${newClassPath}`,
  };
});

function moveFiles(dir, map) {
  Object.entries(map).forEach(([oldRel, newRel]) => {
    const oldPath = path.join(dir, oldRel);
    const newPath = path.join(dir, newRel);
    
    if (fs.existsSync(oldPath)) {
      fs.mkdirSync(path.dirname(newPath), { recursive: true });
      fs.renameSync(oldPath, newPath);
      console.log(`Moved ${oldRel} to ${newRel}`);
    } else {
      console.warn(`File not found: ${oldPath}`);
    }
  });
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.java')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Update package declarations
      // Find the relative path from baseDir or testDir
      let relPath;
      if (filePath.includes('src\\main\\java\\com\\pamana')) {
        relPath = filePath.split('src\\main\\java\\com\\pamana\\')[1];
      } else if (filePath.includes('src\\test\\java\\com\\pamana')) {
        relPath = filePath.split('src\\test\\java\\com\\pamana\\')[1];
      }
      
      if (relPath) {
        // e.g. auth\dto\AuthResponse.java -> auth.dto
        const packageFolder = path.dirname(relPath).replace(/\\/g, '.');
        if (packageFolder && packageFolder !== '.') {
          const newPackageDecl = `package com.pamana.${packageFolder};`;
          content = content.replace(/^package com\.pamana\.[^;]+;/m, newPackageDecl);
        } else {
          content = content.replace(/^package com\.pamana\.[^;]+;/m, 'package com.pamana;');
        }
      }
      
      // Update import statements
      importReplacements.forEach(({ oldImport, newImport }) => {
        // Regex to match exact import (with or without wildcard, but we'll do exact matches first)
        const regex = new RegExp(`import ${oldImport.replace(/\./g, '\\.')};`, 'g');
        content = content.replace(regex, `import ${newImport};`);
      });
      
      // We also need to fix wildcard imports if any, like `import com.pamana.model.*;`
      // Since models are now scattered, if there are wildcards, they will break. 
      // Fortunately Spring Boot usually doesn't generate wildcards unless explicitly set, but just in case, we will see.
      
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
}

console.log("Moving main files...");
moveFiles(baseDir, mapping);
console.log("Moving test files...");
moveFiles(testDir, testMapping);

console.log("Processing imports and packages...");
processDirectory(baseDir);
processDirectory(testDir);

console.log("Done.");
