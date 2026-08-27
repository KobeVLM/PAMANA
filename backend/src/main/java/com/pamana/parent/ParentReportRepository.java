package com.pamana.parent;

import com.pamana.parent.ParentReportRepository;
import com.pamana.parent.ParentReport;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ParentReportRepository extends JpaRepository<ParentReport, UUID> {
    List<ParentReport> findByUserId(UUID userId);
}
