import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { ArticlesService } from './articles.service';
import { apiInterceptor } from '../../../core/interceptors/api.interceptor';
import { errorInterceptor } from '../../../core/interceptors/error.interceptor';
import { Article } from '../models/article.model';

describe('ArticlesService HTTP contract', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let service: ArticlesService;
  let httpMock: HttpTestingController;

  const baseArticle: Article = {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Desc',
    body: 'Body text',
    tagList: ['angular', 'test'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    favorited: false,
    favoritesCount: 0,
    author: {
      username: 'jane',
      bio: '',
      image: '',
      following: false,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ArticlesService,
        provideHttpClient(withInterceptors([apiInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ArticlesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should call GET /api/articles with correct URL', async () => {
    const promise = firstValueFrom(
      service.query({
        type: 'all',
        filters: {},
      }),
    );

    const req = httpMock.expectOne('/api/articles');
    expect(req.request.method).toBe('GET');

    req.flush({ articles: [baseArticle], articlesCount: 1 });
    const result = await promise;
    expect(result.articlesCount).toBe(1);
    expect(result.articles[0].slug).toBe(baseArticle.slug);
  });

  it('should call GET /api/articles/:slug', async () => {
    const promise = firstValueFrom(service.get('abc-slug'));

    const req = httpMock.expectOne('/api/articles/abc-slug');
    expect(req.request.method).toBe('GET');

    req.flush({ article: baseArticle });
    const article = await promise;
    expect(article.slug).toBe('test-article');
  });

  it('should call POST /api/articles with payload including tagList', async () => {
    const newArticle: Partial<Article> = {
      title: 'New title',
      description: 'New desc',
      body: 'New body',
      tagList: ['one', 'two'],
    };

    const promise = firstValueFrom(service.create(newArticle));

    const req = httpMock.expectOne('/api/articles/');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ article: newArticle });

    req.flush({ article: { ...baseArticle, ...newArticle, slug: 'new-title' } });
    const created = await promise;
    expect(created.title).toBe('New title');
    expect(created.tagList).toEqual(['one', 'two']);
  });

  it('should call PUT /api/articles/:slug', async () => {
    const updates: Partial<Article> = {
      slug: 'test-article',
      title: 'Updated',
      body: 'Updated body',
    };

    const promise = firstValueFrom(service.update(updates));

    const req = httpMock.expectOne('/api/articles/test-article');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ article: updates });

    req.flush({ article: { ...baseArticle, ...updates } });
    const updated = await promise;
    expect(updated.title).toBe('Updated');
  });

  it('should call DELETE /api/articles/:slug', async () => {
    const promise = firstValueFrom(service.delete('test-article'));

    const req = httpMock.expectOne('/api/articles/test-article');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await promise;
  });

  it('should surface 401 errors from create()', async () => {
    const errorBody = { errors: { body: ['Unauthorized'] } };
    const promise = firstValueFrom(
      service.create({
        title: 'Bad',
        body: 'Bad',
        description: '',
      }),
    );

    const req = httpMock.expectOne('/api/articles/');
    req.flush(errorBody, { status: 401, statusText: 'Unauthorized' });

    await expect(promise).rejects.toEqual(errorBody);
  });

  it('should surface 400 errors from update()', async () => {
    const errorBody = { errors: { body: ['Invalid request'] } };
    const promise = firstValueFrom(
      service.update({
        slug: 'missing',
        title: 'Whatever',
      }),
    );

    const req = httpMock.expectOne('/api/articles/missing');
    req.flush(errorBody, { status: 400, statusText: 'Bad Request' });

    await expect(promise).rejects.toEqual(errorBody);
  });
});
