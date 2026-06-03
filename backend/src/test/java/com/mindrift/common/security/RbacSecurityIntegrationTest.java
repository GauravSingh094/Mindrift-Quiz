package com.mindrift.common.security;

import com.mindrift.BaseIntegrationTest;
import com.mindrift.user.entity.Permission;
import com.mindrift.user.entity.Role;
import com.mindrift.user.entity.User;
import com.mindrift.user.entity.UserRole;
import com.mindrift.user.entity.UserStatus;
import com.mindrift.user.repository.PermissionRepository;
import com.mindrift.user.repository.RoleRepository;
import com.mindrift.user.repository.UserRepository;
import com.mindrift.user.service.PermissionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class RbacSecurityIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private PermissionService permissionService;

    @Autowired
    private GuardedService guardedService;

    private User playerUser;
    private User adminUser;

    @TestConfiguration
    static class RbacTestConfig {
        @Bean
        public GuardedService guardedService() {
            return new GuardedService();
        }
    }

    @Service
    public static class GuardedService {
        
        @RequirePermission("quiz:create")
        public String createQuiz() {
            return "Quiz Created Successfully";
        }

        @RequirePermission("admin:manage")
        public String runAdminTasks() {
            return "Admin Tasks Run Successfully";
        }
    }

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        roleRepository.deleteAll();
        permissionRepository.deleteAll();

        // 1. Seed Permissions
        Permission createQuizPerm = new Permission();
        createQuizPerm.setId(UUID.randomUUID());
        createQuizPerm.setName("quiz:create");
        createQuizPerm.setDescription("Quiz Creation Permission");
        permissionRepository.save(createQuizPerm);

        Permission adminManagePerm = new Permission();
        adminManagePerm.setId(UUID.randomUUID());
        adminManagePerm.setName("admin:manage");
        adminManagePerm.setDescription("Admin Manage Permission");
        permissionRepository.save(adminManagePerm);

        // 2. Seed Roles and Link Permissions
        Role playerRole = new Role();
        playerRole.setId(UUID.randomUUID());
        playerRole.setName(UserRole.ROLE_PLAYER.name());
        playerRole.setDescription("Standard Participant");
        playerRole.setPermissions(new HashSet<>(Collections.singletonList(createQuizPerm)));
        roleRepository.save(playerRole);

        Role adminRole = new Role();
        adminRole.setId(UUID.randomUUID());
        adminRole.setName(UserRole.ROLE_ADMIN.name());
        adminRole.setDescription("Administrator");
        adminRole.setPermissions(new HashSet<>(Collections.singletonList(adminManagePerm)));
        roleRepository.save(adminRole);

        // 3. Seed Users
        playerUser = new User();
        playerUser.setId(UUID.randomUUID());
        playerUser.setClerkId("clerk_player_123");
        playerUser.setEmail("player@mindrift.com");
        playerUser.setUsername("playerOne");
        playerUser.setRole(UserRole.ROLE_PLAYER);
        playerUser.setStatus(UserStatus.ACTIVE);
        playerUser.setCreatedAt(Instant.now());
        playerUser.setUpdatedAt(Instant.now());
        userRepository.save(playerUser);

        adminUser = new User();
        adminUser.setId(UUID.randomUUID());
        adminUser.setClerkId("clerk_admin_123");
        adminUser.setEmail("admin@mindrift.com");
        adminUser.setUsername("adminOne");
        adminUser.setRole(UserRole.ROLE_ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser.setCreatedAt(Instant.now());
        adminUser.setUpdatedAt(Instant.now());
        userRepository.save(adminUser);
    }

    private void authenticateAs(User user) {
        UserPrincipal principal = new UserPrincipal(user);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    void testAuthorizedUserAccessesGuardedMethod() {
        // Authenticate as Player (who has "quiz:create" permission)
        authenticateAs(playerUser);

        String response = guardedService.createQuiz();
        assertEquals("Quiz Created Successfully", response);
    }

    @Test
    void testUnauthorizedUserAccessesGuardedMethodThrowsAccessDenied() {
        // Authenticate as Player (who does NOT have "admin:manage" permission)
        authenticateAs(playerUser);

        assertThrows(AccessDeniedException.class, () -> guardedService.runAdminTasks());
    }

    @Test
    void testAdminUserAccessesAdminMethod() {
        // Authenticate as Admin (who has "admin:manage" permission)
        authenticateAs(adminUser);

        String response = guardedService.runAdminTasks();
        assertEquals("Admin Tasks Run Successfully", response);
    }

    @Test
    void testUnauthenticatedAccessThrowsAccessDenied() {
        // Clear security context
        SecurityContextHolder.clearContext();

        assertThrows(AccessDeniedException.class, () -> guardedService.createQuiz());
    }

    @Test
    void testPermissionsCaching() {
        authenticateAs(playerUser);

        // First call should result in cache miss and loading from database
        var perms1 = permissionService.getUserPermissions(playerUser.getId());
        assertTrue(perms1.contains("quiz:create"));

        // Second call should fetch directly from Cache (Cache Hit)
        var perms2 = permissionService.getUserPermissions(playerUser.getId());
        assertTrue(perms2.contains("quiz:create"));
    }
}
