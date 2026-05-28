package com.pamana.service;

import com.pamana.model.*;
import com.pamana.repository.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);

    private final UserRepository userRepository;
    private final ModuleProgressRepository moduleProgressRepository;
    private final SyllableProgressRepository syllableProgressRepository;
    private final WordMasteryRepository wordMasteryRepository;
    private final SentenceProgressRepository sentenceProgressRepository;
    private final ParentReportRepository parentReportRepository;
    private final ProgressService progressService;

    public ReportService(UserRepository userRepository,
            ModuleProgressRepository moduleProgressRepository,
            SyllableProgressRepository syllableProgressRepository,
            WordMasteryRepository wordMasteryRepository,
            SentenceProgressRepository sentenceProgressRepository,
            ParentReportRepository parentReportRepository,
            ProgressService progressService) {
        this.userRepository = userRepository;
        this.moduleProgressRepository = moduleProgressRepository;
        this.syllableProgressRepository = syllableProgressRepository;
        this.wordMasteryRepository = wordMasteryRepository;
        this.sentenceProgressRepository = sentenceProgressRepository;
        this.parentReportRepository = parentReportRepository;
        this.progressService = progressService;
    }

    @Transactional
    public byte[] generateReport(UUID userId, int moduleNumber) {
        log.info("Generating PDF progress report: userId={}, moduleNumber={}", userId, moduleNumber);

        // 1. Validate User & Module Completion
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        ModuleProgress progress = moduleProgressRepository.findByUserIdAndModuleNumber(userId, moduleNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Hindi nakita ang module progress record."));

        if (!progress.getIsComplete()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Hindi pa tapos ang module na ito upang ma-download ang report.");
        }

        // 2. Aggregate Module Details
        String moduleTitle = getModuleTitle(moduleNumber);
        String accuracyStr = progress.getAccuracy() != null ? progress.getAccuracy().toString() + "%" : "N/A";
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        // 3. Compile PDF using Apache PDFBox
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                // Header Banner
                stream.beginText();
                stream.setFont(fontBold, 20);
                stream.newLineAtOffset(50, 720);
                stream.showText("PAMANA: Pamanang Heritage Quest");
                stream.endText();

                stream.beginText();
                stream.setFont(fontRegular, 12);
                stream.newLineAtOffset(50, 700);
                stream.showText("Grade 2 Filipino Language Progress Report");
                stream.endText();

                // Decorative horizontal line
                stream.setLineWidth(1.5f);
                stream.moveTo(50, 685);
                stream.lineTo(550, 685);
                stream.stroke();

                // Learner Profile Details
                int yOffset = 650;
                stream.beginText();
                stream.setFont(fontBold, 11);
                stream.newLineAtOffset(50, yOffset);
                stream.showText("Pangalan ng Mag-aaral (Learner): ");
                stream.setFont(fontRegular, 11);
                stream.showText(user.getName());
                stream.endText();

                yOffset -= 20;
                stream.beginText();
                stream.setFont(fontBold, 11);
                stream.newLineAtOffset(50, yOffset);
                stream.showText("Email ng Account: ");
                stream.setFont(fontRegular, 11);
                stream.showText(user.getEmail());
                stream.endText();

                yOffset -= 20;
                stream.beginText();
                stream.setFont(fontBold, 11);
                stream.newLineAtOffset(50, yOffset);
                stream.showText("Petsa ng Pag-download (Date): ");
                stream.setFont(fontRegular, 11);
                stream.showText(dateStr);
                stream.endText();

                yOffset -= 35;
                // Module Completion Details Box
                stream.beginText();
                stream.setFont(fontBold, 13);
                stream.newLineAtOffset(50, yOffset);
                stream.showText("Resulta ng Pag-unlad (Module Results): " + moduleTitle);
                stream.endText();

                yOffset -= 20;
                stream.beginText();
                stream.setFont(fontBold, 11);
                stream.newLineAtOffset(50, yOffset);
                stream.showText("Marka ng Kawastuhan (Average Accuracy): ");
                stream.setFont(fontRegular, 11);
                stream.showText(accuracyStr);
                stream.endText();

                yOffset -= 20;
                stream.beginText();
                stream.setFont(fontBold, 11);
                stream.newLineAtOffset(50, yOffset);
                stream.showText("Katayuan ng Module (Module Status): ");
                stream.setFont(fontRegular, 11);
                stream.showText("Kumpleto at Mastered na!");
                stream.endText();

                // Segment content based on module
                yOffset -= 40;
                if (moduleNumber == 1) {
                    yOffset = renderSyllableReportContent(stream, userId, fontBold, fontRegular, yOffset);
                } else if (moduleNumber == 2 || moduleNumber == 3) {
                    yOffset = renderVocabularyReportContent(stream, userId, moduleNumber, fontBold, fontRegular,
                            yOffset);
                } else if (moduleNumber == 4) {
                    yOffset = renderSentenceReportContent(stream, userId, fontBold, fontRegular, yOffset);
                }

                // Footer section
                stream.beginText();
                stream.setFont(fontRegular, 9);
                stream.newLineAtOffset(50, 50);
                stream.showText("Ang ulat na ito ay awtomatikong nabuo ng PAMANA Web App para sa magulang/guardian.");
                stream.endText();
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.save(outputStream);

            // 4. Save parent report log
            parentReportRepository.save(new ParentReport(userId, moduleNumber));
            log.info("Successfully generated and logged parent progress report for user: {}", userId);

            return outputStream.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF document: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Hindi maiproseso ang PDF report sa ngayon. Subukan ulit.");
        }
    }

    private int renderSyllableReportContent(PDPageContentStream stream, UUID userId, PDType1Font fontBold,
            PDType1Font fontRegular, int yOffset) throws Exception {
        stream.beginText();
        stream.setFont(fontBold, 12);
        stream.newLineAtOffset(50, yOffset);
        stream.showText("Kawastuhan Bawat Sub-level ng Syllable Phonics:");
        stream.endText();

        List<SyllableProgress> progressList = syllableProgressRepository.findByUserId(userId);

        yOffset -= 20;
        for (SyllableProgress p : progressList) {
            stream.beginText();
            stream.setFont(fontBold, 10);
            stream.newLineAtOffset(60, yOffset);
            stream.showText("- " + p.getSubLevel().toUpperCase() + " Set " + p.getSetId() + ": ");
            stream.setFont(fontRegular, 10);
            stream.showText("Attempts: " + p.getAttempts() + ", Accuracy: " + p.getAccuracy() + "%");
            stream.endText();
            yOffset -= 15;
        }

        return yOffset;
    }

    private int renderVocabularyReportContent(PDPageContentStream stream, UUID userId, int moduleNumber,
            PDType1Font fontBold, PDType1Font fontRegular, int yOffset) throws Exception {
        
        com.pamana.dto.DashboardResponse metrics = progressService.getDashboardMetrics(userId);
        List<com.pamana.dto.WordMasteryStatus> wordMasteryList = metrics.getWordMasteryList();

        stream.beginText();
        stream.setFont(fontBold, 12);
        stream.newLineAtOffset(50, yOffset);
        stream.showText("Hamon ng Pamana Pass Rate: " + metrics.getHamonPassRate() + "%");
        stream.endText();

        yOffset -= 30;

        stream.beginText();
        stream.setFont(fontBold, 12);
        stream.newLineAtOffset(50, yOffset);
        stream.showText("Pagsusuri ng mga Salita (Vocabulary Word Analysis):");
        stream.endText();

        int masteredWords = metrics.getMasteredCount();
        int reviewWords = metrics.getNeedsReviewCount();

        yOffset -= 20;
        stream.beginText();
        stream.setFont(fontRegular, 11);
        stream.newLineAtOffset(60, yOffset);
        stream.showText("Kabuuang Salitang Mastered (Green): " + masteredWords);
        stream.endText();

        yOffset -= 15;
        stream.beginText();
        stream.setFont(fontRegular, 11);
        stream.newLineAtOffset(60, yOffset);
        stream.showText("Mga Salitang Kailangan Pang Sanayin (Red): " + reviewWords);
        stream.endText();

        if (reviewWords > 0) {
            yOffset -= 20;
            stream.beginText();
            stream.setFont(fontBold, 10);
            stream.newLineAtOffset(70, yOffset);
            stream.showText("Mga partikular na salitang pagtutuunan ng pansin:");
            stream.endText();

            for (com.pamana.dto.WordMasteryStatus w : wordMasteryList) {
                if ("red".equalsIgnoreCase(w.getStatus())) {
                    yOffset -= 15;
                    stream.beginText();
                    stream.setFont(fontRegular, 10);
                    stream.newLineAtOffset(80, yOffset);
                    stream.showText("- " + w.getWord() + " (Katumpakan: " + w.getOverallAccuracy() + "%)");
                    stream.endText();
                }
            }
        }

        yOffset -= 30;
        stream.beginText();
        stream.setFont(fontBold, 11);
        stream.newLineAtOffset(60, yOffset);
        stream.showText("Rekomendasyon para sa Magulang:");
        stream.endText();

        yOffset -= 20;
        stream.beginText();
        stream.setFont(fontRegular, 10);
        stream.newLineAtOffset(70, yOffset);
        if (reviewWords > 0) {
            stream.showText("Sanayin ang bata sa mga pulang salita sa inyong pamamahay gamit ang actual na mga bagay.");
        } else {
            stream.showText("Magaling! Ipagpatuloy ang mahusay na pagbabasa at paggamit ng Filipino.");
        }
        stream.endText();

        return yOffset - 20;
    }

    private int renderSentenceReportContent(PDPageContentStream stream, UUID userId, PDType1Font fontBold,
            PDType1Font fontRegular, int yOffset) throws Exception {
        stream.beginText();
        stream.setFont(fontBold, 12);
        stream.newLineAtOffset(50, yOffset);
        stream.showText("Kawastuhan Bawat Sentence Tier (Declarative vs. Interrogative):");
        stream.endText();

        List<SentenceProgress> attempts = sentenceProgressRepository.findByUserId(userId);

        double tier1Avg = attempts.stream().filter(a -> a.getTier() == 1)
                .mapToDouble(a -> a.getAccuracy().doubleValue()).average().orElse(0.0);
        double tier2Avg = attempts.stream().filter(a -> a.getTier() == 2)
                .mapToDouble(a -> a.getAccuracy().doubleValue()).average().orElse(0.0);

        yOffset -= 20;
        stream.beginText();
        stream.setFont(fontBold, 11);
        stream.newLineAtOffset(60, yOffset);
        stream.showText("- Tier 1: Paturol (Declarative): ");
        stream.setFont(fontRegular, 11);
        stream.showText(BigDecimal.valueOf(tier1Avg).setScale(2, RoundingMode.HALF_UP) + "% Accuracy");
        stream.endText();

        yOffset -= 20;
        stream.beginText();
        stream.setFont(fontBold, 11);
        stream.newLineAtOffset(60, yOffset);
        stream.showText("- Tier 2: Patanong (Interrogative): ");
        stream.setFont(fontRegular, 11);
        stream.showText(BigDecimal.valueOf(tier2Avg).setScale(2, RoundingMode.HALF_UP) + "% Accuracy");
        stream.endText();

        return yOffset - 20;
    }

    private String getModuleTitle(int moduleNumber) {
        switch (moduleNumber) {
            case 1:
                return "Module 1: Syllables Phonics (Pagbasa ng Pantig)";
            case 2:
                return "Module 2: Self & Body Vocabulary (Ang Aking Sarili at Katawan)";
            case 3:
                return "Module 3: Family & Home Vocabulary (Ang Aking Pamilya at Tahanan)";
            case 4:
                return "Module 4: Simple Sentence Construction (Pagbuo ng Pangungusap)";
            default:
                return "Module " + moduleNumber;
        }
    }
}
