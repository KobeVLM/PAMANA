package com.pamana.klase;

import com.pamana.klase.KlaseRepository;
import com.pamana.klase.Klase;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KlaseRepository extends JpaRepository<Klase, UUID> {
    Optional<Klase> findByJoinCode(String joinCode);
    boolean existsByJoinCode(String joinCode);
    Optional<Klase> findByTeacherId(UUID teacherId);
}
