package com.mindrift.user.repository;

import com.mindrift.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByClerkId(String clerkId);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByClerkId(String clerkId);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
