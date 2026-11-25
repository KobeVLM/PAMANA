package com.pamana.adaptive;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContentBankRepository extends JpaRepository<ContentBankItem, UUID> {

    Optional<ContentBankItem> findByActivityAndItemKeyAndDifficultyTier(
            String activity, String itemKey, String difficultyTier);

    List<ContentBankItem> findByActivity(String activity);

    long countByActivity(String activity);
}
