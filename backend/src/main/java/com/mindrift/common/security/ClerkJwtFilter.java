package com.mindrift.common.security;

import com.mindrift.user.entity.User;
import com.mindrift.user.entity.UserRole;
import com.mindrift.user.entity.UserStatus;
import com.mindrift.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClerkJwtFilter extends OncePerRequestFilter {

    private final JwtTokenService jwtTokenService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (jwt != null) {
                Claims claims = jwtTokenService.parseToken(jwt);
                if (claims != null) {
                    String clerkId = claims.getSubject();
                    if (clerkId != null) {
                        Optional<User> userOpt = userRepository.findByClerkId(clerkId);
                        if (userOpt.isPresent()) {
                            User user = userOpt.get();
                            UserPrincipal principal = new UserPrincipal(user);
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        } else {
                            log.warn("Clerk verified user {} is not yet registered in database. Creating minimal temp context.", clerkId);
                            // Extract email and metadata from claims
                            String email = claims.get("email", String.class);
                            if (email == null) {
                                email = claims.get("email_address", String.class);
                            }
                            if (email == null && claims.get("emails") != null) {
                                email = claims.get("emails").toString();
                            }
                            
                            String firstName = claims.get("first_name", String.class);
                            if (firstName == null) {
                                firstName = claims.get("fname", String.class);
                            }
                            
                            String lastName = claims.get("last_name", String.class);
                            if (lastName == null) {
                                lastName = claims.get("lname", String.class);
                            }
                            
                            String avatarUrl = claims.get("image_url", String.class);
                            if (avatarUrl == null) {
                                avatarUrl = claims.get("avatar_url", String.class);
                            }
                            if (avatarUrl == null) {
                                avatarUrl = claims.get("picture", String.class);
                            }
                            
                            User newUser = new User();
                            newUser.setClerkId(clerkId);
                            newUser.setEmail(email != null ? email : clerkId + "@clerk.mindrift.local");
                            newUser.setUsername(claims.get("username", String.class));
                            newUser.setFirstName(firstName);
                            newUser.setLastName(lastName);
                            newUser.setAvatarUrl(avatarUrl);
                            newUser.setRole(UserRole.ROLE_PLAYER);
                            newUser.setStatus(UserStatus.ACTIVE);
                            
                            // JIT auto-provision Clerk user to prevent downstream transient FK exceptions
                            User savedUser = userRepository.save(newUser);
                            log.info("Auto-provisioned Clerk user {} in database with ID {}", clerkId, savedUser.getId());
                            
                            UserPrincipal tempPrincipal = new UserPrincipal(savedUser);
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(tempPrincipal, null, tempPrincipal.getAuthorities());
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
