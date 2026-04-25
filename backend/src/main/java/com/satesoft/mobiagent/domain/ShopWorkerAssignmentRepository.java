package com.satesoft.mobiagent.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShopWorkerAssignmentRepository extends JpaRepository<ShopWorkerAssignment, Long> {
    List<ShopWorkerAssignment> findByShopIdOrderByCreatedAtAsc(Long shopId);
    List<ShopWorkerAssignment> findByUserId(Long userId);
}
