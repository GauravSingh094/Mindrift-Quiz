package com.mindrift.common.security;

import com.mindrift.user.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.Set;

/**
 * Custom Spring Security PermissionEvaluator mapping SpEL based hasPermission expressions
 * to database RBAC user permissions.
 */
@Component
@RequiredArgsConstructor
public class CustomPermissionEvaluator implements PermissionEvaluator {

    private final PermissionService permissionService;

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal) || !(permission instanceof String)) {
            return false;
        }
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        Set<String> userPermissions = permissionService.getUserPermissions(principal.getId());
        return userPermissions.contains((String) permission);
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal) || !(permission instanceof String)) {
            return false;
        }
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        Set<String> userPermissions = permissionService.getUserPermissions(principal.getId());
        return userPermissions.contains((String) permission);
    }
}
