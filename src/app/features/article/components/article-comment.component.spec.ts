import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { ArticleCommentComponent } from './article-comment.component';
import { UserService } from '../../../core/auth/services/user.service';
import { of, BehaviorSubject } from 'rxjs';
import { Comment } from '../models/comment.model';
import { User } from '../../../core/auth/user.model';
import { provideRouter } from '@angular/router';

describe('ArticleCommentComponent', () => {
  let component: ArticleCommentComponent;
  let fixture: ComponentFixture<ArticleCommentComponent>;
  let mockUserService: any;
  let currentUserSubject: BehaviorSubject<User | null>;

  beforeAll(() => {
    // Initialize TestBed environment once for all tests
    try {
      getTestBed().initTestEnvironment(
        BrowserDynamicTestingModule,
        platformBrowserDynamicTesting()
      );
    } catch (error) {
      // Already initialized, ignore
    }
  });

  const mockComment: Comment = {
    id: '1',
    body: 'This is a test comment',
    createdAt: '2026-01-23T10:00:00.000Z',
    author: {
      username: 'testuser',
      bio: 'Test bio',
      image: 'https://example.com/avatar.jpg',
      following: false,
    },
  };

  const mockUser: User = {
    email: 'test@test.com',
    token: 'jwt-token',
    username: 'testuser',
    bio: 'Test bio',
    image: 'https://example.com/avatar.jpg',
  };

  beforeEach(async () => {
    // Créer un mock du UserService avec BehaviorSubject pour réactivité
    currentUserSubject = new BehaviorSubject<User | null>(mockUser);
    mockUserService = {
      currentUser: currentUserSubject.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [ArticleCommentComponent],
      providers: [
        { provide: UserService, useValue: mockUserService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArticleCommentComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component initialization', () => {
    it('should have comment input property', () => {
      // Comment is an @Input that will be set by parent
      component.comment = mockComment;
      expect(component.comment).toBeDefined();
      expect(component.comment.body).toBe('This is a test comment');
    });

    it('should have delete output emitter', () => {
      expect(component.delete).toBeDefined();
    });
  });

  describe('Comment rendering', () => {
    beforeEach(() => {
      component.comment = mockComment;
      fixture.detectChanges();
    });

    it('should display comment body', () => {
      const compiled = fixture.nativeElement;
      const commentText = compiled.querySelector('.card-text');

      expect(commentText.textContent.trim()).toBe('This is a test comment');
    });

    it('should display author username', () => {
      const compiled = fixture.nativeElement;
      const authorLinks = compiled.querySelectorAll('.comment-author');

      expect(authorLinks[1].textContent.trim()).toBe('testuser');
    });

    it('should display author image', () => {
      const compiled = fixture.nativeElement;
      const authorImg = compiled.querySelector('.comment-author-img');

      expect(authorImg.getAttribute('src')).toBe('https://example.com/avatar.jpg');
    });

    it('should have link to author profile', () => {
      const compiled = fixture.nativeElement;
      const authorLink = compiled.querySelector('.comment-author');

      expect(authorLink.getAttribute('href')).toContain('/profile/testuser');
    });

    it('should format date correctly', () => {
      const compiled = fixture.nativeElement;
      const datePosted = compiled.querySelector('.date-posted');

      expect(datePosted).toBeTruthy();
      expect(datePosted.textContent).toContain('January'); // Date formatée
    });
  });

  describe('Modify permissions', () => {
    it('should show delete icon when user is comment author', () => {
      component.comment = mockComment;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const deleteIcon = compiled.querySelector('.ion-trash-a');

      expect(deleteIcon).toBeTruthy();
    });

    it('should hide delete icon when user is not comment author', () => {
      // Change current user to different user
      currentUserSubject.next({
        ...mockUser,
        username: 'differentuser',
      });

      component.comment = mockComment;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const deleteIcon = compiled.querySelector('.ion-trash-a');

      expect(deleteIcon).toBeFalsy();
    });

    it('should hide delete icon when user is not authenticated', () => {
      // Set user to null (not authenticated)
      currentUserSubject.next(null);

      component.comment = mockComment;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const deleteIcon = compiled.querySelector('.ion-trash-a');

      expect(deleteIcon).toBeFalsy();
    });
  });

  describe('Delete functionality', () => {
    it('should emit delete event when trash icon is clicked', () => {
      const deleteSpy = vi.spyOn(component.delete, 'emit');

      component.comment = mockComment;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const deleteIcon = compiled.querySelector('.ion-trash-a');
      deleteIcon.click();

      expect(deleteSpy).toHaveBeenCalledWith(true);
      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('canModify$ observable', () => {
    it('should return true when current user is comment author', () => {
      component.comment = mockComment;

      return new Promise<void>((resolve) => {
        component.canModify$.subscribe((canModify) => {
          expect(canModify).toBe(true);
          resolve();
        });
      });
    });

    it('should return false when current user is not comment author', () => {
      // Change to different user
      currentUserSubject.next({
        ...mockUser,
        username: 'differentuser',
      });

      component.comment = mockComment;

      return new Promise<void>((resolve) => {
        component.canModify$.subscribe((canModify) => {
          expect(canModify).toBe(false);
          resolve();
        });
      });
    });

    it('should return false when no user is authenticated', () => {
      // Set user to null
      currentUserSubject.next(null);

      component.comment = mockComment;

      return new Promise<void>((resolve) => {
        component.canModify$.subscribe((canModify) => {
          expect(canModify).toBe(false);
          resolve();
        });
      });
    });
  });
});
