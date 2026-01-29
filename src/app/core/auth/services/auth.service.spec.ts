import 'zone.js';
import 'zone.js/testing';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { UserService } from './user.service';
import { JwtService } from './jwt.service';
import { apiInterceptor } from '../../interceptors/api.interceptor';
import { tokenInterceptor } from '../../interceptors/token.interceptor';
import { errorInterceptor } from '../../interceptors/error.interceptor';
import { User } from '../user.model';

describe('AuthService (UserService facade)', () => {
  beforeAll(() => {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  let service: UserService;
  let httpMock: HttpTestingController;
  let router: any;
  let localStorageSpy: any;

  const mockUser: User = {
    email: 'test@example.com',
    token: 'jwt-123',
    username: 'tester',
    bio: '',
    image: '',
  };

  beforeEach(() => {
    localStorageSpy = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(function (key: string) {
        delete this[key];
      }),
      clear: vi.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageSpy,
      writable: true,
      configurable: true,
    });

    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        UserService,
        JwtService,
        { provide: Router, useValue: router },
        provideHttpClient(withInterceptors([apiInterceptor, tokenInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('should call POST /api/users/login with correct payload', () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    service.login(credentials).subscribe();

    const req = httpMock.expectOne('/api/users/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ user: credentials });

    req.flush({ user: mockUser });
  });

  it('should save jwtToken to localStorage on successful login', async () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    const promise = firstValueFrom(service.login(credentials));

    const req = httpMock.expectOne('/api/users/login');
    req.flush({ user: mockUser });

    await promise;
    expect(window.localStorage['jwtToken']).toBe(mockUser.token);
  });

  it('should clear token on logout and navigate home', async () => {
    service.setAuth(mockUser);

    service.logout();

    expect(localStorageSpy.removeItem).toHaveBeenCalledWith('jwtToken');

    const authStates: boolean[] = [];
    const sub = service.isAuthenticated.subscribe(v => authStates.push(v));
    await Promise.resolve();
    expect(authStates[authStates.length - 1]).toBe(false);
    sub.unsubscribe();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should expose isAuthenticated() based on user presence', async () => {
    const states: boolean[] = [];
    const sub = service.isAuthenticated.subscribe(v => states.push(v));

    service.setAuth(mockUser);
    await Promise.resolve();

    expect(states[0]).toBe(false);
    expect(states[1]).toBe(true);
    sub.unsubscribe();
  });
});
