package com.pamana.parent;

import com.pamana.auth.UserRepository;
import com.pamana.auth.User;
import com.pamana.syllable.SyllableProgressRepository;
import com.pamana.syllable.SyllableProgress;
import com.pamana.vocabulary.VocabularyItem;
import com.pamana.vocabulary.VocabularyItemRepository;
import com.pamana.vocabulary.WordMastery;
import com.pamana.vocabulary.WordMasteryRepository;
import com.pamana.sentence.SentenceProgressRepository;
import com.pamana.sentence.SentenceProgress;
import com.pamana.progress.ModuleProgressRepository;
import com.pamana.progress.ModuleProgress;
import com.pamana.progress.ModuleLockService;
import com.pamana.parent.ReportService;
import com.pamana.parent.ParentReportRepository;
import com.pamana.parent.ParentReport;



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
import java.nio.charset.Charset;
import java.nio.charset.CharsetEncoder;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);

    private final UserRepository userRepository;
    private final ModuleProgressRepository moduleProgressRepository;
    private final SyllableProgressRepository syllableProgressRepository;
    private final WordMasteryRepository wordMasteryRepository;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final SentenceProgressRepository sentenceProgressRepository;
    private final ParentReportRepository parentReportRepository;
    private final ModuleLockService moduleLockService;

    public ReportService(UserRepository userRepository,
            ModuleProgressRepository moduleProgressRepository,
            SyllableProgressRepository syllableProgressRepository,
            WordMasteryRepository wordMasteryRepository,
            VocabularyItemRepository vocabularyItemRepository,
            SentenceProgressRepository sentenceProgressRepository,
            ParentReportRepository parentReportRepository,
            ModuleLockService moduleLockService) {
        this.userRepository = userRepository;
        this.moduleProgressRepository = moduleProgressRepository;
        this.syllableProgressRepository = syllableProgressRepository;
        this.wordMasteryRepository = wordMasteryRepository;
        this.vocabularyItemRepository = vocabularyItemRepository;
        this.sentenceProgressRepository = sentenceProgressRepository;
        this.parentReportRepository = parentReportRepository;
        this.moduleLockService = moduleLockService;
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

        boolean isComplete = Boolean.TRUE.equals(progress.getIsComplete());
        boolean hasAttempts = moduleLockService.hasAttemptData(userId, moduleNumber);
        if (!isComplete && !hasAttempts) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Walang naitalang pagtatangka sa module na ito upang makabuo ng report.");
        }

        // 2. Aggregate Module Details
        String moduleTitle = getModuleTitle(moduleNumber);
        String accuracyStr = progress.getAccuracy() != null ? progress.getAccuracy().toString() + "%" : "N/A";
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        // Email is optional (username-only accounts store null), so fall back to
        // a label instead of passing null to PDPageContentStream.showText.
        String learnerEmail = (user.getEmail() == null || user.getEmail().isBlank())
                ? "Walang naka-link na email"
                : user.getEmail();

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
                stream.showText(pdfSafe(user.getName()));
                stream.endText();

                yOffset -= 20;
                stream.beginText();
                stream.setFont(fontBold, 11);
                stream.newLineAtOffset(50, yOffset);
                stream.showText("Email ng Account: ");
                stream.setFont(fontRegular, 11);
                stream.showText(pdfSafe(learnerEmail));
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
                stream.showText(isComplete ? "Kumpleto at Mastered na!" : "Kasalukuyang ginagawa (Partial Progress)");
                stream.endText();

                // Make it unambiguous that a partial report is not a certificate
                // of completion.
                if (!isComplete) {
                    yOffset -= 20;
                    stream.beginText();
                    stream.setFont(fontRegular, 10);
                    stream.newLineAtOffset(50, yOffset);
                    stream.showText("Paalala: hindi pa kumpleto ang module na ito. Ipinapakita ang kasalukuyang progreso.");
                    stream.endText();
                }

                // Segment content based on module
                yOffset -= isComplete ? 40 : 20;
                if (moduleNumber == 1) {
                    yOffset = renderSyllableReportContent(stream, userId, progress, fontBold, fontRegular, yOffset);
                } else if (moduleNumber == 2 || moduleNumber == 3) {
                    yOffset = renderVocabularyReportContent(stream, userId, moduleNumber, progress, fontBold, fontRegular,
                            yOffset);
                } else if (moduleNumber == 4) {
                    yOffset = renderSentenceReportContent(stream, userId, progress, fontBold, fontRegular, yOffset);
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

    private int renderSyllableReportContent(PDPageContentStream stream, UUID userId, ModuleProgress progress,
            PDType1Font fontBold, PDType1Font fontRegular, int yOffset) throws Exception {
        stream.beginText();
        stream.setFont(fontBold, 12);
        stream.newLineAtOffset(50, yOffset);
        stream.showText("Kawastuhan Bawat Sub-level ng Syllable Phonics:");
        stream.endText();

        List<SyllableProgress> progressList = syllableProgressRepository.findByUserId(userId);

        yOffset -= 20;
        if (progressList.isEmpty()) {
            stream.beginText();
            stream.setFont(fontRegular, 11);
            stream.newLineAtOffset(60, yOffset);
            String saved = progress.getAccuracy() != null ? progress.getAccuracy() + "%" : "N/A";
            stream.showText("Walang detalyadong datos ng pagtatangka (module was reset or unlocked). "
                    + "Naka-save na marka: " + saved);
            stream.endText();
            return yOffset - 20;
        }

        for (SyllableProgress p : progressList) {
            stream.beginText();
            stream.setFont(fontBold, 10);
            stream.newLineAtOffset(60, yOffset);
            stream.showText("- " + pdfSafe(p.getSubLevel()).toUpperCase() + " Set " + p.getSetId() + ": ");
            stream.setFont(fontRegular, 10);
            String accuracy = p.getAccuracy() != null ? p.getAccuracy().toString() : "0";
            stream.showText("Attempts: " + p.getAttempts() + ", Accuracy: " + accuracy + "%");
            stream.endText();
            yOffset -= 15;
        }

        return yOffset;
    }

    private int renderVocabularyReportContent(PDPageContentStream stream, UUID userId, int moduleNumber,
            ModuleProgress progress, PDType1Font fontBold, PDType1Font fontRegular, int yOffset) throws Exception {
        
        // Read exactly what this report needs. getDashboardMetrics() fans out
        // into ~46 sequential queries (it looks each vocabulary word up on its
        // own, twice), which pushed Modules 2 and 3 past the browser's report
        // timeout in production. Two bulk queries are enough here.
        String domain = moduleNumber == 2 ? "self_body" : "family_home";
        List<VocabularyItem> domainItems = vocabularyItemRepository.findByDomain(domain);
        Map<UUID, WordMastery> masteryByItem = new HashMap<>();
        for (WordMastery mastery : wordMasteryRepository.findByUserId(userId)) {
            masteryByItem.put(mastery.getVocabItemId(), mastery);
        }

        stream.beginText();
        stream.setFont(fontBold, 12);
        stream.newLineAtOffset(50, yOffset);
        stream.showText("Pagsusuri ng mga Salita (Vocabulary Word Analysis):");
        stream.endText();

        yOffset -= 30;

        // Counts are scoped to this module's domain, not both vocabulary
        // modules, so a Module 2 or 3 report never double-counts words.
        int totalWords = domainItems.size();
        long masteredWords = 0;
        long reviewWords = 0;
        boolean hasAttemptedWords = false;
        List<VocabularyItem> reviewItems = new ArrayList<>();
        for (VocabularyItem item : domainItems) {
            WordMastery mastery = masteryByItem.get(item.getId());
            String status = mastery != null ? mastery.getStatus() : null;
            if (status == null || "grey".equalsIgnoreCase(status)) {
                continue;
            }
            hasAttemptedWords = true;
            if ("green".equalsIgnoreCase(status)) {
                masteredWords++;
            } else if ("red".equalsIgnoreCase(status)) {
                reviewWords++;
                reviewItems.add(item);
            }
        }
        if (!hasAttemptedWords) {
            yOffset -= 20;
            stream.beginText();
            stream.setFont(fontRegular, 11);
            stream.newLineAtOffset(60, yOffset);
            String saved = progress.getAccuracy() != null ? progress.getAccuracy() + "%" : "N/A";
            stream.showText("Walang detalyadong datos ng pagtatangka (module was reset or unlocked). "
                    + "Naka-save na marka: " + saved);
            stream.endText();
            return yOffset - 20;
        }

        yOffset -= 20;
        stream.beginText();
        stream.setFont(fontRegular, 11);
        stream.newLineAtOffset(60, yOffset);
        stream.showText("Kabuuang Salitang Mastered (Green): " + masteredWords + " / " + totalWords);
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

            for (VocabularyItem item : reviewItems) {
                WordMastery mastery = masteryByItem.get(item.getId());
                double accuracy = mastery != null && mastery.getOverallAccuracy() != null
                        ? mastery.getOverallAccuracy().doubleValue()
                        : 0.0;
                yOffset -= 15;
                stream.beginText();
                stream.setFont(fontRegular, 10);
                stream.newLineAtOffset(80, yOffset);
                stream.showText("- " + pdfSafe(item.getWord()) + " (Katumpakan: " + accuracy + "%)");
                stream.endText();
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
        if (masteredWords >= totalWords) {
            stream.showText("Magaling! Ipagpatuloy ang mahusay na pagbabasa at paggamit ng Filipino.");
        } else {
            stream.showText("Sanayin ang bata sa natitirang salita sa inyong pamamahay gamit ang actual na mga bagay.");
        }
        stream.endText();

        return yOffset - 20;
    }

    private int renderSentenceReportContent(PDPageContentStream stream, UUID userId, ModuleProgress progress,
            PDType1Font fontBold, PDType1Font fontRegular, int yOffset) throws Exception {
        stream.beginText();
        stream.setFont(fontBold, 12);
        stream.newLineAtOffset(50, yOffset);
        stream.showText("Kawastuhan Bawat Sentence Tier (Declarative vs. Interrogative):");
        stream.endText();

        List<SentenceProgress> attempts = sentenceProgressRepository.findByUserId(userId);

        // Prefer the snapshot saved at completion time; fall back to the live
        // detail rows for completions that predate the snapshot columns.
        BigDecimal tier1Avg = progress.getTier1Accuracy() != null
                ? progress.getTier1Accuracy()
                : liveTierAverage(attempts, 1);
        BigDecimal tier2Avg = progress.getTier2Accuracy() != null
                ? progress.getTier2Accuracy()
                : liveTierAverage(attempts, 2);

        yOffset -= 20;
        if (tier1Avg == null && tier2Avg == null) {
            // The module is complete but its detail rows are gone (restart or
            // cheat unlock). Report that honestly instead of two fake 0.00%.
            stream.beginText();
            stream.setFont(fontRegular, 11);
            stream.newLineAtOffset(60, yOffset);
            String saved = progress.getAccuracy() != null ? progress.getAccuracy() + "%" : "N/A";
            stream.showText("Walang detalyadong datos ng pagtatangka (module was reset or unlocked). "
                    + "Naka-save na marka: " + saved);
            stream.endText();
            return yOffset - 20;
        }

        renderTierLine(stream, fontBold, fontRegular, yOffset, "- Tier 1: Paturol (Declarative): ", tier1Avg);
        yOffset -= 20;
        renderTierLine(stream, fontBold, fontRegular, yOffset, "- Tier 2: Patanong (Interrogative): ", tier2Avg);

        return yOffset - 20;
    }

    private BigDecimal liveTierAverage(List<SentenceProgress> attempts, int tier) {
        java.util.OptionalDouble average = attempts.stream()
                .filter(a -> a.getTier() != null && a.getTier() == tier)
                .filter(a -> a.getAccuracy() != null)
                .mapToDouble(a -> a.getAccuracy().doubleValue())
                .average();
        return average.isPresent()
                ? BigDecimal.valueOf(average.getAsDouble()).setScale(2, RoundingMode.HALF_UP)
                : null;
    }

    private void renderTierLine(PDPageContentStream stream, PDType1Font fontBold, PDType1Font fontRegular,
            int yOffset, String label, BigDecimal accuracy) throws Exception {
        stream.beginText();
        stream.setFont(fontBold, 11);
        stream.newLineAtOffset(60, yOffset);
        stream.showText(label);
        stream.setFont(fontRegular, 11);
        stream.showText(accuracy != null
                ? accuracy.setScale(2, RoundingMode.HALF_UP) + "% Accuracy"
                : "N/A");
        stream.endText();
    }

    private static final Charset WINDOWS_1252 = Charset.forName("windows-1252");

    /**
     * Keeps text inside the WinAnsi character set used by the standard-14 PDF
     * fonts. Characters outside it (emoji, en/em dashes, curly quotes) make
     * PDPageContentStream.showText throw, so they are replaced with '?'.
     */
    private String pdfSafe(String value) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        CharsetEncoder encoder = WINDOWS_1252.newEncoder();
        StringBuilder out = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (Character.isHighSurrogate(c) && i + 1 < value.length()
                    && Character.isLowSurrogate(value.charAt(i + 1))) {
                out.append('?');
                i++;
            } else if (c < 0x20) {
                out.append(' ');
            } else {
                out.append(encoder.canEncode(c) ? c : '?');
            }
        }
        return out.toString().trim();
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
