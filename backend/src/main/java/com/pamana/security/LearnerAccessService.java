package com.pamana.security;

import com.pamana.auth.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Guards access to a learner's progress data.
 *
 * A caller may access a learner's data only when the caller IS that learner,
 * or when the caller is a PARENT linked to that learner. This closes the
 * IDOR gap where any authenticated user could request another learner's
 * data by changing the id in the request.
 */
@Service
public class LearnerAccessService {

    private final UserRepository userRepository;

    public LearnerAccessService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UUID getRequesterId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }

    /**
     * Asserts that the authenticated caller may access {@code targetUserId}'s data.
     * Throws 403 otherwise.
     */
    public void assertCanAccess(Authentication authentication, UUID targetUserId) {
        UUID requesterId = getRequesterId(authentication);
        if (requesterId.equals(targetUserId)) {
            return;
        }

        boolean isParent = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_PARENT".equals(a.getAuthority()));

        if (isParent) {
            boolean linked = userRepository.findById(targetUserId)
                    .map(user -> requesterId.equals(user.getParentId()))
                    .orElse(false);
            if (linked) {
                return;
            }
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Hindi ka awtorisado na tingnan ang datos ng ibang mag-aaral.");
    }
}
