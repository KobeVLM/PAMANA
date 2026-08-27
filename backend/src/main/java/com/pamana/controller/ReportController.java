package com.pamana.controller;

import com.pamana.service.ReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private static final Logger log = LoggerFactory.getLogger(ReportController.class);

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/generate/{userId}/{moduleNumber}")
    @PreAuthorize("hasAnyRole('PARENT', 'TEACHER', 'LEARNER')")
    public ResponseEntity<byte[]> generateReport(
            @PathVariable UUID userId,
            @PathVariable int moduleNumber) {
        log.info("REST API: Generate PDF report for learner ID: {}, module: {}", userId, moduleNumber);

        byte[] pdfBytes = reportService.generateReport(userId, moduleNumber);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "pamana_progress_report_module_" + moduleNumber + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
