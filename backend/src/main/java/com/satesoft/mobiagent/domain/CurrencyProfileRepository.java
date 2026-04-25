package com.satesoft.mobiagent.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CurrencyProfileRepository extends JpaRepository<CurrencyProfile, Long> {
    List<CurrencyProfile> findByUserIdOrderByCountryNameAsc(Long userId);
}
