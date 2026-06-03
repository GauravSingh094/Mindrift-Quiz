package com.mindrift.user.service;

import com.mindrift.common.monitoring.MonitoringService;
import com.mindrift.user.entity.Permission;
import com.mindrift.user.entity.Role;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.RoleRepository;
import com.mindrift.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Enterprise Permission Service handling User Role-Based Access Control permissions,
 * including high-performance Redis programmatic caching and telemetry auditing.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CacheManager cacheManager;
    private final MonitoringService monitoringService;

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public Set<String> getUserPermissions(UUID userId) {
        Cache cache = cacheManager.getCache("permissions");
        if (cache != null) {
            Cache.ValueWrapper wrapper = cache.get(userId);
            if (wrapper != null && wrapper.get() != null) {
                monitoringService.recordPermissionCacheHit();
                log.debug("RBAC Cache Hit: Loaded permissions from cache for user: {}", userId);
                return (Set<String>) wrapper.get();
            }
        }

        monitoringService.recordPermissionCacheMiss();
        log.info("RBAC Cache Miss: Loading permissions from database for user: {}", userId);
        
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return Collections.emptySet();
        }

        User user = userOpt.get();
        String roleName = user.getRole().name();
        
        Optional<Role> roleOpt = roleRepository.findByName(roleName);
        if (roleOpt.isEmpty()) {
            log.warn("Role entity not found in database for role name: {}", roleName);
            return Collections.emptySet();
        }

        Role role = roleOpt.get();
        Set<String> permissions = role.getPermissions().stream()
                .map(Permission::getName)
                .collect(Collectors.toSet());

        if (cache != null) {
            cache.put(userId, permissions);
        }

        log.debug("Loaded {} permissions for user {} with role {}", permissions.size(), userId, roleName);
        return permissions;
    }
}
