package com.satesoft.mobiagent.domain;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface MnoWalletRepository extends JpaRepository<MnoWallet, Long> { List<MnoWallet> findByUserId(Long userId); }
