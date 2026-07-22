import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;
  let mailService: any;

  beforeEach(() => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      validatePassword: jest.fn(),
      setResetToken: jest.fn(),
      findByValidResetTokenHash: jest.fn(),
      updatePasswordAndClearResetToken: jest.fn(),
      isAccountLocked: jest.fn().mockReturnValue(false),
      registerFailedLogin: jest.fn(),
      resetFailedLogins: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt-token') };
    mailService = { sendPasswordResetEmail: jest.fn() };

    service = new AuthService(usersService, jwtService, mailService);
  });

  describe('login', () => {
    it('throws UnauthorizedException when the email is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'nobody@test.com', password: 'x' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@test.com', password: 'hashed', role: 'student', fullName: 'A' });
      usersService.validatePassword.mockResolvedValue(false);
      await expect(service.login({ email: 'a@test.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });

    it('returns a signed token and user info on valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@test.com', password: 'hashed', role: 'student', fullName: 'A' });
      usersService.validatePassword.mockResolvedValue(true);

      const result = await service.login({ email: 'a@test.com', password: 'correct' });

      expect(result.accessToken).toBe('signed-jwt-token');
      expect(result.user.email).toBe('a@test.com');
    });

    it('resets the failed-attempt counter on a successful login', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@test.com', password: 'hashed', role: 'student', fullName: 'A' });
      usersService.validatePassword.mockResolvedValue(true);

      await service.login({ email: 'a@test.com', password: 'correct' });

      expect(usersService.resetFailedLogins).toHaveBeenCalledWith('1');
    });

    it('registers a failed attempt when the password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@test.com', password: 'hashed', role: 'student', fullName: 'A' });
      usersService.validatePassword.mockResolvedValue(false);

      await expect(service.login({ email: 'a@test.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
      expect(usersService.registerFailedLogin).toHaveBeenCalledWith('1');
    });

    it('rejects login while the account is locked, without checking the password', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'a@test.com',
        password: 'hashed',
        role: 'student',
        fullName: 'A',
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
      });
      usersService.isAccountLocked.mockReturnValue(true);

      await expect(service.login({ email: 'a@test.com', password: 'correct' })).rejects.toThrow(UnauthorizedException);
      expect(usersService.validatePassword).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('creates the user and returns a token response', async () => {
      usersService.create.mockResolvedValue({ id: '2', email: 'new@test.com', role: 'student', fullName: 'New' });

      const result = await service.register({ fullName: 'New', email: 'new@test.com', password: 'secret1' });

      expect(usersService.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('signed-jwt-token');
    });
  });

  describe('forgotPassword', () => {
    it('does nothing (no email sent, no error) when the email is not registered', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await service.forgotPassword('ghost@test.com', 'http://localhost:4200');

      expect(usersService.setResetToken).not.toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('generates a reset token and sends an email when the user exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '3', email: 'real@test.com' });

      await service.forgotPassword('real@test.com', 'http://localhost:4200');

      expect(usersService.setResetToken).toHaveBeenCalledWith('3', expect.any(String), expect.any(Date));
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'real@test.com',
        expect.stringContaining('http://localhost:4200/reset-password?token='),
      );
    });
  });

  describe('resetPassword', () => {
    it('throws when the token is invalid or expired', async () => {
      usersService.findByValidResetTokenHash.mockResolvedValue(null);
      await expect(service.resetPassword('bad-token', 'newpass123')).rejects.toThrow();
    });

    it('updates the password when the token is valid', async () => {
      usersService.findByValidResetTokenHash.mockResolvedValue({ id: '4' });

      await service.resetPassword('good-token', 'newpass123');

      expect(usersService.updatePasswordAndClearResetToken).toHaveBeenCalledWith('4', 'newpass123');
    });
  });
});
