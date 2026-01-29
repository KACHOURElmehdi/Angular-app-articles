import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { tokenInterceptor } from './token.interceptor';
import { apiInterceptor } from './api.interceptor';
import { JwtService } from '../auth/services/jwt.service';

describe('AuthInterceptor (tokenInterceptor)', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let http: HttpClient;
  let httpMock: HttpTestingController;
  let jwtServiceMock: any;

  beforeEach(() => {
    jwtServiceMock = {
      getToken: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor, tokenInterceptor])),
        provideHttpClientTesting(),
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('attaches Authorization header when token exists', () => {
    jwtServiceMock.getToken.mockReturnValue('abc.def.ghi');

    http.get('/profile').subscribe();

    const req = httpMock.expectOne('/api/profile');
    expect(req.request.headers.get('Authorization')).toBe('Token abc.def.ghi');
    req.flush({ ok: true });
  });

  it('does not set Authorization header when token is missing', () => {
    jwtServiceMock.getToken.mockReturnValue(undefined);

    http.get('/profile').subscribe();

    const req = httpMock.expectOne('/api/profile');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ ok: true });
  });
});
