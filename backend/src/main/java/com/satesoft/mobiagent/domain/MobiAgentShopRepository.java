package com.satesoft.mobiagent.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MobiAgentShopRepository extends JpaRepository<MobiAgentShop, Long> {
    List<MobiAgentShop> findByOwnerUserIdOrderByCreatedAtAsc(Long ownerUserId);
}
