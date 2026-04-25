package com.satesoft.mobiagent.domain;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface MnoAccountRepository extends JpaRepository<MnoAccount, Long> { List<MnoAccount> findByUserId(Long userId); }
