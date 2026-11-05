import { emailSchema, otpSchema, profileSchema } from '@marketplace/shared';

describe('emailSchema', () => {
  it('normalises case and whitespace', () => {
    expect(emailSchema.parse({ email: '  Alice@Example.COM ' })).toEqual({
      email: 'alice@example.com',
    });
  });

  it('rejects invalid addresses', () => {
    expect(emailSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });
});

describe('otpSchema', () => {
  it.each(['123456', ' 654321 '])('accepts %p', (token) => {
    expect(otpSchema.safeParse({ token }).success).toBe(true);
  });

  it.each(['12345', '1234567', 'abcdef', ''])('rejects %p', (token) => {
    expect(otpSchema.safeParse({ token }).success).toBe(false);
  });
});

describe('profileSchema', () => {
  it('lower-cases usernames and stores empty optional fields as null', () => {
    expect(profileSchema.parse({ username: 'Vintage_Finds', display_name: '  ', region: '' })).toEqual(
      { username: 'vintage_finds', display_name: null, region: null },
    );
  });

  it.each(['ab', 'has space', 'émile', 'a'.repeat(31), 'dash-name'])(
    'rejects username %p (matches the database CHECK)',
    (username) => {
      expect(profileSchema.safeParse({ username, display_name: '', region: '' }).success).toBe(false);
    },
  );

  it('enforces the database length limits', () => {
    const tooLong = profileSchema.safeParse({
      username: 'ok_name',
      display_name: 'x'.repeat(61),
      region: 'y'.repeat(81),
    });
    expect(tooLong.success).toBe(false);
    expect(tooLong.error?.issues.map((issue) => issue.path[0])).toEqual(['display_name', 'region']);
  });
});
