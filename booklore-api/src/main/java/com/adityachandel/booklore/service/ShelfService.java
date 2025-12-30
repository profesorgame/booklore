package com.adityachandel.booklore.service;

import com.adityachandel.booklore.config.security.service.AuthenticationService;
import com.adityachandel.booklore.exception.ApiError;
import com.adityachandel.booklore.mapper.BookMapper;
import com.adityachandel.booklore.mapper.ShelfMapper;
import com.adityachandel.booklore.model.dto.Book;
import com.adityachandel.booklore.model.dto.BookLoreUser;
import com.adityachandel.booklore.model.dto.Shelf;
import com.adityachandel.booklore.model.dto.request.ShelfCreateRequest;
import com.adityachandel.booklore.model.entity.BookLoreUserEntity;
import com.adityachandel.booklore.model.entity.ShelfEntity;
import com.adityachandel.booklore.model.enums.ShelfType;
import com.adityachandel.booklore.repository.BookRepository;
import com.adityachandel.booklore.repository.ShelfRepository;
import com.adityachandel.booklore.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@AllArgsConstructor
@Service
public class ShelfService {

    private final ShelfRepository shelfRepository;
    private final BookRepository bookRepository;
    private final ShelfMapper shelfMapper;
    private final BookMapper bookMapper;
    private final AuthenticationService authenticationService;
    private final UserRepository userRepository;

    public Shelf createShelf(ShelfCreateRequest request) {
        Long userId = getAuthenticatedUserId();
        BookLoreUser user = authenticationService.getAuthenticatedUser();
        validateAutoEmailPermissions(user, request);
        boolean autoEmailEnabled = request.isAutoEmailEnabled();
        if (shelfRepository.existsByUserIdAndName(userId, request.getName())) {
            throw ApiError.SHELF_ALREADY_EXISTS.createException(request.getName());
        }
        ShelfEntity shelfEntity = ShelfEntity.builder()
                .icon(request.getIcon())
                .name(request.getName())
                .iconType(request.getIconType())
                .autoEmailEnabled(autoEmailEnabled)
                .autoEmailProviderId(resolveAutoEmailProviderId(request, autoEmailEnabled))
                .autoEmailRecipientId(resolveAutoEmailRecipientId(request, autoEmailEnabled))
                .user(fetchUserEntityById(userId))
                .build();
        return shelfMapper.toShelf(shelfRepository.save(shelfEntity));
    }

    public Shelf updateShelf(Long id, ShelfCreateRequest request) {
        BookLoreUser user = authenticationService.getAuthenticatedUser();
        validateAutoEmailPermissions(user, request);
        boolean autoEmailEnabled = request.isAutoEmailEnabled();
        ShelfEntity shelfEntity = findShelfByIdOrThrow(id);
        shelfEntity.setName(request.getName());
        shelfEntity.setIcon(request.getIcon());
        shelfEntity.setIconType(request.getIconType());
        shelfEntity.setAutoEmailEnabled(autoEmailEnabled);
        shelfEntity.setAutoEmailProviderId(resolveAutoEmailProviderId(request, autoEmailEnabled));
        shelfEntity.setAutoEmailRecipientId(resolveAutoEmailRecipientId(request, autoEmailEnabled));
        return shelfMapper.toShelf(shelfRepository.save(shelfEntity));
    }

    public List<Shelf> getShelves() {
        Long userId = getAuthenticatedUserId();
        return shelfRepository.findByUserId(userId).stream()
                .map(shelfMapper::toShelf)
                .toList();
    }

    public Shelf getShelf(Long shelfId) {
        return shelfMapper.toShelf(findShelfByIdOrThrow(shelfId));
    }

    public void deleteShelf(Long shelfId) {
        shelfRepository.deleteById(shelfId);
    }

    public Shelf getUserKoboShelf() {
        Long userId = getAuthenticatedUserId();
        Optional<ShelfEntity> koboShelf = shelfRepository.findByUserIdAndName(userId, ShelfType.KOBO.getName());
        return koboShelf.map(shelfMapper::toShelf).orElse(null);
    }

    public List<Book> getShelfBooks(Long shelfId) {
        findShelfByIdOrThrow(shelfId);
        return bookRepository.findAllWithMetadataByShelfId(shelfId).stream()
                .map(bookMapper::toBook)
                .toList();
    }

    private Long getAuthenticatedUserId() {
        BookLoreUser user = authenticationService.getAuthenticatedUser();
        return user.getId();
    }

    private BookLoreUserEntity fetchUserEntityById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with ID " + userId));
    }

    private ShelfEntity findShelfByIdOrThrow(Long shelfId) {
        return shelfRepository.findById(shelfId)
                .orElseThrow(() -> ApiError.SHELF_NOT_FOUND.createException(shelfId));
    }

    public Optional<ShelfEntity> getShelf(Long id, String name) {
        return shelfRepository.findByUserIdAndName(id, name);
    }

    private void validateAutoEmailPermissions(BookLoreUser user, ShelfCreateRequest request) {
        boolean wantsAutoEmail = request.isAutoEmailEnabled()
                || request.getAutoEmailProviderId() != null
                || request.getAutoEmailRecipientId() != null;
        if (!wantsAutoEmail) {
            return;
        }
        if (user.getPermissions() == null) {
            throw ApiError.GENERIC_UNAUTHORIZED.createException("You do not have permission to configure auto email.");
        }
        boolean canEmail = user.getPermissions().isAdmin() || user.getPermissions().isCanEmailBook();
        if (!canEmail) {
            throw ApiError.GENERIC_UNAUTHORIZED.createException("You do not have permission to configure auto email.");
        }
    }

    private Long resolveAutoEmailProviderId(ShelfCreateRequest request, boolean autoEmailEnabled) {
        return autoEmailEnabled ? request.getAutoEmailProviderId() : null;
    }

    private Long resolveAutoEmailRecipientId(ShelfCreateRequest request, boolean autoEmailEnabled) {
        return autoEmailEnabled ? request.getAutoEmailRecipientId() : null;
    }
}
