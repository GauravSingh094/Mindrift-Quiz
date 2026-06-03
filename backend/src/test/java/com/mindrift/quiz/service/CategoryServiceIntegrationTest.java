package com.mindrift.quiz.service;

import com.mindrift.BaseIntegrationTest;
import com.mindrift.common.exception.BaseMindriftException;
import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.quiz.dto.CategoryRequest;
import com.mindrift.quiz.dto.CategoryResponse;
import com.mindrift.quiz.entity.Category;
import com.mindrift.quiz.repository.CategoryRepository;
import com.mindrift.quiz.repository.QuizRepository;
import com.mindrift.user.entity.User;
import com.mindrift.user.entity.UserRole;
import com.mindrift.user.entity.UserStatus;
import com.mindrift.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class CategoryServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired private CategoryService categoryService;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private QuizRepository quizRepository;
    @Autowired private UserRepository userRepository;

    private User admin;

    @BeforeEach
    void setUp() {
        quizRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        admin = userRepository.save(buildUser("admin_cat", UserRole.ROLE_ADMIN));
    }

    @Test
    void createCategory_success() {
        CategoryRequest req = buildRequest("Technology", "technology", null);
        CategoryResponse response = categoryService.createCategory(req, admin, "127.0.0.1", "Test");

        assertNotNull(response.getId());
        assertEquals("Technology", response.getName());
        assertEquals("technology", response.getSlug());
        assertNull(response.getParentId());
    }

    @Test
    void createCategory_duplicateSlug_throwsException() {
        categoryService.createCategory(buildRequest("Tech", "tech", null), admin, "127.0.0.1", "Test");

        assertThrows(BaseMindriftException.class,
                () -> categoryService.createCategory(buildRequest("Tech2", "tech", null), admin, "127.0.0.1", "Test"));
    }

    @Test
    void createSubcategory_success() {
        CategoryResponse parent = categoryService.createCategory(
                buildRequest("Sciences", "sciences", null), admin, "127.0.0.1", "Test");
        CategoryRequest childReq = buildRequest("Physics", "physics", parent.getId());
        CategoryResponse child = categoryService.createCategory(childReq, admin, "127.0.0.1", "Test");

        assertEquals(parent.getId(), child.getParentId());
        assertEquals("Sciences", child.getParentName());
    }

    @Test
    void getTopLevel_excludesSubcategories() {
        CategoryResponse parent = categoryService.createCategory(
                buildRequest("Parent", "parent", null), admin, "127.0.0.1", "Test");
        categoryService.createCategory(
                buildRequest("Child", "child", parent.getId()), admin, "127.0.0.1", "Test");

        List<CategoryResponse> topLevel = categoryService.getAllTopLevel();
        assertEquals(1, topLevel.size());
        assertEquals("Parent", topLevel.get(0).getName());
    }

    @Test
    void getChildren_returnsSubcategories() {
        CategoryResponse parent = categoryService.createCategory(
                buildRequest("Parent2", "parent2", null), admin, "127.0.0.1", "Test");
        categoryService.createCategory(buildRequest("Child1", "child1", parent.getId()), admin, "127.0.0.1", "Test");
        categoryService.createCategory(buildRequest("Child2", "child2", parent.getId()), admin, "127.0.0.1", "Test");

        List<CategoryResponse> children = categoryService.getChildren(parent.getId());
        assertEquals(2, children.size());
    }

    @Test
    void deleteCategory_notFound_throwsException() {
        assertThrows(ResourceNotFoundException.class,
                () -> categoryService.deleteCategory(UUID.randomUUID(), admin, "127.0.0.1", "Test"));
    }

    @Test
    void updateCategory_cannotBeSelfParent_throwsException() {
        CategoryResponse cat = categoryService.createCategory(
                buildRequest("Solo", "solo", null), admin, "127.0.0.1", "Test");

        CategoryRequest req = buildRequest("Solo", "solo", cat.getId());
        assertThrows(BaseMindriftException.class,
                () -> categoryService.updateCategory(cat.getId(), req, admin, "127.0.0.1", "Test"));
    }

    @Test
    void getAllPaged_returnsPaginatedResults() {
        categoryService.createCategory(buildRequest("Cat A", "cat-a", null), admin, "127.0.0.1", "Test");
        categoryService.createCategory(buildRequest("Cat B", "cat-b", null), admin, "127.0.0.1", "Test");
        categoryService.createCategory(buildRequest("Cat C", "cat-c", null), admin, "127.0.0.1", "Test");

        Page<CategoryResponse> page1 = categoryService.getAllPaged(PageRequest.of(0, 2));
        assertEquals(2, page1.getContent().size());
        assertEquals(3, page1.getTotalElements());
    }

    private User buildUser(String username, UserRole role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setClerkId("clerk_" + username + "_" + UUID.randomUUID());
        user.setEmail(username + "@test.com");
        user.setUsername(username);
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        return user;
    }

    private CategoryRequest buildRequest(String name, String slug, UUID parentId) {
        CategoryRequest req = new CategoryRequest();
        req.setName(name);
        req.setSlug(slug);
        req.setDescription("Description of " + name);
        req.setParentId(parentId);
        return req;
    }
}
