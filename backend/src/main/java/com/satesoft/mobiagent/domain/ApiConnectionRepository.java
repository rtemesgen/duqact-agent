package com.satesoft.mobiagent.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApiConnectionRepository extends JpaRepository<ApiConnection, Long> {
    List<ApiConnection> findByUserIdOrderByCreatedAtAsc(Long userId);
}
