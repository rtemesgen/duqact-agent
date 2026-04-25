package com.satesoft.mobiagent.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChannelTypeRepository extends JpaRepository<ChannelType, Long> {
    List<ChannelType> findByUserIdOrderByCreatedAtAsc(Long userId);
}
