package com.mindrift.common.security;

import com.mindrift.user.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Set;

/**
 * Aspect handling enterprise RBAC authorization checks for classes or methods
 * annotated with {@link RequirePermission}.
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class RequirePermissionAspect {

    private final PermissionService permissionService;

    @Before("@annotation(com.mindrift.common.security.RequirePermission) || @within(com.mindrift.common.security.RequirePermission)")
    public void checkPermission(JoinPoint joinPoint) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal)) {
            throw new AccessDeniedException("Access denied: User is not authenticated");
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        
        // Extract annotation on the method
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        RequirePermission requirePermission = method.getAnnotation(RequirePermission.class);
        
        if (requirePermission == null) {
            // Check if the declaring class is annotated
            requirePermission = method.getDeclaringClass().getAnnotation(RequirePermission.class);
        }
        
        if (requirePermission == null) {
            return;
        }

        String requiredPermissionName = requirePermission.value();
        Set<String> userPermissions = permissionService.getUserPermissions(principal.getId());
        
        if (!userPermissions.contains(requiredPermissionName)) {
            log.warn("RBAC Access Denied: User {} ({}) attempted to access resource requiring permission '{}', but had permissions: {}",
                    principal.getId(), principal.getEmail(), requiredPermissionName, userPermissions);
            throw new AccessDeniedException("Access denied: Missing required permission '" + requiredPermissionName + "'");
        }
        
        log.debug("RBAC Access Granted: User {} ({}) successfully authorized for permission '{}'",
                principal.getId(), principal.getEmail(), requiredPermissionName);
    }
}
